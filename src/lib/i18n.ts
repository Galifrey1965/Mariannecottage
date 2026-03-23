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
 * Identity function — no longer builds language-prefixed paths
 * @example localePath('fr', '/rooms') => '/rooms'
 */
export function localePath(_locale: Locale, path: string): string {
	return path;
}

/**
 * Parse Accept-Language header and return best matching locale
 */
export function detectLocale(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) return DEFAULT_LOCALE;

	const preferred = acceptLanguage
		.split(',')
		.map(lang => lang.split(';')[0].trim().toLowerCase())
		.map(lang => lang.split('-')[0]) // Extract just the language code (en, fr, de)
		.find(lang => LOCALES.includes(lang as Locale));

	return (preferred as Locale) || DEFAULT_LOCALE;
}

/**
 * Validate that locale is one of the allowed locales
 */
export function isValidLocale(locale: unknown): locale is Locale {
	return typeof locale === 'string' && LOCALES.includes(locale as Locale);
}

/** Map our locale codes to BCP 47 tags */
const LOCALE_MAP: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE' };

/**
 * Format a date using the user's locale
 */
export function formatDate(locale: Locale, date: Date, options?: Intl.DateTimeFormatOptions): string {
	return new Intl.DateTimeFormat(LOCALE_MAP[locale], options).format(date);
}

/**
 * Format currency using the user's locale
 */
export function formatCurrency(locale: Locale, amount: number, currency = 'EUR'): string {
	return new Intl.NumberFormat(LOCALE_MAP[locale], { style: 'currency', currency }).format(amount);
}

/**
 * Simple pluralization: picks singular or plural translation key based on count
 * @example plural(messages, 'book.night', 'book.nights', 3) => "3 nights"
 */
export function plural(messages: Messages, singularKey: string, pluralKey: string, count: number): string {
	const key = count === 1 ? singularKey : pluralKey;
	return `${count} ${t(messages, key)}`;
}
