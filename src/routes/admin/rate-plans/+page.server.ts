import type { PageServerLoad } from './$types';
import { listRatePlansAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const plans = await listRatePlansAdmin(true);
	return { plans };
};
