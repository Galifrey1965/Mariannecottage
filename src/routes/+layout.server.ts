import { detectLocale, isValidLocale } from '$lib/i18n';
import * as en from '../../messages/en.json';
import * as fr from '../../messages/fr.json';
import * as de from '../../messages/de.json';
import type { LayoutServerLoad } from './$types';

const COOKIE = 'marianne_locale';
const allMessages = { en, fr, de };

export const load: LayoutServerLoad = ({ request, cookies }) => {
	const cookie = cookies.get(COOKIE);
	const lang = isValidLocale(cookie)
		? cookie
		: detectLocale(request.headers.get('accept-language'));

	return { lang, messages: allMessages[lang] };
};
