import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	createBookingAtomic,
	BookingDatesTakenError,
	generateBookingReference,
	getTaxSettings,
	getRateForBooking
} from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

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

	const taxSettings = await getTaxSettings();
	const taxRate = taxSettings.taxe_de_sejour_per_person_per_night;
	const tax = Math.round(num_guests * num_nights * taxRate * 100) / 100;

	const total_cost = Math.round((subtotal + tax) * 100) / 100;
	const booking_reference = generateBookingReference();

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
			status: 'pending',
			booking_reference
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
