// Admin gallery category CRUD.
//
// GET    → list (also returns image_count per category for the admin UI)
// POST   → create  { slug, label_en, label_fr, label_de, sort_order? }
// PATCH  → update  { id, ...partial }
// DELETE → delete  { id }  — fails if any image still references it

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	countImagesInCategory
} from '$lib/server/gallery';
import { adminClient, logAdminEvent } from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return unauthorized();
	const categories = await listCategories();
	// Counts in one round-trip: group by category_id over gallery_images.
	const { data: countRows } = await adminClient
		.from('gallery_images')
		.select('category_id');
	const counts = new Map<string, number>();
	for (const row of (countRows ?? []) as Array<{ category_id: string }>) {
		counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
	}
	return json({
		categories: categories.map((c) => ({ ...c, image_count: counts.get(c.id) ?? 0 }))
	});
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const slug = String(body.slug ?? '').trim();
	const label_en = String(body.label_en ?? '').trim();
	const label_fr = String(body.label_fr ?? '').trim();
	const label_de = String(body.label_de ?? '').trim();
	if (!slug || !label_en || !label_fr || !label_de) {
		return json({ error: 'slug, label_en, label_fr, label_de all required' }, { status: 400 });
	}
	try {
		const category = await createCategory({
			slug,
			label_en,
			label_fr,
			label_de,
			sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0
		});
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_category.create',
			target_type: 'gallery_category',
			target_id: category.id,
			metadata: { slug }
		});
		return json({ success: true, category });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'create failed' }, { status: 400 });
	}
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const id = String(body.id ?? '');
	if (!id) return json({ error: 'id required' }, { status: 400 });
	try {
		const category = await updateCategory(id, {
			slug: body.slug !== undefined ? String(body.slug) : undefined,
			label_en: body.label_en !== undefined ? String(body.label_en) : undefined,
			label_fr: body.label_fr !== undefined ? String(body.label_fr) : undefined,
			label_de: body.label_de !== undefined ? String(body.label_de) : undefined,
			sort_order: typeof body.sort_order === 'number' ? body.sort_order : undefined
		});
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_category.update',
			target_type: 'gallery_category',
			target_id: id,
			metadata: { fields: Object.keys(body).filter((k) => k !== 'id') }
		});
		return json({ success: true, category });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'update failed' }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = String(body.id ?? '');
	if (!id) return json({ error: 'id required' }, { status: 400 });

	const count = await countImagesInCategory(id);
	if (count > 0) {
		return json(
			{ error: `category still has ${count} image(s); reassign or delete them first` },
			{ status: 409 }
		);
	}

	try {
		await deleteCategory(id);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_category.delete',
			target_type: 'gallery_category',
			target_id: id,
			metadata: {}
		});
		return json({ success: true });
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : 'delete failed' }, { status: 400 });
	}
};
