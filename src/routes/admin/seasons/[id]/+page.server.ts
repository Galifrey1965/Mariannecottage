import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSeasonByIdAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const season = await getSeasonByIdAdmin(params.id);
	if (!season) throw error(404, 'Season not found');
	return { season };
};
