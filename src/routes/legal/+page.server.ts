import { getDefaultCancellationPolicy } from '$lib/server/supabase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Pull the active default policy so the public cancellation summary
	// follows admin edits. If lookup fails, return null and let the page
	// fall back to a static schedule — better degraded copy than a 500.
	const cancellationPolicy = await getDefaultCancellationPolicy().catch(() => null);
	return { cancellationPolicy };
};
