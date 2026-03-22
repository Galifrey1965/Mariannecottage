export type Locale = 'en' | 'fr' | 'de';

export const LOCALES: Locale[] = ['en', 'fr', 'de'];
export const DEFAULT_LOCALE: Locale = 'en';

export type Messages = Record<string, unknown>;

/**
 * Get translation from nested object using dot notation
 * @example t(messages, 'home.hero.title', { name: 'John' })
 */
export function t(messages: Messages, key: string, params?: Record<string, string>): string {
	const keys = key.split('.');
	let value: unknown = messages;

	for (const k of keys) {
		if (typeof value === 'object' && value !== null && k in value) {
			value = (value as Record<string, unknown>)[k];
		} else {
			return key; // Fallback to key if translation not found
		}
	}

	let result = typeof value === 'string' ? value : key;

	// Simple interpolation: replace {param} with values
	if (params) {
		for (const [key, val] of Object.entries(params)) {
			result = result.replace(`{${key}}`, val);
		}
	}

	return result;
}

/**
 * Build a localized path with language prefix
 * @example localePath('fr', '/rooms') => '/fr/rooms'
 */
export function localePath(locale: Locale, path: string): string {
	if (path === '/') {
		return `/${locale}`;
	}
	return `/${locale}${path}`;
}

/**
 * Parse Accept-Language header and return best matching locale
 */
export function detectLocale(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) return DEFAULT_LOCALE;

	const preferred = acceptLanguage
		.split(',')
		.map(lang => lang.split(';')[0].trim().toLowerCase())
		.find(lang => LOCALES.some(l => lang.startsWith(l)));

	return (preferred as Locale) || DEFAULT_LOCALE;
}

/**
 * Validate that locale is one of the allowed locales
 */
export function isValidLocale(locale: unknown): locale is Locale {
	return typeof locale === 'string' && LOCALES.includes(locale as Locale);
}
