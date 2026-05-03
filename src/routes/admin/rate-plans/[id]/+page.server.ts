import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getRatePlanByIdAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const plan = await getRatePlanByIdAdmin(params.id);
	if (!plan) throw error(404, 'Rate plan not found');
	return { plan };
};
