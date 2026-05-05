import { getAvailability, getTaxSettings, getRatePlans, getTestBlockedDates } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';
import type { RatePlan } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
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
