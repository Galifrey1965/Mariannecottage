// S-02: daily Netlify scheduled function that triggers the Booking.com
// availability sync. Posts to the in-app /api/sync-booking-com endpoint
// with the shared secret; the schedule itself is declared inline below.
//
// Cadence: daily backstop. The /book page server load runs a debounced
// lazy sync (runBcSyncLazyIfStale, 10-min window) on every visit, so an
// active site keeps BC fresh on real demand. This run only catches
// stretches with no /book traffic. Originally @hourly; that was overkill
// for a 4-bed B&B — most hours had no bookings on either side to clash.
//
// Runtime: Netlify Functions v2 (web-standard handler signature).

export default async () => {
	const siteUrl = process.env.URL || process.env.PUBLIC_SITE_URL;
	const secret = process.env.SYNC_SECRET;

	if (!siteUrl) {
		console.error('[sync-bc] URL / PUBLIC_SITE_URL not set; aborting');
		return new Response('missing site url', { status: 500 });
	}
	if (!secret) {
		console.error('[sync-bc] SYNC_SECRET not set; aborting');
		return new Response('missing secret', { status: 500 });
	}

	const target = `${siteUrl.replace(/\/$/, '')}/api/sync-booking-com`;

	try {
		const res = await fetch(target, {
			method: 'POST',
			headers: { 'x-sync-secret': secret }
		});
		const body = await res.text();
		if (!res.ok) {
			console.error(`[sync-bc] sync failed: ${res.status} ${body}`);
		} else {
			console.log(`[sync-bc] sync ok: ${body}`);
		}
		return new Response(body, { status: res.status });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error(`[sync-bc] sync threw: ${message}`);
		return new Response(message, { status: 500 });
	}
};

export const config = {
	schedule: '@daily'
};
