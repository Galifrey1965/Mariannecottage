// Phase 2: create a Stripe PaymentIntent for an existing pending_payment
// booking. Replaces the older hosted-checkout-session endpoint so the wizard
// can collect card details inline via Stripe's Payment Element.
//
// Flow:
//   POST /api/book                       → row inserted with status='pending_payment'
//   POST /api/stripe/payment-intent      → PaymentIntent created, returns client_secret
//   client mounts Payment Element        → user enters card / SCA / wallet
//   stripe.confirmPayment(...)
//     ├─ no redirect needed              → wizard advances to step 4 (Confirmed),
//     │                                    which polls /api/book/[ref] until the
//     │                                    webhook flips status to 'confirmed'
//     └─ redirect (3DS / SCA)            → Stripe takes the user away and back
//                                          to return_url = /book/confirm?ref=…
//
// The webhook at /api/stripe/webhook still drives the confirmed transition.
// Idempotency: if called twice for the same booking we reuse the existing
// PaymentIntent (looked up by booking.payment_intent_id) so the user can
// retry the form without spinning up a fresh intent each time.

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/supabase';
import { getStripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request }) => {
	const stripe = getStripe();
	if (!stripe) {
		return json({ success: false, error: 'stripe_not_configured' }, { status: 503 });
	}

	const body = await request.json().catch(() => ({}));
	const bookingRef: string | undefined = body.booking_reference;
	if (!bookingRef) {
		return json({ success: false, error: 'missing booking_reference' }, { status: 400 });
	}

	const { data: booking, error: fetchErr } = await adminClient
		.from('bookings')
		.select(
			'id, booking_reference, guest_name, guest_email, num_guests, num_nights, check_in_date, check_out_date, total_cost, status, payment_intent_id'
		)
		.eq('booking_reference', bookingRef)
		.maybeSingle();
	if (fetchErr) throw fetchErr;
	if (!booking) {
		return json({ success: false, error: 'booking_not_found' }, { status: 404 });
	}
	if (booking.status !== 'pending_payment' && booking.status !== 'pending') {
		return json(
			{ success: false, error: 'booking_not_payable', current_status: booking.status },
			{ status: 409 }
		);
	}

	const totalCents = Math.round(Number(booking.total_cost) * 100);

	// Reuse an existing PaymentIntent on retry so the same client_secret keeps
	// working — Stripe rejects amount changes on a confirmed-pending intent
	// but our amounts can't change for a pending booking, so it's safe.
	if (booking.payment_intent_id) {
		try {
			const existing = await stripe.paymentIntents.retrieve(booking.payment_intent_id);
			if (
				existing.status === 'requires_payment_method' ||
				existing.status === 'requires_confirmation' ||
				existing.status === 'requires_action'
			) {
				return json({
					success: true,
					client_secret: existing.client_secret,
					payment_intent_id: existing.id
				});
			}
		} catch (err) {
			// Fall through to creating a new intent if retrieval fails (e.g. stale id).
			console.warn(
				`[payment-intent] retrieve failed for ${booking.payment_intent_id}, creating new`,
				err instanceof Error ? err.message : err
			);
		}
	}

	const intent = await stripe.paymentIntents.create({
		amount: totalCents,
		currency: 'eur',
		// Lets the Payment Element show whatever payment methods the Stripe
		// account has enabled (cards, link, sepa, etc.) without us hard-coding.
		automatic_payment_methods: { enabled: true },
		receipt_email: booking.guest_email ?? undefined,
		description: `Marianne Cottage booking ${booking.booking_reference}`,
		metadata: {
			booking_id: booking.id,
			booking_reference: booking.booking_reference
		}
	});

	const { error: updateErr } = await adminClient
		.from('bookings')
		.update({ payment_intent_id: intent.id })
		.eq('id', booking.id);
	if (updateErr) {
		console.error('[payment-intent] failed to persist payment_intent_id', updateErr);
	}

	return json({
		success: true,
		client_secret: intent.client_secret,
		payment_intent_id: intent.id
	});
};
