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
		routeLine?: boolean;
	}

	let {
		markers,
		center = [49.172937, -0.988765],
		zoom = 10,
		height = '500px',
		fitBounds = false,
		routeLine = false
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

	// Estimate a Web Mercator zoom level that fits the marker bounds in the
	// container, with margin. Used as the initial zoom so the map starts at
	// the right view rather than relying solely on a deferred fitBounds call.
	function computeFitZoom(ms: Marker[], container: HTMLDivElement): number {
		if (ms.length < 2 || !container) return 10;
		const lats = ms.map((m) => m.lat);
		const lngs = ms.map((m) => m.lng);
		const latSpan = Math.max(...lats) - Math.min(...lats);
		const lngSpan = Math.max(...lngs) - Math.min(...lngs);
		const w = Math.max(container.offsetWidth, 200) - 80;
		const h = Math.max(container.offsetHeight, 200) - 80;
		const TILE = 256;
		const lngFraction = lngSpan / 360;
		const cosLat = Math.cos((Math.max(...lats) * Math.PI) / 180);
		const latFraction = latSpan / 360 / Math.max(cosLat, 0.1);
		const lngZoom = Math.log2(w / TILE / lngFraction);
		const latZoom = Math.log2(h / TILE / latFraction);
		const zoom = Math.floor(Math.min(lngZoom, latZoom));
		return Math.max(2, Math.min(14, zoom));
	}

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
			const { Map, InfoWindow, LatLngBounds, Polyline } = await loader.importLibrary('maps');
			const { Marker } = await loader.importLibrary('marker');

			// If we'll fit-bounds, compute the framing center+zoom up front so
			// the map mounts directly at the right view rather than at the
			// default cottage zoom 10 (which leaves distant POIs off-screen).
			let initialCenter = { lat: center[0], lng: center[1] };
			let initialZoom = zoom;
			if (fitBounds && markers.length > 1) {
				const lats = markers.map((m) => m.lat);
				const lngs = markers.map((m) => m.lng);
				initialCenter = {
					lat: (Math.min(...lats) + Math.max(...lats)) / 2,
					lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
				};
				initialZoom = computeFitZoom(markers, mapContainer);
			}

			map = new Map(mapContainer, {
				center: initialCenter,
				zoom: initialZoom,
				maxZoom: fitBounds ? 14 : undefined,
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

			if (routeLine && markers.length >= 2) {
				try {
					new Polyline({
						path: markers.slice(0, 2).map((m) => ({ lat: m.lat, lng: m.lng })),
						geodesic: true,
						strokeColor: 'transparent',
						strokeOpacity: 0,
						icons: [
							{
								icon: {
									path: 'M 0,-1 0,1',
									strokeColor: '#7a4a2a',
									strokeOpacity: 0.85,
									strokeWeight: 2.5,
									scale: 3
								},
								offset: '0',
								repeat: '12px'
							}
						],
						map
					});
				} catch (e) {
					console.warn('GoogleMap: route polyline failed to render', e);
				}
			}

			// Precision pass — once the panel transition has settled, re-fit
			// the bounds with the actual container size. Wrapped in try/catch
			// so a stale map reference can't crash the rest of the page.
			if (fitBounds && markers.length > 1) {
				const bounds = new LatLngBounds();
				for (const m of markers) bounds.extend({ lat: m.lat, lng: m.lng });
				setTimeout(() => {
					try { map?.fitBounds(bounds, 40); } catch (e) { console.warn('fitBounds failed', e); }
				}, 120);
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
