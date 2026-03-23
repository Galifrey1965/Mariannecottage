import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ cookies }) => {
	const authed = cookies.get('admin_session') === 'authenticated';
	return { authed };
};
