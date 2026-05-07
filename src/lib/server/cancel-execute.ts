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
	refundChoice: 'auto' | 'none' | 'override';
	/**
	 * Custom refund amount in EUR (not cents). Required when
	 * refundChoice === 'override'. Used for goodwill refunds on
	 * non-refundable bookings, partial-refund settlements, etc.
	 * Always paired with a non-empty `reason` so the audit trail
	 * captures why the policy was overridden.
	 */
	overrideAmount?: number;
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
	const { booking, quote, refundChoice, overrideAmount, reason, source, userId, markTokenUsed } = input;

	if (!CANCELLABLE_STATUSES.has(booking.status)) {
		throw new CancelStateError(409, `Cannot cancel a booking in status '${booking.status}'`);
	}

	// Override gates: validate up-front so we don't half-cancel before
	// realising the input was malformed. Override is admin-only territory
	// (the guest magic-link path always passes 'auto'), so loose validation
	// here is fine — the API layer also re-validates.
	if (refundChoice === 'override') {
		if (typeof overrideAmount !== 'number' || !Number.isFinite(overrideAmount) || overrideAmount <= 0) {
			throw new CancelStateError(400, 'Override refund requires a positive amount');
		}
		if (overrideAmount > booking.total_cost) {
			throw new CancelStateError(400, 'Override refund cannot exceed the booking total');
		}
		if (!booking.payment_intent_id) {
			throw new CancelStateError(400, 'Cannot refund — no payment_intent_id on this booking');
		}
		if (booking.status !== 'confirmed') {
			throw new CancelStateError(400, 'Override refund only valid for confirmed bookings');
		}
		if (!reason || !reason.trim()) {
			throw new CancelStateError(400, 'Override refund requires a reason');
		}
	}

	// Resolve the effective refund amount based on the choice. Auto follows
	// the snapshot policy quote; override uses the admin-supplied amount;
	// none refunds nothing.
	let effectiveAmount = 0;
	const isOverride = refundChoice === 'override';
	if (
		refundChoice === 'auto' &&
		booking.payment_intent_id &&
		booking.status === 'confirmed' &&
		quote &&
		quote.refund_amount > 0
	) {
		effectiveAmount = quote.refund_amount;
	} else if (isOverride) {
		effectiveAmount = overrideAmount as number;
	}

	let stripeRefundId: string | null = null;
	if (effectiveAmount > 0 && booking.payment_intent_id) {
		const stripe = getStripe();
		if (!stripe) {
			throw new CancelStateError(503, 'Stripe not configured; cannot process refund');
		}
		try {
			const amountCents = Math.round(effectiveAmount * 100);
			const refund = await stripe.refunds.create(
				{
					payment_intent: booking.payment_intent_id,
					amount: amountCents,
					reason: 'requested_by_customer',
					metadata: {
						booking_id: booking.id,
						booking_reference: booking.booking_reference,
						refund_pct: isOverride ? 'override' : String(quote?.refund_pct ?? 0),
						policy_overridden: isOverride ? 'true' : 'false',
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

	// Free the availability rows the cancelled booking owned. book_dates_atomic
	// writes synced_from='manual' for every booking it creates, so we scope the
	// free to that — BC-synced rows have their own lifecycle (the iCal sync
	// owns them) and BC bookings cancel via a different path. Failure here is
	// non-fatal: the booking is already cancelled, the dates just stay blocked
	// on the public calendar until the next backfill / manual nudge.
	const dates: string[] = [];
	const cursor = new Date(booking.check_in_date + 'T00:00:00Z');
	const end = new Date(booking.check_out_date + 'T00:00:00Z');
	while (cursor < end) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	if (dates.length > 0) {
		const { error: freeError } = await adminClient
			.from('availability')
			.update({ available: true, synced_at: new Date().toISOString() })
			.in('date', dates)
			.eq('synced_from', 'manual');
		if (freeError) {
			console.error('[cancel-execute] availability free failed:', freeError);
		}
	}

	await logAdminEvent({
		user_id: userId,
		action: source === 'admin' ? 'admin_cancel_refund' : 'guest_cancel_refund',
		target_type: 'booking',
		target_id: booking.id,
		metadata: {
			source,
			refund_choice: refundChoice,
			policy_overridden: isOverride,
			reason: reason ?? null,
			prior_status: booking.status,
			// For an override, the effective amount drives the audit log; the
			// quote (still computed against the snapshot policy) is recorded
			// alongside as `policy_quoted_amount` so reviewers can see how far
			// the override deviated from policy.
			refund_amount: effectiveAmount,
			policy_quoted_amount: quote?.refund_amount ?? 0,
			refund_pct: isOverride ? null : (quote?.refund_pct ?? 0),
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
			// Email summary tracks what the guest actually got refunded
			// (effectiveAmount) — for an override that's the admin's number,
			// not the policy quote. policyName flips to 'Goodwill override'
			// so the guest doesn't read "Non-refundable" alongside a
			// non-zero refund and get confused.
			const refundSummary =
				stripeRefundId && effectiveAmount > 0
					? {
							refundAmount: effectiveAmount,
							refundPct: isOverride ? 0 : (quote?.refund_pct ?? 0),
							policyName: isOverride ? 'Goodwill override' : (quote?.policy_name ?? '')
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
