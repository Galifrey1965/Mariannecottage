import type { PageServerLoad } from './$types';
import { listSeasonsAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const seasons = await listSeasonsAdmin(true);
	return { seasons };
};
