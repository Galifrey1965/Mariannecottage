import { redirect } from '@sveltejs/kit';
import { detectLocale, localePath } from '$lib/i18n';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ request }) => {
	// Root / should redirect to /en or /fr/de based on browser language
	const url = new URL(request.url);
	if (url.pathname === '/') {
		const acceptLanguage = request.headers.get('accept-language');
		const locale = detectLocale(acceptLanguage);
		throw redirect(307, localePath(locale, '/'));
	}
};
