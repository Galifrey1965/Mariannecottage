// B-02 Phase 2: TTL sweep endpoint.
//
// Called daily by netlify/functions/sweep-pending.ts via the SWEEP_SECRET
// shared header. Delegates to the SQL function expire_pending_bookings()
// which atomically expires stale soft-reserves and frees their availability
// rows. Logs a single agent_events row per non-empty sweep summarising the
// batch.
//
// Also carries the enquiries retention purge (2026-07-26) — it rides along here
// rather than in its own scheduled function precisely because this cron already
// exists and already has a secret, so retention needed no new Netlify config.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 2

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { adminClient, purgeOldEnquiries } from '$lib/server/supabase';

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

	// The two jobs below are deliberately independent: neither may abort the
	// other. The booking sweep is load-bearing for availability, and the
	// retention purge is a disclosed GDPR commitment (/legal) — a failure in one
	// must not quietly suspend the other. Note this is not hypothetical: as of
	// 2026-07-26 expire_pending_bookings fails with 42702 ("column reference
	// booking_reference is ambiguous"), which under an early return would have
	// meant retention never ran at all. See outstanding-issues.md B-08.
	const { data, error } = await adminClient.rpc('expire_pending_bookings');
	if (error) {
		console.error('[sweep-pending] expire_pending_bookings failed:', error);
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
		// Detail row is captured in agent_events above (action =
		// soft_reserve_swept) — no need for a separate console line.
	}

	// GDPR retention purge, in its own try/catch. The count is returned and
	// logged so the daily run leaves evidence that retention is actually
	// happening rather than rotting into an unkept promise.
	let enquiriesPurged: number | null = null;
	try {
		enquiriesPurged = await purgeOldEnquiries();
		if (enquiriesPurged > 0) {
			console.log(`[sweep-pending] purged ${enquiriesPurged} enquiries older than 24 months`);
		}
	} catch (purgeError) {
		console.error('[sweep-pending] enquiry retention purge failed:', purgeError);
	}

	const body = {
		expired: expired.length,
		dates_freed: expired.reduce((a, r) => a + r.freed_dates, 0),
		enquiries_purged: enquiriesPurged,
		booking_sweep_failed: Boolean(error)
	};

	// Still surface the booking-sweep failure as a 500 so the cron logs it and
	// it does not go unnoticed — but only after the purge has had its turn.
	return json(body, { status: error ? 500 : 200 });
};
