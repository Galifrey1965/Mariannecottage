import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

// Admin client (server-side only)
export const adminClient = createClient(
	publicEnv.PUBLIC_SUPABASE_URL!,
	privateEnv.SUPABASE_SERVICE_ROLE_KEY!
);

// Anon client (can be used on client or server)
export const anonClient = createClient(
	publicEnv.PUBLIC_SUPABASE_URL!,
	publicEnv.PUBLIC_SUPABASE_ANON_KEY!
);

// Types
export interface Booking {
	id: string;
	created_at: string;
	updated_at: string;
	guest_name: string;
	guest_email: string;
	guest_phone?: string;
	guest_country?: string;
	num_guests: number;
	check_in_date: string;
	check_out_date: string;
	num_nights: number;
	special_requests?: string;
	nightly_rate: number;
	subtotal: number;
	tax: number;
	total_cost: number;
	status: 'pending' | 'confirmed' | 'cancelled';
	booking_reference: string;
	payment_intent_id?: string;
	paid_at?: string;
	admin_notes?: string;
}

export interface Availability {
	id: string;
	date: string;
	available: boolean;
	nightly_rate?: number;
	synced_at: string;
	synced_from: 'booking.com' | 'manual';
	notes?: string;
}

export interface RatePlan {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	description?: string;
	rate_per_night: number;
	valid_from: string;
	valid_until: string;
	created_by?: string;
	is_active: boolean;
}

export interface TaxSettings {
	id: number;
	taxe_de_sejour_per_person_per_night: number;
	updated_at: string;
	updated_by?: string;
}

// Booking operations

// B-02 Phase 1: error thrown when book_dates_atomic detects a conflict.
// /api/book maps this to HTTP 409.
export class BookingDatesTakenError extends Error {
	constructor() {
		super('DATES_TAKEN');
		this.name = 'BookingDatesTakenError';
	}
}

// Deprecated in favour of createBookingAtomic — retained for now in case
// of out-of-tree callers; safe to remove once confirmed unused.
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
	const { data, error } = await adminClient
		.from('bookings')
		.insert([booking])
		.select()
		.single();

	if (error) throw error;
	return data;
}

// B-02 Phase 1: atomic availability-check + insert + availability-mark
// inside a single transaction guarded by an advisory lock.
// Throws BookingDatesTakenError on date conflict (Postgres SQLSTATE P0001 / message 'DATES_TAKEN').
export async function createBookingAtomic(
	booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>
): Promise<{ id: string; booking_reference: string }> {
	const { data, error } = await adminClient.rpc('book_dates_atomic', { p_booking: booking });

	if (error) {
		if (error.code === 'P0001' || /DATES_TAKEN/.test(error.message ?? '')) {
			throw new BookingDatesTakenError();
		}
		throw error;
	}
	return data as { id: string; booking_reference: string };
}

export async function getBooking(bookingId: string) {
	const { data, error } = await adminClient
		.from('bookings')
		.select('*')
		.eq('id', bookingId)
		.single();

	if (error) throw error;
	return data;
}

export async function getBookingsByEmail(email: string) {
	const { data, error } = await adminClient
		.from('bookings')
		.select('*')
		.eq('guest_email', email)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data;
}

// Availability operations
export async function getAvailability(startDate: string, endDate: string) {
	const { data, error } = await anonClient
		.from('availability')
		.select('*')
		.gte('date', startDate)
		.lte('date', endDate)
		.order('date', { ascending: true });

	if (error) throw error;
	return data;
}

export async function setAvailability(date: string, available: boolean, nightly_rate?: number) {
	const { data, error } = await adminClient
		.from('availability')
		.upsert(
			{
				date,
				available,
				nightly_rate,
				synced_from: 'manual',
				synced_at: new Date().toISOString()
			},
			{ onConflict: 'date' }
		)
		.select()
		.single();

	if (error) throw error;
	return data;
}

// Rate plan operations
export async function getRatePlans() {
	const { data, error } = await anonClient
		.from('rate_plans')
		.select('*')
		.eq('is_active', true)
		.order('valid_from', { ascending: true });

	if (error) throw error;
	return data;
}

export async function getRatePlanForDate(date: string) {
	const { data, error } = await anonClient
		.from('rate_plans')
		.select('*')
		.eq('is_active', true)
		.lte('valid_from', date)
		.gte('valid_until', date)
		.order('rate_per_night', { ascending: false })
		.limit(1)
		.single();

	if (error) return null; // No matching rate plan
	return data;
}

// Tax settings (B-04)
export async function getTaxSettings(): Promise<TaxSettings> {
	const { data, error } = await anonClient
		.from('tax_settings')
		.select('*')
		.eq('id', 1)
		.single();

	if (error) throw error;
	return data;
}

// Utility: Generate booking reference
export function generateBookingReference(): string {
	const now = new Date();
	const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `MC-${dateStr}-${random}`;
}
