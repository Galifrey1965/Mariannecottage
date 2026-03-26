<script lang="ts">
	import type L from 'leaflet';
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

	// Map container — reactive so $effect can track when it mounts/unmounts
	let mapContainer: HTMLDivElement | undefined = $state(undefined);

	// Category colours for the POI marker dot
	const CATEGORY_COLORS: Record<string, string> = {
		ww2: '#8b5e3c',
		heritage: '#7b5ea7',
		towns: '#2563eb',
		museums: '#0d9488'
	};

	// Distance label — use the "exception" key for distant POIs (>60km, e.g. Mont Saint-Michel)
	const distanceLabel = $derived(
		poi.distanceKm > 60
			? t(messages, 'poi.distance.exception')
			: `${poi.distanceKm.toFixed(1)} km ${t(messages, 'poi.distance.from_cottage')}`
	);

	// Initialise Leaflet when the container element is in the DOM (i.e. when open=true renders it)
	$effect(() => {
		const container = mapContainer;
		if (!container) return;

		let map: L.Map;

		import('leaflet').then(({ default: L }) => {
			map = L.map(container, { zoomControl: true, attributionControl: true });

			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				maxZoom: 19
			}).addTo(map);

			// Cottage origin marker (gold house)
			const cottageIcon = L.divIcon({
				className: 'poi-map-marker',
				html: `<div class="poi-map-marker__dot" style="background:#b8860b;" title="Marianne Cottage">🏠</div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 32]
			});

			L.marker([COTTAGE_ORIGIN.lat, COTTAGE_ORIGIN.lng], { icon: cottageIcon })
				.bindPopup('<strong>Marianne Cottage</strong>')
				.addTo(map);

			// POI marker (category colour)
			const poiColor = CATEGORY_COLORS[poi.category] ?? '#555';
			const poiIcon = L.divIcon({
				className: 'poi-map-marker',
				html: `<div class="poi-map-marker__dot" style="background:${poiColor};">📍</div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 32]
			});

			L.marker([poi.lat, poi.lng], { icon: poiIcon })
				.bindPopup(`<strong>${t(messages, poi.titleKey)}</strong><br>${distanceLabel}`)
				.addTo(map);

			// Fit map to show both markers with padding
			const bounds = L.latLngBounds(
				[COTTAGE_ORIGIN.lat, COTTAGE_ORIGIN.lng],
				[poi.lat, poi.lng]
			);
			map.fitBounds(bounds, { padding: [40, 40] });
		});

		return () => {
			if (map) map.remove();
		};
	});

	// Close on click outside the panel
	$effect(() => {
		if (!open) return;

		function handleDocClick(e: MouseEvent) {
			const panel = document.querySelector('.poi-map-panel');
			if (panel && !panel.contains(e.target as Node)) {
				onclose();
			}
		}

		// Defer by one frame so the click that opened the panel doesn't immediately close it
		const id = setTimeout(() => document.addEventListener('click', handleDocClick), 0);

		return () => {
			clearTimeout(id);
			document.removeEventListener('click', handleDocClick);
		};
	});
</script>

{#if open}
	<div class="poi-map-panel" role="region" aria-label={t(messages, 'poi.actions.view_map')}>
		<!-- Header -->
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

		<!-- Map -->
		<div bind:this={mapContainer} class="poi-map-panel__map"></div>

		<!-- OSM attribution note -->
		<p class="poi-map-panel__osm-note" aria-hidden="true">
			Straight-line distance · Map © OpenStreetMap contributors
		</p>
	</div>
{/if}

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

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
	}

	.poi-map-panel__osm-note {
		margin: 0;
		padding: 0.2rem 0.75rem;
		font-size: 0.65rem;
		color: var(--color-text-muted, #5f5e5a);
		text-align: right;
	}

	:global(.poi-map-marker) {
		background: none;
		border: none;
	}

	:global(.poi-map-marker__dot) {
		font-size: 22px;
		line-height: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
	}
</style>
