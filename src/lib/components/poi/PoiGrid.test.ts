import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import PoiGrid from './PoiGrid.svelte';
import type { Poi } from '$lib/data/poi';
import * as en from '../../../../messages/en.json';

// Mock Google Maps loader — required by PoiCard → PoiMap child
vi.mock('@googlemaps/js-api-loader', () => {
	class Map { fitBounds = vi.fn(); }
	class LatLngBounds { extend = vi.fn().mockReturnThis(); }
	class InfoWindow { setContent = vi.fn(); open = vi.fn(); close = vi.fn(); }
	class Marker { addListener = vi.fn(); setMap = vi.fn(); }
	class Loader {
		constructor(_: unknown) {}
		importLibrary = vi.fn().mockResolvedValue({ Map, LatLngBounds, InfoWindow, Marker });
	}
	return { Loader };
});

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_GOOGLE_MAPS_API_KEY: 'test-key' }
}));

function makePoi(id: string, overrides: Partial<Poi> = {}): Poi {
	return {
		id,
		category: 'ww2',
		lat: 49.37,
		lng: -0.89,
		distanceKm: 23,
		popularityScore: 80,
		accessibilityLevel: 'Good',
		website: null,
		wikipedia: null,
		images: [],
		titleKey: `poi.omaha_beach.title`,
		subtitleKey: `poi.omaha_beach.subtitle`,
		summaryKey: `poi.omaha_beach.summary`,
		...overrides
	};
}

const threePois = [makePoi('a'), makePoi('b'), makePoi('c')];
const defaultProps = { pois: threePois, messages: en, lang: 'en' as const };

describe('PoiGrid', () => {
	describe('normal state', () => {
		it('renders a card for each POI', () => {
			const { container } = render(PoiGrid, { props: defaultProps });
			expect(container.querySelectorAll('.poi-card')).toHaveLength(3);
		});

		it('grid has list role', () => {
			const { getByRole } = render(PoiGrid, { props: defaultProps });
			expect(getByRole('list')).toBeInTheDocument();
		});

		it('each card is wrapped in a listitem', () => {
			const { getAllByRole } = render(PoiGrid, { props: defaultProps });
			expect(getAllByRole('listitem')).toHaveLength(3);
		});
	});

	describe('empty state', () => {
		it('shows no-results message when pois is empty', () => {
			const { getByText } = render(PoiGrid, { props: { ...defaultProps, pois: [] } });
			expect(getByText('No attractions match the current filters')).toBeInTheDocument();
		});

		it('empty state has role=status', () => {
			const { getByRole } = render(PoiGrid, { props: { ...defaultProps, pois: [] } });
			expect(getByRole('status')).toBeInTheDocument();
		});

		it('does not render the grid when empty', () => {
			const { queryByRole } = render(PoiGrid, { props: { ...defaultProps, pois: [] } });
			expect(queryByRole('list')).not.toBeInTheDocument();
		});
	});

	describe('loading state', () => {
		it('renders skeleton cards when loading=true', () => {
			const { container } = render(PoiGrid, { props: { ...defaultProps, loading: true } });
			expect(container.querySelectorAll('.poi-grid__skeleton')).toHaveLength(6);
		});

		it('grid has aria-busy=true when loading', () => {
			const { container } = render(PoiGrid, { props: { ...defaultProps, loading: true } });
			const grid = container.querySelector('.poi-grid') as HTMLElement;
			expect(grid).toHaveAttribute('aria-busy', 'true');
		});

		it('does not render real cards when loading', () => {
			const { container } = render(PoiGrid, { props: { ...defaultProps, loading: true } });
			expect(container.querySelectorAll('.poi-card')).toHaveLength(0);
		});
	});
});
