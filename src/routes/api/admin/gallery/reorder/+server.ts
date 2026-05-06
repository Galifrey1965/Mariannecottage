// Batch reorder of gallery images.
//
// POST body: { order: [{ id, sort_order }, ...] }

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reorderImages } from '$lib/server/gallery';
import { logAdminEvent } from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as { order?: Array<{ id: string; sort_order: number }> };
	const order = body.order ?? [];
	if (!Array.isArray(order) || order.length === 0) {
		return json({ error: 'order array required' }, { status: 400 });
	}

	for (const entry of order) {
		if (!entry.id || typeof entry.sort_order !== 'number') {
			return json({ error: 'each entry must be { id, sort_order: number }' }, { status: 400 });
		}
	}

	try {
		await reorderImages(order);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'gallery_image.reorder',
			target_type: 'gallery_image',
			target_id: null,
			metadata: { count: order.length }
		});
		return json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'reorder failed';
		return json({ error: message }, { status: 400 });
	}
};
