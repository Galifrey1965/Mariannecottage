import type { PageServerLoad } from './$types';
import {
	listImages,
	listCategories,
	listRooms,
	type GalleryImage,
	type GalleryCategory,
	type Room
} from '$lib/server/gallery';

type Locale = 'en' | 'fr' | 'de';

function pickCategoryLabel(cat: GalleryCategory, lang: Locale): string {
	switch (lang) {
		case 'fr': return cat.label_fr || cat.label_en;
		case 'de': return cat.label_de || cat.label_en;
		default:   return cat.label_en;
	}
}

function pickRoomLabel(room: Room, lang: Locale): string {
	switch (lang) {
		case 'fr': return room.name_fr || room.name_en;
		case 'de': return room.name_de || room.name_en;
		default:   return room.name_en;
	}
}

function pickAlt(img: GalleryImage, lang: Locale): string {
	switch (lang) {
		case 'fr': return img.alt_fr || img.alt_en;
		case 'de': return img.alt_de || img.alt_en;
		default:   return img.alt_en;
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const lang = (locals.lang ?? 'en') as Locale;

	const [rawImages, rawCategories, rawRooms] = await Promise.all([
		listImages(),
		listCategories(),
		listRooms()
	]);

	// Hide empty categories from the filter bar so visitors don't see
	// "Bathroom (0)" while Mark hasn't uploaded any. Also hide the generic
	// 'rooms' category — its photos are surfaced via the per-room chips
	// below instead, so a separate Rooms chip would just duplicate them.
	const usedCategoryIds = new Set(rawImages.map((i) => i.category_id));
	const categories = rawCategories
		.filter((c) => usedCategoryIds.has(c.id) && c.slug !== 'rooms')
		.map((c) => ({ slug: c.slug, label: pickCategoryLabel(c, lang) }));

	// Per-room chips: one per room that has at least one photo. Each room
	// is a sellable unit, so visitors get to drill into a specific
	// bedroom rather than seeing all room photos lumped together.
	const usedRoomIds = new Set(
		rawImages.filter((i) => i.room_id).map((i) => i.room_id as string)
	);
	const rooms = rawRooms
		.filter((r) => usedRoomIds.has(r.id))
		.map((r) => ({ slug: r.slug, label: pickRoomLabel(r, lang) }));

	const categorySlugById = new Map(rawCategories.map((c) => [c.id, c.slug]));
	const roomSlugById = new Map(rawRooms.map((r) => [r.id, r.slug]));

	const images = rawImages.map((img) => ({
		thumb: img.urls.thumb,
		full: img.urls.full,
		alt: pickAlt(img, lang),
		category_slug: categorySlugById.get(img.category_id) ?? 'unknown',
		room_slug: img.room_id ? (roomSlugById.get(img.room_id) ?? null) : null
	}));

	return { images, categories, rooms };
};
