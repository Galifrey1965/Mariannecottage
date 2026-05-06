// Google Cloud Translation v2 helper.
//
// Uses the simple API-key flavour of the Cloud Translation API. The key lives
// in Mark's GCP project alongside the existing Maps and Places keys; provisioned
// 2026-05-06. See documentation/infrastructure.md for ownership / billing.
//
// Used by:
//   - /admin/gallery   — auto-fill FR/DE alt text from English on upload/edit
//   - /admin/banners   — same, for banner copy (wired in a follow-up patch)
//
// Errors are swallowed and surfaced as an empty-string return so the admin UI
// can fall back to manual entry without blowing up the form. The endpoint
// caller is responsible for telling the user "auto-translate failed, please
// fill these manually" if `translatedText` comes back empty.

import { env as privateEnv } from '$env/dynamic/private';

export type TranslateTarget = 'fr' | 'de';

interface GoogleTranslateResponse {
	data?: {
		translations?: Array<{ translatedText?: string }>;
	};
	error?: { code: number; message: string; status?: string };
}

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

export async function translate(text: string, target: TranslateTarget): Promise<string> {
	const trimmed = text.trim();
	if (!trimmed) return '';

	const key = privateEnv.GOOGLE_TRANSLATE_API_KEY;
	if (!key) {
		console.warn('[translate] GOOGLE_TRANSLATE_API_KEY not set; returning empty string');
		return '';
	}

	try {
		const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ q: trimmed, source: 'en', target, format: 'text' })
		});

		const body = (await res.json()) as GoogleTranslateResponse;

		if (!res.ok || body.error) {
			console.error('[translate] API error:', res.status, body.error?.message ?? body);
			return '';
		}

		const translated = body.data?.translations?.[0]?.translatedText;
		return typeof translated === 'string' ? translated : '';
	} catch (err) {
		console.error('[translate] fetch failed:', err);
		return '';
	}
}

// Convenience: translate one English string into both FR and DE in parallel.
// Returns whatever succeeded; failed translations come back as ''.
export async function translateBoth(
	text: string
): Promise<{ fr: string; de: string }> {
	const [fr, de] = await Promise.all([translate(text, 'fr'), translate(text, 'de')]);
	return { fr, de };
}
