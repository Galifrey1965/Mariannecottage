import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	adminClient,
	createBookingAtomic,
	BookingDatesTakenError,
	generateBookingReference,
	logAdminEvent
} from '$lib/server/supabase';

// /admin/availability — owner-initiated date blocks. Implemented as
// synthetic source='admin_block', status='confirmed' bookings so the
// existing iCal feed (getBookingsForIcalFeed) advertises blocks to OTAs
// without bespoke plumbing. v1 single-date toggle only.

function nextDayISO(iso: string): string {
	const d = new Date(iso + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const date: string | undefined = body?.date;
	if (!date || !ISO_DATE_RE.test(date)) {
		return json({ error: 'Invalid date — expected YYYY-MM-DD' }, { status: 400 });
	}

	// Optional free-text reason persisted on the synthetic admin_block row's
	// admin_notes field. Trimmed; empty/whitespace-only values are not sent so
	// the column stays NULL and "blocks with notes" audits stay accurate.
	const rawNotes = typeof body?.admin_notes === 'string' ? body.admin_notes.trim() : '';
	const adminNotes = rawNotes.length > 0 ? rawNotes : undefined;

	const checkIn = date;
	const checkOut = nextDayISO(date);
	const reference = generateBookingReference();

	try {
		const result = await createBookingAtomic({
			guest_name: 'Cottage blocked',
			guest_email: null,
			num_guests: 1,
			check_in_date: checkIn,
			check_out_date: checkOut,
			num_nights: 1,
			nightly_rate: 0,
			subtotal: 0,
			tax: 0,
			total_cost: 0,
			status: 'confirmed',
			booking_reference: reference,
			source: 'admin_block',
			admin_notes: adminNotes
		} as unknown as Parameters<typeof createBookingAtomic>[0]);

		await logAdminEvent({
			user_id: locals.user.id,
			action: 'availability.block.create',
			target_type: 'booking',
			target_id: result.id,
			metadata: {
				date: checkIn,
				booking_reference: result.booking_reference,
				has_notes: adminNotes !== undefined
			}
		});

		return json({ success: true, id: result.id, date: checkIn, booking_reference: result.booking_reference });
	} catch (err) {
		if (err instanceof BookingDatesTakenError) {
			return json({ error: 'Date already blocked or booked' }, { status: 409 });
		}
		console.error('admin/availability POST failed:', err);
		return json({ error: 'Failed to create block' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const id: string | undefined = body?.id;
	if (!id) {
		return json({ error: 'Missing booking id' }, { status: 400 });
	}

	const { data: booking, error: lookupErr } = await adminClient
		.from('bookings')
		.select('id, source, check_in_date, check_out_date, booking_reference')
		.eq('id', id)
		.maybeSingle();

	if (lookupErr) {
		console.error('admin/availability DELETE lookup failed:', lookupErr);
		return json({ error: 'Lookup failed' }, { status: 500 });
	}
	if (!booking) {
		return json({ error: 'Block not found' }, { status: 404 });
	}
	if (booking.source !== 'admin_block') {
		return json(
			{ error: 'Only admin_block bookings can be removed via this endpoint' },
			{ status: 409 }
		);
	}

	const dates: string[] = [];
	const d = new Date(booking.check_in_date + 'T00:00:00Z');
	const end = new Date(booking.check_out_date + 'T00:00:00Z');
	while (d < end) {
		dates.push(d.toISOString().slice(0, 10));
		d.setUTCDate(d.getUTCDate() + 1);
	}

	const { error: deleteErr } = await adminClient.from('bookings').delete().eq('id', id);
	if (deleteErr) {
		console.error('admin/availability DELETE booking failed:', deleteErr);
		return json({ error: 'Delete failed' }, { status: 500 });
	}

	if (dates.length > 0) {
		const { error: freeErr } = await adminClient
			.from('availability')
			.update({ available: true, synced_at: new Date().toISOString() })
			.in('date', dates)
			.eq('synced_from', 'manual');
		if (freeErr) console.error('admin/availability DELETE free-availability failed:', freeErr);
	}

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'availability.block.delete',
		target_type: 'booking',
		target_id: id,
		metadata: { dates, booking_reference: booking.booking_reference }
	});

	return json({ success: true });
};
