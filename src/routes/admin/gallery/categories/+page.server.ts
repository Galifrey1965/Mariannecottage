import type { PageServerLoad } from './$types';
import { listCategories } from '$lib/server/gallery';
import { adminClient } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const categories = await listCategories();
	const { data: rows } = await adminClient.from('gallery_images').select('category_id');
	const counts = new Map<string, number>();
	for (const r of (rows ?? []) as Array<{ category_id: string }>) {
		counts.set(r.category_id, (counts.get(r.category_id) ?? 0) + 1);
	}
	return {
		categories: categories.map((c) => ({ ...c, image_count: counts.get(c.id) ?? 0 }))
	};
};
