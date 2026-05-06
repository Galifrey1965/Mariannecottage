// Image upload pipeline.
//
// Steps:
//   1. Validate mime + size (extra defence; bucket already enforces but we
//      give a friendly error before reading the body).
//   2. Run sharp on the source bytes to extract metadata + produce two
//      derived variants (full @ 2000px wide WebP q80, thumb @ 400px wide
//      WebP q75). Auto-rotate by EXIF so phone-portrait shots come out
//      upright. Strip metadata to keep file size tight.
//   3. Generate the row id up front (UUID v4) — Storage object keys are
//      derived from it, so we need it before writing any object.
//   4. Push originals/<id>.<ext>, full/<id>.webp, thumbs/<id>.webp.
//   5. Insert the gallery_images row.
//
// Errors mid-flight: best-effort cleanup of any objects already written.

import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { adminClient } from '$lib/server/supabase';
import { putObject, deleteObjects, objectKey } from './storage';

const FULL_MAX_WIDTH = 2000;
const FULL_QUALITY = 80;
const THUMB_MAX_WIDTH = 400;
const THUMB_QUALITY = 75;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface UploadInput {
	bytes: Buffer;
	mimeType: string;
	originalFilename: string | null;
	categoryId: string;
	roomId: string | null;
	altEn: string;
	altFr: string | null;
	altDe: string | null;
}

export interface UploadResult {
	id: string;
	width: number;
	height: number;
	originalExt: string;
}

function extFromMime(mime: string): string {
	if (mime === 'image/jpeg') return 'jpg';
	if (mime === 'image/png') return 'png';
	if (mime === 'image/webp') return 'webp';
	throw new Error(`unsupported mime: ${mime}`);
}

export async function uploadGalleryImage(input: UploadInput): Promise<UploadResult> {
	if (input.bytes.length === 0) throw new Error('empty file');
	if (input.bytes.length > MAX_BYTES) throw new Error(`file too large (max ${MAX_BYTES} bytes)`);
	if (!ALLOWED_MIME.has(input.mimeType)) throw new Error(`unsupported mime: ${input.mimeType}`);
	if (!input.altEn.trim()) throw new Error('alt_en required');
	if (!input.categoryId) throw new Error('category_id required');

	const id = randomUUID();
	const originalExt = extFromMime(input.mimeType);

	// Use a single sharp pipeline per derivative (Buffer in → Buffer out).
	// rotate() applies EXIF orientation so a phone-portrait JPEG comes out
	// upright; calling without args reads the orientation tag.
	// withMetadata() defaults are stripped — slimmer files.
	const base = () => sharp(input.bytes, { failOn: 'truncated' }).rotate();

	const meta = await base().metadata();
	const width = meta.width ?? 0;
	const height = meta.height ?? 0;
	if (!width || !height) throw new Error('could not read image dimensions');

	const fullBuffer = await base()
		.resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: FULL_QUALITY })
		.toBuffer();

	const thumbBuffer = await base()
		.resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: THUMB_QUALITY })
		.toBuffer();

	const writtenKeys: string[] = [];
	const cleanup = async () => deleteObjects(writtenKeys);

	try {
		const originalKey = objectKey('original', id, originalExt);
		await putObject(originalKey, input.bytes, { contentType: input.mimeType });
		writtenKeys.push(originalKey);

		const fullKey = objectKey('full', id, 'webp');
		await putObject(fullKey, fullBuffer, { contentType: 'image/webp' });
		writtenKeys.push(fullKey);

		const thumbKey = objectKey('thumb', id, 'webp');
		await putObject(thumbKey, thumbBuffer, { contentType: 'image/webp' });
		writtenKeys.push(thumbKey);

		// sort_order: append at the end of the chosen category. Mark can
		// drag-reorder afterwards.
		const { data: maxRow } = await adminClient
			.from('gallery_images')
			.select('sort_order')
			.eq('category_id', input.categoryId)
			.order('sort_order', { ascending: false })
			.limit(1)
			.maybeSingle();
		const nextSort = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 10;

		const { error } = await adminClient.from('gallery_images').insert({
			id,
			category_id: input.categoryId,
			room_id: input.roomId,
			alt_en: input.altEn.trim(),
			alt_fr: input.altFr?.trim() || null,
			alt_de: input.altDe?.trim() || null,
			sort_order: nextSort,
			original_filename: input.originalFilename,
			original_ext: originalExt,
			width,
			height
		});

		if (error) throw new Error(`db insert failed: ${error.message}`);

		return { id, width, height, originalExt };
	} catch (err) {
		await cleanup();
		throw err;
	}
}

// Replace the file backing an existing row. Keeps the same id, so cached
// browser fetches refresh via the row's bumped updated_at.
export async function replaceGalleryImageFile(
	id: string,
	bytes: Buffer,
	mimeType: string,
	originalFilename: string | null
): Promise<{ originalExt: string; width: number; height: number }> {
	if (!ALLOWED_MIME.has(mimeType)) throw new Error(`unsupported mime: ${mimeType}`);
	if (bytes.length > MAX_BYTES) throw new Error('file too large');

	const { data: row, error: readErr } = await adminClient
		.from('gallery_images')
		.select('id, original_ext')
		.eq('id', id)
		.single();
	if (readErr || !row) throw new Error('row not found');

	const newExt = extFromMime(mimeType);
	const oldExt = (row as { original_ext: string }).original_ext;

	// If the extension changed, the old original key has a stale path. Delete it.
	if (oldExt !== newExt) {
		await deleteObjects([objectKey('original', id, oldExt)]);
	}

	const base = () => sharp(bytes, { failOn: 'truncated' }).rotate();
	const meta = await base().metadata();
	const width = meta.width ?? 0;
	const height = meta.height ?? 0;

	const fullBuffer = await base()
		.resize({ width: FULL_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: FULL_QUALITY })
		.toBuffer();
	const thumbBuffer = await base()
		.resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: THUMB_QUALITY })
		.toBuffer();

	await putObject(objectKey('original', id, newExt), bytes, {
		contentType: mimeType,
		upsert: true
	});
	await putObject(objectKey('full', id, 'webp'), fullBuffer, {
		contentType: 'image/webp',
		upsert: true
	});
	await putObject(objectKey('thumb', id, 'webp'), thumbBuffer, {
		contentType: 'image/webp',
		upsert: true
	});

	const { error: updErr } = await adminClient
		.from('gallery_images')
		.update({
			original_filename: originalFilename,
			original_ext: newExt,
			width,
			height,
			updated_at: new Date().toISOString()
		})
		.eq('id', id);

	if (updErr) throw new Error(`db update failed: ${updErr.message}`);

	return { originalExt: newExt, width, height };
}

export async function deleteGalleryImage(id: string): Promise<void> {
	const { data: row, error: readErr } = await adminClient
		.from('gallery_images')
		.select('id, original_ext')
		.eq('id', id)
		.single();
	if (readErr || !row) throw new Error('row not found');

	const ext = (row as { original_ext: string }).original_ext;
	await deleteObjects([
		objectKey('original', id, ext),
		objectKey('full', id, 'webp'),
		objectKey('thumb', id, 'webp')
	]);

	const { error: delErr } = await adminClient.from('gallery_images').delete().eq('id', id);
	if (delErr) throw new Error(`db delete failed: ${delErr.message}`);
}
