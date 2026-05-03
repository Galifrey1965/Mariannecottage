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
// Everything else is rejected:
//   - pending_payment → *           — only webhook (→ confirmed) or sweep (→ expired)
//   - confirmed → cancelled         — must go through /api/admin/bookings/cancel
//   - cancelled / refunded / refunded_overbooked / expired / payment_failed
//                                   — terminal; no admin status changes allowed
// Notes-only PATCH (no status change) is unrestricted.
const ALLOWED_PATCH_TRANSITIONS: Record<string, ReadonlySet<string>> = {
	pending: new Set(['confirmed'])
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id, status, admin_notes } = await request.json();

	if (status) {
		// Need the current status to validate the transition. One indexed lookup.
		const { data: current, error: fetchErr } = await adminClient
			.from('bookings')
			.select('status')
			.eq('id', id)
			.maybeSingle();
		if (fetchErr) {
			console.error('Failed to load booking for PATCH:', fetchErr);
			return json({ error: 'Lookup failed' }, { status: 500 });
		}
		if (!current) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}
		const allowed = ALLOWED_PATCH_TRANSITIONS[current.status as string];
		if (!allowed || !allowed.has(status)) {
			return json(
				{
					error: `Status transition '${current.status}' → '${status}' is not allowed via this endpoint. Use the cancel endpoint or wait for the relevant webhook.`,
					current_status: current.status
				},
				{ status: 409 }
			);
		}
	}

	const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (status) updates.status = status;
	if (admin_notes !== undefined) updates.admin_notes = admin_notes;

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
