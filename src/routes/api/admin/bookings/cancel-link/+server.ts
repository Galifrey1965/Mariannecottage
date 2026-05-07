// Admin-only helper that mints a guest cancellation magic link on
// demand. The same link is auto-injected into the booking-confirmed
// email (see lib/server/email-adapter.ts), so this endpoint is for
// admin re-issue paths — the guest lost the email, the admin wants to
// read the link out by phone, etc.
//
// GET ?id=<bookingId> → { url, token, expires_at } (admin-auth-gated)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient, type Booking } from '$lib/server/supabase';
import { signCancelToken, expiryForCheckIn } from '$lib/server/cancel-token';
import { env as publicEnv } from '$env/dynamic/public';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	const id = url.searchParams.get('id');
	if (!id) return json({ error: 'id required' }, { status: 400 });

	const { data, error } = await adminClient
		.from('bookings')
		.select('id, booking_reference, check_in_date, status')
		.eq('id', id)
		.maybeSingle();
	if (error) {
		console.error('[cancel-link] booking lookup failed:', error);
		return json({ error: 'Lookup failed' }, { status: 500 });
	}
	const booking = data as Pick<Booking, 'id' | 'booking_reference' | 'check_in_date' | 'status'> | null;
	if (!booking) return json({ error: 'Booking not found' }, { status: 404 });

	const expSec = expiryForCheckIn(booking.check_in_date);
	const token = signCancelToken({
		bid: booking.id,
		ref: booking.booking_reference,
		exp: expSec
	});

	const base = publicEnv.PUBLIC_SITE_URL;
	if (!base) {
		// Hard fail rather than embed a localhost link the admin would then
		// read out to a guest by phone. PUBLIC_SITE_URL is set on Netlify
		// production; if it's missing, something is wrong with the deploy
		// config and the right fix is to set it, not to paper over it.
		console.error('[cancel-link] PUBLIC_SITE_URL not configured');
		return json({ error: 'PUBLIC_SITE_URL not configured' }, { status: 503 });
	}
	const fullUrl = `${base.replace(/\/$/, '')}/book/cancel?token=${encodeURIComponent(token)}`;

	return json({
		url: fullUrl,
		token,
		expires_at: new Date(expSec * 1000).toISOString(),
		booking_reference: booking.booking_reference
	});
};
