import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PoiCard from './PoiCard.svelte';
import type { Poi } from '$lib/data/poi';
import * as en from '../../../../messages/en.json';

// Mock Leaflet — required by PoiMap child component
const mockMapInstance = {
	setView: vi.fn().mockReturnThis(),
	remove: vi.fn(),
	fitBounds: vi.fn(),
	addLayer: vi.fn()
};
const mockMarker = { addTo: vi.fn().mockReturnThis(), bindPopup: vi.fn().mockReturnThis() };
const mockTileLayer = { addTo: vi.fn() };

vi.mock('leaflet', () => ({
	default: {
		map: vi.fn(() => mockMapInstance),
		tileLayer: vi.fn(() => mockTileLayer),
		marker: vi.fn(() => mockMarker),
		divIcon: vi.fn(() => ({})),
		latLngBounds: vi.fn(() => ({ extend: vi.fn().mockReturnThis() }))
	}
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

		it('renders distance label', () => {
			const { getByText } = render(PoiCard, { props: defaultProps });
			expect(getByText(/23\.3 km/)).toBeInTheDocument();
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
			localStorage.setItem('poi:favorites', JSON.stringify(['omaha-beach']));
			const { getByRole } = render(PoiCard, { props: defaultProps });
			// Initial state should be favourited (read from localStorage on mount)
			const unfavBtn = getByRole('button', { name: 'Remove from favourites' });
			await fireEvent.click(unfavBtn);
			const stored = JSON.parse(localStorage.getItem('poi:favorites') ?? '[]');
			expect(stored).not.toContain('omaha-beach');
		});

		it('initialises as favourited when id is in localStorage', () => {
			localStorage.setItem('poi:favorites', JSON.stringify(['omaha-beach']));
			const { getByRole } = render(PoiCard, { props: defaultProps });
			expect(getByRole('button', { name: 'Remove from favourites' })).toHaveAttribute(
				'aria-pressed',
				'true'
			);
		});
	});
});
