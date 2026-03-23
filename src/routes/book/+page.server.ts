import { getAvailability } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const today = new Date();
	const endDate = new Date(today);
	endDate.setDate(endDate.getDate() + 90);

	const startStr = today.toISOString().split('T')[0];
	const endStr = endDate.toISOString().split('T')[0];

	try {
		const availability = await getAvailability(startStr, endStr);
		const availabilityMap: Record<string, boolean> = {};
		if (availability) {
			for (const row of availability) {
				availabilityMap[row.date] = row.available;
			}
		}
		return { availability: availabilityMap };
	} catch {
		return { availability: {} };
	}
};
