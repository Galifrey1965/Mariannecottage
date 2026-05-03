// PR 4 (admin slice): refund engine driven by the snapshot cancellation policy.
//
// Pure functions only — no I/O. The API endpoint loads the policy + booking
// and feeds them in; the engine returns the refund/absorbed-fee numbers; the
// endpoint persists the decision.
//
// Booking → policy is snapshot at booking time (book_dates_atomic stamps
// cancellation_policy_id on the row), so policy edits never retroactively
// change a confirmed booking's refund terms.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import type { CancellationPolicy, CancellationPolicySchedule } from './supabase';

// Stripe doesn't return its own fee on refunds — the cottage absorbs it. We
// don't have the real balance-transaction fee handy at admin-decision time, so
// we estimate from typical EU consumer-card pricing. Refine to a per-booking
// real number once we wire up Stripe balance_transactions lookup.
const ABSORBED_FEE_PERCENT = 0.015;
const ABSORBED_FEE_FLAT = 0.25;

export interface RefundQuote {
	days_before_check_in: number;
	refund_pct: number;
	refund_amount: number;
	absorbed_fee_estimate: number;
	policy_name: string;
	matched_window: CancellationPolicySchedule | null;
}

export function daysBetween(fromIso: string, toIso: string): number {
	// Day-resolution diff. Both inputs are date strings; use UTC midnights to
	// avoid DST-induced fence-post errors. Result is `to - from` rounded down.
	const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
	const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`);
	const ms = to - from;
	return Math.floor(ms / 86_400_000);
}

export function selectWindow(
	schedule: CancellationPolicySchedule[],
	daysBeforeCheckIn: number
): CancellationPolicySchedule | null {
	if (!schedule || schedule.length === 0) return null;
	// Walk descending so "≥14d → 100%" wins over "≥7d → 50%" when both apply.
	const sorted = [...schedule].sort(
		(a, b) => b.days_before_check_in - a.days_before_check_in
	);
	for (const window of sorted) {
		if (daysBeforeCheckIn >= window.days_before_check_in) {
			return window;
		}
	}
	return null;
}

export function round2(n: number): number {
	// Round to 2dp via integer math to dodge binary-float drift on sums.
	return Math.round(n * 100) / 100;
}

export function estimateAbsorbedFee(refundAmount: number): number {
	if (refundAmount <= 0) return 0;
	return round2(refundAmount * ABSORBED_FEE_PERCENT + ABSORBED_FEE_FLAT);
}

export interface ComputeRefundInput {
	policy: CancellationPolicy;
	checkInDate: string;
	totalCost: number;
	now?: string;
}

export function computeRefund(input: ComputeRefundInput): RefundQuote {
	const { policy, checkInDate, totalCost } = input;
	const today = (input.now ?? new Date().toISOString()).slice(0, 10);

	const daysBeforeCheckIn = daysBetween(today, checkInDate);
	const matched = selectWindow(policy.schedule, daysBeforeCheckIn);
	const refund_pct = matched?.refund_pct ?? 0;
	const refund_amount = round2((totalCost * refund_pct) / 100);
	const absorbed_fee_estimate = estimateAbsorbedFee(refund_amount);

	return {
		days_before_check_in: daysBeforeCheckIn,
		refund_pct,
		refund_amount,
		absorbed_fee_estimate,
		policy_name: policy.name,
		matched_window: matched ?? null
	};
}
