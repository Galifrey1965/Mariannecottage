import { adminClient, getAvailability, getTaxSettings, getSeasons, getTestBlockedDates, getCheckInDates } from '$lib/server/supabase';
import { runBcSyncLazyIfStale } from '$lib/server/bc-sync';
import { computeBookableWindows } from '$lib/booking-windows';
import { MIN_NIGHTS, getEarliestCheckInDate } from '$lib/booking-policy';
import type { PageServerLoad } from './$types';
import type { Season } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	// Background: clear any soft-reserves whose 20-min TTL has elapsed
	// (frees abandoned-booking dates for the next visitor) and pull the
	// Booking.com iCal feed if the last sync was >10 min ago.
	//
	// Both run fire-and-forget so the user-facing page render isn't gated
	// on a third-party HTTP call (BC iCal can take seconds) or any extra
	// Supabase round-trip. The trade-off: this render uses whatever the
	// availability table holds *now*, so it can be ≤10 min stale relative
	// to BC and may briefly display an expired soft-reserve as taken.
	// Backstops:
	//   - The Netlify daily cron always runs both jobs.
	//   - The 10-min debounce in runBcSyncLazyIfStale means the next
	//     visit will simply re-attempt the sync if a fire-and-forget run
	//     was killed before completing on Netlify Functions.
	void adminClient.rpc('expire_pending_bookings').then(({ error }) => {
		if (error) console.error('[/book load] expire_pending_bookings failed:', error);
	});
	void runBcSyncLazyIfStale().catch((err) => {
		console.error('[/book load] BC sync failed:', err);
	});

	const today = new Date();
	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + 90);

	const startStr = today.toISOString().split('T')[0];
	const endStr = endDate.toISOString().split('T')[0];

	// Run the Supabase calls in parallel — they're independent. Each
	// .catch returns a sane fallback so one failed lookup doesn't break
	// the page; matches the prior per-query try/catch behaviour.
	const [availability, taxSettings, seasonsResult, testBlockedDates, checkoutOnlyDates] = await Promise.all([
		getAvailability(startStr, endStr).catch(() => null),
		getTaxSettings().catch(() => null),
		getSeasons().catch((): Season[] => []),
		getTestBlockedDates(startStr).catch((): string[] => []),
		getCheckInDates(startStr).catch((): string[] => [])
	]);

	const availabilityMap: Record<string, boolean> = {};
	if (availability) {
		for (const row of availability) {
			availabilityMap[row.date] = row.available;
		}
	}

	const taxRate = taxSettings?.taxe_de_sejour_per_person_per_night ?? 0.68;

	// Pre-compute the bookable-windows list server-side so the windows
	// picker on step 1 has zero further round-trips. Bounded by the
	// latest active season's end date — anything past that is
	// closed-by-absence anyway, no point surfacing it. Capped to a
	// 90-day raw horizon so the page doesn't try to render a year of
	// windows on first paint.
	const earliestCheckIn = getEarliestCheckInDate(today);
	const activeSeasons = (seasonsResult ?? []).filter((s) => s.is_active);
	const latestSeasonDateISO =
		activeSeasons.length > 0
			? activeSeasons.reduce((acc, s) => (s.end_date > acc ? s.end_date : acc), activeSeasons[0].end_date)
			: endStr;
	const latestCheckIn = new Date(latestSeasonDateISO + 'T00:00:00Z');
	const horizonCap = new Date(today);
	horizonCap.setDate(horizonCap.getDate() + 90);
	const effectiveLatest = latestCheckIn < horizonCap ? latestCheckIn : horizonCap;

	const windows = computeBookableWindows({
		availability: availabilityMap,
		checkoutOnlyDates,
		seasons: seasonsResult,
		earliestCheckIn,
		latestCheckIn: effectiveLatest,
		minNights: MIN_NIGHTS
	});

	return {
		availability: availabilityMap,
		taxRate,
		seasons: seasonsResult,
		testBlockedDates,
		checkoutOnlyDates,
		windows
	};
};
