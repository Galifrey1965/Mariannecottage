// Admin-only "resend a transactional email" endpoint.
//
// POST /api/admin/bookings/resend-email
//   { id: string, type: 'confirmation' | 'cancellation' }
//
// Use cases:
//   - Guest reports they didn't receive their booking confirmation.
//   - Admin needs to re-share the cancel magic link by email (resends the
//     full confirmation, which embeds the link).
//   - Guest reports they didn't receive the cancellation email after Mark
//     cancelled them.
//
// Status guards mirror the buttons in the admin panel:
//   - 'confirmation' is only valid for status === 'confirmed' (the link the
//     email contains is only meaningful for an active booking).
//   - 'cancellation' is only valid for cancelled-family statuses.
// Anything else returns 409 with the current status, so the UI can hide the
// button accurately.
//
// For 'cancellation', we look up the most recent admin_cancel_refund event in
// agent_events and reconstruct a RefundSummary so the resent email matches
// what was originally sent. If no such event exists (e.g. legacy row), the
// email goes out without refund detail — guest can check their bank.
//
// Every send is recorded in agent_events with action='email.resend' so the
// audit log carries a clear trail of who replayed what and when.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient, logAdminEvent, type Booking } from '$lib/server/supabase';
import {
	emailService,
	type RefundSummary
} from '$lib/server/email';
import {
	bookingToEmailDetails,
	buildCancelMagicLink,
	localeFromBooking
} from '$lib/server/email-adapter';

type ResendType = 'confirmation' | 'cancellation';

const CANCELLED_STATUSES = new Set(['cancelled', 'refunded', 'refunded_overbooked']);

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const id: string | undefined = body?.id;
	const type: ResendType | undefined = body?.type;

	if (!id || !type) {
		return json({ error: 'id and type are required' }, { status: 400 });
	}
	if (type !== 'confirmation' && type !== 'cancellation') {
		return json({ error: `Unknown type '${type}'` }, { status: 400 });
	}

	const { data, error } = await adminClient
		.from('bookings')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) {
		console.error('[resend-email] booking lookup failed:', error);
		return json({ error: 'Lookup failed' }, { status: 500 });
	}
	const booking = data as Booking | null;
	if (!booking) {
		return json({ error: 'Booking not found' }, { status: 404 });
	}
	if (!booking.guest_email) {
		return json(
			{ error: "This booking has no guest email — fill it in first." },
			{ status: 409 }
		);
	}

	if (type === 'confirmation' && booking.status !== 'confirmed') {
		return json(
			{
				error: `Confirmation resend only valid for confirmed bookings (current: '${booking.status}').`,
				current_status: booking.status
			},
			{ status: 409 }
		);
	}
	if (type === 'cancellation' && !CANCELLED_STATUSES.has(booking.status)) {
		return json(
			{
				error: `Cancellation resend only valid for cancelled bookings (current: '${booking.status}').`,
				current_status: booking.status
			},
			{ status: 409 }
		);
	}

	const lang = localeFromBooking(booking);
	const details = bookingToEmailDetails(booking);

	try {
		if (type === 'confirmation') {
			const cancelLink = buildCancelMagicLink(booking);
			await emailService.sendBookingConfirmation(details, lang, cancelLink);
		} else {
			const refund = await loadLastRefundSummary(booking.id);
			await emailService.sendBookingCancelled(details, refund, lang);
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown';
		console.error(`[resend-email] send failed (${type}, booking ${booking.id}): ${message}`);
		return json({ error: 'Email send failed — see server log' }, { status: 502 });
	}

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'email.resend',
		target_type: 'booking',
		target_id: booking.id,
		metadata: {
			type,
			booking_reference: booking.booking_reference,
			recipient: booking.guest_email
		}
	});

	return json({ success: true });
};

async function loadLastRefundSummary(bookingId: string): Promise<RefundSummary | null> {
	const { data } = await adminClient
		.from('agent_events')
		.select('metadata')
		.eq('target_id', bookingId)
		.eq('action', 'admin_cancel_refund')
		.order('created_at', { ascending: false })
		.limit(1);
	const meta = data?.[0]?.metadata as Record<string, unknown> | undefined;
	if (!meta) return null;
	const refundAmount = Number(meta.refund_amount ?? 0);
	const refundPct = Number(meta.refund_pct ?? 0);
	const policyName = typeof meta.policy_name === 'string' ? meta.policy_name : 'Cancellation';
	if (!Number.isFinite(refundAmount) || refundAmount <= 0) return null;
	return { refundAmount, refundPct, policyName };
}
