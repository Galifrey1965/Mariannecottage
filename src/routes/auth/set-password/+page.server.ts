// Lands invited admins after they click the magic link in their Supabase
// invite email. The link goes Supabase → here with `?code=…` (PKCE);
// we exchange it for a session, then show a password form. Submitting
// the form calls auth.updateUser({ password }) and drops them on /admin.
//
// Lives outside /admin/ so the admin layout's auth-gate redirect can't fire
// before we've had a chance to consume the PKCE code.

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (error) {
			console.warn('[auth/set-password] code exchange failed:', error.message);
			throw redirect(303, '/admin/login?invite_error=1');
		}
		// Redirect to the same path without ?code= so a refresh doesn't try to
		// re-spend a one-time code.
		throw redirect(303, '/auth/set-password');
	}

	// Don't redirect on missing session — Studio's email links can come back
	// in implicit flow with tokens in the URL fragment, which the server
	// can't see. The browser script in +page.svelte swaps those for cookies
	// via /api/auth/set-session and reloads. If neither code nor fragment
	// arrives, the page just shows a "link invalid or expired" state.
	return {
		email: locals.user?.email ?? null,
		hasSession: !!locals.user
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/admin/login');
		}
		const formData = await request.formData();
		const password = String(formData.get('password') ?? '');
		const confirm = String(formData.get('confirm') ?? '');

		if (password.length < 10) {
			return fail(400, { error: 'Password must be at least 10 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { error: error.message });
		}
		throw redirect(303, '/admin');
	}
};
