import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { adminClient, type UserProfile } from '$lib/server/supabase';
import { getEffectiveDisplayProfile } from '$lib/server/view-as';

export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	// /admin/login handles its own redirect for already-authed users; do not gate it here.
	if (url.pathname === '/admin/login') {
		return { user: null, profile: null, displayProfile: null, allProfiles: [] };
	}

	if (!locals.user || !locals.profile) {
		throw redirect(303, '/admin/login');
	}

	const displayProfile = await getEffectiveDisplayProfile(locals.profile, cookies);

	let allProfiles: UserProfile[] = [];
	if (locals.profile.role === 'developer') {
		const { data } = await adminClient
			.from('user_profiles')
			.select('user_id, display_name, role, created_at')
			.order('display_name');
		allProfiles = (data as UserProfile[] | null) ?? [];
	}

	return {
		user: { id: locals.user.id, email: locals.user.email },
		profile: locals.profile,
		displayProfile,
		allProfiles
	};
};
