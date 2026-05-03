// B-02 Phase 2: TTL sweep endpoint.
//
// Called every 5 minutes by netlify/functions/sweep-pending.ts via the
// SWEEP_SECRET shared header. Delegates to the SQL function
// expire_pending_bookings() which atomically expires stale soft-reserves
// and frees their availability rows. Logs a single agent_events row per
// non-empty sweep summarising the batch.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 2

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { adminClient } from '$lib/server/supabase';

interface ExpiredRow {
	booking_id: string;
	booking_reference: string;
	check_in_date: string;
	check_out_date: string;
	freed_dates: number;
}

export const POST: RequestHandler = async ({ request }) => {
	const expectedSecret = privateEnv.SWEEP_SECRET;
	if (!expectedSecret) {
		console.error('[sweep-pending] SWEEP_SECRET not configured');
		return new Response('not configured', { status: 503 });
	}

	const provided = request.headers.get('x-sweep-secret');
	if (provided !== expectedSecret) {
		return new Response('forbidden', { status: 403 });
	}

	const { data, error } = await adminClient.rpc('expire_pending_bookings');
	if (error) {
		console.error('[sweep-pending] expire_pending_bookings failed:', error);
		return new Response('sweep failed', { status: 500 });
	}

	const expired = (data ?? []) as ExpiredRow[];

	if (expired.length > 0) {
		const totalFreed = expired.reduce((acc, r) => acc + r.freed_dates, 0);
		const { error: auditError } = await adminClient.from('agent_events').insert({
			action: 'soft_reserve_swept',
			target_type: 'sweep',
			target_id: null,
			metadata: {
				expired_count: expired.length,
				freed_dates_total: totalFreed,
				bookings: expired.map((r) => ({
					id: r.booking_id,
					reference: r.booking_reference,
					check_in: r.check_in_date,
					check_out: r.check_out_date,
					freed: r.freed_dates
				}))
			}
		});
		if (auditError) {
			console.error('[sweep-pending] audit insert failed:', auditError);
		}
		console.log(
			`[sweep-pending] expired ${expired.length} booking(s), freed ${totalFreed} availability row(s)`
		);
	}

	return json({ expired: expired.length, dates_freed: expired.reduce((a, r) => a + r.freed_dates, 0) });
};
