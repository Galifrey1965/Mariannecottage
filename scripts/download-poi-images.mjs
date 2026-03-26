#!/usr/bin/env node
/**
 * POI Image Downloader
 * Downloads up to 10 open-license landscape images per POI from Wikimedia Commons.
 * Saves images to static/images/poi/{poi-id}/1.jpg, 2.jpg, ...
 * Writes attribution metadata to static/images/poi/{poi-id}/attribution.json
 * After completion, outputs updated `images` arrays to paste into src/lib/data/poi.ts
 *
 * Usage: node scripts/download-poi-images.mjs [poi-id]
 *   poi-id  (optional) — run for a single POI only, e.g. omaha-beach
 *
 * Requirements: Node 22+ (built-in fetch)
 */

import { createWriteStream, mkdirSync, existsSync } from 'node:fs';
import { writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATIC_DIR = join(ROOT, 'static', 'images', 'poi');
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const MAX_IMAGES = 10;
const MIN_WIDTH = 800; // skip portrait/tiny images

// Search terms per POI id — tune these if results are poor
const SEARCH_TERMS = {
	'omaha-beach': 'Omaha Beach Normandy D-Day',
	'american-cemetery': 'Normandy American Cemetery Colleville-sur-Mer',
	'pointe-du-hoc': 'Pointe du Hoc Normandy',
	'bayeux': 'Bayeux Cathedral Normandy tapestry',
	'arromanches': 'Arromanches Normandy artificial harbour D-Day',
	'memorial-caen': 'Mémorial Caen museum',
	'utah-beach': 'Utah Beach Normandy D-Day',
	'la-cambe': 'La Cambe German war cemetery Normandy',
	'overlord-museum': 'Overlord Museum Colleville-sur-Mer',
	'cerisy-abbey': 'Cerisy Abbey Normandy',
	'saint-lo': 'Saint-Lô Normandy town',
	'haras-national': 'Haras national Saint-Lô stud farm',
	'chateau-balleroy': 'Château Balleroy Normandy',
	'coutances': 'Coutances Cathedral Normandy',
	'carentan': 'Carentan Normandy town',
	'juno-beach': 'Juno Beach Centre Courseulles-sur-Mer',
	'lessay-abbey': 'Lessay Abbey Normandy Romanesque',
	'vire': 'Vire Normandy gorges town',
	'torigni-sur-vire': 'Torigni-sur-Vire château Normandy',
	'mont-saint-michel': 'Mont Saint-Michel'
};

async function commonsApi(params) {
	const url = new URL(COMMONS_API);
	url.search = new URLSearchParams({
		...params,
		format: 'json',
		origin: '*'
	}).toString();
	const res = await fetch(url.toString(), {
		headers: { 'User-Agent': 'MarianneCottage/1.0 (https://marrianecottage.netlify.app)' }
	});
	if (!res.ok) throw new Error(`Commons API error: ${res.status}`);
	return res.json();
}

async function searchImages(term) {
	const data = await commonsApi({
		action: 'query',
		list: 'search',
		srsearch: term,
		srnamespace: '6',
		srlimit: '30',
		srprop: 'snippet'
	});
	return (data.query?.search ?? []).map((r) => r.title);
}

async function getImageInfo(titles) {
	if (!titles.length) return [];
	const data = await commonsApi({
		action: 'query',
		prop: 'imageinfo',
		iiprop: 'url|extmetadata|dimensions|mime',
		titles: titles.join('|'),
		iiurlwidth: '1200'
	});
	const pages = Object.values(data.query?.pages ?? {});
	return pages
		.filter((p) => p.imageinfo?.length)
		.map((p) => {
			const info = p.imageinfo[0];
			const meta = info.extmetadata ?? {};
			return {
				title: p.title,
				url: info.thumburl || info.url,
				mime: info.mime,
				width: info.width,
				height: info.height,
				artist: meta.Artist?.value?.replace(/<[^>]+>/g, '') ?? 'Unknown',
				license: meta.LicenseShortName?.value ?? 'Unknown',
				description: meta.ImageDescription?.value?.replace(/<[^>]+>/g, '') ?? ''
			};
		});
}

function isUsable(img) {
	if (!img.url) return false;
	if (!['image/jpeg', 'image/png', 'image/webp'].includes(img.mime)) return false;
	// prefer landscape
	if (img.width < MIN_WIDTH) return false;
	if (img.height > img.width) return false;
	// skip if license unclear (be conservative)
	const lic = img.license.toLowerCase();
	if (lic.includes('non-commercial') || lic.includes('nc')) return false;
	return true;
}

async function downloadImage(url, destPath) {
	const res = await fetch(url, {
		headers: { 'User-Agent': 'MarianneCottage/1.0 (https://marrianecottage.netlify.app)' }
	});
	if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
	const dest = createWriteStream(destPath);
	await pipeline(Readable.fromWeb(res.body), dest);
}

async function processPoi(poiId, searchTerm) {
	console.log(`\n▶ ${poiId}`);
	const dir = join(STATIC_DIR, poiId);
	mkdirSync(dir, { recursive: true });

	// Search for candidate image titles
	const titles = await searchImages(searchTerm);
	if (!titles.length) {
		console.log(`  ⚠ No search results`);
		return [];
	}

	// Fetch image info in batches of 20 (API limit)
	const infos = [];
	for (let i = 0; i < titles.length; i += 20) {
		const batch = await getImageInfo(titles.slice(i, i + 20));
		infos.push(...batch);
	}

	const usable = infos.filter(isUsable).slice(0, MAX_IMAGES);
	if (!usable.length) {
		console.log(`  ⚠ No usable images found (${infos.length} candidates checked)`);
		return [];
	}

	const attribution = [];
	const imageEntries = [];
	let saved = 0;

	for (let i = 0; i < usable.length; i++) {
		const img = usable[i];
		const ext = img.mime === 'image/png' ? 'png' : 'jpg';
		const filename = `${i + 1}.${ext}`;
		const destPath = join(dir, filename);
		const srcPath = `/images/poi/${poiId}/${filename}`;

		try {
			await downloadImage(img.url, destPath);
			saved++;
			console.log(`  ✓ ${filename} — ${img.title}`);

			attribution.push({
				file: filename,
				source: img.title,
				artist: img.artist,
				license: img.license,
				url: `https://commons.wikimedia.org/wiki/${encodeURIComponent(img.title)}`
			});

			imageEntries.push({
				src: srcPath,
				alt: img.description || img.title.replace('File:', '').replace(/_/g, ' '),
				attribution: `${img.artist} / Wikimedia Commons / ${img.license}`
			});
		} catch (err) {
			console.log(`  ✗ ${filename} failed: ${err.message}`);
		}
	}

	await writeFile(
		join(dir, 'attribution.json'),
		JSON.stringify(attribution, null, 2)
	);

	console.log(`  → ${saved} images saved`);
	return imageEntries;
}

async function main() {
	const targetId = process.argv[2] ?? null;

	const entries = Object.entries(SEARCH_TERMS).filter(
		([id]) => !targetId || id === targetId
	);

	if (targetId && !entries.length) {
		console.error(`Unknown POI id: ${targetId}`);
		console.error(`Valid ids: ${Object.keys(SEARCH_TERMS).join(', ')}`);
		process.exit(1);
	}

	mkdirSync(STATIC_DIR, { recursive: true });

	const results = {};
	for (const [poiId, term] of entries) {
		results[poiId] = await processPoi(poiId, term);
	}

	// Output updated images arrays for copy-paste into poi.ts
	console.log('\n\n══════════════════════════════════════════════');
	console.log('  Copy-paste the following into src/lib/data/poi.ts');
	console.log('  Replace each `images: []` with the array below');
	console.log('══════════════════════════════════════════════\n');

	for (const [poiId, images] of Object.entries(results)) {
		if (images.length) {
			console.log(`// ${poiId}`);
			console.log(`images: ${JSON.stringify(images, null, 2)},\n`);
		}
	}

	console.log('\nDone.');
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
