import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createBooking, generateBookingReference } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	// Validate required fields
	const required = ['guest_name', 'guest_email', 'num_guests', 'check_in_date', 'check_out_date'];
	for (const field of required) {
		if (!body[field]) {
			return json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
		}
	}

	// Email validation
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.guest_email)) {
		return json({ success: false, error: 'Invalid email address' }, { status: 400 });
	}

	// Date validation
	const checkIn = new Date(body.check_in_date);
	const checkOut = new Date(body.check_out_date);
	if (checkOut <= checkIn) {
		return json({ success: false, error: 'Check-out must be after check-in' }, { status: 400 });
	}

	const num_nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
	const nightly_rate = body.nightly_rate || 120;
	const subtotal = num_nights * nightly_rate;
	const tax = Math.round(subtotal * 0.1 * 100) / 100;
	const total_cost = subtotal + tax;
	const booking_reference = generateBookingReference();

	try {
		const booking = await createBooking({
			guest_name: body.guest_name,
			guest_email: body.guest_email,
			guest_phone: body.guest_phone || null,
			guest_country: body.guest_country || null,
			num_guests: body.num_guests,
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
		console.error('Booking creation failed:', err);
		return json({ success: false, error: 'Failed to create booking' }, { status: 500 });
	}
};
