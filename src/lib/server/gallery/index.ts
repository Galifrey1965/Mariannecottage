// Read helpers + types for the gallery — public-side and admin-side both
// consume these. Service-role admin lookups go through adminClient because
// even though RLS allows public SELECT, the admin pages serve preview-of-state
// (drafts, future seeded rows, etc.) and need to bypass any future RLS tweaks.

import { adminClient, anonClient } from '$lib/server/supabase';
import { imageUrls } from './storage';

export interface GalleryCategory {
	id: string;
	slug: string;
	label_en: string;
	label_fr: string;
	label_de: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface Room {
	id: string;
	slug: string;
	name_en: string;
	name_fr: string;
	name_de: string;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface GalleryImageRow {
	id: string;
	category_id: string;
	room_id: string | null;
	alt_en: string;
	alt_fr: string | null;
	alt_de: string | null;
	sort_order: number;
	original_filename: string | null;
	original_ext: string;
	width: number | null;
	height: number | null;
	created_at: string;
	updated_at: string;
}

export interface GalleryImage extends GalleryImageRow {
	urls: { original: string; full: string; thumb: string };
}

function withUrls(row: GalleryImageRow): GalleryImage {
	return { ...row, urls: imageUrls(row.id, row.original_ext, row.updated_at) };
}

export async function listCategories(): Promise<GalleryCategory[]> {
	const { data, error } = await anonClient
		.from('gallery_categories')
		.select('*')
		.order('sort_order', { ascending: true });
	if (error) throw error;
	return (data as GalleryCategory[] | null) ?? [];
}

export async function listRooms(): Promise<Room[]> {
	const { data, error } = await anonClient
		.from('rooms')
		.select('*')
		.order('sort_order', { ascending: true });
	if (error) throw error;
	return (data as Room[] | null) ?? [];
}

export async function listImages(): Promise<GalleryImage[]> {
	const { data, error } = await anonClient
		.from('gallery_images')
		.select('*')
		.order('sort_order', { ascending: true });
	if (error) throw error;
	return ((data as GalleryImageRow[] | null) ?? []).map(withUrls);
}

export async function listImagesAdmin(): Promise<GalleryImage[]> {
	const { data, error } = await adminClient
		.from('gallery_images')
		.select('*')
		.order('sort_order', { ascending: true });
	if (error) throw error;
	return ((data as GalleryImageRow[] | null) ?? []).map(withUrls);
}

export async function getImage(id: string): Promise<GalleryImage | null> {
	const { data, error } = await adminClient
		.from('gallery_images')
		.select('*')
		.eq('id', id)
		.maybeSingle();
	if (error) return null;
	const row = data as GalleryImageRow | null;
	return row ? withUrls(row) : null;
}

export interface PatchImageInput {
	categoryId?: string;
	roomId?: string | null;
	altEn?: string;
	altFr?: string | null;
	altDe?: string | null;
}

export async function patchImage(id: string, input: PatchImageInput): Promise<GalleryImage> {
	const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (input.categoryId !== undefined) patch.category_id = input.categoryId;
	if (input.roomId !== undefined) patch.room_id = input.roomId;
	if (input.altEn !== undefined) patch.alt_en = input.altEn.trim();
	if (input.altFr !== undefined) patch.alt_fr = input.altFr?.trim() || null;
	if (input.altDe !== undefined) patch.alt_de = input.altDe?.trim() || null;

	const { data, error } = await adminClient
		.from('gallery_images')
		.update(patch)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return withUrls(data as GalleryImageRow);
}

// Batch reorder. `order` is an array of { id, sort_order } pairs — we apply
// them in one round-trip via upsert on the primary key. Other columns are
// untouched because upsert with onConflict and a sparse object only updates
// the keys present.
export async function reorderImages(order: Array<{ id: string; sort_order: number }>): Promise<void> {
	if (order.length === 0) return;
	for (const { id, sort_order } of order) {
		const { error } = await adminClient
			.from('gallery_images')
			.update({ sort_order, updated_at: new Date().toISOString() })
			.eq('id', id);
		if (error) throw error;
	}
}

// Categories admin helpers.
export interface CategoryInput {
	slug: string;
	label_en: string;
	label_fr: string;
	label_de: string;
	sort_order?: number;
}

export async function createCategory(input: CategoryInput): Promise<GalleryCategory> {
	const { data, error } = await adminClient
		.from('gallery_categories')
		.insert({
			slug: input.slug,
			label_en: input.label_en,
			label_fr: input.label_fr,
			label_de: input.label_de,
			sort_order: input.sort_order ?? 0
		})
		.select()
		.single();
	if (error) throw error;
	return data as GalleryCategory;
}

export async function updateCategory(
	id: string,
	patch: Partial<CategoryInput>
): Promise<GalleryCategory> {
	const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (patch.slug !== undefined) update.slug = patch.slug;
	if (patch.label_en !== undefined) update.label_en = patch.label_en;
	if (patch.label_fr !== undefined) update.label_fr = patch.label_fr;
	if (patch.label_de !== undefined) update.label_de = patch.label_de;
	if (patch.sort_order !== undefined) update.sort_order = patch.sort_order;
	const { data, error } = await adminClient
		.from('gallery_categories')
		.update(update)
		.eq('id', id)
		.select()
		.single();
	if (error) throw error;
	return data as GalleryCategory;
}

export async function deleteCategory(id: string): Promise<void> {
	// gallery_images.category_id has ON DELETE RESTRICT — Postgres will refuse
	// the delete if any image still references the category. Surface a clean
	// error to the admin endpoint so it can return 409.
	const { error } = await adminClient.from('gallery_categories').delete().eq('id', id);
	if (error) throw error;
}

export async function countImagesInCategory(id: string): Promise<number> {
	const { count, error } = await adminClient
		.from('gallery_images')
		.select('id', { count: 'exact', head: true })
		.eq('category_id', id);
	if (error) throw error;
	return count ?? 0;
}
