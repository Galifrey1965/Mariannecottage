import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminClient } from '$lib/server/supabase';

export const GET: RequestHandler = async ({ cookies, url }) => {
	if (cookies.get('admin_session') !== 'authenticated') {
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

	// Get total count (unfiltered)
	const { count } = await adminClient
		.from('bookings')
		.select('*', { count: 'exact', head: true });

	return json({ bookings: filtered, total: count || 0 });
};

export const PATCH: RequestHandler = async ({ cookies, request }) => {
	if (cookies.get('admin_session') !== 'authenticated') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id, status, admin_notes } = await request.json();

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

	return json({ success: true, booking: data });
};
