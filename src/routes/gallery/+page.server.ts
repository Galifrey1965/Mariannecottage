import type { PageServerLoad } from './$types';
import { listImages, listCategories, type GalleryImage, type GalleryCategory } from '$lib/server/gallery';

type Locale = 'en' | 'fr' | 'de';

function pickLabel(cat: GalleryCategory, lang: Locale): string {
	switch (lang) {
		case 'fr': return cat.label_fr || cat.label_en;
		case 'de': return cat.label_de || cat.label_en;
		default:   return cat.label_en;
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

	const [rawImages, rawCategories] = await Promise.all([listImages(), listCategories()]);

	// Suppress empty categories from the filter bar — visitors shouldn't see
	// "Bathroom (0)" if Mark hasn't uploaded any bathroom shots yet.
	const usedCategoryIds = new Set(rawImages.map((i) => i.category_id));
	const categories = rawCategories
		.filter((c) => usedCategoryIds.has(c.id))
		.map((c) => ({ slug: c.slug, label: pickLabel(c, lang) }));

	const slugById = new Map(rawCategories.map((c) => [c.id, c.slug]));

	const images = rawImages.map((img) => ({
		thumb: img.urls.thumb,
		full: img.urls.full,
		alt: pickAlt(img, lang),
		category_slug: slugById.get(img.category_id) ?? 'unknown'
	}));

	return { images, categories };
};
