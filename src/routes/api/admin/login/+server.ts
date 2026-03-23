import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple password auth — replace with Supabase Auth when keys are available
const ADMIN_PASSWORD = 'marianne2024';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { password } = await request.json();

	if (password === ADMIN_PASSWORD) {
		cookies.set('admin_session', 'authenticated', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 8 // 8 hours
		});
		return json({ success: true });
	}

	return json({ success: false, error: 'Invalid password' }, { status: 401 });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
	cookies.delete('admin_session', { path: '/' });
	return json({ success: true });
};
