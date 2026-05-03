// B-07 / PR 3 — "view as" helper.
// A developer-role user can toggle the layout to *frame* the UI as if they
// were a different user. It does NOT change permissions (everyone has full
// owner perms) — it only swaps the display name shown in the nav so we can
// debug user-specific UI bugs from one account.
//
// Storage: a cookie `viewAs` whose value is the target user_id (UUID).
// If the cookie is absent, the developer sees their own profile.

import type { Cookies } from '@sveltejs/kit';
import type { UserProfile } from './supabase';
import { adminClient } from './supabase';

const COOKIE_NAME = 'viewAs';

export function readViewAsCookie(cookies: Cookies): string | null {
	return cookies.get(COOKIE_NAME) ?? null;
}

export function setViewAsCookie(cookies: Cookies, targetUserId: string | null): void {
	if (targetUserId) {
		cookies.set(COOKIE_NAME, targetUserId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24
		});
	} else {
		cookies.delete(COOKIE_NAME, { path: '/' });
	}
}

// Returns the profile to *display* in the nav. For non-developers, always own.
// For developers with a viewAs cookie pointing at another user, the target's profile.
export async function getEffectiveDisplayProfile(
	ownProfile: UserProfile | null,
	cookies: Cookies
): Promise<UserProfile | null> {
	if (!ownProfile) return null;
	if (ownProfile.role !== 'developer') return ownProfile;

	const targetUserId = readViewAsCookie(cookies);
	if (!targetUserId || targetUserId === ownProfile.user_id) return ownProfile;

	const { data, error } = await adminClient
		.from('user_profiles')
		.select('user_id, display_name, role, created_at')
		.eq('user_id', targetUserId)
		.maybeSingle();

	if (error || !data) return ownProfile;
	return data as UserProfile;
}
