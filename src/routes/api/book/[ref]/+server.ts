// Phase 2: read-only booking lookup by reference. Used by the in-page wizard's
// Confirmed step (step 4) to poll status while the Stripe webhook flips the
// row from 'pending_payment' to 'confirmed' — same race the /book/confirm
// page handles, but reachable from /book without a route change.
//
// Returns only public-safe fields: no payment_intent_id, no internal id.

import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ params }) => {
	const ref = params.ref;
	if (!ref) {
		throw error(400, 'Missing booking reference');
	}

	const { data: booking, error: dbErr } = await adminClient
		.from('bookings')
		.select(
			'booking_reference, guest_name, guest_email, num_guests, num_nights, check_in_date, check_out_date, total_cost, status, paid_at'
		)
		.eq('booking_reference', ref)
		.maybeSingle();
	if (dbErr) throw dbErr;
	if (!booking) {
		throw error(404, 'Booking not found');
	}

	return json({ booking });
};
