import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { runBcSync, BcSyncConfigError, BcSyncFetchError } from '$lib/server/bc-sync';
import type { RequestHandler } from './$types';

// Booking.com inbound sync — secret-protected wrapper around runBcSync.
// Called by the daily Netlify cron (netlify/functions/sync-bc.ts) as a
// backstop. The lazy /book server load also calls runBcSync directly
// (debounced) so abandoned hourly-cron coverage isn't actually missed
// on real visits.

export const POST: RequestHandler = async ({ request }) => {
	const secret = request.headers.get('x-sync-secret');
	if (!env.SYNC_SECRET || secret !== env.SYNC_SECRET) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await runBcSync();
		return json(result);
	} catch (err) {
		if (err instanceof BcSyncConfigError) {
			return json({ error: err.message }, { status: 503 });
		}
		if (err instanceof BcSyncFetchError) {
			return json({ error: err.message }, { status: 502 });
		}
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('[sync-booking-com] failed:', message);
		return json({ error: message }, { status: 500 });
	}
};
