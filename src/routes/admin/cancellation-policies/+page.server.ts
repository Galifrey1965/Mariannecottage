import type { PageServerLoad } from './$types';
import { listCancellationPoliciesAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const policies = await listCancellationPoliciesAdmin();
	return { policies };
};
