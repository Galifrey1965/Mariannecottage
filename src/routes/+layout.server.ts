import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as en from '../../messages/en.json';
import * as fr from '../../messages/fr.json';
import * as de from '../../messages/de.json';
import { getActiveBanners, getGoogleRating, type GoogleRating } from '$lib/server/supabase';
import type { LayoutServerLoad } from './$types';

const allMessages = { en, fr, de };

// Google rating now lives in the DB (issue #55), refreshed daily by the
// fetch-google-rating cron so reviews update without a redeploy. We still fall
// back to the committed static/google-rating.json if the DB row is missing
// (e.g. first deploy before the migration seed, or a transient Supabase error)
// so the rating block never silently disappears.
async function loadRating(): Promise<GoogleRating | null> {
	const fromDb = await getGoogleRating();
	if (fromDb) return fromDb;
	try {
		const path = resolve(process.cwd(), 'static/google-rating.json');
		const raw = await readFile(path, 'utf-8');
		return JSON.parse(raw) as GoogleRating;
	} catch {
		return null;
	}
}

export const load: LayoutServerLoad = async ({ locals }) => {
	// Locale is resolved in hooks.server.ts (single source of truth for
	// both <html lang> via transformPageChunk and the messages bundle).
	const lang = locals.lang;
	const [banners, rating] = await Promise.all([getActiveBanners(), loadRating()]);
	const isAdmin = locals.profile?.role === 'owner' || locals.profile?.role === 'developer';
	return { lang, messages: allMessages[lang], banners, rating, isAdmin };
};
