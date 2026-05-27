// Issue #55: daily Netlify scheduled function that refreshes the Google rating.
// Mirrors netlify/functions/sweep-pending.ts: does no work itself, just POSTs
// to the in-app /api/refresh-google-rating endpoint with the shared secret.
// The endpoint fetches Google Places and upserts the google_rating row, so
// reviews refresh on a schedule without a redeploy.
//
// Runtime: Netlify Functions v2 (web-standard handler signature).

export default async () => {
	const siteUrl = process.env.URL || process.env.PUBLIC_SITE_URL;
	const secret = process.env.RATING_SECRET;

	if (!siteUrl) {
		console.error('[fetch-google-rating] URL / PUBLIC_SITE_URL not set; aborting');
		return new Response('missing site url', { status: 500 });
	}
	if (!secret) {
		console.error('[fetch-google-rating] RATING_SECRET not set; aborting');
		return new Response('missing secret', { status: 500 });
	}

	const target = `${siteUrl.replace(/\/$/, '')}/api/refresh-google-rating`;

	try {
		const res = await fetch(target, {
			method: 'POST',
			headers: { 'x-rating-secret': secret }
		});
		const body = await res.text();
		if (!res.ok) {
			console.error(`[fetch-google-rating] refresh failed: ${res.status} ${body}`);
		} else {
			console.log(`[fetch-google-rating] refresh ok: ${body}`);
		}
		return new Response(body, { status: res.status });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error(`[fetch-google-rating] refresh threw: ${message}`);
		return new Response(message, { status: 500 });
	}
};

export const config = {
	schedule: '@daily'
};
