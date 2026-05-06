// Supabase Storage wrappers for the gallery bucket.
//
// Object key layout (flat by row UUID):
//   originals/<id>.<ext>   — source upload, kept as backup / re-derive source
//   full/<id>.webp         — display size for the lightbox
//   thumbs/<id>.webp       — small size for the grid
//
// Public read is granted by `bucket.public = true`; service role bypasses RLS
// for writes. Cache-control is set per-object to 1 year immutable; cache-bust
// is handled by appending ?v=<updated_at> in the URL builders below.

import { adminClient } from '$lib/server/supabase';
import { env as publicEnv } from '$env/dynamic/public';

export const BUCKET = 'gallery';
export const VARIANT_PATHS = {
	original: 'originals',
	full: 'full',
	thumb: 'thumbs'
} as const;

export type Variant = keyof typeof VARIANT_PATHS;

export interface PutOptions {
	contentType: string;
	upsert?: boolean;
}

const CACHE_CONTROL = '31536000'; // 1 year, see VARIANT_URL ?v= for bust

export function objectKey(variant: Variant, id: string, ext: string): string {
	const safeExt = ext.replace(/^\./, '').toLowerCase();
	return `${VARIANT_PATHS[variant]}/${id}.${safeExt}`;
}

export async function putObject(
	key: string,
	body: Buffer | Uint8Array,
	opts: PutOptions
): Promise<void> {
	const { error } = await adminClient.storage.from(BUCKET).upload(key, body, {
		contentType: opts.contentType,
		cacheControl: CACHE_CONTROL,
		upsert: opts.upsert ?? true
	});
	if (error) throw new Error(`storage put failed for ${key}: ${error.message}`);
}

export async function deleteObjects(keys: string[]): Promise<void> {
	if (keys.length === 0) return;
	const { error } = await adminClient.storage.from(BUCKET).remove(keys);
	if (error) {
		// Storage delete is idempotent for missing keys; log non-404 errors.
		console.error('[gallery storage] delete failed:', error.message, keys);
	}
}

// Build the public CDN URL for a stored object. We append ?v= so the browser
// refetches when the row's updated_at changes (cache-bust on replace).
export function publicUrl(variant: Variant, id: string, ext: string, updatedAt?: string): string {
	const base = publicEnv.PUBLIC_SUPABASE_URL?.replace(/\/$/, '') ?? '';
	const key = objectKey(variant, id, ext);
	const v = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : '';
	return `${base}/storage/v1/object/public/${BUCKET}/${key}${v}`;
}

// Convenience: all three variant URLs for a row, with cache-bust applied.
export function imageUrls(
	id: string,
	originalExt: string,
	updatedAt?: string
): { original: string; full: string; thumb: string } {
	return {
		original: publicUrl('original', id, originalExt, updatedAt),
		full: publicUrl('full', id, 'webp', updatedAt),
		thumb: publicUrl('thumb', id, 'webp', updatedAt)
	};
}
