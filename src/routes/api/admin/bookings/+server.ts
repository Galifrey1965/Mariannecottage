import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient, logAdminEvent } from '$lib/server/supabase';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Escape commas/parens in user input so they don't break the PostgREST .or()
// filter grammar. ilike values themselves don't need backslash-escaping for
// Supabase wildcards (% _) — those just become literal matches.
function escapeOrTerm(value: string): string {
	return value.replace(/[(),]/g, '');
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const status = url.searchParams.get('status');
	const search = url.searchParams.get('search')?.trim();
	const mode = url.searchParams.get('mode') ?? 'paged';
	const includeStats = url.searchParams.get('stats') === '1';

	const pageRaw = Number(url.searchParams.get('page') ?? 0);
	const pageSizeRaw = Number(url.searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE);
	const page = Number.isFinite(pageRaw) ? Math.max(0, Math.floor(pageRaw)) : 0;
	const pageSize = Number.isFinite(pageSizeRaw)
		? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(pageSizeRaw)))
		: DEFAULT_PAGE_SIZE;

	let query = adminClient
		.from('bookings')
		.select('*', { count: 'exact' })
		.order('check_in_date', { ascending: true });

	if (status && status !== 'all') {
		query = query.eq('status', status);
	}

	if (search && search.length >= 2) {
		const term = escapeOrTerm(search);
		query = query.or(
			`guest_name.ilike.%${term}%,guest_email.ilike.%${term}%,booking_reference.ilike.%${term}%`
		);
	}

	if (mode !== 'all') {
		const start = page * pageSize;
		query = query.range(start, start + pageSize - 1);
	}

	const { data: bookings, error, count } = await query;

	if (error) {
		console.error('Failed to fetch bookings:', error);
		return json({ bookings: [], total: 0, page, pageSize });
	}

	const response: Record<string, unknown> = {
		bookings: bookings ?? [],
		total: count ?? 0,
		page,
		pageSize
	};

	if (includeStats) {
		response.stats = await loadBookingStats();
	}

	return json(response);
};

async function loadBookingStats() {
	const todayIso = new Date().toISOString().slice(0, 10);

	const [total, confirmed, pending, upcoming, bcActive, revenueRows, bcRanges] = await Promise.all([
		adminClient.from('bookings').select('*', { count: 'exact', head: true }),
		adminClient.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
		adminClient.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
		adminClient
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.gt('check_in_date', todayIso)
			.neq('status', 'cancelled'),
		adminClient
			.from('bookings')
			.select('*', { count: 'exact', head: true })
			.eq('source', 'booking_com')
			.neq('status', 'cancelled'),
		adminClient.from('bookings').select('total_cost').eq('status', 'confirmed'),
		adminClient
			.from('bookings')
			.select('check_in_date, check_out_date')
			.eq('source', 'booking_com')
			.neq('status', 'cancelled')
	]);

	const totalRevenue = (revenueRows.data ?? []).reduce(
		(sum, row) => sum + (Number((row as { total_cost: number | null }).total_cost) || 0),
		0
	);

	const bcActiveDates: string[] = [];
	for (const row of (bcRanges.data ?? []) as { check_in_date: string; check_out_date: string }[]) {
		const d = new Date(row.check_in_date + 'T00:00:00Z');
		const end = new Date(row.check_out_date + 'T00:00:00Z');
		while (d < end) {
			bcActiveDates.push(d.toISOString().slice(0, 10));
			d.setUTCDate(d.getUTCDate() + 1);
		}
	}

	return {
		totalCount: total.count ?? 0,
		confirmedCount: confirmed.count ?? 0,
		pendingCount: pending.count ?? 0,
		upcomingCount: upcoming.count ?? 0,
		bcActiveCount: bcActive.count ?? 0,
		totalRevenue,
		bcActiveDates
	};
}

// Bookings deletable via DELETE /api/admin/bookings. Active bookings must be
// cancelled first — that path captures the cancel reason in the audit log and
// triggers the refund / email side-effects. Hard delete is reserved for
// terminal-state rows where there's no in-flight side-effect to reverse.
const DELETABLE_STATUSES: ReadonlySet<string> = new Set([
	'cancelled',
	'expired',
	'refunded',
	'refunded_overbooked',
	'payment_failed'
]);

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => null);
	const id: string | undefined = body?.id;
	if (!id) {
		return json({ error: 'Missing booking id' }, { status: 400 });
	}

	const { data: booking, error: lookupError } = await adminClient
		.from('bookings')
		.select('id, source, status, check_in_date, check_out_date, booking_reference')
		.eq('id', id)
		.maybeSingle();

	if (lookupError) {
		console.error('admin/bookings DELETE lookup failed:', lookupError);
		return json({ error: 'Lookup failed' }, { status: 500 });
	}
	if (!booking) {
		return json({ error: 'Booking not found' }, { status: 404 });
	}
	if (booking.source === 'admin_block') {
		return json(
			{ error: 'Use /api/admin/availability for admin-block rows' },
			{ status: 409 }
		);
	}
	if (booking.source === 'booking_com') {
		return json(
			{ error: 'Booking.com rows are owned by the iCal sync — cancel locally instead' },
			{ status: 409 }
		);
	}
	if (!DELETABLE_STATUSES.has(booking.status as string)) {
		return json(
			{
				error: `Cannot delete a booking in status '${booking.status}'. Cancel it first.`,
				current_status: booking.status
			},
			{ status: 409 }
		);
	}

	// Free availability rows owned by this booking before deleting it.
	// Same scoping as cancel-execute: synced_from='manual' only, so a still-
	// active BC overlap (defensive — shouldn't happen) is left intact.
	const dates: string[] = [];
	const cursor = new Date(booking.check_in_date + 'T00:00:00Z');
	const end = new Date(booking.check_out_date + 'T00:00:00Z');
	while (cursor < end) {
		dates.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}
	if (dates.length > 0) {
		const { error: freeError } = await adminClient
			.from('availability')
			.update({ available: true, synced_at: new Date().toISOString() })
			.in('date', dates)
			.eq('synced_from', 'manual');
		if (freeError) {
			console.error('admin/bookings DELETE availability-free failed:', freeError);
		}
	}

	const { error: deleteError } = await adminClient
		.from('bookings')
		.delete()
		.eq('id', id);

	if (deleteError) {
		console.error('admin/bookings DELETE failed:', deleteError);
		return json({ error: 'Delete failed' }, { status: 500 });
	}

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'booking.delete',
		target_type: 'booking',
		target_id: id,
		metadata: {
			prior_status: booking.status,
			source: booking.source,
			booking_reference: booking.booking_reference,
			dates
		}
	});

	return json({ success: true });
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
