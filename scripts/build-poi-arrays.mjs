// One-off: builds poi.ts `images` arrays from already-downloaded
// attribution.json files. Alt text is derived from the Commons file
// title (strip prefix/extension, swap underscores for spaces).
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STATIC_DIR = join(ROOT, 'static', 'images', 'poi');

const targets = process.argv.slice(2);
if (!targets.length) {
	console.error('usage: build-poi-arrays.mjs <poi-id> [<poi-id> ...]');
	process.exit(1);
}

function altFromSource(source) {
	return source
		.replace(/^File:/, '')
		.replace(/\.[a-z]+$/i, '')
		.replace(/[_-]+/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/\s*\(\d+\)\s*$/, '')
		.trim();
}

function escapeSingle(s) {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

for (const id of targets) {
	const dir = join(STATIC_DIR, id);
	const attribPath = join(dir, 'attribution.json');
	const raw = await readFile(attribPath, 'utf8');
	const list = JSON.parse(raw);
	const lines = list.map((e) => {
		const src = `/images/poi/${id}/${e.file}`;
		const alt = escapeSingle(altFromSource(e.source));
		const attribution = escapeSingle(`${e.artist} / Wikimedia Commons / ${e.license}`);
		return `\t\t\t\t{ src: '${src}', alt: '${alt}', attribution: '${attribution}' }`;
	});
	console.log(`// ${id}`);
	console.log(`\t\t\timages: [\n${lines.join(',\n')}\n\t\t\t],`);
	console.log();
}
