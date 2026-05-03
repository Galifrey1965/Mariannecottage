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

// B-02 Phase 2 (2026-05-03): payment-lifecycle state machine.
// 'pending'              — legacy: manual flow, no payment.
// 'pending_payment'      — soft-reserved during checkout; absorbs payment retries until TTL.
// 'confirmed'            — payment_intent.succeeded.
// 'payment_failed'       — reserved for explicit abandon / admin-set; webhook keeps row in pending_payment instead.
// 'expired'              — TTL sweep released a stale pending_payment.
// 'cancelled'            — admin or guest cancellation, pre-refund.
// 'refunded'             — refund issued on a confirmed booking.
// 'refunded_overbooked'  — late-success race: payment cleared after expiry, auto-refunded.
export type BookingStatus =
	| 'pending'
	| 'pending_payment'
	| 'confirmed'
	| 'payment_failed'
	| 'expired'
	| 'cancelled'
	| 'refunded'
	| 'refunded_overbooked';

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
	status: BookingStatus;
	booking_reference: string;
	payment_intent_id?: string;
	paid_at?: string;
	pending_until?: string;
	payment_attempts?: number;
	last_payment_error?: string;
	cancellation_policy_id?: string;
	admin_notes?: string;
	cancellation_token_used_at?: string;
}

// B-06 Phase 2 (2026-05-03): cancellation policy catalogue.
// schedule is walked in descending days_before_check_in to compute refund pct.
export interface CancellationPolicySchedule {
	days_before_check_in: number;
	refund_pct: number;
}

export interface CancellationPolicy {
	id: string;
	name: string;
	description?: string;
	schedule: CancellationPolicySchedule[];
	is_default: boolean;
	created_at: string;
	updated_at: string;
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
	rate_2_guests: number;
	rate_3_guests: number;
	rate_4_guests: number;
	valid_from: string;
	valid_until: string;
	created_by?: string;
	is_active: boolean;
}

export interface RatePlanInput {
	name: string;
	description?: string | null;
	rate_per_night: number;
	rate_2_guests: number;
	rate_3_guests: number;
	rate_4_guests: number;
	valid_from: string;
	valid_until: string;
	is_active?: boolean;
}

export interface TaxSettings {
	id: number;
	taxe_de_sejour_per_person_per_night: number;
	updated_at: string;
	updated_by?: string;
}

export type AdminRole = 'owner' | 'developer';

export interface UserProfile {
	user_id: string;
	display_name: string;
	role: AdminRole;
	created_at: string;
}

export interface AgentEventInput {
	user_id: string | null;
	action: string;
	target_type?: string | null;
	target_id?: string | null;
	metadata?: Record<string, unknown> | null;
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

// B-02 Phase 2: atomic availability-check + insert + availability-mark
// inside a single transaction guarded by an advisory lock.
// Default status is 'pending_payment' with TTL on pending_until; the function
// returns pending_until + cancellation_policy_id so the client can drive a
// countdown timer and surface the snapshot policy.
// Throws BookingDatesTakenError on date conflict (Postgres SQLSTATE P0001 / message 'DATES_TAKEN').
export interface AtomicBookingResult {
	id: string;
	booking_reference: string;
	pending_until: string | null;
	cancellation_policy_id: string | null;
}

export async function createBookingAtomic(
	booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'> & { ttl_minutes?: number }
): Promise<AtomicBookingResult> {
	const { data, error } = await adminClient.rpc('book_dates_atomic', { p_booking: booking });

	if (error) {
		if (error.code === 'P0001' || /DATES_TAKEN/.test(error.message ?? '')) {
			throw new BookingDatesTakenError();
		}
		throw error;
	}
	return data as AtomicBookingResult;
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

// iCal OUT (Phase 2 row 5): bookings that block inventory and whose check-out
// is today or in the future.
//
// Included: 'pending' (legacy), 'pending_payment' (soft-reserved during
// checkout — must block BC during the TTL window), 'confirmed' (paid).
// Excluded: 'expired', 'payment_failed', 'cancelled', 'refunded',
// 'refunded_overbooked' — these no longer hold inventory, so removing them
// from the feed releases the dates on BC's side after their next pull.
// Past bookings are excluded to keep the feed small.
export async function getBookingsForIcalFeed(today: string) {
	const { data, error } = await adminClient
		.from('bookings')
		.select('booking_reference, check_in_date, check_out_date, updated_at, status')
		.in('status', ['pending', 'pending_payment', 'confirmed'])
		.gte('check_out_date', today)
		.order('check_in_date', { ascending: true });

	if (error) throw error;
	return (data ?? []) as Array<{
		booking_reference: string;
		check_in_date: string;
		check_out_date: string;
		updated_at: string;
		status: string;
	}>;
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
export async function getRatePlans(): Promise<RatePlan[]> {
	const { data, error } = await anonClient
		.from('rate_plans')
		.select('*')
		.eq('is_active', true)
		.order('valid_from', { ascending: true });

	if (error) throw error;
	return (data as RatePlan[] | null) ?? [];
}

// B-01 / PR 4: returns the active rate plan covering `date`, picking the
// highest base rate on overlap (matches the legacy ordering).
export async function getRatePlanForDate(date: string): Promise<RatePlan | null> {
	const { data, error } = await anonClient
		.from('rate_plans')
		.select('*')
		.eq('is_active', true)
		.lte('valid_from', date)
		.gte('valid_until', date)
		.order('rate_per_night', { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) return null;
	return (data as RatePlan | null) ?? null;
}

// B-01 / PR 4: per-guest rate selector. num_guests must be 1..4 (matches
// bookings.num_guests CHECK). Returns null when no active plan covers the date.
export function rateForGuestCount(plan: RatePlan, num_guests: number): number {
	switch (num_guests) {
		case 1: return Number(plan.rate_per_night);
		case 2: return Number(plan.rate_2_guests);
		case 3: return Number(plan.rate_3_guests);
		case 4: return Number(plan.rate_4_guests);
		default: throw new Error(`num_guests out of range: ${num_guests}`);
	}
}

export async function getRateForBooking(
	date: string,
	num_guests: number
): Promise<{ plan: RatePlan; nightly_rate: number } | null> {
	const plan = await getRatePlanForDate(date);
	if (!plan) return null;
	return { plan, nightly_rate: rateForGuestCount(plan, num_guests) };
}

// Admin rate-plan helpers (service-role only).
export async function listRatePlansAdmin(includeInactive = true): Promise<RatePlan[]> {
	let query = adminClient.from('rate_plans').select('*');
	if (!includeInactive) query = query.eq('is_active', true);
	const { data, error } = await query.order('valid_from', { ascending: true });
	if (error) throw error;
	return (data as RatePlan[] | null) ?? [];
}

export async function getRatePlanByIdAdmin(id: string): Promise<RatePlan | null> {
	const { data, error } = await adminClient
		.from('rate_plans')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return null;
	return (data as RatePlan | null) ?? null;
}

export async function createRatePlan(input: RatePlanInput): Promise<RatePlan> {
	const { data, error } = await adminClient
		.from('rate_plans')
		.insert([{ ...input, is_active: input.is_active ?? true }])
		.select()
		.single();
	if (error) throw error;
	return data as RatePlan;
}

export async function updateRatePlan(id: string, patch: Partial<RatePlanInput>): Promise<RatePlan> {
	const { data, error } = await adminClient
		.from('rate_plans')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data as RatePlan;
}

export async function archiveRatePlan(id: string): Promise<RatePlan> {
	return updateRatePlan(id, { is_active: false });
}

// PR 4 / B-06 (admin slice): cancellation policy helpers.

export async function getCancellationPolicyById(id: string): Promise<CancellationPolicy | null> {
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) {
		console.error('getCancellationPolicyById failed:', error);
		return null;
	}
	return (data as CancellationPolicy | null) ?? null;
}

export async function getDefaultCancellationPolicy(): Promise<CancellationPolicy | null> {
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.select('*')
		.eq('is_default', true)
		.maybeSingle();
	if (error) {
		console.error('getDefaultCancellationPolicy failed:', error);
		return null;
	}
	return (data as CancellationPolicy | null) ?? null;
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

// B-07 / PR 3: Admin user profile + audit-log helpers.

export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
	const { data, error } = await adminClient
		.from('user_profiles')
		.select('user_id, display_name, role, created_at')
		.eq('user_id', userId)
		.maybeSingle();

	if (error) {
		console.error('getProfileByUserId failed:', error);
		return null;
	}
	return (data as UserProfile | null) ?? null;
}

export async function logAdminEvent(input: AgentEventInput): Promise<void> {
	const { error } = await adminClient.from('agent_events').insert({
		user_id: input.user_id,
		action: input.action,
		target_type: input.target_type ?? null,
		target_id: input.target_id ?? null,
		metadata: input.metadata ?? null
	});
	if (error) {
		console.error('logAdminEvent failed:', error);
	}
}

// Utility: Generate booking reference
export function generateBookingReference(): string {
	const now = new Date();
	const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `MC-${dateStr}-${random}`;
}
