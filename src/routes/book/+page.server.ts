import { getAvailability, getTaxSettings } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date();
	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + 90);

	const startStr = today.toISOString().split('T')[0];
	const endStr = endDate.toISOString().split('T')[0];

	const availabilityMap: Record<string, boolean> = {};
	let taxRate = 0.68;

	try {
		const availability = await getAvailability(startStr, endStr);
		if (availability) {
			for (const row of availability) {
				availabilityMap[row.date] = row.available;
			}
		}
	} catch {
		// fall through with empty availability map
	}

	try {
		const taxSettings = await getTaxSettings();
		taxRate = taxSettings.taxe_de_sejour_per_person_per_night;
	} catch {
		// fall through with sane default
	}

	return { availability: availabilityMap, taxRate };
};
