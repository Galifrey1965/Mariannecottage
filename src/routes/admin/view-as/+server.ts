import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setViewAsCookie } from '$lib/server/view-as';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!locals.profile || locals.profile.role !== 'developer') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const formData = await request.formData();
	const targetUserId = String(formData.get('target_user_id') ?? '').trim();

	setViewAsCookie(cookies, targetUserId || null);
	throw redirect(303, '/admin');
};
