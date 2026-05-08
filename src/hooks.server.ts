import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { getProfileByUserId } from '$lib/server/supabase';
import { detectLocale, isValidLocale } from '$lib/i18n';

const LOCALE_COOKIE = 'marianne_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
	// Supabase PKCE forwarder. Studio's "Send invitation" / password-recovery
	// emails build the magic link from the project's Site URL, which is
	// `https://mariannecottage.fr` (the site root). After Supabase verifies
	// the token, it appends `?code=…` and redirects there — but the home
	// page can't consume the code. Forward any incoming `?code=` (other than
	// to the set-password page itself) to /auth/set-password so the existing
	// PKCE handler can complete the sign-in. We don't gate on path so a
	// recovery email landing on /any/route still works.
	const incomingCode = event.url.searchParams.get('code');
	if (incomingCode && event.url.pathname !== '/auth/set-password') {
		throw redirect(303, `/auth/set-password?code=${encodeURIComponent(incomingCode)}`);
	}

	// Locale detection runs once per request and is the single source of
	// truth for both the SSR <html lang> attribute and the layout's
	// messages bundle. Priority: ?lang= query > cookie > Accept-Language >
	// default. If the query param wins, persist it as a cookie so the
	// next request stays on that locale without the query string.
	const urlLang = event.url.searchParams.get('lang');
	const cookieLang = event.cookies.get(LOCALE_COOKIE);
	if (isValidLocale(urlLang)) {
		event.locals.lang = urlLang;
		event.cookies.set(LOCALE_COOKIE, urlLang, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: 'lax' });
	} else if (isValidLocale(cookieLang)) {
		event.locals.lang = cookieLang;
	} else {
		event.locals.lang = detectLocale(event.request.headers.get('accept-language'));
	}

	event.locals.supabase = createServerClient(
		publicEnv.PUBLIC_SUPABASE_URL!,
		publicEnv.PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	// safeGetSession: validates the JWT against the Auth server before trusting it.
	// getSession() alone returns whatever's in the cookie unverified.
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	const { user } = await event.locals.safeGetSession();
	event.locals.user = user;
	event.locals.profile = user ? await getProfileByUserId(user.id) : null;

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});

	// Security headers — applied to SSR responses. netlify.toml [[headers]]
	// only covers static files in the publish dir, so SvelteKit-rendered
	// pages bypass it. Mirror the same policy here so scanners (Mozilla
	// Observatory, securityheaders.com) see them on the home page too.
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(name, value);
	}

	return response;
};

const SECURITY_HEADERS: Record<string, string> = {
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.com https://m.stripe.network https://maps.googleapis.com https://maps.gstatic.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data: https://fonts.gstatic.com",
		"connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.supabase.co wss://*.supabase.co https://maps.googleapis.com https://*.googleapis.com",
		"frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://*.stripe.com https://www.google.com https://maps.google.com",
		"media-src 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'self'",
		'upgrade-insecure-requests'
	].join('; '),
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()',
	'X-Frame-Options': 'SAMEORIGIN',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Cross-Origin-Opener-Policy': 'same-origin'
};
