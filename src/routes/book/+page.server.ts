import { adminClient, getAvailability, getTaxSettings, getRatePlans, getTestBlockedDates } from '$lib/server/supabase';
import { runBcSyncLazyIfStale } from '$lib/server/bc-sync';
import type { PageServerLoad } from './$types';
import type { RatePlan } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	// Lazy sweep: clear any soft-reserves whose 20-min TTL has elapsed
	// before we read availability. The Netlify daily cron is a backstop —
	// this on-visit sweep is what makes abandoned reservations free up
	// for the next visitor without waiting for the cron. If the RPC itself
	// fails we still serve the page (worst case: stale availability for
	// this one render).
	const { error: sweepError } = await adminClient.rpc('expire_pending_bookings');
	if (sweepError) {
		console.error('[/book load] expire_pending_bookings failed:', sweepError);
	}

	// Lazy BC sync: pull the Booking.com iCal feed if the last sync was
	// more than 10 min ago. Bounds how often /book hits BC's feed (a busy
	// flurry of visits → 1 fetch per 10 min). The Netlify daily cron is
	// the backstop in case nobody visits /book for a long stretch.
	await runBcSyncLazyIfStale();

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
