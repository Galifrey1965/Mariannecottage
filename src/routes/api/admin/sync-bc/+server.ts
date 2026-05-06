import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { logAdminEvent } from '$lib/server/supabase';
import type { RequestHandler } from './$types';

// Admin-triggered Booking.com sync — convenience wrapper around the cron
// endpoint /api/sync-booking-com. Lets a logged-in admin force a refresh
// without needing to know SYNC_SECRET. Useful right after deploy when the
// next cron tick is up to an hour away.
export const POST: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (!env.SYNC_SECRET) {
		return json({ error: 'SYNC_SECRET not configured on this environment' }, { status: 503 });
	}

	const target = new URL('/api/sync-booking-com', url.origin);
	const res = await fetch(target.href, {
		method: 'POST',
		headers: { 'x-sync-secret': env.SYNC_SECRET }
	});
	const body = await res.json().catch(() => ({}));

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'sync_bc.manual_trigger',
		target_type: 'sync',
		target_id: null,
		metadata: {
			status: res.status,
			ok: res.ok,
			result_summary: typeof body === 'object' && body !== null
				? Object.fromEntries(
					Object.entries(body).filter(([k]) =>
						['imported', 'updated', 'cancelled', 'success', 'error'].includes(k)
					)
				)
				: null
		}
	});

	return json(body, { status: res.status });
};
