// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
	t,
	detectLocale,
	isValidLocale,
	formatDate,
	formatCurrency,
	plural,
	localePath,
	DEFAULT_LOCALE,
	LOCALES
} from './i18n';

const messages = {
	home: {
		hero: {
			title: 'Welcome to {name}'
		}
	},
	nav: {
		home: 'Home',
		rooms: 'Rooms'
	},
	book: {
		night: 'night',
		nights: 'nights'
	}
};

describe('t() — translation lookup', () => {
	it('returns value for valid dot-path key', () => {
		expect(t(messages, 'nav.home')).toBe('Home');
	});

	it('returns deeply nested values', () => {
		expect(t(messages, 'home.hero.title')).toBe('Welcome to {name}');
	});

	it('falls back to key string when path not found', () => {
		expect(t(messages, 'missing.key')).toBe('missing.key');
	});

	it('falls back when partial path exists', () => {
		expect(t(messages, 'nav.missing')).toBe('nav.missing');
	});

	it('interpolates {param} placeholders', () => {
		expect(t(messages, 'home.hero.title', { name: 'Marianne' })).toBe('Welcome to Marianne');
	});

	it('leaves unmatched placeholders intact', () => {
		expect(t(messages, 'home.hero.title')).toBe('Welcome to {name}');
	});
});

describe('detectLocale()', () => {
	it('returns default locale for null', () => {
		expect(detectLocale(null)).toBe(DEFAULT_LOCALE);
	});

	it('returns default locale for empty string', () => {
		expect(detectLocale('')).toBe(DEFAULT_LOCALE);
	});

	it('detects fr from fr-FR,en;q=0.9', () => {
		expect(detectLocale('fr-FR,en;q=0.9')).toBe('fr');
	});

	it('detects de from de-AT,de;q=0.9,en;q=0.8', () => {
		expect(detectLocale('de-AT,de;q=0.9,en;q=0.8')).toBe('de');
	});

	it('returns en for unsupported locale like ja', () => {
		expect(detectLocale('ja,zh;q=0.9')).toBe('en');
	});

	it('picks first matching locale from list', () => {
		expect(detectLocale('es,fr;q=0.8,de;q=0.7')).toBe('fr');
	});
});

describe('isValidLocale()', () => {
	it('returns true for supported locales', () => {
		for (const l of LOCALES) {
			expect(isValidLocale(l)).toBe(true);
		}
	});

	it('returns false for unsupported locale', () => {
		expect(isValidLocale('es')).toBe(false);
	});

	it('returns false for null/undefined', () => {
		expect(isValidLocale(null)).toBe(false);
		expect(isValidLocale(undefined)).toBe(false);
	});

	it('returns false for non-string', () => {
		expect(isValidLocale(42)).toBe(false);
	});
});

describe('formatDate()', () => {
	const date = new Date('2026-03-15T12:00:00Z');

	it('formats with English locale', () => {
		const result = formatDate('en', date, { month: 'long', year: 'numeric' });
		expect(result).toContain('March');
		expect(result).toContain('2026');
	});

	it('formats with French locale — produces French month name', () => {
		const result = formatDate('fr', date, { month: 'long', year: 'numeric' });
		expect(result.toLowerCase()).toContain('mars');
		expect(result).toContain('2026');
	});

	it('formats with German locale — produces German month name', () => {
		const result = formatDate('de', date, { month: 'long', year: 'numeric' });
		expect(result).toContain('März');
		expect(result).toContain('2026');
	});

	it('formats weekday correctly per locale', () => {
		const sunday = new Date('2026-03-22T12:00:00Z'); // a Sunday
		const en = formatDate('en', sunday, { weekday: 'long' });
		const fr = formatDate('fr', sunday, { weekday: 'long' });
		expect(en).toContain('Sunday');
		expect(fr.toLowerCase()).toContain('dimanche');
	});
});

describe('formatCurrency()', () => {
	it('formats EUR for English locale', () => {
		const result = formatCurrency('en', 120);
		expect(result).toMatch(/€|EUR/);
		expect(result).toContain('120');
	});

	it('formats EUR for French locale', () => {
		const result = formatCurrency('fr', 120);
		expect(result).toMatch(/€|EUR/);
		expect(result).toContain('120');
	});

	it('formats EUR for German locale', () => {
		const result = formatCurrency('de', 120);
		expect(result).toMatch(/€|EUR/);
	});

	it('handles decimals', () => {
		const result = formatCurrency('en', 99.5);
		expect(result).toMatch(/99[.,]50/);
	});
});

describe('plural()', () => {
	it('returns singular form when count is 1', () => {
		expect(plural(messages, 'book.night', 'book.nights', 1)).toBe('1 night');
	});

	it('returns plural form when count > 1', () => {
		expect(plural(messages, 'book.night', 'book.nights', 3)).toBe('3 nights');
	});

	it('returns plural form when count is 0', () => {
		expect(plural(messages, 'book.night', 'book.nights', 0)).toBe('0 nights');
	});
});

describe('localePath()', () => {
	it('returns path unchanged (identity function)', () => {
		expect(localePath('fr', '/rooms')).toBe('/rooms');
		expect(localePath('en', '/')).toBe('/');
	});
});
