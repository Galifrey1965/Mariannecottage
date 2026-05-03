import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PoiMap from './PoiMap.svelte';
import type { Poi } from '$lib/data/poi';
import * as en from '../../../../messages/en.json';

// Mock Google Maps loader — components use `new Loader(...)` and `new Map(...)`,
// so the mocks need to be real constructors (classes), not arrow-function impls.
vi.mock('@googlemaps/js-api-loader', () => {
	class Map {
		fitBounds = vi.fn();
		setCenter = vi.fn();
		setZoom = vi.fn();
	}
	class LatLngBounds {
		extend = vi.fn().mockReturnThis();
	}
	class InfoWindow {
		setContent = vi.fn();
		open = vi.fn();
		close = vi.fn();
	}
	class Marker {
		addListener = vi.fn();
		setMap = vi.fn();
	}
	class Loader {
		constructor(_: unknown) {}
		importLibrary = vi.fn().mockResolvedValue({ Map, LatLngBounds, InfoWindow, Marker });
	}
	return { Loader };
});

// Provide an API key in the test env so PoiMap doesn't short-circuit to "missing key"
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

const defaultProps = {
	poi: mockPoi,
	open: true,
	onclose: vi.fn(),
	messages: en
};

describe('PoiMap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('visibility', () => {
		it('renders the panel when open=true', () => {
			const { getByRole } = render(PoiMap, { props: defaultProps });
			expect(getByRole('region')).toBeInTheDocument();
		});

		it('does not render when open=false', () => {
			const { queryByRole } = render(PoiMap, {
				props: { ...defaultProps, open: false }
			});
			expect(queryByRole('region')).not.toBeInTheDocument();
		});
	});

	describe('content', () => {
		it('shows the POI title in the header', () => {
			const { getByText } = render(PoiMap, { props: defaultProps });
			expect(getByText('Omaha Beach')).toBeInTheDocument();
		});

		it('shows the distance from cottage', () => {
			const { getByText } = render(PoiMap, { props: defaultProps });
			expect(getByText(/23\.3 km/)).toBeInTheDocument();
		});

		it('shows exception label for distant POIs (>60km)', () => {
			const distantPoi: Poi = { ...mockPoi, distanceKm: 70.9 };
			const { getByText } = render(PoiMap, {
				props: { ...defaultProps, poi: distantPoi }
			});
			expect(getByText('Worth the drive')).toBeInTheDocument();
		});

		it('has a close button with aria-label', () => {
			const { getByLabelText } = render(PoiMap, { props: defaultProps });
			expect(getByLabelText('Close map')).toBeInTheDocument();
		});

		it('renders a map container div', () => {
			const { container } = render(PoiMap, { props: defaultProps });
			expect(container.querySelector('.poi-map-panel__map')).toBeInTheDocument();
		});
	});

	describe('close behaviour', () => {
		it('calls onclose when close button is clicked', async () => {
			const onclose = vi.fn();
			const { getByLabelText } = render(PoiMap, {
				props: { ...defaultProps, onclose }
			});
			await fireEvent.click(getByLabelText('Close map'));
			expect(onclose).toHaveBeenCalledOnce();
		});
	});

	describe('accessibility', () => {
		it('panel has role=region with aria-label', () => {
			const { getByRole } = render(PoiMap, { props: defaultProps });
			expect(getByRole('region', { name: 'View on map' })).toBeInTheDocument();
		});
	});
});
