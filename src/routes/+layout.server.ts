import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as en from '../../messages/en.json';
import * as fr from '../../messages/fr.json';
import * as de from '../../messages/de.json';
import { getActiveBanners } from '$lib/server/supabase';
import type { LayoutServerLoad } from './$types';

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

export const load: LayoutServerLoad = async ({ locals }) => {
	// Locale is resolved in hooks.server.ts (single source of truth for
	// both <html lang> via transformPageChunk and the messages bundle).
	const lang = locals.lang;
	const [banners, rating] = await Promise.all([getActiveBanners(), loadRating()]);
	const isAdmin = locals.profile?.role === 'owner' || locals.profile?.role === 'developer';
	return { lang, messages: allMessages[lang], banners, rating, isAdmin };
};
