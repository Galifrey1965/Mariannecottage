import { adminClient, getAvailability, getTaxSettings, getRatePlans, getTestBlockedDates } from '$lib/server/supabase';
import { runBcSyncLazyIfStale } from '$lib/server/bc-sync';
import type { PageServerLoad } from './$types';
import type { RatePlan } from '$lib/server/supabase';

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

	// Run the four Supabase calls in parallel — they're independent.
	// Each .catch returns a sane fallback so one failed lookup doesn't
	// break the page; matches the prior per-query try/catch behaviour.
	const [availability, taxSettings, ratePlansResult, testBlockedDates] = await Promise.all([
		getAvailability(startStr, endStr).catch(() => null),
		getTaxSettings().catch(() => null),
		getRatePlans().catch((): RatePlan[] => []),
		getTestBlockedDates(startStr).catch((): string[] => [])
	]);

	const availabilityMap: Record<string, boolean> = {};
	if (availability) {
		for (const row of availability) {
			availabilityMap[row.date] = row.available;
		}
	}

	const taxRate = taxSettings?.taxe_de_sejour_per_person_per_night ?? 0.68;

	return { availability: availabilityMap, taxRate, ratePlans: ratePlansResult, testBlockedDates };
};
