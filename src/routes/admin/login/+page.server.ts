import { fail, redirect } from '@sveltejs/kit';
import { rateLimit } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

// Brute-force guard. 10 attempts per 15-minute window keyed by IP — leaves
// a real admin plenty of headroom for typo'd passwords on the same machine,
// blocks credential-stuffing bots cold.
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60_000;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/admin');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals, getClientAddress }) => {
		const ip = getClientAddress();
		const result = rateLimit(`admin-login:${ip}`, LOGIN_MAX, LOGIN_WINDOW_MS);
		if (!result.allowed) {
			return fail(429, {
				email: '',
				error: `Too many sign-in attempts. Try again in ${Math.ceil(result.retryAfterSec / 60)} minute(s).`
			});
		}

		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { email, error: 'Invalid email or password.' });
		}

		throw redirect(303, '/admin');
	}
};
