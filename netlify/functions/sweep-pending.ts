// B-02 Phase 2: scheduled function that sweeps expired soft-reserves.
// Mirrors netlify/functions/sync-bc.ts pattern: this function does no work
// itself, just POSTs to the in-app /api/sweep-pending endpoint with the
// shared secret. Schedule declared inline per Netlify Functions v2.
//
// Cadence: daily backstop. The booking page server load also calls
// expire_pending_bookings on every visit, so a stale reservation is
// almost always cleared the moment the next visitor lands on /book —
// this scheduled run only catches the case where nobody visits for a
// long stretch. Originally */5 minutes; that was overkill for a 4-bed
// B&B with low-volume bookings.

export default async () => {
	const siteUrl = process.env.URL || process.env.PUBLIC_SITE_URL;
	const secret = process.env.SWEEP_SECRET;

	if (!siteUrl) {
		console.error('[sweep-pending] URL / PUBLIC_SITE_URL not set; aborting');
		return new Response('missing site url', { status: 500 });
	}
	if (!secret) {
		console.error('[sweep-pending] SWEEP_SECRET not set; aborting');
		return new Response('missing secret', { status: 500 });
	}

	const target = `${siteUrl.replace(/\/$/, '')}/api/sweep-pending`;

	try {
		const res = await fetch(target, {
			method: 'POST',
			headers: { 'x-sweep-secret': secret }
		});
		const body = await res.text();
		if (!res.ok) {
			console.error(`[sweep-pending] sweep failed: ${res.status} ${body}`);
		} else {
			console.log(`[sweep-pending] sweep ok: ${body}`);
		}
		return new Response(body, { status: res.status });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error(`[sweep-pending] sweep threw: ${message}`);
		return new Response(message, { status: 500 });
	}
};

export const config = {
	schedule: '@daily'
};
