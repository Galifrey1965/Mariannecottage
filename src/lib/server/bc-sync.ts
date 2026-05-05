// S-01: pure helpers + orchestrated runner for Booking.com availability sync.
//
// `diffBcAvailability` produces the upsert/free lists needed to keep the
// `availability` table aligned with the latest iCal feed:
//   - dates currently in the BC feed → upsert as available=false (block)
//   - rows previously blocked by BC but no longer in the feed → set available=true
//     (stale block clearing — fixes S-01)
//   - manually-set rows (synced_from='manual') are never touched
//
// `runBcSync` is the orchestrator — fetches the iCal feed, diffs it against
// stored bookings, and writes the changes. Called by:
//   - /api/sync-booking-com (cron-triggered, secret-protected wrapper)
//   - /book server load (lazy, debounced — see runBcSyncLazyIfStale)

import { env } from '$env/dynamic/private';
import { adminClient, getLastBcSyncAt } from './supabase';
import { parseIcal } from './ical';

export interface BcAvailabilityRow {
	date: string;
	available: boolean;
}

export interface BcSyncDiff {
	toBlock: string[];
	toFree: string[];
}

export function diffBcAvailability(
	currentBlocked: string[],
	existingBcRows: BcAvailabilityRow[],
	todayISO: string
): BcSyncDiff {
	const blockedSet = new Set<string>();
	for (const d of currentBlocked) {
		if (d >= todayISO) blockedSet.add(d);
	}

	const toFree: string[] = [];
	for (const row of existingBcRows) {
		if (row.date < todayISO) continue;
		if (row.available) continue;
		if (blockedSet.has(row.date)) continue;
		toFree.push(row.date);
	}

	return {
		toBlock: [...blockedSet],
		toFree
	};
}

export function todayISO(now: Date = new Date()): string {
	return now.toISOString().slice(0, 10);
}

export interface BcSyncResult {
	inserted: number;
	updated: number;
	cancelled: number;
	blocked_dates: number;
	freed_dates: number;
}

export class BcSyncConfigError extends Error {}
export class BcSyncFetchError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

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

export async function runBcSync(): Promise<BcSyncResult> {
	if (!env.BOOKING_COM_ICAL_URL || env.BOOKING_COM_ICAL_URL === 'REPLACE_ME') {
		throw new BcSyncConfigError('BOOKING_COM_ICAL_URL not configured');
	}

	const today = todayISO();
	const nowIso = new Date().toISOString();

	const response = await fetch(env.BOOKING_COM_ICAL_URL);
	if (!response.ok) {
		throw new BcSyncFetchError(response.status, `Failed to fetch iCal: ${response.status}`);
	}

	const events = parseIcal(await response.text())
		.filter((e) => e.uid && e.end > today);

	const seenUids = new Set<string>();
	for (const e of events) if (e.uid) seenUids.add(e.uid);

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

	for (const e of events) {
		if (!e.uid) continue;
		const existing = existingByUid.get(e.uid);
		const eventDates = expandRange(e.start, e.end);

		if (existing) {
			// Sticky local cancellation: once admin cancels a BC import via the
			// admin panel, sync stops touching it.
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

	// Block-set wins over free-set when a date appears in both (e.g. moved
	// between two BC reservations within the same sync).
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

	// Touch the last-sync timestamp even when no diff is needed, so the
	// debounce in runBcSyncLazyIfStale knows we just checked. Without this,
	// a quiet feed (no BC bookings) would force every visit to re-fetch.
	if (finalBlock.length === 0 && finalFree.length === 0) {
		await adminClient
			.from('availability')
			.update({ synced_at: nowIso })
			.eq('synced_from', 'booking.com')
			.gte('date', today);
	}

	return {
		inserted,
		updated,
		cancelled,
		blocked_dates: finalBlock.length,
		freed_dates: finalFree.length
	};
}

// Debounce window: only re-fetch the BC iCal if the last sync was longer
// ago than this. Bounds how hard a busy /book page can hammer BC's feed.
const LAZY_SYNC_STALE_MS = 10 * 60 * 1000; // 10 min

export async function runBcSyncLazyIfStale(): Promise<{ ran: boolean; reason: string }> {
	const last = await getLastBcSyncAt();
	if (last) {
		const ageMs = Date.now() - new Date(last).getTime();
		if (ageMs < LAZY_SYNC_STALE_MS) {
			return { ran: false, reason: `last sync ${Math.round(ageMs / 1000)}s ago — within debounce window` };
		}
	}
	try {
		await runBcSync();
		return { ran: true, reason: 'sync completed' };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error('[runBcSyncLazyIfStale] sync failed:', message);
		return { ran: false, reason: `sync failed: ${message}` };
	}
}
