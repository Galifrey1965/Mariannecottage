// B-06 Phase 2: Stripe webhook handler.
//
// Handles three event types:
//   - payment_intent.succeeded         → confirm booking (or refund_overbooked
//                                        for the late-success race)
//   - payment_intent.payment_failed    → retain pending_payment, bump attempts
//   - charge.refunded                  → mark booking refunded (admin-issued
//                                        refund flow, idempotent)
//
// SvelteKit gotcha — signature verification needs the raw request body, not
// parsed JSON. We use request.text() and pass that into Stripe's
// constructEvent. Per spec: documentation/specs/phase-2-direct-booking.md PR 2.
//
// Idempotency lives in the SQL function handle_stripe_event: dedup on
// stripe_webhook_events.event_id, then booking UPDATE + agent_events INSERT
// in one transaction. Replays of an already-processed event are no-ops.
//
// Failure response semantics for Stripe's retry policy:
//   200 — handled (or duplicate, or no matching booking — Stripe stops)
//   400 — signature invalid (bad config or attacker — Stripe stops)
//   503 — Stripe keys not configured (Stripe will retry — buys time to
//         set env vars without losing events during the dark-deploy window)
//   500 — handler threw (Stripe retries up to 3 days)

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { adminClient } from '$lib/server/supabase';
import { getStripe, getWebhookSecret } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request }) => {
	const stripe = getStripe();
	const secret = getWebhookSecret();

	if (!stripe || !secret) {
		console.warn('[stripe-webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET not configured');
		return new Response('stripe not configured', { status: 503 });
	}

	const signature = request.headers.get('stripe-signature');
	if (!signature) {
		return new Response('missing stripe-signature header', { status: 400 });
	}

	const rawBody = await request.text();

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(rawBody, signature, secret);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.warn(`[stripe-webhook] signature verification failed: ${message}`);
		return new Response('invalid signature', { status: 400 });
	}

	try {
		const result = await routeEvent(stripe, event);
		return json(result);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error(`[stripe-webhook] handler threw on ${event.type} (${event.id}): ${message}`);
		return new Response('handler error', { status: 500 });
	}
};

async function routeEvent(
	stripe: Stripe,
	event: Stripe.Event
): Promise<{ duplicate: boolean; action: string }> {
	switch (event.type) {
		case 'payment_intent.succeeded':
			return handlePaymentIntentSucceeded(stripe, event);
		case 'payment_intent.payment_failed':
			return handlePaymentIntentFailed(event);
		case 'charge.refunded':
			return handleChargeRefunded(event);
		default:
			// Stripe sends events for many lifecycle moments we don't subscribe to;
			// any that arrive at this handler we acknowledge but don't act on.
			return { duplicate: false, action: 'ignored' };
	}
}

async function handlePaymentIntentSucceeded(
	stripe: Stripe,
	event: Stripe.Event
): Promise<{ duplicate: boolean; action: string }> {
	const pi = event.data.object as Stripe.PaymentIntent;
	const booking = await findBookingForPaymentIntent(pi);

	if (!booking) {
		// No matching booking row — could be a stale intent or test event.
		// Acknowledge so Stripe stops retrying; record the event for audit.
		await callHandleStripeEvent(event.id, event.type, null, {}, {
			reason: 'no_matching_booking',
			payment_intent_id: pi.id
		});
		return { duplicate: false, action: 'no_booking' };
	}

	// Late-success race: row was swept to 'expired' before this event fired,
	// or has already been confirmed by an earlier (idempotent) replay.
	if (booking.status === 'expired') {
		// Refund first, then mark refunded_overbooked. If the Stripe refund call
		// fails we throw → Stripe retries the webhook → next attempt re-runs.
		await stripe.refunds.create({
			payment_intent: pi.id,
			reason: 'requested_by_customer',
			metadata: { reason: 'overbooked', booking_id: booking.id }
		});
		const result = await callHandleStripeEvent(
			event.id,
			event.type,
			booking.id,
			{
				status: 'refunded_overbooked',
				payment_intent_id: pi.id,
				pending_until: null
			},
			{
				event_type: event.type,
				payment_intent_id: pi.id,
				amount: pi.amount,
				outcome: 'refunded_overbooked',
				prior_status: booking.status
			}
		);
		return { duplicate: result.duplicate, action: 'refunded_overbooked' };
	}

	if (booking.status === 'confirmed' || booking.status === 'refunded') {
		// Already confirmed (probably a duplicate replay); just dedup-record it.
		const result = await callHandleStripeEvent(
			event.id,
			event.type,
			booking.id,
			{},
			{ event_type: event.type, payment_intent_id: pi.id, outcome: 'noop_already_settled' }
		);
		return { duplicate: result.duplicate, action: 'noop' };
	}

	// Happy path: pending_payment → confirmed.
	const result = await callHandleStripeEvent(
		event.id,
		event.type,
		booking.id,
		{
			status: 'confirmed',
			payment_intent_id: pi.id,
			paid_at: new Date(event.created * 1000).toISOString(),
			pending_until: null
		},
		{
			event_type: event.type,
			payment_intent_id: pi.id,
			amount: pi.amount,
			outcome: 'confirmed',
			prior_status: booking.status
		}
	);
	return { duplicate: result.duplicate, action: 'confirmed' };
}

async function handlePaymentIntentFailed(
	event: Stripe.Event
): Promise<{ duplicate: boolean; action: string }> {
	const pi = event.data.object as Stripe.PaymentIntent;
	const booking = await findBookingForPaymentIntent(pi);

	if (!booking) {
		await callHandleStripeEvent(event.id, event.type, null, {}, {
			reason: 'no_matching_booking',
			payment_intent_id: pi.id
		});
		return { duplicate: false, action: 'no_booking' };
	}

	// Stay in pending_payment so the guest can retry their card without losing
	// the inventory hold. TTL sweep cleans up stale rows; this handler only
	// records the attempt.
	const errorMessage = pi.last_payment_error?.message ?? 'unknown';
	const result = await callHandleStripeEvent(
		event.id,
		event.type,
		booking.id,
		{
			increment_payment_attempts: true,
			last_payment_error: errorMessage
		},
		{
			event_type: event.type,
			payment_intent_id: pi.id,
			outcome: 'attempt_failed',
			error_code: pi.last_payment_error?.code ?? null,
			error_message: errorMessage
		}
	);
	return { duplicate: result.duplicate, action: 'attempt_failed' };
}

async function handleChargeRefunded(
	event: Stripe.Event
): Promise<{ duplicate: boolean; action: string }> {
	const charge = event.data.object as Stripe.Charge;
	const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
	if (!piId) {
		return { duplicate: false, action: 'no_payment_intent' };
	}

	const { data, error } = await adminClient
		.from('bookings')
		.select('id, status')
		.eq('payment_intent_id', piId)
		.maybeSingle();
	if (error) throw error;
	const booking = data;

	if (!booking) {
		await callHandleStripeEvent(event.id, event.type, null, {}, {
			reason: 'no_matching_booking',
			payment_intent_id: piId
		});
		return { duplicate: false, action: 'no_booking' };
	}

	// If already in a refunded terminal state (refunded_overbooked is set when
	// we issued the refund proactively), don't downgrade.
	if (booking.status === 'refunded_overbooked' || booking.status === 'refunded') {
		const result = await callHandleStripeEvent(
			event.id,
			event.type,
			booking.id,
			{},
			{ event_type: event.type, payment_intent_id: piId, outcome: 'noop_already_refunded' }
		);
		return { duplicate: result.duplicate, action: 'noop' };
	}

	const result = await callHandleStripeEvent(
		event.id,
		event.type,
		booking.id,
		{ status: 'refunded' },
		{
			event_type: event.type,
			payment_intent_id: piId,
			amount_refunded: charge.amount_refunded,
			outcome: 'refunded',
			prior_status: booking.status
		}
	);
	return { duplicate: result.duplicate, action: 'refunded' };
}

async function findBookingForPaymentIntent(pi: Stripe.PaymentIntent) {
	// Prefer lookup by payment_intent_id; fall back to metadata.booking_id
	// (set when the PaymentIntent was created — useful before the row's
	// payment_intent_id column has been populated).
	const { data: byPi, error: piErr } = await adminClient
		.from('bookings')
		.select('id, status, check_in_date, check_out_date')
		.eq('payment_intent_id', pi.id)
		.maybeSingle();
	if (piErr) throw piErr;
	if (byPi) return byPi;

	const bookingId = pi.metadata?.booking_id;
	if (bookingId) {
		const { data: byMeta, error: metaErr } = await adminClient
			.from('bookings')
			.select('id, status, check_in_date, check_out_date')
			.eq('id', bookingId)
			.maybeSingle();
		if (metaErr) throw metaErr;
		return byMeta;
	}
	return null;
}

async function callHandleStripeEvent(
	eventId: string,
	eventType: string,
	bookingId: string | null,
	bookingPatch: Record<string, unknown>,
	audit: Record<string, unknown>
): Promise<{ duplicate: boolean }> {
	const { data, error } = await adminClient.rpc('handle_stripe_event', {
		p_event_id: eventId,
		p_event_type: eventType,
		p_booking_id: bookingId,
		p_booking_patch: bookingPatch,
		p_audit: audit
	});
	if (error) throw error;
	return data as { duplicate: boolean };
}
