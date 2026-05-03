import { json } from '@sveltejs/kit';
import { parseIcal, getBlockedDates } from '$lib/server/ical';
import { adminClient } from '$lib/server/supabase';
import { diffBcAvailability, todayISO } from '$lib/server/bc-sync';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// Protect with shared secret
	const secret = request.headers.get('x-sync-secret');
	if (!env.SYNC_SECRET || secret !== env.SYNC_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!env.BOOKING_COM_ICAL_URL || env.BOOKING_COM_ICAL_URL === 'REPLACE_ME') {
		return json({ error: 'BOOKING_COM_ICAL_URL not configured' }, { status: 503 });
	}

	try {
		const response = await fetch(env.BOOKING_COM_ICAL_URL);
		if (!response.ok) {
			return json({ error: `Failed to fetch iCal: ${response.status}` }, { status: 502 });
		}

		const icsText = await response.text();
		const events = parseIcal(icsText);
		const blockedDates = getBlockedDates(events);

		const today = todayISO();

		// S-01: load existing BC-sourced rows from today onwards so we can
		// free dates that have dropped out of the feed (cancelled BC reservations).
		const { data: existingRows, error: fetchErr } = await adminClient
			.from('availability')
			.select('date, available')
			.eq('synced_from', 'booking.com')
			.gte('date', today);

		if (fetchErr) throw fetchErr;

		const { toBlock, toFree } = diffBcAvailability(
			blockedDates,
			(existingRows ?? []) as Array<{ date: string; available: boolean }>,
			today
		);

		if (toBlock.length > 0) {
			const rows = toBlock.map((date) => ({
				date,
				available: false,
				synced_from: 'booking.com',
				synced_at: new Date().toISOString()
			}));

			const { error } = await adminClient
				.from('availability')
				.upsert(rows, { onConflict: 'date' });

			if (error) throw error;
		}

		if (toFree.length > 0) {
			// Only touch rows that are currently synced_from='booking.com' —
			// manually-set rows must never be cleared by sync.
			const { error } = await adminClient
				.from('availability')
				.update({
					available: true,
					synced_at: new Date().toISOString()
				})
				.in('date', toFree)
				.eq('synced_from', 'booking.com');

			if (error) throw error;
		}

		return json({ synced: toBlock.length, freed: toFree.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
