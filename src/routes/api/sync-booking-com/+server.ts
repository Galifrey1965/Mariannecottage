import { json } from '@sveltejs/kit';
import { parseIcal, getBlockedDates } from '$lib/server/ical';
import { adminClient } from '$lib/server/supabase';
import { BOOKING_COM_ICAL_URL, SYNC_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// Protect with shared secret
	const secret = request.headers.get('x-sync-secret');
	if (!SYNC_SECRET || secret !== SYNC_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!BOOKING_COM_ICAL_URL || BOOKING_COM_ICAL_URL === 'REPLACE_ME') {
		return json({ error: 'BOOKING_COM_ICAL_URL not configured' }, { status: 503 });
	}

	try {
		const response = await fetch(BOOKING_COM_ICAL_URL);
		if (!response.ok) {
			return json({ error: `Failed to fetch iCal: ${response.status}` }, { status: 502 });
		}

		const icsText = await response.text();
		const events = parseIcal(icsText);
		const blockedDates = getBlockedDates(events);

		if (blockedDates.length > 0) {
			const rows = blockedDates.map(date => ({
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

		return json({ synced: blockedDates.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
};
