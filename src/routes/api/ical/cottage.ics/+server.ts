// Phase 2 row 5 — iCal OUT feed of cottage bookings.
//
// Public-by-design (no auth, no PII): contents are blocked dates keyed by
// booking_reference. OTAs subscribe to this URL via their iCal-import
// option (Booking.com extranet → Calendar → Sync your calendar).
//
// Cache: 5 minutes — BC polls hourly, our cron polls hourly, the feed
// changes only when a booking lands or cancels. 5 min is plenty.

import type { RequestHandler } from './$types';
import { getBookingsForIcalFeed } from '$lib/server/supabase';
import { buildIcalFeed } from '$lib/server/ical-out';

export const GET: RequestHandler = async () => {
	const today = new Date().toISOString().slice(0, 10);

	let icsBody: string;
	try {
		const bookings = await getBookingsForIcalFeed(today);
		icsBody = buildIcalFeed(bookings);
	} catch (err) {
		console.error('iCal OUT feed failed:', err);
		// Return an empty (but valid) calendar rather than an HTTP error so
		// OTA pollers don't disable the subscription on a transient blip.
		icsBody = buildIcalFeed([]);
	}

	return new Response(icsBody, {
		status: 200,
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': 'inline; filename="cottage.ics"',
			'Cache-Control': 'public, max-age=300, s-maxage=300',
			'X-Robots-Tag': 'noindex'
		}
	});
};
