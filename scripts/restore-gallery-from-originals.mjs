// Disaster-recovery script.
//
// Reads every row in `gallery_images`, locates the corresponding source file
// in `images/originals/<original_filename>`, re-uploads to Supabase Storage,
// regenerates the full + thumb WebP variants. Idempotent — safe to run if
// some objects already exist (uses upsert).
//
// Usage:
//   node --env-file=.env scripts/restore-gallery-from-originals.mjs           # dry run
//   node --env-file=.env scripts/restore-gallery-from-originals.mjs --apply   # actually upload
//
// Required env:
//   PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ORIGINALS_DIR = path.join(REPO_ROOT, 'images', 'originals');

const apply = process.argv.includes('--apply');

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
	console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
	process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey);
const BUCKET = 'gallery';

const FULL_MAX_WIDTH = 2000;
const FULL_QUALITY = 80;
const THUMB_MAX_WIDTH = 400;
const THUMB_QUALITY = 75;

function mimeFromExt(ext) {
	const e = ext.toLowerCase().replace(/^\./, '');
	if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
	if (e === 'png') return 'image/png';
	if (e === 'webp') return 'image/webp';
	return 'application/octet-stream';
}

async function processOne(row) {
	if (!row.original_filename) {
		return { id: row.id, status: 'skip', reason: 'no original_filename' };
	}
	const sourcePath = path.join(ORIGINALS_DIR, row.original_filename);
	let bytes;
	try {
		bytes = await readFile(sourcePath);
	} catch {
		return { id: row.id, status: 'missing', reason: sourcePath };
	}

	const ext = (row.original_ext || 'jpg').toLowerCase();
	const mime = mimeFromExt(ext);

	const base = () => sharp(bytes, { failOn: 'truncated' }).rotate();
	const full = await base()
		.resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: FULL_QUALITY })
		.toBuffer();
	const thumb = await base()
		.resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: THUMB_QUALITY })
		.toBuffer();

	if (!apply) {
		return { id: row.id, status: 'dry-run', original_bytes: bytes.length, full_bytes: full.length, thumb_bytes: thumb.length };
	}

	const writes = [
		[`originals/${row.id}.${ext}`, bytes, mime],
		[`full/${row.id}.webp`, full, 'image/webp'],
		[`thumbs/${row.id}.webp`, thumb, 'image/webp']
	];

	for (const [key, body, contentType] of writes) {
		const { error } = await client.storage
			.from(BUCKET)
			.upload(key, body, { contentType, cacheControl: '31536000', upsert: true });
		if (error) return { id: row.id, status: 'fail', key, reason: error.message };
	}
	return { id: row.id, status: 'restored' };
}

async function main() {
	console.log(`[restore-gallery] mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
	console.log(`[restore-gallery] originals dir: ${ORIGINALS_DIR}`);

	const { data, error } = await client.from('gallery_images').select('id, original_filename, original_ext');
	if (error) throw error;
	const rows = data ?? [];
	console.log(`[restore-gallery] ${rows.length} rows in gallery_images`);

	const results = { restored: 0, 'dry-run': 0, missing: 0, skip: 0, fail: 0 };
	for (const row of rows) {
		const r = await processOne(row);
		results[r.status] = (results[r.status] ?? 0) + 1;
		if (r.status === 'missing' || r.status === 'fail') {
			console.warn(`[${r.status}] ${r.id}  ${r.reason}`);
		} else {
			console.log(`[${r.status}] ${r.id}`);
		}
	}

	console.log('');
	console.log('[restore-gallery] summary:', results);
	if (!apply) {
		console.log('[restore-gallery] dry run only — pass --apply to actually upload.');
	}
}

main().catch((err) => {
	console.error('[restore-gallery] fatal:', err);
	process.exit(1);
});
