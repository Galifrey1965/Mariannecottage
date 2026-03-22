import { error } from '@sveltejs/kit';
import { isValidLocale, type Locale } from '$lib/i18n';
import * as enMessages from '../../../messages/en.json';
import * as frMessages from '../../../messages/fr.json';
import * as deMessages from '../../../messages/de.json';
import type { LayoutServerLoad } from './$types';

const messages: Record<Locale, typeof enMessages> = {
	en: enMessages,
	fr: frMessages,
	de: deMessages
};

export const load: LayoutServerLoad = ({ params }) => {
	const { lang } = params;

	if (!isValidLocale(lang)) {
		throw error(404, 'Not found');
	}

	return {
		lang,
		messages: messages[lang]
	};
};
