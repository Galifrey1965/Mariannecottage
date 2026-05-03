// PR 4: admin-only helper that mints a guest cancellation magic link.
//
// While PR 5 (email infrastructure) is not yet shipped, the cancel link can't
// be auto-injected into a booking-confirmed email. This endpoint lets an admin
// generate the link on demand and copy-paste it (or read it out by phone).
// When PR 5 ships, the same engine will produce the same link inside the
// transactional email.
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

	const base = publicEnv.PUBLIC_SITE_URL || 'http://localhost:5173';
	const fullUrl = `${base.replace(/\/$/, '')}/book/cancel?token=${encodeURIComponent(token)}`;

	return json({
		url: fullUrl,
		token,
		expires_at: new Date(expSec * 1000).toISOString(),
		booking_reference: booking.booking_reference
	});
};
