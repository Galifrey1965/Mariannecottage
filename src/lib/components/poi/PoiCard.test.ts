import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PoiCard from './PoiCard.svelte';
import type { Poi } from '$lib/data/poi';
import { favorites } from '$lib/stores/favorites.svelte';
import * as en from '../../../../messages/en.json';

// Mock Google Maps loader — required by PoiMap child component
vi.mock('@googlemaps/js-api-loader', () => {
	class Map { fitBounds = vi.fn(); setCenter = vi.fn(); setZoom = vi.fn(); }
	class LatLngBounds { extend = vi.fn().mockReturnThis(); }
	class InfoWindow { setContent = vi.fn(); open = vi.fn(); close = vi.fn(); }
	class Marker { addListener = vi.fn(); setMap = vi.fn(); }
	class Polyline { setMap = vi.fn(); }
	class Loader {
		constructor(_: unknown) {}
		importLibrary = vi.fn().mockResolvedValue({ Map, LatLngBounds, InfoWindow, Marker, Polyline });
	}
	return { Loader };
});

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_GOOGLE_MAPS_API_KEY: 'test-key' }
}));

const mockPoi: Poi = {
	id: 'omaha-beach',
	category: 'ww2',
	lat: 49.3715,
	lng: -0.8885,
	distanceKm: 23.3,
	popularityScore: 93,
	accessibilityLevel: 'Good',
	website: 'https://example.com',
	wikipedia: 'https://en.wikipedia.org/wiki/Omaha_Beach',
	images: [],
	titleKey: 'poi.omaha_beach.title',
	subtitleKey: 'poi.omaha_beach.subtitle',
	summaryKey: 'poi.omaha_beach.summary'
};

const defaultProps = { poi: mockPoi, messages: en, lang: 'en' as const };

describe('PoiCard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		favorites.items = [];
	});

	describe('content', () => {
		it('renders title from i18n key', () => {
			const { getByRole } = render(PoiCard, { props: defaultProps });
			expect(getByRole('heading', { name: 'Omaha Beach' })).toBeInTheDocument();
		});

		it('renders subtitle from i18n key', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText('The most iconic D-Day landing site')).toBeInTheDocument();
		});

		it('renders summary from i18n key', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText(/One of five Allied landing beaches/)).toBeInTheDocument();
		});

		it('renders category chip with label', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText('WW2 History')).toBeInTheDocument();
		});

		it('renders accessibility badge', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText('Good')).toBeInTheDocument();
		});

		it('renders distance label (miles for en, km for other locales)', () => {
			// 23.3 km → 14.5 mi when lang=en
			const { container: enContainer } = render(PoiCard, { props: defaultProps });
			expect(enContainer.textContent).toMatch(/14\.5\s*mi/);

			const { container: frContainer } = render(PoiCard, {
				props: { ...defaultProps, lang: 'fr' as const }
			});
			expect(frContainer.textContent).toMatch(/23\.3\s*km/);
		});

		it('shows "Worth the drive" for distant POIs (>60km)', () => {
			const distantPoi: Poi = { ...mockPoi, distanceKm: 70 };
			const { getByText } = render(PoiCard, {
				props: { ...defaultProps, poi: distantPoi }
			});
			expect(getByText('Worth the drive')).toBeInTheDocument();
		});
	});

	describe('learn more link', () => {
		it('renders Learn More when website is set', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText('Learn More')).toBeInTheDocument();
		});

		it('renders Learn More when only wikipedia is set', () => {
			const wikiOnlyPoi: Poi = { ...mockPoi, website: null };
			const { getByText } = render(PoiCard, {
				props: { ...defaultProps, poi: wikiOnlyPoi }
			});
			expect(getByText('Learn More')).toBeInTheDocument();
		});

		it('hides Learn More when both website and wikipedia are null', () => {
			const noLinkPoi: Poi = { ...mockPoi, website: null, wikipedia: null };
			const { queryByText } = render(PoiCard, {
				props: { ...defaultProps, poi: noLinkPoi }
			});
			expect(queryByText('Learn More')).not.toBeInTheDocument();
		});

		it('Learn More opens in new tab', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			const link = getByText('Learn More').closest('a') as HTMLAnchorElement;
			expect(link.target).toBe('_blank');
			expect(link.rel).toContain('noopener');
		});

		it('Learn More links to website when both are present', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			const link = getByText('Learn More').closest('a') as HTMLAnchorElement;
			expect(link.href).toBe('https://example.com/');
		});
	});

	describe('map toggle', () => {
		it('distance chip has aria-expanded=false initially', () => {
			const { getByRole } = render(PoiCard, { props: defaultProps });
			const chip = getByRole('button', { name: /View on map/ });
			expect(chip).toHaveAttribute('aria-expanded', 'false');
		});

		it('clicking distance chip shows map panel', async () => {
			const { getByRole, container } = render(PoiCard, { props: defaultProps });
			await fireEvent.click(getByRole('button', { name: /View on map/ }));
			expect(container.querySelector('.poi-map-panel')).toBeInTheDocument();
		});

		it('distance chip aria-expanded updates when map opens', async () => {
			const { container } = render(PoiCard, { props: defaultProps });
			const chip = container.querySelector('.poi-card__distance-chip') as HTMLButtonElement;
			await fireEvent.click(chip);
			expect(chip).toHaveAttribute('aria-expanded', 'true');
		});
	});

	describe('favourite toggle', () => {
		it('renders favourite button with aria-pressed=false initially', () => {
			const { getByRole } = render(PoiCard, { props: defaultProps });
			const btn = getByRole('button', { name: 'Add to favourites' });
			expect(btn).toHaveAttribute('aria-pressed', 'false');
		});

		it('toggling favourite sets aria-pressed=true', async () => {
			const { getByRole } = render(PoiCard, { props: defaultProps });
			await fireEvent.click(getByRole('button', { name: 'Add to favourites' }));
			expect(getByRole('button', { name: 'Remove from favourites' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		});

		it('saves poi id to localStorage on favourite', async () => {
			const { getByRole } = render(PoiCard, { props: defaultProps });
			await fireEvent.click(getByRole('button', { name: 'Add to favourites' }));
			const stored = JSON.parse(localStorage.getItem('poi:favorites') ?? '[]');
			expect(stored).toContain('omaha-beach');
		});

		it('removes poi id from localStorage on unfavourite', async () => {
			favorites.items = ['omaha-beach'];
			const { getByRole } = render(PoiCard, { props: defaultProps });
			const unfavBtn = getByRole('button', { name: 'Remove from favourites' });
			await fireEvent.click(unfavBtn);
			expect(favorites.has('omaha-beach')).toBe(false);
		});

		it('initialises as favourited when id is in the store', () => {
			favorites.items = ['omaha-beach'];
			const { getByRole } = render(PoiCard, { props: defaultProps });
			expect(getByRole('button', { name: 'Remove from favourites' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		});
	});
});
