// Shared POI-favourites store. Backed by localStorage (key: poi:favorites).
// Per-browser, persists across visits, not synced across devices.

const FAVORITES_KEY = 'poi:favorites';

function loadInitial(): string[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		const raw = localStorage.getItem(FAVORITES_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

function persist(items: string[]) {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
	} catch {
		// localStorage full or blocked — keep the in-memory state and move on.
	}
}

class FavoritesStore {
	items = $state<string[]>(loadInitial());

	get count() {
		return this.items.length;
	}

	has(id: string) {
		return this.items.includes(id);
	}

	toggle(id: string) {
		this.items = this.has(id)
			? this.items.filter((x) => x !== id)
			: [...this.items, id];
		persist(this.items);
	}
}

export const favorites = new FavoritesStore();
