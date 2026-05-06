// Server-side proxy for the Google Translate v2 helper. Keeps the API key
// off the browser. Generic across admin pages — currently used by the
// gallery (image alt text + category labels) and banners admin (banner
// message). Any future admin form needing FR/DE auto-fill from English
// can hit this endpoint.
//
// POST body: { text: string, targets?: ('fr' | 'de')[] }
// Returns: { fr: string, de: string }  — empty string per locale on failure.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { translate, type TranslateTarget } from '$lib/server/translate';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as { text?: string; targets?: TranslateTarget[] };
	const text = (body.text ?? '').trim();
	if (!text) return json({ fr: '', de: '' });

	const targets: TranslateTarget[] =
		Array.isArray(body.targets) && body.targets.length > 0 ? body.targets : ['fr', 'de'];

	const results = await Promise.all(targets.map((t) => translate(text, t).then((v) => [t, v] as const)));
	const out: Record<string, string> = { fr: '', de: '' };
	for (const [t, v] of results) out[t] = v;

	return json(out);
};
