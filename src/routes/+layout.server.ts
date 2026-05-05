import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { detectLocale, isValidLocale } from '$lib/i18n';
import * as en from '../../messages/en.json';
import * as fr from '../../messages/fr.json';
import * as de from '../../messages/de.json';
import { getActiveBanners } from '$lib/server/supabase';
import type { LayoutServerLoad } from './$types';

const COOKIE = 'marianne_locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const allMessages = { en, fr, de };

interface GoogleRating {
	ratingValue: number;
	ratingCount: number;
	fetchedAt?: string;
}

let cachedRating: GoogleRating | null | undefined;

async function loadRating(): Promise<GoogleRating | null> {
	if (cachedRating !== undefined) return cachedRating;
	try {
		const path = resolve(process.cwd(), 'static/google-rating.json');
		const raw = await readFile(path, 'utf-8');
		const parsed = JSON.parse(raw) as GoogleRating;
		cachedRating = parsed;
	} catch {
		cachedRating = null;
	}
	return cachedRating;
}

export const load: LayoutServerLoad = async ({ url, request, cookies }) => {
	// Priority: ?lang= query param > cookie > Accept-Language > default
	const urlLang = url.searchParams.get('lang');
	const cookie = cookies.get(COOKIE);

	let lang: 'en' | 'fr' | 'de';
	if (isValidLocale(urlLang)) {
		lang = urlLang;
		cookies.set(COOKIE, lang, { path: '/', maxAge: COOKIE_MAX_AGE, sameSite: 'lax' });
	} else if (isValidLocale(cookie)) {
		lang = cookie;
	} else {
		lang = detectLocale(request.headers.get('accept-language'));
	}

	const [banners, rating] = await Promise.all([getActiveBanners(), loadRating()]);

	return { lang, messages: allMessages[lang], banners, rating };
};
