// Sets the SSR session cookies from a {access_token, refresh_token} pair
// posted by the browser. Used by the implicit-flow email-link handler:
// Supabase's Studio-generated emails come back with tokens in the URL
// fragment (#access_token=…&refresh_token=…), which the server can't see
// because fragments are browser-only. The /auth/set-password page reads
// the fragment client-side and POSTs the tokens here so locals.supabase
// can validate them and write the SSR session cookies — after which a
// reload lands on the password form with locals.user populated.

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json().catch(() => null);
	const accessToken = body?.access_token;
	const refreshToken = body?.refresh_token;
	if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
		return json({ success: false, error: 'missing_tokens' }, { status: 400 });
	}

	const { error } = await locals.supabase.auth.setSession({
		access_token: accessToken,
		refresh_token: refreshToken
	});
	if (error) {
		return json({ success: false, error: error.message }, { status: 401 });
	}

	return json({ success: true });
};
