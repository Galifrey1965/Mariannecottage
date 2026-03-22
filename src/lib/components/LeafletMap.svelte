<script lang="ts">
	import { onMount } from 'svelte';
	import type L from 'leaflet';

	interface Marker {
		lat: number;
		lng: number;
		title: string;
		description: string;
		type: 'cottage' | 'ww2' | 'nature' | 'towns';
	}

	interface Props {
		markers: Marker[];
		center?: [number, number];
		zoom?: number;
		height?: string;
	}

	let { markers, center = [49.1264, -1.0986], zoom = 10, height = '500px' }: Props = $props();

	let mapContainer: HTMLDivElement;

	onMount(async () => {
		const L = (await import('leaflet')).default;

		const map = L.map(mapContainer).setView(center, zoom);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution:
				'© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		// Color mapping by type
		const typeColors: Record<string, string> = {
			cottage: '🏠',
			ww2: '⚔️',
			nature: '🌿',
			towns: '🏛️'
		};

		// Add markers
		for (const marker of markers) {
			const markerColor = marker.type === 'cottage' ? '#b8860b' : '#d2691e';
			const icon = L.divIcon({
				className: 'custom-marker',
				html: `<div style="font-size: 24px; color: ${markerColor};">${typeColors[marker.type] || '📍'}</div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			});

			const popup = L.popup().setContent(
				`<div class="text-sm"><strong>${marker.title}</strong><br>${marker.description}</div>`
			);

			L.marker([marker.lat, marker.lng], { icon }).bindPopup(popup).addTo(map);
		}

		return () => {
			map.remove();
		};
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<div bind:this={mapContainer} style="height: {height}; width: 100%; border-radius: 0.5rem; overflow: hidden;" />

<style>
	:global(.custom-marker) {
		background: none;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global(.leaflet-popup-content) {
		margin: 0;
		font-family: inherit;
	}
</style>
