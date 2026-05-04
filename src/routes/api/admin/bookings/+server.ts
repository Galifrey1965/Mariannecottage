import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient, logAdminEvent } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const status = url.searchParams.get('status');
	const search = url.searchParams.get('search')?.toLowerCase();

	let query = adminClient.from('bookings').select('*');

	if (status && status !== 'all') {
		query = query.eq('status', status);
	}

	query = query.order('check_in_date', { ascending: true });

	const { data: bookings, error } = await query;

	if (error) {
		console.error('Failed to fetch bookings:', error);
		return json({ bookings: [], total: 0 });
	}

	let filtered = bookings || [];

	// Client-side search filter (Supabase doesn't support OR ilike across multiple columns easily)
	if (search) {
		filtered = filtered.filter(b =>
			b.guest_name?.toLowerCase().includes(search) ||
			b.guest_email?.toLowerCase().includes(search) ||
			b.booking_reference?.toLowerCase().includes(search)
		);
	}

	const { count } = await adminClient
		.from('bookings')
		.select('*', { count: 'exact', head: true });

	return json({ bookings: filtered, total: count || 0 });
};

// PATCH allowed status transitions, by state-machine rule.
//   pending → confirmed             — admin manual confirm of a non-Stripe booking
// Booking.com imports get an extra path:
//   confirmed → cancelled (BC only) — local cancel of an OTA-imported block
//                                     (no Stripe refund applies); sticky against sync
// Everything else is rejected:
//   - pending_payment → *           — only webhook (→ confirmed) or sweep (→ expired)
//   - confirmed → cancelled (web/admin) — must go through /api/admin/bookings/cancel
//   - cancelled / refunded / refunded_overbooked / expired / payment_failed
//                                   — terminal; no admin status changes allowed
// Notes-only PATCH (no status change) is unrestricted.
const ALLOWED_PATCH_TRANSITIONS: Record<string, ReadonlySet<string>> = {
	pending: new Set(['confirmed'])
};
const ALLOWED_BC_TRANSITIONS: Record<string, ReadonlySet<string>> = {
	confirmed: new Set(['cancelled']),
	pending: new Set(['cancelled'])
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const { id, status, admin_notes } = body;
	// Enrichment fields — used primarily for Booking.com imports where the
	// iCal feed gives us only dates + UID and Mark fills in the rest from
	// the BC reservation email. Web/admin bookings can also be edited here.
	const ENRICHABLE = [
		'guest_name',
		'guest_email',
		'guest_phone',
		'guest_country',
		'num_guests',
		'special_requests',
		'nightly_rate',
		'subtotal',
		'tax',
		'total_cost',
		'external_ref'
	] as const;

	let bcCancellation: { check_in_date: string; check_out_date: string } | null = null;

	if (status) {
		// Need the current status + source to validate the transition.
		const { data: current, error: fetchErr } = await adminClient
			.from('bookings')
			.select('status, source, check_in_date, check_out_date')
			.eq('id', id)
			.maybeSingle();
		if (fetchErr) {
			console.error('Failed to load booking for PATCH:', fetchErr);
			return json({ error: 'Lookup failed' }, { status: 500 });
		}
		if (!current) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}
		const standard = ALLOWED_PATCH_TRANSITIONS[current.status as string];
		const bcAllowed = current.source === 'booking_com'
			? ALLOWED_BC_TRANSITIONS[current.status as string]
			: undefined;
		const isAllowed = (standard && standard.has(status)) || (bcAllowed && bcAllowed.has(status));
		if (!isAllowed) {
			return json(
				{
					error: `Status transition '${current.status}' → '${status}' is not allowed via this endpoint. Use the cancel endpoint or wait for the relevant webhook.`,
					current_status: current.status
				},
				{ status: 409 }
			);
		}
		if (status === 'cancelled' && current.source === 'booking_com') {
			bcCancellation = {
				check_in_date: current.check_in_date as string,
				check_out_date: current.check_out_date as string
			};
		}
	}

	const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (status) updates.status = status;
	if (admin_notes !== undefined) updates.admin_notes = admin_notes;
	for (const f of ENRICHABLE) {
		if (body[f] !== undefined) updates[f] = body[f];
	}

	const { data, error } = await adminClient
		.from('bookings')
		.update(updates)
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('Failed to update booking:', error);
		return json({ error: 'Update failed' }, { status: 500 });
	}

	// Free the availability rows for a locally-cancelled BC booking. We only
	// touch rows where synced_from='booking.com' so any manual blocks layered
	// on the same date stay intact.
	if (bcCancellation) {
		const dates: string[] = [];
		const d = new Date(bcCancellation.check_in_date + 'T00:00:00Z');
		const end = new Date(bcCancellation.check_out_date + 'T00:00:00Z');
		while (d < end) {
			dates.push(d.toISOString().slice(0, 10));
			d.setUTCDate(d.getUTCDate() + 1);
		}
		if (dates.length > 0) {
			const { error: freeErr } = await adminClient
				.from('availability')
				.update({ available: true, synced_at: new Date().toISOString() })
				.in('date', dates)
				.eq('synced_from', 'booking.com');
			if (freeErr) console.error('Failed to free availability after BC cancel:', freeErr);
		}
	}

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'booking.update',
		target_type: 'booking',
		target_id: id,
		metadata: {
			fields: Object.keys(updates).filter((k) => k !== 'updated_at'),
			status: status ?? null
		}
	});

	return json({ success: true, booking: data });
};
