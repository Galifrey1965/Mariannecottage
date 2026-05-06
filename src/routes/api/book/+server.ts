import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	adminClient,
	createBookingAtomic,
	BookingDatesTakenError,
	generateBookingReference,
	getRateForBooking
} from '$lib/server/supabase';
import { detectLocale, isValidLocale } from '$lib/i18n';
import { MIN_NIGHTS, MIN_LEAD_HOURS, getEarliestCheckInDate } from '$lib/booking-policy';
import { rateLimitResponse } from '$lib/server/rate-limit';

// Public booking creation endpoint — rate limit per IP so a bot can't
// flood-create pending bookings (which would also flood Stripe with
// abandoned PaymentIntents). 10/min is well above any real human pace.
const BOOK_MAX = 10;
const BOOK_WINDOW_MS = 60_000;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const limited = rateLimitResponse(`book:${ip}`, BOOK_MAX, BOOK_WINDOW_MS);
	if (limited) return limited;

	const body = await request.json();

	// Synchronous expired-pending-payment sweep before we attempt the
	// atomic booking. Without this, a guest who clicked Confirm a few
	// minutes ago and bounced (e.g. lost the Stripe redirect) would have
	// a stuck pending_payment row holding their dates blocked, and the
	// retry would hit DATES_TAKEN against their own previous attempt.
	// /book page-load runs the same RPC fire-and-forget, so this catches
	// the rest. Best-effort — if the sweep itself fails we still attempt
	// the booking; the worst case is the user sees DATES_TAKEN and tries
	// again after the daily cron runs.
	try {
		await adminClient.rpc('expire_pending_bookings');
	} catch (err) {
		console.error('[/api/book] expire_pending_bookings sweep failed:', err);
	}

	const required = ['guest_name', 'guest_email', 'num_guests', 'check_in_date', 'check_out_date'];
	for (const field of required) {
		if (!body[field]) {
			return json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
		}
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guest_email)) {
		return json({ success: false, error: 'Invalid email address' }, { status: 400 });
	}

	const num_guests = Number(body.num_guests);
	if (!Number.isInteger(num_guests) || num_guests < 1 || num_guests > 4) {
		return json({ success: false, error: 'num_guests must be 1-4' }, { status: 400 });
	}

	const checkIn = new Date(body.check_in_date);
	const checkOut = new Date(body.check_out_date);
	if (checkOut <= checkIn) {
		return json({ success: false, error: 'Check-out must be after check-in' }, { status: 400 });
	}

	const num_nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

	// Booking policy guards — defended on the server because the calendar
	// rules can be bypassed by anyone POSTing directly to the API. Errors use
	// short error_code values so the client can localise the message.
	if (num_nights < MIN_NIGHTS) {
		return json(
			{
				success: false,
				error_code: 'min_nights',
				error: `${MIN_NIGHTS}-night minimum stay`,
				min_nights: MIN_NIGHTS
			},
			{ status: 400 }
		);
	}

	const earliest = getEarliestCheckInDate();
	if (checkIn < earliest) {
		return json(
			{
				success: false,
				error_code: 'lead_time',
				error: `Bookings require at least ${MIN_LEAD_HOURS} hours notice`,
				min_lead_hours: MIN_LEAD_HOURS
			},
			{ status: 400 }
		);
	}

	// B-01 / PR 4: rate is determined server-side by check-in date + guest count.
	// Reject if no active plan covers the check-in (no silent 120 fallback).
	const rate = await getRateForBooking(body.check_in_date, num_guests);
	if (!rate) {
		return json(
			{ success: false, error_code: 'no_rate_plan', error: 'No rate plan covers those dates' },
			{ status: 400 }
		);
	}
	const nightly_rate = rate.nightly_rate;
	const subtotal = Math.round(num_nights * nightly_rate * 100) / 100;

	// Tourist tax is included in the per-night rate Mark quotes, so we don't
	// add it on top — `tax` stays 0 and total === subtotal.
	const tax = 0;
	const total_cost = subtotal;
	const booking_reference = generateBookingReference();

	const guest_locale = isValidLocale(body.locale)
		? body.locale
		: detectLocale(request.headers.get('accept-language'));

	try {
		const booking = await createBookingAtomic({
			guest_name: body.guest_name,
			guest_email: body.guest_email,
			guest_phone: body.guest_phone || null,
			guest_country: body.guest_country || null,
			num_guests,
			check_in_date: body.check_in_date,
			check_out_date: body.check_out_date,
			num_nights,
			special_requests: body.special_requests || null,
			nightly_rate,
			subtotal,
			tax,
			total_cost,
			status: 'pending_payment',
			booking_reference,
			source: 'web',
			guest_locale
		});

		return json({ success: true, booking });
	} catch (err) {
		if (err instanceof BookingDatesTakenError) {
			return json(
				{ success: false, error_code: 'dates_taken', error: 'Those dates were just booked' },
				{ status: 409 }
			);
		}
		console.error('Booking creation failed:', err);
		return json({ success: false, error: 'Failed to create booking' }, { status: 500 });
	}
};
