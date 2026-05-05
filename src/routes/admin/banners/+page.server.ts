import type { PageServerLoad } from './$types';
import { listSiteBannersAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const banners = await listSiteBannersAdmin();
	return { banners };
};
