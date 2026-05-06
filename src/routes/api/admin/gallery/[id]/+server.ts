// Admin gallery row update / delete / replace-file.
//
// GET    → single row
// PATCH  → JSON body { category_id?, room_id?, alt_en?, alt_fr?, alt_de? }
// PUT    → multipart with `file` to replace the image bytes (keeps the row id
//          and metadata otherwise; bumps updated_at to bust caches)
// DELETE → removes Storage objects + row

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getImage, patchImage } from '$lib/server/gallery';
import { replaceGalleryImageFile, deleteGalleryImage } from '$lib/server/gallery/upload';
import { logAdminEvent } from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return unauthorized();
	const image = await getImage(params.id!);
	if (!image) return json({ error: 'not found' }, { status: 404 });
	return json({ image });
};

export const PATCH: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;

	try {
		const image = await patchImage(params.id!, {
			categoryId: body.category_id !== undefined ? String(body.category_id) : undefined,
			roomId:
				body.room_id !== undefined
					? body.room_id === null || body.room_id === ''
						? null
						: String(body.room_id)
					: undefined,
			altEn: body.alt_en !== undefined ? String(body.alt_en) : undefined,
			altFr:
				body.alt_fr !== undefined
					? body.alt_fr === null
						? null
						: String(body.alt_fr)
					: undefined,
			altDe:
				body.alt_de !== undefined
					? body.alt_de === null
						? null
						: String(body.alt_de)
					: undefined
		});
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_image.update',
			target_type: 'gallery_image',
			target_id: params.id!,
			metadata: { fields: Object.keys(body) }
		});
		return json({ success: true, image });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'update failed';
		return json({ error: message }, { status: 400 });
	}
};

export const PUT: RequestHandler = async ({ locals, request, params }) => {
	if (!locals.user) return unauthorized();

	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'file is required' }, { status: 400 });
	}

	const bytes = Buffer.from(await file.arrayBuffer());

	try {
		const result = await replaceGalleryImageFile(
			params.id!,
			bytes,
			file.type,
			file.name || null
		);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_image.replace_file',
			target_type: 'gallery_image',
			target_id: params.id!,
			metadata: { original_filename: file.name || null }
		});
		return json({ success: true, ...result });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'replace failed';
		return json({ error: message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) return unauthorized();
	try {
		await deleteGalleryImage(params.id!);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_image.delete',
			target_type: 'gallery_image',
			target_id: params.id!,
			metadata: {}
		});
		return json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'delete failed';
		return json({ error: message }, { status: 400 });
	}
};
