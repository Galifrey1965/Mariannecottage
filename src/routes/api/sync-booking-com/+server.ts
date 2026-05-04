import { json } from '@sveltejs/kit';
import { parseIcal } from '$lib/server/ical';
import { adminClient } from '$lib/server/supabase';
import { todayISO } from '$lib/server/bc-sync';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Booking.com inbound sync — pulls the iCal feed and promotes each VEVENT to
// a `bookings` row (source='booking_com', status='confirmed') so admin can
// enrich with guest details from BC's notification email. Existing rows are
// matched + updated by ical_uid; rows whose UID has dropped out of the feed
// are marked cancelled. Availability is kept in lockstep so the public
// calendar continues to render BC-blocked dates as red.

export const POST: RequestHandler = async ({ request }) => {
	const secret = request.headers.get('x-sync-secret');
	if (!env.SYNC_SECRET || secret !== env.SYNC_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!env.BOOKING_COM_ICAL_URL || env.BOOKING_COM_ICAL_URL === 'REPLACE_ME') {
		return json({ error: 'BOOKING_COM_ICAL_URL not configured' }, { status: 503 });
	}

	const today = todayISO();
	const nowIso = new Date().toISOString();

	try {
		const response = await fetch(env.BOOKING_COM_ICAL_URL);
		if (!response.ok) {
			return json({ error: `Failed to fetch iCal: ${response.status}` }, { status: 502 });
		}

		const events = parseIcal(await response.text())
			.filter((e) => e.uid && e.end > today); // ignore events without UID or already in the past

		const seenUids = new Set<string>();
		for (const e of events) if (e.uid) seenUids.add(e.uid);

		// Load existing BC rows (active or cancelled) so we can match by ical_uid.
		// We pull all upcoming BC rows + any past-but-still-relevant ones.
		const { data: existingBcRaw, error: fetchErr } = await adminClient
			.from('bookings')
			.select('id, ical_uid, check_in_date, check_out_date, status, ical_summary')
			.eq('source', 'booking_com')
			.gte('check_out_date', today);

		if (fetchErr) throw fetchErr;
		type ExistingBc = {
			id: string;
			ical_uid: string | null;
			check_in_date: string;
			check_out_date: string;
			status: string;
			ical_summary: string | null;
		};
		const existingBc: ExistingBc[] = (existingBcRaw ?? []) as ExistingBc[];
		const existingByUid = new Map<string, ExistingBc>();
		for (const row of existingBc) {
			if (row.ical_uid) existingByUid.set(row.ical_uid, row);
		}

		let inserted = 0;
		let updated = 0;
		let cancelled = 0;
		const datesToBlock = new Set<string>();
		const datesToFree = new Set<string>();

		// 1) Upsert each VEVENT
		for (const e of events) {
			if (!e.uid) continue;
			const existing = existingByUid.get(e.uid);
			const eventDates = expandRange(e.start, e.end);

			if (existing) {
				// Sticky local cancellation: once admin cancels a BC import via the
				// admin panel, sync stops touching it. Dates stay free; status stays
				// cancelled. To bring it back, admin must explicitly un-cancel
				// (no UI for that yet — manual SQL or a future button).
				if (existing.status === 'cancelled') continue;

				const datesChanged = existing.check_in_date !== e.start || existing.check_out_date !== e.end;
				const summaryChanged = (existing.ical_summary ?? '') !== (e.summary ?? '');
				if (datesChanged || summaryChanged) {
					if (datesChanged) {
						for (const d of expandRange(existing.check_in_date, existing.check_out_date)) datesToFree.add(d);
						for (const d of eventDates) datesToBlock.add(d);
					}
					const numNights = nightsBetween(e.start, e.end);
					const { error: updErr } = await adminClient
						.from('bookings')
						.update({
							check_in_date: e.start,
							check_out_date: e.end,
							num_nights: numNights,
							ical_summary: e.summary ?? null,
							updated_at: nowIso
						})
						.eq('id', existing.id);
					if (updErr) throw updErr;
					updated += 1;
				}
			} else {
				const numNights = nightsBetween(e.start, e.end);
				const ref = `BC-${e.uid.slice(0, 12)}`;
				const { error: insErr } = await adminClient.from('bookings').insert({
					source: 'booking_com',
					status: 'confirmed',
					ical_uid: e.uid,
					ical_summary: e.summary ?? null,
					booking_reference: ref,
					guest_name: 'Booking.com guest',
					guest_email: null,
					num_guests: 2,
					check_in_date: e.start,
					check_out_date: e.end,
					num_nights: numNights,
					nightly_rate: 0,
					subtotal: 0,
					tax: 0,
					total_cost: 0
				});
				if (insErr) throw insErr;
				for (const d of eventDates) datesToBlock.add(d);
				inserted += 1;
			}
		}

		// 2) Cancel BC rows that have dropped out of the feed (guest cancelled on BC)
		for (const row of existingBc) {
			if (!row.ical_uid) continue;
			if (seenUids.has(row.ical_uid)) continue;
			if (row.status === 'cancelled') continue;
			const { error: cancelErr } = await adminClient
				.from('bookings')
				.update({ status: 'cancelled', updated_at: nowIso })
				.eq('id', row.id);
			if (cancelErr) throw cancelErr;
			for (const d of expandRange(row.check_in_date, row.check_out_date)) datesToFree.add(d);
			cancelled += 1;
		}

		// 3) Reconcile availability table.
		//    Block-set wins over free-set when a date appears in both
		//    (e.g. a date moved between two BC reservations within the same sync).
		const finalBlock = [...datesToBlock];
		const finalFree = [...datesToFree].filter((d) => !datesToBlock.has(d));

		if (finalBlock.length > 0) {
			const rows = finalBlock.map((date) => ({
				date,
				available: false,
				synced_from: 'booking.com',
				synced_at: nowIso
			}));
			const { error } = await adminClient.from('availability').upsert(rows, { onConflict: 'date' });
			if (error) throw error;
		}

		if (finalFree.length > 0) {
			const { error } = await adminClient
				.from('availability')
				.update({ available: true, synced_at: nowIso })
				.in('date', finalFree)
				.eq('synced_from', 'booking.com');
			if (error) throw error;
		}

		return json({
			inserted,
			updated,
			cancelled,
			blocked_dates: finalBlock.length,
			freed_dates: finalFree.length
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('[sync-booking-com] failed:', message);
		return json({ error: message }, { status: 500 });
	}
};

function expandRange(startIso: string, endIso: string): string[] {
	const out: string[] = [];
	const d = new Date(startIso + 'T00:00:00Z');
	const end = new Date(endIso + 'T00:00:00Z');
	while (d < end) {
		out.push(d.toISOString().slice(0, 10));
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return out;
}

function nightsBetween(startIso: string, endIso: string): number {
	const ms = new Date(endIso + 'T00:00:00Z').getTime() - new Date(startIso + 'T00:00:00Z').getTime();
	return Math.max(1, Math.round(ms / 86_400_000));
}
