/**
 * GDPR consent helpers — single source of truth for whether third-party
 * scripts (currently Google Maps) may load. Mirrors the storage key and
 * event name used by CookieConsent.svelte.
 */

const STORAGE_KEY = 'marianne_cookie_consent';
const EVENT = 'cookieconsent';

export type ConsentChoice = 'accepted' | 'rejected';

/**
 * Reads the persisted consent choice. Returns null when no choice has been
 * made yet (banner still showing) or when localStorage is unavailable.
 * Safe to call during SSR — returns null on the server.
 */
export function getConsent(): ConsentChoice | null {
	if (typeof window === 'undefined') return null;
	try {
		const v = window.localStorage.getItem(STORAGE_KEY);
		return v === 'accepted' || v === 'rejected' ? v : null;
	} catch {
		return null;
	}
}

/**
 * Updates the consent choice and broadcasts the change so any feature
 * components currently mounted can react without a reload.
 */
export function setConsent(choice: ConsentChoice): void {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(STORAGE_KEY, choice);
	} catch {
		// non-fatal; the in-memory event still propagates for this session
	}
	try {
		window.dispatchEvent(new CustomEvent(EVENT, { detail: { choice } }));
	} catch {
		// ignored
	}
}

/**
 * Subscribes to consent changes. Returns an unsubscribe function suitable
 * for use as a Svelte $effect cleanup.
 */
export function onConsentChange(callback: (choice: ConsentChoice) => void): () => void {
	if (typeof window === 'undefined') return () => {};
	const handler = (e: Event) => {
		const detail = (e as CustomEvent<{ choice: ConsentChoice }>).detail;
		if (detail?.choice) callback(detail.choice);
	};
	window.addEventListener(EVENT, handler);
	return () => window.removeEventListener(EVENT, handler);
}
