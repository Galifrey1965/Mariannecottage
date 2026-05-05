// Tracks which (banner-id, effect) pairs the visitor has dismissed.
// Persisted to localStorage so the choice survives page reloads.
// Keying on both id + effect means: if Mark later swaps a banner's effect
// from fireworks → snow, the new effect plays again because the key changed.

const STORAGE_KEY = 'mc-fx-dismissed';

type DismissalMap = Record<string, true>;

function read(): DismissalMap {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

function write(map: DismissalMap): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// Quota / private mode — silently degrade.
	}
}

function key(bannerId: string, effect: string): string {
	return `${bannerId}:${effect}`;
}

export function isDismissed(bannerId: string, effect: string): boolean {
	if (effect === 'none') return false;
	return read()[key(bannerId, effect)] === true;
}

export function dismiss(bannerId: string, effect: string): void {
	if (effect === 'none') return;
	const map = read();
	map[key(bannerId, effect)] = true;
	write(map);
}
