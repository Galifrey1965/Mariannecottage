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
	source?: 'web' | 'admin' | 'booking_com' | 'admin_block' | 'test';
	ical_uid?: string;
	ical_summary?: string;
	external_ref?: string;
	cancellation_token_used_at?: string;
	guest_locale?: 'en' | 'fr' | 'de';
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
		.neq('source', 'test')
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

// Returns the most recent timestamp the Booking.com inbound sync touched
// (any availability row with synced_from='booking.com'). The admin uses this
// to decide whether they need to hit the manual "Sync now" button — if the
// cron ran 5 minutes ago they'll skip it; if it's an hour stale they'll click.
export async function getLastBcSyncAt(): Promise<string | null> {
	const { data, error } = await adminClient
		.from('availability')
		.select('synced_at')
		.eq('synced_from', 'booking.com')
		.order('synced_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	if (error) {
		console.error('[getLastBcSyncAt] failed:', error);
		return null;
	}
	return (data?.synced_at as string) ?? null;
}

// Returns every availability row currently blocked (available=false) from
// today onwards, including the synced_from + synced_at metadata. Used by the
// admin calendar to overlay OTA-imported blocks (e.g. Booking.com) that don't
// have a corresponding row in `bookings` — so admins see the same blocked
// dates the public site does.
export async function getBlockedAvailability(today: string) {
	const { data, error } = await adminClient
		.from('availability')
		.select('date, synced_from, synced_at')
		.eq('available', false)
		.gte('date', today)
		.order('date', { ascending: true });

	if (error) throw error;
	return (data ?? []) as Array<{ date: string; synced_from: string | null; synced_at: string | null }>;
}

// Returns ISO date strings for every night currently held by a source='test'
// booking that still holds inventory. Used by the public booking calendar to
// render test-blocked dates with a distinct colour so admins/devs can see at
// a glance which "unavailable" cells are seeded test data, not real bookings.
export async function getTestBlockedDates(today: string): Promise<string[]> {
	const { data, error } = await adminClient
		.from('bookings')
		.select('check_in_date, check_out_date')
		.eq('source', 'test')
		.in('status', ['pending', 'pending_payment', 'confirmed'])
		.gte('check_out_date', today);

	if (error) throw error;
	const out = new Set<string>();
	for (const row of (data ?? []) as Array<{ check_in_date: string; check_out_date: string }>) {
		const d = new Date(row.check_in_date + 'T00:00:00Z');
		const end = new Date(row.check_out_date + 'T00:00:00Z');
		while (d < end) {
			out.add(d.toISOString().slice(0, 10));
			d.setUTCDate(d.getUTCDate() + 1);
		}
	}
	return [...out];
}

// Returns ISO check-in dates for active bookings whose check-out is on or
// after `today`. The booking calendar uses this to flag those dates as
// "checkout-only" — bookable as the morning end of a *new* stay (industry-
// standard same-day turnover), but never as a check-in or middle night.
// Statuses mirror getTestBlockedDates so we cover the same inventory-
// holding rows: confirmed reservations plus live soft-reserves.
export async function getCheckInDates(today: string): Promise<string[]> {
	const { data, error } = await adminClient
		.from('bookings')
		.select('check_in_date')
		.in('status', ['pending', 'pending_payment', 'confirmed'])
		.gte('check_out_date', today);

	if (error) throw error;
	const out = new Set<string>();
	for (const row of (data ?? []) as Array<{ check_in_date: string }>) {
		out.add(row.check_in_date);
	}
	return [...out];
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

// 2026-05-05: site_banners — admin-managed top-of-page messages.

export type SiteBannerEffect = 'none' | 'fireworks' | 'snow' | 'sparkles' | 'hearts' | 'confetti';
export type SiteBannerEffectIntensity = 'continuous' | 'burst-idle' | 'load-only';
export type SiteBannerLocale = 'en' | 'fr' | 'de';
export type SiteBannerIcon =
	| 'info' | 'alert' | 'megaphone' | 'gift' | 'percent' | 'star' | 'sparkles'
	| 'heart' | 'snowflake' | 'party' | 'ghost' | 'flag' | 'sun' | 'moon'
	| 'bell' | 'check' | 'flame' | 'flower';
export type SiteBannerPalette =
	| 'sage' | 'cream' | 'sky' | 'amber' | 'mint' | 'terracotta'
	| 'lavender' | 'coral' | 'ocean' | 'crimson' | 'charcoal' | 'ukraine';

export interface SiteBanner {
	id: string;
	icon: SiteBannerIcon | null;
	palette: SiteBannerPalette;
	message_en: string;
	message_fr?: string | null;
	message_de?: string | null;
	enabled: boolean;
	display_order: number;
	starts_at?: string | null;
	ends_at?: string | null;
	effect: SiteBannerEffect;
	effect_intensity: SiteBannerEffectIntensity;
	locales: SiteBannerLocale[];
	is_recurring: boolean;
	created_at: string;
	updated_at: string;
}

export interface SiteBannerInput {
	icon: SiteBannerIcon | null;
	palette?: SiteBannerPalette;
	message_en: string;
	message_fr?: string | null;
	message_de?: string | null;
	enabled?: boolean;
	display_order?: number;
	starts_at?: string | null;
	ends_at?: string | null;
	effect?: SiteBannerEffect;
	effect_intensity?: SiteBannerEffectIntensity;
	locales?: SiteBannerLocale[];
	is_recurring?: boolean;
}

// Public — RLS already filters to active rows.
export async function getActiveBanners(): Promise<SiteBanner[]> {
	const { data, error } = await anonClient
		.from('site_banners')
		.select('*')
		.order('display_order', { ascending: true });
	if (error) {
		console.error('getActiveBanners failed:', error);
		return [];
	}
	return (data as SiteBanner[] | null) ?? [];
}

// Admin — service-role bypasses RLS so disabled rows come back too.
export async function listSiteBannersAdmin(): Promise<SiteBanner[]> {
	const { data, error } = await adminClient
		.from('site_banners')
		.select('*')
		.order('display_order', { ascending: true })
		.order('created_at', { ascending: false });
	if (error) throw error;
	return (data as SiteBanner[] | null) ?? [];
}

export async function createSiteBanner(input: SiteBannerInput): Promise<SiteBanner> {
	const { data, error } = await adminClient
		.from('site_banners')
		.insert([
			{
				icon: input.icon ?? null,
				palette: input.palette ?? 'sage',
				message_en: input.message_en,
				message_fr: input.message_fr ?? null,
				message_de: input.message_de ?? null,
				enabled: input.enabled ?? true,
				display_order: input.display_order ?? 0,
				starts_at: input.starts_at ?? null,
				ends_at: input.ends_at ?? null,
				effect: input.effect ?? 'none',
				effect_intensity: input.effect_intensity ?? 'burst-idle',
				locales: input.locales ?? ['en', 'fr', 'de'],
				is_recurring: input.is_recurring ?? false
			}
		])
		.select()
		.single();
	if (error) throw error;
	return data as SiteBanner;
}

export async function updateSiteBanner(
	id: string,
	input: Partial<SiteBannerInput>
): Promise<SiteBanner> {
	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (input.icon !== undefined) patch.icon = input.icon;
	if (input.palette !== undefined) patch.palette = input.palette;
	if (input.message_en !== undefined) patch.message_en = input.message_en;
	if (input.message_fr !== undefined) patch.message_fr = input.message_fr;
	if (input.message_de !== undefined) patch.message_de = input.message_de;
	if (input.enabled !== undefined) patch.enabled = input.enabled;
	if (input.display_order !== undefined) patch.display_order = input.display_order;
	if (input.starts_at !== undefined) patch.starts_at = input.starts_at;
	if (input.ends_at !== undefined) patch.ends_at = input.ends_at;
	if (input.effect !== undefined) patch.effect = input.effect;
	if (input.effect_intensity !== undefined) patch.effect_intensity = input.effect_intensity;
	if (input.locales !== undefined) patch.locales = input.locales;
	if (input.is_recurring !== undefined) patch.is_recurring = input.is_recurring;
	const { data, error } = await adminClient
		.from('site_banners')
		.update(patch)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data as SiteBanner;
}

export async function deleteSiteBanner(id: string): Promise<void> {
	const { error } = await adminClient.from('site_banners').delete().eq('id', id);
	if (error) throw error;
}

// PR 4: cancellation_policies admin CRUD.

export interface CancellationPolicyInput {
	name: string;
	description?: string | null;
	schedule: CancellationPolicySchedule[];
	is_default?: boolean;
}

export async function listCancellationPoliciesAdmin(): Promise<CancellationPolicy[]> {
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.select('*')
		.order('is_default', { ascending: false })
		.order('name', { ascending: true });
	if (error) throw error;
	return (data as CancellationPolicy[] | null) ?? [];
}

export async function createCancellationPolicy(
	input: CancellationPolicyInput
): Promise<CancellationPolicy> {
	if (input.is_default) await clearDefaultCancellationPolicy(null);
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.insert([
			{
				name: input.name,
				description: input.description ?? null,
				schedule: input.schedule,
				is_default: !!input.is_default
			}
		])
		.select()
		.single();
	if (error) throw error;
	return data as CancellationPolicy;
}

export async function updateCancellationPolicy(
	id: string,
	input: Partial<CancellationPolicyInput>
): Promise<CancellationPolicy> {
	if (input.is_default) await clearDefaultCancellationPolicy(id);
	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (input.name !== undefined) patch.name = input.name;
	if (input.description !== undefined) patch.description = input.description;
	if (input.schedule !== undefined) patch.schedule = input.schedule;
	if (input.is_default !== undefined) patch.is_default = input.is_default;
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.update(patch)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data as CancellationPolicy;
}

export async function deleteCancellationPolicy(id: string): Promise<void> {
	const { error } = await adminClient.from('cancellation_policies').delete().eq('id', id);
	if (error) throw error;
}

// Returns count of bookings (across all statuses) snapshot to this policy.
// Used by the admin delete-policy guard to refuse delete when historical
// bookings still reference the row.
export async function countBookingsUsingPolicy(id: string): Promise<number> {
	const { count, error } = await adminClient
		.from('bookings')
		.select('id', { count: 'exact', head: true })
		.eq('cancellation_policy_id', id);
	if (error) throw error;
	return count ?? 0;
}

async function clearDefaultCancellationPolicy(exceptId: string | null): Promise<void> {
	let query = adminClient
		.from('cancellation_policies')
		.update({ is_default: false, updated_at: new Date().toISOString() })
		.eq('is_default', true);
	if (exceptId) query = query.neq('id', exceptId);
	const { error } = await query;
	if (error) throw error;
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
