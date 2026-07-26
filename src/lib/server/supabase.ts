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
	rate_plan?: RatePlan;
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

export type SeasonKind = 'low' | 'high' | 'peak';
export type RatePlan = 'refundable' | 'non_refundable';

export interface Season {
	id: string;
	created_at: string;
	updated_at: string;
	name: string;
	description?: string;
	kind: SeasonKind;
	rate_per_night: number;
	rate_2_guests: number;
	rate_3_guests: number;
	rate_4_guests: number;
	// Non-refundable plan rates. NULL on the row → this season has no
	// non-refundable option (the booking flow hides the rate-plan picker).
	// All-or-none enforced by a CHECK constraint at the DB level.
	rate_per_night_nonref: number | null;
	rate_2_guests_nonref: number | null;
	rate_3_guests_nonref: number | null;
	rate_4_guests_nonref: number | null;
	start_date: string;
	end_date: string;
	created_by?: string;
	is_active: boolean;
	reviewed_by_admin: boolean;
}

export interface SeasonInput {
	name: string;
	description?: string | null;
	kind: SeasonKind;
	rate_per_night: number;
	rate_2_guests: number;
	rate_3_guests: number;
	rate_4_guests: number;
	rate_per_night_nonref?: number | null;
	rate_2_guests_nonref?: number | null;
	rate_3_guests_nonref?: number | null;
	rate_4_guests_nonref?: number | null;
	start_date: string;
	end_date: string;
	is_active?: boolean;
	reviewed_by_admin?: boolean;
}

// seasonHasNonref lives in $lib/booking-windows so client code can use
// it without dragging in server modules. Re-imported + re-exported here
// for callers already pulling helpers from $lib/server/supabase.
import { seasonHasNonref } from '$lib/booking-windows';
export { seasonHasNonref };

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

// Season operations (renamed from rate_plans 2026-05-07).
export async function getSeasons(): Promise<Season[]> {
	const { data, error } = await anonClient
		.from('seasons')
		.select('*')
		.eq('is_active', true)
		.order('start_date', { ascending: true });

	if (error) throw error;
	return (data as Season[] | null) ?? [];
}

// Returns the active season covering `date`. On overlap the smallest-span
// season wins — supports both premium overlays (e.g. Ascension Weekend
// Peak on top of High) and discount overlays (a 1-week last-minute sale
// inside Low) without an explicit priority field.
export async function getSeasonForDate(date: string): Promise<Season | null> {
	const { data, error } = await anonClient
		.from('seasons')
		.select('*')
		.eq('is_active', true)
		.lte('start_date', date)
		.gte('end_date', date);

	if (error) return null;
	const rows = (data as Season[] | null) ?? [];
	return resolveSeason(rows);
}

// Pick the smallest-span season from a list, breaking ties on most-recent
// created_at. Exported so callers that already have the active-seasons
// list (e.g. /book server load) can resolve without re-querying.
export function resolveSeason(rows: Season[]): Season | null {
	if (rows.length === 0) return null;
	const span = (s: Season) =>
		new Date(s.end_date).getTime() - new Date(s.start_date).getTime();
	return [...rows].sort((a, b) => {
		const ds = span(a) - span(b);
		if (ds !== 0) return ds;
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
	})[0];
}

// Per-guest rate selector. num_guests must be 1..4 (matches
// bookings.num_guests CHECK). rate_plan defaults to 'refundable' so
// callers that don't yet thread the picker through still work.
// Throws if 'non_refundable' is requested on a season that has no
// non-refundable rates configured — caller should validate via
// seasonHasNonref first.
export function rateForGuestCount(
	season: Season,
	num_guests: number,
	rate_plan: RatePlan = 'refundable'
): number {
	if (rate_plan === 'non_refundable') {
		if (!seasonHasNonref(season)) {
			throw new Error('non_refundable rate requested on season with no non-refundable rates');
		}
		switch (num_guests) {
			case 1: return Number(season.rate_per_night_nonref);
			case 2: return Number(season.rate_2_guests_nonref);
			case 3: return Number(season.rate_3_guests_nonref);
			case 4: return Number(season.rate_4_guests_nonref);
			default: throw new Error(`num_guests out of range: ${num_guests}`);
		}
	}
	switch (num_guests) {
		case 1: return Number(season.rate_per_night);
		case 2: return Number(season.rate_2_guests);
		case 3: return Number(season.rate_3_guests);
		case 4: return Number(season.rate_4_guests);
		default: throw new Error(`num_guests out of range: ${num_guests}`);
	}
}

export async function getRateForBooking(
	date: string,
	num_guests: number,
	rate_plan: RatePlan = 'refundable'
): Promise<{ season: Season; nightly_rate: number } | null> {
	const season = await getSeasonForDate(date);
	if (!season) return null;
	if (rate_plan === 'non_refundable' && !seasonHasNonref(season)) return null;
	return { season, nightly_rate: rateForGuestCount(season, num_guests, rate_plan) };
}

// Admin season helpers (service-role only).
export async function listSeasonsAdmin(includeInactive = true): Promise<Season[]> {
	let query = adminClient.from('seasons').select('*');
	if (!includeInactive) query = query.eq('is_active', true);
	const { data, error } = await query.order('start_date', { ascending: true });
	if (error) throw error;
	return (data as Season[] | null) ?? [];
}

export async function getSeasonByIdAdmin(id: string): Promise<Season | null> {
	const { data, error } = await adminClient
		.from('seasons')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return null;
	return (data as Season | null) ?? null;
}

export async function createSeason(input: SeasonInput): Promise<Season> {
	const { data, error } = await adminClient
		.from('seasons')
		.insert([{
			...input,
			is_active: input.is_active ?? true,
			reviewed_by_admin: input.reviewed_by_admin ?? true
		}])
		.select()
		.single();
	if (error) throw error;
	return data as Season;
}

export async function updateSeason(id: string, patch: Partial<SeasonInput>): Promise<Season> {
	const { data, error } = await adminClient
		.from('seasons')
		.update({ ...patch, updated_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data as Season;
}

export async function archiveSeason(id: string): Promise<Season> {
	return updateSeason(id, { is_active: false });
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

// Picks the right cancellation policy for a guest's chosen rate plan.
// Refundable → the default policy. Non-refundable → the row named
// 'Non-refundable' (seeded by migration 2026-05-07-03). Returns null
// only if the expected policy is missing — which is a config error
// the caller should surface.
export async function getCancellationPolicyForRatePlan(
	rate_plan: RatePlan
): Promise<CancellationPolicy | null> {
	if (rate_plan === 'refundable') return getDefaultCancellationPolicy();
	const { data, error } = await adminClient
		.from('cancellation_policies')
		.select('*')
		.eq('name', 'Non-refundable')
		.maybeSingle();
	if (error) {
		console.error('getCancellationPolicyForRatePlan(non_refundable) failed:', error);
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

// 2026-05-27: google_rating — daily-refreshed Google Business Profile snapshot
// (issue #55). Single row (id = 1). Read on every page load by
// +layout.server.ts; written by /api/refresh-google-rating via the daily cron.

export interface GoogleReview {
	authorName: string;
	authorPhoto: string | null;
	rating: number;
	text: string;
	languageCode: string;
	publishTime: string | null;
	relativeTime: string;
}

export interface GoogleRating {
	ratingValue: number;
	ratingCount: number;
	googleMapsUri: string | null;
	reviews: GoogleReview[];
	placeId?: string;
	name?: string;
	fetchedAt?: string;
}

export async function getGoogleRating(): Promise<GoogleRating | null> {
	const { data, error } = await anonClient
		.from('google_rating')
		.select('place_id, name, rating_value, rating_count, google_maps_uri, reviews, fetched_at')
		.eq('id', 1)
		.maybeSingle();
	if (error) {
		console.error('getGoogleRating failed:', error);
		return null;
	}
	if (!data) return null;
	return {
		placeId: (data.place_id as string) ?? undefined,
		name: (data.name as string) ?? undefined,
		ratingValue: Number(data.rating_value) || 0,
		ratingCount: Number(data.rating_count) || 0,
		googleMapsUri: (data.google_maps_uri as string) ?? null,
		reviews: ((data.reviews as GoogleReview[]) ?? []),
		fetchedAt: (data.fetched_at as string) ?? undefined
	};
}

export async function upsertGoogleRating(input: GoogleRating): Promise<void> {
	const { error } = await adminClient.from('google_rating').upsert(
		{
			id: 1,
			place_id: input.placeId ?? null,
			name: input.name ?? null,
			rating_value: input.ratingValue,
			rating_count: input.ratingCount,
			google_maps_uri: input.googleMapsUri ?? null,
			reviews: input.reviews,
			fetched_at: input.fetchedAt ?? new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'id' }
	);
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

// 2026-07-26: enquiries — contact-form submissions persisted before the
// notification email is attempted.
//
// Background: on 2026-07-24 a real enquiry was destroyed. Brevo's IP allow-list
// rejected the send from a fresh Lambda egress IP, sendEnquiry threw out of the
// admin notice, /api/contact returned 500 — and because nothing was ever
// written down, the message was unrecoverable. The row is now the system of
// record and the email is only a notification, so any future send failure
// (outage, quota, bad sender) is non-destructive.
//
// Service-role only: the table holds visitor PII, RLS is on with no policies,
// and anon/authenticated are explicitly REVOKEd. Always go through adminClient.

export type EnquiryStatus = 'new' | 'spam' | 'replied' | 'archived';

export interface EnquiryInput {
	name: string;
	email: string;
	message: string;
	locale: string;
	status: 'new' | 'spam';
	spam_reason?: string | null;
}

export interface Enquiry {
	id: string;
	created_at: string;
	name: string;
	email: string;
	message: string;
	locale: string;
	status: EnquiryStatus;
	spam_reason: string | null;
	admin_notified_at: string | null;
	ack_sent_at: string | null;
	notify_error: string | null;
	notify_attempts: number;
	last_notify_attempt_at: string | null;
}

const ENQUIRY_COLUMNS =
	'id, created_at, name, email, message, locale, status, spam_reason, admin_notified_at, ack_sent_at, notify_error, notify_attempts, last_notify_attempt_at';

// Brevo error bodies can be verbose; notify_error is for diagnosis, not archival.
const NOTIFY_ERROR_MAX_CHARS = 500;

// 24 months — enquiries have no accounting purpose (unlike bookings, kept 10
// years for French accounting), so they are purged on a fixed clock. Disclosed
// on /legal — see legal.gdpr_processing_enquiry.
const ENQUIRY_RETENTION_MONTHS = 24;

export async function createEnquiry(input: EnquiryInput): Promise<string> {
	const { data, error } = await adminClient
		.from('enquiries')
		.insert({
			name: input.name,
			email: input.email,
			message: input.message,
			locale: input.locale,
			status: input.status,
			spam_reason: input.spam_reason ?? null
		})
		.select('id')
		.single();
	if (error) throw error;
	return (data as { id: string }).id;
}

// `attempts` is the running total from E-02's counter. It is optional so the
// original /api/contact call sites keep working unchanged; the retry sweep
// passes the incremented value it read off the row.
export async function markEnquiryNotified(id: string, attempts?: number): Promise<void> {
	const now = new Date().toISOString();
	const patch: Record<string, unknown> = { admin_notified_at: now };
	if (attempts !== undefined) {
		patch.notify_attempts = attempts;
		patch.last_notify_attempt_at = now;
		// A row that finally succeeded should not keep showing the error that
		// stopped it last time.
		patch.notify_error = null;
	}
	const { error } = await adminClient.from('enquiries').update(patch).eq('id', id);
	if (error) throw error;
}

export async function markEnquiryNotifyFailed(
	id: string,
	error: string,
	attempts?: number
): Promise<void> {
	const patch: Record<string, unknown> = { notify_error: error.slice(0, NOTIFY_ERROR_MAX_CHARS) };
	if (attempts !== undefined) {
		patch.notify_attempts = attempts;
		patch.last_notify_attempt_at = new Date().toISOString();
	}
	const { error: updateError } = await adminClient
		.from('enquiries')
		.update(patch)
		.eq('id', id);
	if (updateError) throw updateError;
}

// GDPR retention: enquiries have no accounting purpose (unlike bookings, kept
// 10 years), so they are deleted 24 months after submission. Disclosed on
// /legal — see legal.gdpr_processing_enquiry. Called daily from
// /api/sweep-pending. Spam rows share the same clock deliberately: a
// misclassified genuine enquiry deserves the same recovery period.
export async function purgeOldEnquiries(): Promise<number> {
	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - ENQUIRY_RETENTION_MONTHS);
	const { data, error } = await adminClient
		.from('enquiries')
		.delete()
		.lt('created_at', cutoff.toISOString())
		.select('id');
	if (error) throw error;
	return (data as { id: string }[] | null)?.length ?? 0;
}

// E-01: admin read + status transitions.
//
// Persisting enquiries stopped them being destroyed; it did not make anyone
// look at them. Until this landed, a row whose notification failed sat in the
// table with notify_error populated and nothing anywhere surfaced it.

export interface EnquiryListOptions {
	status?: EnquiryStatus | 'all';
	page?: number;
	pageSize?: number;
}

export async function listEnquiriesAdmin(
	options: EnquiryListOptions = {}
): Promise<{ enquiries: Enquiry[]; total: number }> {
	const page = Math.max(0, options.page ?? 0);
	const pageSize = options.pageSize ?? 25;

	let q = adminClient
		.from('enquiries')
		.select(ENQUIRY_COLUMNS, { count: 'exact' })
		.order('created_at', { ascending: false });

	if (options.status && options.status !== 'all') {
		q = q.eq('status', options.status);
	}

	const start = page * pageSize;
	q = q.range(start, start + pageSize - 1);

	const { data, error, count } = await q;
	if (error) throw error;
	return { enquiries: (data ?? []) as unknown as Enquiry[], total: count ?? 0 };
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
	const { data, error } = await adminClient
		.from('enquiries')
		.select(ENQUIRY_COLUMNS)
		.eq('id', id)
		.maybeSingle();
	if (error) throw error;
	return (data as unknown as Enquiry | null) ?? null;
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
	const { data, error } = await adminClient
		.from('enquiries')
		.update({ status })
		.eq('id', id)
		.select(ENQUIRY_COLUMNS)
		.single();
	if (error) throw error;
	return data as unknown as Enquiry;
}

// E-02: candidates for the notification retry sweep — genuine enquiries nobody
// was ever told about. Served by the partial index enquiries_unnotified_idx.
//
// Oldest first: if the batch limit bites, the enquiry that has been waiting
// longest is the one that gets sent, not the one that happens to be newest.
export async function listUnnotifiedEnquiries(options: {
	maxAttempts: number;
	maxAgeDays: number;
	limit: number;
}): Promise<Enquiry[]> {
	const cutoff = new Date(Date.now() - options.maxAgeDays * 86_400_000).toISOString();
	const { data, error } = await adminClient
		.from('enquiries')
		.select(ENQUIRY_COLUMNS)
		.eq('status', 'new')
		.is('admin_notified_at', null)
		.lt('notify_attempts', options.maxAttempts)
		.gte('created_at', cutoff)
		.order('created_at', { ascending: true })
		.limit(options.limit);
	if (error) throw error;
	return (data ?? []) as unknown as Enquiry[];
}

// Rows the sweep will never pick up again: too many failed attempts, or older
// than the age ceiling. Counted so the daily run can say so out loud instead of
// quietly narrowing its own workload — these still need a human.
export async function countAbandonedEnquiries(options: {
	maxAttempts: number;
	maxAgeDays: number;
}): Promise<number> {
	const cutoff = new Date(Date.now() - options.maxAgeDays * 86_400_000).toISOString();
	const { count, error } = await adminClient
		.from('enquiries')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'new')
		.is('admin_notified_at', null)
		.or(`notify_attempts.gte.${options.maxAttempts},created_at.lt.${cutoff}`);
	if (error) throw error;
	return count ?? 0;
}

// Head-count queries so the admin header can show what needs attention without
// pulling rows. `unnotified` is the number Mark was never told about — the
// count that would have been 1 on 2026-07-24 and told us something was wrong.
export async function getEnquiryCounts(): Promise<{
	newCount: number;
	spamCount: number;
	unnotifiedCount: number;
}> {
	const [newRes, spamRes, unnotifiedRes] = await Promise.all([
		adminClient.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
		adminClient.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'spam'),
		adminClient
			.from('enquiries')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'new')
			.is('admin_notified_at', null)
	]);

	for (const res of [newRes, spamRes, unnotifiedRes]) {
		if (res.error) {
			console.error('getEnquiryCounts failed:', res.error);
			return { newCount: 0, spamCount: 0, unnotifiedCount: 0 };
		}
	}

	return {
		newCount: newRes.count ?? 0,
		spamCount: spamRes.count ?? 0,
		unnotifiedCount: unnotifiedRes.count ?? 0
	};
}

// Utility: Generate booking reference
export function generateBookingReference(): string {
	const now = new Date();
	const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `MC-${dateStr}-${random}`;
}
