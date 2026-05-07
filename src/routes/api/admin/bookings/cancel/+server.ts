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
// The actual cancel-with-refund execution lives in $lib/server/cancel-execute.ts —
// shared with the guest magic-link path at /book/cancel.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	loadBookingForCancel,
	executeCancellation,
	CancelStateError
} from '$lib/server/cancel-execute';
import type { Booking, CancellationPolicy } from '$lib/server/supabase';
import type { RefundQuote } from '$lib/server/cancellation';

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

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });

	const preview = await loadBookingForCancel(id);
	if (!preview) return json({ error: 'Booking not found' }, { status: 404 });
	if (!preview.policy || !preview.quote) {
		return json({ error: 'No cancellation policy on file' }, { status: 500 });
	}

	const out: CancelPreview = {
		booking: {
			id: preview.booking.id,
			booking_reference: preview.booking.booking_reference,
			guest_name: preview.booking.guest_name,
			guest_email: preview.booking.guest_email,
			check_in_date: preview.booking.check_in_date,
			check_out_date: preview.booking.check_out_date,
			total_cost: preview.booking.total_cost,
			status: preview.booking.status,
			payment_intent_id: preview.booking.payment_intent_id
		},
		quote: preview.quote,
		policy: {
			id: preview.policy.id,
			name: preview.policy.name,
			description: preview.policy.description,
			schedule: preview.policy.schedule
		},
		can_refund: preview.can_refund
	};

	return json(out);
};

interface CancelPostBody {
	id: string;
	reason?: string;
	refund: 'auto' | 'none' | 'override';
	override_amount?: number;
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = (await request.json()) as Partial<CancelPostBody>;
	if (!body.id || !body.refund || !['auto', 'none', 'override'].includes(body.refund)) {
		return json({ error: 'id and refund (auto|none|override) required' }, { status: 400 });
	}

	if (body.refund === 'override') {
		if (typeof body.override_amount !== 'number' || !Number.isFinite(body.override_amount) || body.override_amount <= 0) {
			return json({ error: 'override_amount must be a positive number' }, { status: 400 });
		}
		if (!body.reason || !body.reason.trim()) {
			return json({ error: 'reason is required when overriding the policy' }, { status: 400 });
		}
	}

	const preview = await loadBookingForCancel(body.id);
	if (!preview) return json({ error: 'Booking not found' }, { status: 404 });

	try {
		const { booking, stripeRefundId } = await executeCancellation({
			booking: preview.booking,
			quote: preview.quote,
			refundChoice: body.refund,
			overrideAmount: body.refund === 'override' ? body.override_amount : undefined,
			reason: body.reason,
			source: 'admin',
			userId: locals.user.id
		});
		return json({
			success: true,
			booking,
			quote: preview.quote,
			stripe_refund_id: stripeRefundId
		});
	} catch (err) {
		if (err instanceof CancelStateError) {
			return json({ error: err.message }, { status: err.status });
		}
		throw err;
	}
};
