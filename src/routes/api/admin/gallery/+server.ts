// Admin gallery list + create.
//
// GET  → list all images, all categories, all rooms (one round-trip for the
//        admin grid). Service-role under the hood; auth-gated.
// POST → multipart upload of a new image. Form fields:
//          file        — File (required)
//          category_id — UUID (required)
//          room_id     — UUID or '' (optional)
//          alt_en      — string (required)
//          alt_fr      — string or '' (optional, auto-translated client-side)
//          alt_de      — string or '' (optional)

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listImagesAdmin, listCategories, listRooms } from '$lib/server/gallery';
import { uploadGalleryImage } from '$lib/server/gallery/upload';
import { logAdminEvent } from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return unauthorized();
	const [images, categories, rooms] = await Promise.all([
		listImagesAdmin(),
		listCategories(),
		listRooms()
	]);
	return json({ images, categories, rooms });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();

	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'file is required' }, { status: 400 });
	}

	const categoryId = String(form.get('category_id') ?? '');
	const roomIdRaw = form.get('room_id');
	const roomId = roomIdRaw && String(roomIdRaw) !== '' ? String(roomIdRaw) : null;
	const altEn = String(form.get('alt_en') ?? '');
	const altFr = form.get('alt_fr') ? String(form.get('alt_fr')) : null;
	const altDe = form.get('alt_de') ? String(form.get('alt_de')) : null;

	if (!categoryId) return json({ error: 'category_id is required' }, { status: 400 });
	if (!altEn.trim()) return json({ error: 'alt_en is required' }, { status: 400 });

	const bytes = Buffer.from(await file.arrayBuffer());

	try {
		const result = await uploadGalleryImage({
			bytes,
			mimeType: file.type,
			originalFilename: file.name || null,
			categoryId,
			roomId,
			altEn,
			altFr,
			altDe
		});
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_image.create',
			target_type: 'gallery_image',
			target_id: result.id,
			metadata: {
				category_id: categoryId,
				room_id: roomId,
				original_filename: file.name || null
			}
		});
		return json({ success: true, image: result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'upload failed';
		return json({ error: message }, { status: 400 });
	}
};
