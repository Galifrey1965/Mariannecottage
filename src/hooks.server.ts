import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { env as publicEnv } from '$env/dynamic/public';
import { getProfileByUserId } from '$lib/server/supabase';
import { detectLocale, isValidLocale } from '$lib/i18n';

const LOCALE_COOKIE = 'marianne_locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const handle: Handle = async ({ event, resolve }) => {
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

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		},
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
};
