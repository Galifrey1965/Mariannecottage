// Process design/logo-source.png:
//  1. Remove the cream/white background (alpha → 0 for near-white pixels).
//  2. Preserve anti-aliased edges with partial alpha (no jagged outlines).
//  3. Emit transparent PNGs at 1x and 2x for the website.
//  4. Also emit an email-friendly variant on a cream background.
// Re-run with `node scripts/process-logo.mjs`.
import sharp from 'sharp';
import { resolve } from 'node:path';

const SRC = resolve('design/logo-source.png');
const OUT_PNG = resolve('static/images/logo.png');
const OUT_PNG_2X = resolve('static/images/logo@2x.png');
const OUT_EMAIL = resolve('static/images/logo-email.png');

// Tuning: anything brighter than UPPER (luma 0–255) is fully transparent;
// anything darker than LOWER is fully opaque ink; in between gets a smooth
// alpha ramp so anti-aliased stroke edges survive without halos.
const UPPER = 235;
const LOWER = 150;

async function stripBackground(srcBuffer) {
	const img = sharp(srcBuffer).ensureAlpha();
	const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
	const out = Buffer.from(data);
	for (let i = 0; i < out.length; i += 4) {
		const r = out[i];
		const g = out[i + 1];
		const b = out[i + 2];
		const luma = 0.299 * r + 0.587 * g + 0.114 * b;
		if (luma >= UPPER) {
			out[i + 3] = 0;
		} else if (luma <= LOWER) {
			// keep ink pixel as-is
		} else {
			const t = (UPPER - luma) / (UPPER - LOWER);
			out[i + 3] = Math.round(255 * t);
		}
	}
	return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
}

const srcBuffer = await sharp(SRC).toBuffer();
const meta = await sharp(SRC).metadata();
console.log(`source: ${meta.width}×${meta.height}`);

const transparent = await stripBackground(srcBuffer);
const transparentBuffer = await transparent.png().toBuffer();

// 1x — fits header at any reasonable size
await sharp(transparentBuffer).resize({ width: 280, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(OUT_PNG);
console.log(`✓ ${OUT_PNG}`);

// 2x — for retina displays
await sharp(transparentBuffer).resize({ width: 560, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(OUT_PNG_2X);
console.log(`✓ ${OUT_PNG_2X}`);

// Email variant: composite onto cream background so it works in clients that
// force their own (often dark) background colour.
await sharp(transparentBuffer)
	.resize({ width: 480, withoutEnlargement: true })
	.flatten({ background: '#f5f1ea' })
	.png({ compressionLevel: 9 })
	.toFile(OUT_EMAIL);
console.log(`✓ ${OUT_EMAIL}`);
