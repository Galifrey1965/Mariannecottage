// PR 4 (admin slice): admin-driven cancel-with-refund.
//
// GET  ?id=<bookingId>          → returns refund preview computed against the
//                                  booking's snapshot policy. No side effects.
// POST { id, reason?, refund }  → executes the cancellation. `refund` is one of
//                                  'auto' (issue refund per policy preview) or
//                                  'none' (cancel without refund — for legacy /
//                                  pre-payment rows or admin override).
//
// On execute we flip status to 'cancelled' immediately. The follow-up
// `charge.refunded` webhook is what finally flips the row to 'refunded';
// this endpoint just kicks off the refund.
//
// Idempotency: Stripe refunds.create is called with idempotencyKey
// `booking-<id>-cancel-refund`. Since a booking is cancelled at most once,
// re-running the same admin action within 24h returns Stripe's stored result
// instead of double-refunding.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import { json, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	adminClient,
	getCancellationPolicyById,
	getDefaultCancellationPolicy,
	logAdminEvent,
	type Booking,
	type CancellationPolicy
} from '$lib/server/supabase';
import { computeRefund, type RefundQuote } from '$lib/server/cancellation';
import { getStripe } from '$lib/server/stripe';

interface CancelPreview {
	booking: Pick<
		Booking,
		'id' | 'booking_reference' | 'guest_name' | 'guest_email' |
		'check_in_date' | 'check_out_date' | 'total_cost' | 'status' | 'payment_intent_id'
	>;
	quote: RefundQuote;
	policy: Pick<CancellationPolicy, 'id' | 'name' | 'description' | 'schedule'>;
	can_refund: boolean;
}

const CANCELLABLE_STATUSES = new Set([
	'pending', 'pending_payment', 'confirmed'
]);

async function loadBookingAndPolicy(bookingId: string) {
	const { data, error } = await adminClient
		.from('bookings')
		.select('*')
		.eq('id', bookingId)
		.maybeSingle();
	if (error) throw error;
	const booking = data as Booking | null;
	if (!booking) return { booking: null, policy: null };

	let policy: CancellationPolicy | null = null;
	if (booking.cancellation_policy_id) {
		policy = await getCancellationPolicyById(booking.cancellation_policy_id);
	}
	if (!policy) {
		// Fallback for legacy bookings that pre-date the cancellation_policy_id
		// column. They get the current default policy at admin-decision time.
		policy = await getDefaultCancellationPolicy();
	}
	return { booking, policy };
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });

	const { booking, policy } = await loadBookingAndPolicy(id);
	if (!booking) return json({ error: 'Booking not found' }, { status: 404 });
	if (!policy) return json({ error: 'No cancellation policy on file' }, { status: 500 });

	const quote = computeRefund({
		policy,
		checkInDate: booking.check_in_date,
		totalCost: booking.total_cost
	});

	const preview: CancelPreview = {
		booking: {
			id: booking.id,
			booking_reference: booking.booking_reference,
			guest_name: booking.guest_name,
			guest_email: booking.guest_email,
			check_in_date: booking.check_in_date,
			check_out_date: booking.check_out_date,
			total_cost: booking.total_cost,
			status: booking.status,
			payment_intent_id: booking.payment_intent_id
		},
		quote,
		policy: {
			id: policy.id,
			name: policy.name,
			description: policy.description,
			schedule: policy.schedule
		},
		can_refund:
			!!booking.payment_intent_id &&
			booking.status === 'confirmed' &&
			quote.refund_amount > 0
	};

	return json(preview);
};

interface CancelPostBody {
	id: string;
	reason?: string;
	refund: 'auto' | 'none';
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = (await request.json()) as Partial<CancelPostBody>;
	if (!body.id || (body.refund !== 'auto' && body.refund !== 'none')) {
		return json({ error: 'id and refund (auto|none) required' }, { status: 400 });
	}

	const { booking, policy } = await loadBookingAndPolicy(body.id);
	if (!booking) return json({ error: 'Booking not found' }, { status: 404 });
	if (!CANCELLABLE_STATUSES.has(booking.status)) {
		return json(
			{ error: `Cannot cancel a booking in status '${booking.status}'` },
			{ status: 409 }
		);
	}

	const quote = policy
		? computeRefund({
				policy,
				checkInDate: booking.check_in_date,
				totalCost: booking.total_cost
		  })
		: null;

	let stripeRefundId: string | null = null;
	let stripeRefundError: string | null = null;

	if (
		body.refund === 'auto' &&
		booking.payment_intent_id &&
		booking.status === 'confirmed' &&
		quote &&
		quote.refund_amount > 0
	) {
		const stripe = getStripe();
		if (!stripe) {
			return json(
				{ error: 'Stripe not configured; cannot process refund' },
				{ status: 503 }
			);
		}
		try {
			// Stripe wants the amount in the smallest currency unit (cents for EUR).
			const amountCents = Math.round(quote.refund_amount * 100);
			const refund = await stripe.refunds.create(
				{
					payment_intent: booking.payment_intent_id,
					amount: amountCents,
					reason: 'requested_by_customer',
					metadata: {
						booking_id: booking.id,
						booking_reference: booking.booking_reference,
						refund_pct: String(quote.refund_pct),
						admin_user_id: locals.user.id,
						admin_reason: body.reason ?? ''
					}
				},
				{ idempotencyKey: `booking-${booking.id}-cancel-refund` }
			);
			stripeRefundId = refund.id;
		} catch (err) {
			stripeRefundError = err instanceof Error ? err.message : 'unknown';
			console.error(`[admin-cancel] Stripe refund failed for ${booking.id}: ${stripeRefundError}`);
			return json(
				{
					error: `Stripe refund failed: ${stripeRefundError}`,
					can_retry: true
				},
				{ status: 502 }
			);
		}
	}

	// Flip the booking. The follow-up charge.refunded webhook will move
	// 'cancelled' → 'refunded' once Stripe confirms; the admin UI shows the
	// in-flight state in the meantime.
	const adminNoteAppend = body.reason
		? `[${new Date().toISOString().slice(0, 10)} cancel] ${body.reason}`
		: null;
	const newAdminNotes = adminNoteAppend
		? booking.admin_notes
			? `${booking.admin_notes}\n${adminNoteAppend}`
			: adminNoteAppend
		: booking.admin_notes;

	const { data: updated, error: updateError } = await adminClient
		.from('bookings')
		.update({
			status: 'cancelled',
			admin_notes: newAdminNotes,
			updated_at: new Date().toISOString()
		})
		.eq('id', booking.id)
		.select()
		.single();
	if (updateError) {
		console.error('[admin-cancel] booking update failed:', updateError);
		throw kitError(500, 'Booking update failed');
	}

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'admin_cancel_refund',
		target_type: 'booking',
		target_id: booking.id,
		metadata: {
			refund_choice: body.refund,
			reason: body.reason ?? null,
			prior_status: booking.status,
			refund_amount: quote?.refund_amount ?? 0,
			refund_pct: quote?.refund_pct ?? 0,
			absorbed_fee_estimate: quote?.absorbed_fee_estimate ?? 0,
			policy_name: quote?.policy_name ?? null,
			payment_intent_id: booking.payment_intent_id ?? null,
			stripe_refund_id: stripeRefundId,
			days_before_check_in: quote?.days_before_check_in ?? null
		}
	});

	return json({
		success: true,
		booking: updated,
		quote,
		stripe_refund_id: stripeRefundId
	});
};
