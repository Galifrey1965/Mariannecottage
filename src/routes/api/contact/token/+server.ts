// 2026-07-26: issues the anti-bot form token for the contact form.
//
// EnquiryForm.svelte fetches this on mount and posts the token back with the
// enquiry, letting /api/contact apply a fill-time floor. See form-token.ts for
// why the key is derived from CANCEL_TOKEN_SECRET rather than a new env var.

import { json } from '@sveltejs/kit';
import { signFormToken } from '$lib/server/form-token';
import { rateLimitResponse } from '$lib/server/rate-limit';
import type { RequestHandler } from './$types';

// Generous for real page loads (a visitor may reload, or open a few tabs), but
// stops the endpoint becoming a free token mint for a bot farm.
const TOKEN_MAX = 20;
const TOKEN_WINDOW_MS = 60_000;

export const GET: RequestHandler = async ({ getClientAddress }) => {
	const limited = rateLimitResponse(`contact-token:${getClientAddress()}`, TOKEN_MAX, TOKEN_WINDOW_MS);
	if (limited) return limited;

	let token: string | null = null;
	try {
		token = signFormToken();
	} catch (error) {
		// No CANCEL_TOKEN_SECRET configured. The form must still work, so hand
		// back a null token — /api/contact treats a missing token as genuine
		// rather than punishing visitors for our own misconfiguration.
		console.error('[contact-token] could not sign form token:', error);
	}

	return json(
		{ token },
		{
			status: 200,
			// A CDN-cached token would hand every visitor the same issued-at
			// timestamp and defeat the timing check entirely.
			headers: { 'Cache-Control': 'no-store' }
		}
	);
};
