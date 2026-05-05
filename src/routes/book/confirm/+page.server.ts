// PR 3 Phase 2: load booking by reference for the post-Stripe-redirect confirm page.
//
// Stripe sends the user back here with ?ref=&session_id=. The session_id is
// kept in the URL for support/debugging but we don't fetch the Session from
// Stripe — the booking row is the source of truth, updated by the webhook.
//
// Status-aware rendering: 'confirmed' = success; 'pending_payment' = webhook
// hasn't fired yet (rare race, usually <1s) — page shows a "confirming…" state
// and the client polls. Other statuses (expired, cancelled, refunded) show the
// matching error state.

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const ref = url.searchParams.get('ref');
	if (!ref) {
		throw error(400, 'Missing booking reference');
	}

	const { data: booking, error: dbErr } = await adminClient
		.from('bookings')
		.select('booking_reference, guest_name, guest_email, num_guests, num_nights, check_in_date, check_out_date, total_cost, status, paid_at')
		.eq('booking_reference', ref)
		.maybeSingle();
	if (dbErr) throw dbErr;
	if (!booking) {
		throw error(404, 'Booking not found');
	}

	return { booking };
};
