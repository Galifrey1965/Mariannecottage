<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';

	interface Marker {
		lat: number;
		lng: number;
		title: string;
		description: string;
		type: 'cottage' | 'ww2' | 'nature' | 'towns' | 'heritage' | 'museums';
	}

	interface Props {
		markers: Marker[];
		center?: [number, number];
		zoom?: number;
		height?: string;
		fitBounds?: boolean;
	}

	let {
		markers,
		center = [49.172937, -0.988765],
		zoom = 10,
		height = '500px',
		fitBounds = false
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let missingKey = $state(false);

	const TYPE_GLYPHS: Record<string, string> = {
		cottage: '🏠',
		ww2: '⚔️',
		nature: '🌿',
		towns: '🏘️',
		heritage: '🏛️',
		museums: '🏛️'
	};

	onMount(() => {
		const apiKey = env.PUBLIC_GOOGLE_MAPS_API_KEY;
		if (!apiKey) {
			missingKey = true;
			return;
		}

		let map: google.maps.Map | undefined;
		let infoWindow: google.maps.InfoWindow | undefined;

		import('@googlemaps/js-api-loader').then(async ({ Loader }) => {
			const loader = new Loader({ apiKey, version: 'weekly' });
			const { Map, InfoWindow, LatLngBounds } = await loader.importLibrary('maps');
			const { Marker } = await loader.importLibrary('marker');

			map = new Map(mapContainer, {
				center: { lat: center[0], lng: center[1] },
				zoom,
				mapTypeControl: false,
				streetViewControl: false,
				fullscreenControl: false
			});
			infoWindow = new InfoWindow();

			for (const m of markers) {
				const glyph = TYPE_GLYPHS[m.type] || '📍';
				const marker = new Marker({
					position: { lat: m.lat, lng: m.lng },
					map,
					title: m.title,
					label: { text: glyph, fontSize: '20px' },
					icon: {
						path: 'M 0,0 m -16,-16 a 16,16 0 1,0 32,0 a 16,16 0 1,0 -32,0',
						fillColor: 'transparent',
						strokeColor: 'transparent',
						scale: 1
					}
				});
				marker.addListener('click', () => {
					infoWindow!.setContent(
						`<div style="font-size:0.85rem;"><strong>${m.title}</strong><br>${m.description}</div>`
					);
					infoWindow!.open({ map, anchor: marker });
				});
			}

			if (fitBounds && markers.length > 1) {
				const bounds = new LatLngBounds();
				for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng });
				map.fitBounds(bounds, 60);
			}
		});

		return () => {
			if (infoWindow) infoWindow.close();
		};
	});
</script>

<div bind:this={mapContainer} class="map" style="height: {height};">
	{#if missingKey}
		<div class="map__placeholder">
			<p>Map preview unavailable in this environment</p>
			<p class="map__placeholder-note">Set <code>PUBLIC_GOOGLE_MAPS_API_KEY</code> to display the map</p>
		</div>
	{/if}
</div>

<style>
	.map {
		width: 100%;
		border-radius: 0.5rem;
		overflow: hidden;
		background: var(--color-cream, #f5f0e8);
	}
	.map__placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 0.25rem;
		color: var(--color-text-muted, #5f5e5a);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem;
	}
	.map__placeholder-note {
		font-size: 0.75rem;
		opacity: 0.7;
	}
	.map__placeholder code {
		background: var(--color-cream-dark, #ede6d8);
		padding: 0 0.25rem;
		border-radius: 0.125rem;
	}
</style>
