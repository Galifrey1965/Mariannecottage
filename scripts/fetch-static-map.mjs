/**
 * Fetches a Google Static Maps PNG of the cottage location and writes it to
 * static/images/cottage-static-map.png + @2x. Runs once (or on demand) — the
 * cottage doesn't move, so the output is a committed static asset.
 *
 * Why self-host instead of hot-linking the Static Maps URL?
 *   The site is GDPR-gated: we don't contact Google until the visitor
 *   accepts cookies. A hot-linked googleapis.com URL would defeat that
 *   posture. Generating once at build/dev time and serving from /static/
 *   keeps the consent gate honest while still giving crawlers and pre-
 *   consent visitors a real map preview.
 *
 * Endpoint: maps.googleapis.com/maps/api/staticmap
 * Auth: PUBLIC_GOOGLE_MAPS_API_KEY (same key as the live map; the request
 *       runs server-side here, but the resulting PNG is just bytes — no
 *       key embedded)
 * Failure mode: logs and exits 0 — build continues, the existing PNG (if
 *       any) is used. The contact page degrades gracefully if the file is
 *       missing (the consent overlay still renders without the preview).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const KEY =
	process.env.GOOGLE_STATIC_MAPS ??
	process.env.GOOGLE_MAPS_API_KEY ??
	process.env.PUBLIC_GOOGLE_MAPS_API_KEY;
const LAT = 49.172937;
const LNG = -0.988765;
const OUT_1X = resolve(process.cwd(), 'static/images/cottage-static-map.png');
const OUT_2X = resolve(process.cwd(), 'static/images/cottage-static-map@2x.png');

if (!KEY) {
	console.warn(
		'[fetch-static-map] No key found (looked for GOOGLE_STATIC_MAPS, GOOGLE_MAPS_API_KEY, PUBLIC_GOOGLE_MAPS_API_KEY) — skipping fetch.'
	);
	process.exit(0);
}

function buildUrl({ width, height, scale }) {
	const params = new URLSearchParams({
		center: `${LAT},${LNG}`,
		zoom: '14',
		size: `${width}x${height}`,
		scale: String(scale),
		maptype: 'roadmap',
		format: 'png',
		markers: `color:0x7a4a2a|${LAT},${LNG}`,
		key: KEY
	});
	return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

async function fetchOne(url, output) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Static Maps ${res.status}: ${await res.text()}`);
	const buf = Buffer.from(await res.arrayBuffer());
	await mkdir(dirname(output), { recursive: true });
	await writeFile(output, buf);
	console.log(`[fetch-static-map] ${(buf.length / 1024).toFixed(1)} kB → ${output}`);
}

try {
	// 1x at 640×360 (16:9) for typical contact-page panel size; 2x for retina.
	await fetchOne(buildUrl({ width: 640, height: 360, scale: 1 }), OUT_1X);
	await fetchOne(buildUrl({ width: 640, height: 360, scale: 2 }), OUT_2X);
} catch (err) {
	console.error(`[fetch-static-map] Failed: ${err instanceof Error ? err.message : err}`);
	console.error('[fetch-static-map] Build continues; existing PNG (if any) will be used.');
	process.exit(0);
}
