// PR 4: guest-facing magic-link cancel route.
//
// URL: /book/cancel?token=<base64url-payload>.<base64url-hmac>
//
// GET (load): verify the token's HMAC + expiry, look up the booking, ensure
//   it's still cancellable and the token hasn't been used. Returns the refund
//   preview to the page so the guest sees what they'll get back before they
//   commit.
// POST (default action): re-verifies the token + used flag, marks the token
//   used, executes the cancellation (always 'auto' refund — guest path has no
//   choice; the policy is the policy), writes the audit row, redirects to
//   /book/cancel/done.
//
// All errors render the page in an error state rather than 4xx-ing — guests
// click links from emails and shouldn't see raw HTTP errors.
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	verifyCancelToken,
	CancelTokenError
} from '$lib/server/cancel-token';
import {
	loadBookingForCancel,
	executeCancellation,
	CancelStateError
} from '$lib/server/cancel-execute';
import { adminClient } from '$lib/server/supabase';

type LoadOk = {
	state: 'ok';
	token: string;
	booking_reference: string;
	guest_name: string;
	check_in_date: string;
	check_out_date: string;
	total_cost: number;
	policy_name: string;
	refund_pct: number;
	refund_amount: number;
	days_before_check_in: number;
};

type LoadErr = {
	state: 'error';
	reason:
		| 'no_token'
		| 'invalid_token'
		| 'expired_token'
		| 'not_found'
		| 'already_cancelled'
		| 'not_cancellable'
		| 'token_already_used'
		| 'no_policy';
	message: string;
};

export const load: PageServerLoad = async ({ url }): Promise<LoadOk | LoadErr> => {
	const token = url.searchParams.get('token');
	if (!token) {
		return { state: 'error', reason: 'no_token', message: 'No cancellation token in this link.' };
	}

	let payload;
	try {
		payload = verifyCancelToken(token);
	} catch (err) {
		if (err instanceof CancelTokenError) {
			if (err.reason === 'expired') {
				return {
					state: 'error',
					reason: 'expired_token',
					message: 'This cancellation link has expired. Please contact us directly.'
				};
			}
			return {
				state: 'error',
				reason: 'invalid_token',
				message: 'This cancellation link is not valid.'
			};
		}
		throw err;
	}

	const preview = await loadBookingForCancel(payload.bid);
	if (!preview) {
		return {
			state: 'error',
			reason: 'not_found',
			message: 'We could not find this booking.'
		};
	}

	if (preview.booking.cancellation_token_used_at) {
		return {
			state: 'error',
			reason: 'token_already_used',
			message: 'This cancellation link has already been used.'
		};
	}

	if (preview.booking.status === 'cancelled' || preview.booking.status === 'refunded' || preview.booking.status === 'refunded_overbooked') {
		return {
			state: 'error',
			reason: 'already_cancelled',
			message: 'This booking has already been cancelled.'
		};
	}

	if (!['pending', 'pending_payment', 'confirmed'].includes(preview.booking.status)) {
		return {
			state: 'error',
			reason: 'not_cancellable',
			message: `This booking is in '${preview.booking.status}' state and can no longer be cancelled online — please contact us.`
		};
	}

	if (!preview.policy || !preview.quote) {
		return {
			state: 'error',
			reason: 'no_policy',
			message: 'We could not load the cancellation policy. Please contact us.'
		};
	}

	return {
		state: 'ok',
		token,
		booking_reference: preview.booking.booking_reference,
		guest_name: preview.booking.guest_name,
		check_in_date: preview.booking.check_in_date,
		check_out_date: preview.booking.check_out_date,
		total_cost: preview.booking.total_cost,
		policy_name: preview.quote.policy_name,
		refund_pct: preview.quote.refund_pct,
		refund_amount: preview.quote.refund_amount,
		days_before_check_in: preview.quote.days_before_check_in
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const token = String(formData.get('token') ?? '');
		const reason = String(formData.get('reason') ?? '').trim() || undefined;

		if (!token) {
			return fail(400, { error: 'Missing token.' });
		}

		let payload;
		try {
			payload = verifyCancelToken(token);
		} catch (err) {
			if (err instanceof CancelTokenError) {
				return fail(400, { error: 'Cancellation link is no longer valid.' });
			}
			throw err;
		}

		const preview = await loadBookingForCancel(payload.bid);
		if (!preview) return fail(404, { error: 'Booking not found.' });

		// Re-check the used flag after token verification — protects against
		// concurrent double-clicks. The DB update below sets it atomically.
		if (preview.booking.cancellation_token_used_at) {
			return fail(409, { error: 'This cancellation link has already been used.' });
		}

		// Race-safe used-flag claim: stamp the column NOW, but only if it's still
		// NULL. Two concurrent submissions: one wins (rowCount=1), one loses
		// (rowCount=0) — the loser sees already_used.
		const claimedAt = new Date().toISOString();
		const { data: claimed, error: claimError } = await adminClient
			.from('bookings')
			.update({ cancellation_token_used_at: claimedAt })
			.eq('id', preview.booking.id)
			.is('cancellation_token_used_at', null)
			.select('id')
			.maybeSingle();
		if (claimError) {
			console.error('[guest-cancel] token claim failed:', claimError);
			return fail(500, { error: 'Cancellation could not be processed. Please try again.' });
		}
		if (!claimed) {
			return fail(409, { error: 'This cancellation link has already been used.' });
		}

		try {
			await executeCancellation({
				booking: preview.booking,
				quote: preview.quote,
				refundChoice: 'auto',
				reason,
				source: 'guest',
				userId: null,
				// Token already claimed above; the helper would re-stamp the same
				// column, but skipping the re-write keeps the audit trail tight.
				markTokenUsed: false
			});
		} catch (err) {
			// Roll back the token claim so the guest can retry — otherwise a
			// transient Stripe/DB failure would leave the link permanently dead.
			await adminClient
				.from('bookings')
				.update({ cancellation_token_used_at: null })
				.eq('id', preview.booking.id)
				.eq('cancellation_token_used_at', claimedAt);

			if (err instanceof CancelStateError) {
				return fail(err.status, { error: err.message });
			}
			throw err;
		}

		throw redirect(303, `/book/cancel/done?ref=${encodeURIComponent(preview.booking.booking_reference)}`);
	}
};
