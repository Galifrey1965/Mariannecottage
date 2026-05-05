/**
 * Fetches the Google Business Profile rating + review count for the cottage
 * and writes static/google-rating.json. Run as a prebuild step.
 *
 * Endpoint: Places API (New) — Text Search + (implicit) Place Details
 * Auth: GOOGLE_PLACES_API_KEY env var (server-only, no PUBLIC_ prefix)
 * Failure mode: logs and exits 0 — build continues without rating, last
 * committed JSON is used. SEOHead omits aggregateRating block if missing/empty.
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACE_QUERY = 'Marianne Cottage Bed and Breakfast Couvains 50680';
const OUTPUT = resolve(process.cwd(), 'static/google-rating.json');

if (!KEY) {
	console.warn('[fetch-google-rating] GOOGLE_PLACES_API_KEY not set — skipping fetch.');
	process.exit(0);
}

try {
	const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': KEY,
			'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount'
		},
		body: JSON.stringify({ textQuery: PLACE_QUERY, languageCode: 'en' })
	});

	if (!res.ok) {
		throw new Error(`Places searchText failed: ${res.status} ${await res.text()}`);
	}

	const data = await res.json();
	const place = data.places?.[0];
	if (!place) throw new Error(`No place matched query: "${PLACE_QUERY}"`);

	const out = {
		placeId: place.id,
		name: place.displayName?.text ?? 'Marianne Cottage',
		ratingValue: typeof place.rating === 'number' ? place.rating : 0,
		ratingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
		fetchedAt: new Date().toISOString()
	};

	await writeFile(OUTPUT, JSON.stringify(out, null, 2) + '\n');
	console.log(
		`[fetch-google-rating] ${out.ratingValue}★ / ${out.ratingCount} reviews → ${OUTPUT}`
	);
} catch (err) {
	console.error(`[fetch-google-rating] Failed: ${err instanceof Error ? err.message : err}`);
	console.error('[fetch-google-rating] Build continues; existing JSON (if any) will be used.');
	process.exit(0);
}
