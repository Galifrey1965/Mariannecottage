import type { PageServerLoad } from './$types';
import { listImagesAdmin, listCategories, listRooms } from '$lib/server/gallery';

export const load: PageServerLoad = async () => {
	const [images, categories, rooms] = await Promise.all([
		listImagesAdmin(),
		listCategories(),
		listRooms()
	]);
	return { images, categories, rooms };
};
