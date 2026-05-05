// PR 4: shared cancellation execution path for admin + guest entry points.
//
// Both the admin endpoint (/api/admin/bookings/cancel) and the guest magic-link
// action (/book/cancel) call this. They differ only in *how* the caller is
// authenticated (admin session vs HMAC token) and in the audit-row metadata —
// the actual cancel-with-refund logic is the same.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import {
	adminClient,
	getCancellationPolicyById,
	getDefaultCancellationPolicy,
	logAdminEvent,
	type Booking,
	type CancellationPolicy
} from './supabase';
import { computeRefund, type RefundQuote } from './cancellation';
import { getStripe } from './stripe';
import { emailService } from './email';
import { bookingToEmailDetails, localeFromBooking } from './email-adapter';

const CANCELLABLE_STATUSES = new Set(['pending', 'pending_payment', 'confirmed']);

export interface BookingPreview {
	booking: Booking;
	policy: CancellationPolicy | null;
	quote: RefundQuote | null;
	can_refund: boolean;
}

export async function loadBookingForCancel(bookingId: string): Promise<BookingPreview | null> {
	const { data, error } = await adminClient
		.from('bookings')
		.select('*')
		.eq('id', bookingId)
		.maybeSingle();
	if (error) throw error;
	const booking = data as Booking | null;
	if (!booking) return null;

	let policy: CancellationPolicy | null = null;
	if (booking.cancellation_policy_id) {
		policy = await getCancellationPolicyById(booking.cancellation_policy_id);
	}
	if (!policy) {
		policy = await getDefaultCancellationPolicy();
	}

	const quote = policy
		? computeRefund({
				policy,
				checkInDate: booking.check_in_date,
				totalCost: booking.total_cost
		  })
		: null;

	const can_refund =
		!!booking.payment_intent_id &&
		booking.status === 'confirmed' &&
		!!quote &&
		quote.refund_amount > 0;

	return { booking, policy, quote, can_refund };
}

export interface ExecuteCancelInput {
	booking: Booking;
	quote: RefundQuote | null;
	refundChoice: 'auto' | 'none';
	reason?: string;
	source: 'admin' | 'guest';
	/**
	 * Admin user id when source='admin'; null for guest cancels.
	 * The audit row records this verbatim so we can distinguish actor types
	 * during incident review.
	 */
	userId: string | null;
	/**
	 * Set true to additionally stamp bookings.cancellation_token_used_at = NOW().
	 * Guest path uses this for replay protection on the magic-link token.
	 */
	markTokenUsed?: boolean;
}

export interface ExecuteCancelResult {
	booking: Booking;
	stripeRefundId: string | null;
}

export class CancelStateError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message);
		this.name = 'CancelStateError';
	}
}

export async function executeCancellation(input: ExecuteCancelInput): Promise<ExecuteCancelResult> {
	const { booking, quote, refundChoice, reason, source, userId, markTokenUsed } = input;

	if (!CANCELLABLE_STATUSES.has(booking.status)) {
		throw new CancelStateError(409, `Cannot cancel a booking in status '${booking.status}'`);
	}

	let stripeRefundId: string | null = null;

	if (
		refundChoice === 'auto' &&
		booking.payment_intent_id &&
		booking.status === 'confirmed' &&
		quote &&
		quote.refund_amount > 0
	) {
		const stripe = getStripe();
		if (!stripe) {
			throw new CancelStateError(503, 'Stripe not configured; cannot process refund');
		}
		try {
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
						source,
						initiator_user_id: userId ?? '',
						guest_or_admin_reason: reason ?? ''
					}
				},
				// Same idempotency key shape regardless of source — a booking is
				// cancelled at most once, so the key is stable for both admin and
				// guest paths. Re-execution within 24h returns Stripe's stored result.
				{ idempotencyKey: `booking-${booking.id}-cancel-refund` }
			);
			stripeRefundId = refund.id;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown';
			console.error(`[cancel-execute] Stripe refund failed for ${booking.id}: ${message}`);
			throw new CancelStateError(502, `Stripe refund failed: ${message}`);
		}
	}

	const adminNoteAppend = reason
		? `[${new Date().toISOString().slice(0, 10)} ${source} cancel] ${reason}`
		: null;
	const newAdminNotes = adminNoteAppend
		? booking.admin_notes
			? `${booking.admin_notes}\n${adminNoteAppend}`
			: adminNoteAppend
		: booking.admin_notes;

	const update: Record<string, unknown> = {
		status: 'cancelled',
		admin_notes: newAdminNotes,
		updated_at: new Date().toISOString()
	};
	if (markTokenUsed) {
		update.cancellation_token_used_at = new Date().toISOString();
	}

	const { data: updated, error: updateError } = await adminClient
		.from('bookings')
		.update(update)
		.eq('id', booking.id)
		.select()
		.single();
	if (updateError) {
		console.error('[cancel-execute] booking update failed:', updateError);
		throw new CancelStateError(500, 'Booking update failed');
	}

	await logAdminEvent({
		user_id: userId,
		action: source === 'admin' ? 'admin_cancel_refund' : 'guest_cancel_refund',
		target_type: 'booking',
		target_id: booking.id,
		metadata: {
			source,
			refund_choice: refundChoice,
			reason: reason ?? null,
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

	const updatedBooking = updated as Booking;

	// Notify the guest. Failure here doesn't roll back the cancellation —
	// the row is cancelled, the refund is in flight, and we don't want a
	// flaky email to make the admin think the action didn't take. The
	// charge.refunded webhook will follow up with the refund-issued email
	// once Stripe actually clears the refund.
	if (updatedBooking.guest_email) {
		try {
			const refundSummary =
				stripeRefundId && quote && quote.refund_amount > 0
					? {
							refundAmount: quote.refund_amount,
							refundPct: quote.refund_pct,
							policyName: quote.policy_name
					  }
					: null;
			await emailService.sendBookingCancelled(
				bookingToEmailDetails(updatedBooking),
				refundSummary,
				localeFromBooking(updatedBooking)
			);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown';
			console.error(`[cancel-execute] cancellation email failed for ${booking.id}: ${message}`);
		}
	}

	return { booking: updatedBooking, stripeRefundId };
}
