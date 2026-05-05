// PR 3 Phase 2: create a Stripe Checkout Session for an existing pending_payment booking.
//
// Flow:
//   POST /api/book                       → row inserted with status='pending_payment'
//   POST /api/stripe/checkout-session    → Stripe Session created, returns hosted URL
//   client redirects to url              → Stripe collects card / 3DS / PayPal
//   Stripe → /book/confirm?ref=&session  → success page (reads booking row; status
//                                          may still be pending_payment until webhook
//                                          fires — page polls / shows pending state)
//   Stripe → /book?payment_cancelled=1   → cancel returns user to step 3 of wizard
//
// Webhook handles state transition asynchronously. We do NOT mark the booking
// confirmed here — only the webhook can, after it verifies signature + receives
// payment_intent.succeeded with metadata.booking_id we set below.
//
// Idempotency: if called twice for the same booking we re-create a Session.
// Old sessions auto-expire on Stripe's side at expires_at; the booking row's
// pending_until is the source of truth for our TTL sweep.

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { adminClient } from '$lib/server/supabase';
import { getStripe } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, url }) => {
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
		.select('id, booking_reference, guest_name, guest_email, num_guests, num_nights, check_in_date, check_out_date, total_cost, status, pending_until')
		.eq('booking_reference', bookingRef)
		.maybeSingle();
	if (fetchErr) throw fetchErr;
	if (!booking) {
		return json({ success: false, error: 'booking_not_found' }, { status: 404 });
	}
	if (booking.status !== 'pending_payment' && booking.status !== 'pending') {
		// Already confirmed, expired, cancelled, refunded — Checkout would be wrong.
		return json(
			{ success: false, error: 'booking_not_payable', current_status: booking.status },
			{ status: 409 }
		);
	}

	const siteUrl = publicEnv.PUBLIC_SITE_URL ?? `${url.protocol}//${url.host}`;
	const totalCents = Math.round(Number(booking.total_cost) * 100);

	// Set Session expiry to align with the booking's pending_until so Stripe
	// stops accepting payment exactly when our TTL sweep would release the
	// inventory anyway. Min 30 min per Stripe; cap at 24h.
	let expiresAt: number | undefined;
	if (booking.pending_until) {
		const pendingMs = new Date(booking.pending_until).getTime();
		const now = Date.now();
		const delta = Math.max(30 * 60_000, Math.min(24 * 60 * 60_000, pendingMs - now));
		expiresAt = Math.floor((now + delta) / 1000);
	}

	const session = await stripe.checkout.sessions.create({
		mode: 'payment',
		payment_method_types: ['card'],
		customer_email: booking.guest_email,
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: 'eur',
					unit_amount: totalCents,
					product_data: {
						name: 'Marianne Cottage — Direct booking',
						description: `${booking.num_nights} night${booking.num_nights === 1 ? '' : 's'} · ${booking.num_guests} guest${booking.num_guests === 1 ? '' : 's'} · ${booking.check_in_date} → ${booking.check_out_date}`
					}
				}
			}
		],
		// CRITICAL: metadata flows from Session → PaymentIntent so the webhook
		// handler's findBookingForPaymentIntent fallback can match the booking
		// before payment_intent_id is written to the booking row.
		metadata: {
			booking_id: booking.id,
			booking_reference: booking.booking_reference
		},
		payment_intent_data: {
			metadata: {
				booking_id: booking.id,
				booking_reference: booking.booking_reference
			},
			description: `Marianne Cottage booking ${booking.booking_reference}`
		},
		success_url: `${siteUrl}/book/confirm?ref=${encodeURIComponent(booking.booking_reference)}&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${siteUrl}/book?payment_cancelled=1&ref=${encodeURIComponent(booking.booking_reference)}`,
		expires_at: expiresAt,
		locale: 'auto'
	});

	if (!session.url) {
		console.error('[checkout-session] stripe returned session without url', session.id);
		return json({ success: false, error: 'stripe_no_url' }, { status: 502 });
	}

	return json({ success: true, url: session.url, session_id: session.id });
};
