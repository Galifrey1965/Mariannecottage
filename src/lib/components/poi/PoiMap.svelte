<script lang="ts">
	import { env } from '$env/dynamic/public';
	import type { Poi } from '$lib/data/poi.js';
	import { COTTAGE_ORIGIN } from '$lib/data/poi.js';
	import type { Messages } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';

	interface Props {
		poi: Poi;
		open: boolean;
		onclose: () => void;
		messages: Messages;
	}

	let { poi, open, onclose, messages }: Props = $props();

	let mapContainer: HTMLDivElement | undefined = $state(undefined);
	let missingKey = $state(false);

	const CATEGORY_COLORS: Record<string, string> = {
		ww2: '#8b5e3c',
		heritage: '#7b5ea7',
		towns: '#2563eb',
		museums: '#0d9488'
	};

	const distanceLabel = $derived(
		poi.distanceKm > 60
			? t(messages, 'poi.distance.exception')
			: `${poi.distanceKm.toFixed(1)} km ${t(messages, 'poi.distance.from_cottage')}`
	);

	$effect(() => {
		const container = mapContainer;
		if (!container) return;

		const apiKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		if (!apiKey) {
			missingKey = true;
			return;
		}

		let map: google.maps.Map | undefined;

		import('@googlemaps/js-api-loader').then(async ({ Loader }) => {
			const loader = new Loader({ apiKey, version: 'weekly' });
			const { Map, LatLngBounds, InfoWindow } = await loader.importLibrary('maps');
			const { Marker } = await loader.importLibrary('marker');

			map = new Map(container, {
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false,
				gestureHandling: 'cooperative'
			});
			const infoWindow = new InfoWindow();

			const cottageMarker = new Marker({
				position: { lat: COTTAGE_ORIGIN.lat, lng: COTTAGE_ORIGIN.lng },
				map,
				title: 'Marianne Cottage',
				label: { text: '🏠', fontSize: '20px' },
				icon: {
					path: 'M 0,0 m -16,-16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0',
					fillColor: '#b8860b',
					fillOpacity: 0.15,
					strokeColor: '#b8860b',
					scale: 1
				}
			});
			cottageMarker.addListener('click', () => {
				infoWindow.setContent('<strong>Marianne Cottage</strong>');
				infoWindow.open({ map, anchor: cottageMarker });
			});

			const poiColor = CATEGORY_COLORS[poi.category] ?? '#555';
			const poiMarker = new Marker({
				position: { lat: poi.lat, lng: poi.lng },
				map,
				title: t(messages, poi.titleKey),
				label: { text: '📍', fontSize: '20px' },
				icon: {
					path: 'M 0,0 m -16,-16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0',
					fillColor: poiColor,
					fillOpacity: 0.15,
					strokeColor: poiColor,
					scale: 1
				}
			});
			poiMarker.addListener('click', () => {
				infoWindow.setContent(
					`<strong>${t(messages, poi.titleKey)}</strong><br>${distanceLabel}`
				);
				infoWindow.open({ map, anchor: poiMarker });
			});

			const bounds = new LatLngBounds();
			bounds.extend({ lat: COTTAGE_ORIGIN.lat, lng: COTTAGE_ORIGIN.lng });
			bounds.extend({ lat: poi.lat, lng: poi.lng });
			map.fitBounds(bounds, 40);
		});
	});

	$effect(() => {
		if (!open) return;

		function handleDocClick(e: MouseEvent) {
			const panel = document.querySelector('.poi-map-panel');
			if (panel && !panel.contains(e.target as Node)) {
				onclose();
			}
		}

		const id = setTimeout(() => document.addEventListener('click', handleDocClick), 0);

		return () => {
			clearTimeout(id);
			document.removeEventListener('click', handleDocClick);
		};
	});
</script>

{#if open}
	<div class="poi-map-panel" role="region" aria-label={t(messages, 'poi.actions.view_map')}>
		<div class="poi-map-panel__header">
			<span class="poi-map-panel__title">{t(messages, poi.titleKey)}</span>
			<span class="poi-map-panel__distance">{distanceLabel}</span>
			<button
				class="poi-map-panel__close"
				type="button"
				onclick={onclose}
				aria-label={t(messages, 'poi.actions.close_map')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<div bind:this={mapContainer} class="poi-map-panel__map">
			{#if missingKey}
				<div class="poi-map-panel__placeholder">
					Map unavailable — <code>PUBLIC_GOOGLE_MAPS_API_KEY</code> not set
				</div>
			{/if}
		</div>

		<p class="poi-map-panel__attribution" aria-hidden="true">
			Straight-line distance · Map data © Google
		</p>
	</div>
{/if}

<style>
	.poi-map-panel {
		border-top: 1px solid var(--color-cream-dark, #ede6d8);
		background: var(--color-cream, #f5f0e8);
		overflow: hidden;
		animation: poi-map-expand 0.25s ease-out;
	}

	@keyframes poi-map-expand {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.poi-map-panel__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
	}

	.poi-map-panel__title {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--color-text, #2c2c2a);
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.poi-map-panel__distance {
		font-size: 0.75rem;
		color: var(--color-text-muted, #5f5e5a);
		white-space: nowrap;
	}

	.poi-map-panel__close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--color-text-muted, #5f5e5a);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.poi-map-panel__close:hover {
		background: var(--color-cream-dark, #ede6d8);
	}

	.poi-map-panel__close:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}

	.poi-map-panel__map {
		height: 220px;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.poi-map-panel__placeholder {
		font-size: 0.75rem;
		color: var(--color-text-muted, #5f5e5a);
		text-align: center;
		padding: 0 1rem;
	}

	.poi-map-panel__placeholder code {
		background: var(--color-cream-dark, #ede6d8);
		padding: 0 0.25rem;
		border-radius: 0.125rem;
	}

	.poi-map-panel__attribution {
		margin: 0;
		padding: 0.2rem 0.75rem;
		font-size: 0.65rem;
		color: var(--color-text-muted, #5f5e5a);
		text-align: right;
	}
</style>
