// Refreshes the cached Google Business Profile rating + reviews (issue #55).
//
// Called daily by netlify/functions/fetch-google-rating.ts via the
// RATING_SECRET shared header. Fetches Google Places API (New) searchText and
// upserts the singleton google_rating row. Replaces the old build-time
// scripts/fetch-google-rating.mjs → static/google-rating.json flow, so reviews
// refresh on a schedule without a redeploy.
//
// Failure mode: on any Google error we leave the existing DB row untouched and
// return non-200 — the site keeps serving the last good snapshot.

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env as privateEnv } from '$env/dynamic/private';
import { upsertGoogleRating, type GoogleReview } from '$lib/server/supabase';

const PLACE_QUERY = 'Marianne Cottage Bed and Breakfast Couvains 50680';

interface PlacesReview {
	authorAttribution?: { displayName?: string; photoUri?: string };
	rating?: number;
	originalText?: { text?: string; languageCode?: string };
	text?: { text?: string; languageCode?: string };
	publishTime?: string;
	relativePublishTimeDescription?: string;
}

export const POST: RequestHandler = async ({ request }) => {
	const expectedSecret = privateEnv.RATING_SECRET;
	if (!expectedSecret) {
		console.error('[refresh-google-rating] RATING_SECRET not configured');
		return new Response('not configured', { status: 503 });
	}
	if (request.headers.get('x-rating-secret') !== expectedSecret) {
		return new Response('forbidden', { status: 403 });
	}

	const key = privateEnv.GOOGLE_PLACES_API_KEY;
	if (!key) {
		console.error('[refresh-google-rating] GOOGLE_PLACES_API_KEY not set');
		return new Response('missing api key', { status: 503 });
	}

	try {
		const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Goog-Api-Key': key,
				'X-Goog-FieldMask': [
					'places.id',
					'places.displayName',
					'places.rating',
					'places.userRatingCount',
					'places.googleMapsUri',
					'places.reviews'
				].join(',')
			},
			body: JSON.stringify({ textQuery: PLACE_QUERY })
		});

		if (!res.ok) {
			throw new Error(`Places searchText failed: ${res.status} ${await res.text()}`);
		}

		const data = await res.json();
		const place = data.places?.[0];
		if (!place) throw new Error(`No place matched query: "${PLACE_QUERY}"`);

		const reviews: GoogleReview[] = ((place.reviews ?? []) as PlacesReview[]).map((r) => ({
			authorName: r.authorAttribution?.displayName ?? 'Guest',
			authorPhoto: r.authorAttribution?.photoUri ?? null,
			rating: typeof r.rating === 'number' ? r.rating : 0,
			// originalText preserves the author's native language; text is Google's
			// localised version if a different languageCode is requested.
			text: r.originalText?.text ?? r.text?.text ?? '',
			languageCode: r.originalText?.languageCode ?? r.text?.languageCode ?? 'en',
			publishTime: r.publishTime ?? null,
			relativeTime: r.relativePublishTimeDescription ?? ''
		}));

		await upsertGoogleRating({
			placeId: place.id,
			name: place.displayName?.text ?? 'Marianne Cottage',
			ratingValue: typeof place.rating === 'number' ? place.rating : 0,
			ratingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
			googleMapsUri: place.googleMapsUri ?? null,
			reviews,
			fetchedAt: new Date().toISOString()
		});

		return json({
			ok: true,
			ratingValue: typeof place.rating === 'number' ? place.rating : 0,
			ratingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
			reviewBodies: reviews.length
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'unknown error';
		console.error(`[refresh-google-rating] failed: ${message}`);
		return new Response(message, { status: 502 });
	}
};
