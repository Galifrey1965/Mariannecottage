<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type L from 'leaflet';

	type MapView = 'illustrated' | 'satellite';
	let view = $state<MapView>('illustrated');
	let hoveredNode = $state<string | null>(null);
	let leafletMap: L.Map | undefined;
	let mapEl: HTMLDivElement | undefined = $state();
	let leafletMounted = $state(false);

	const NODES = [
		{
			id: 'cottage',
			label: 'Marianne Cottage',
			sub: '1 La Haye, Couvains · GPS 49.1728, -0.9887',
			desc: 'Your restored 1800s longère. Lime-wash walls, oak beams, Pierre de Caen stone — and two en-suite rooms looking out over the orchard.',
			cx: 340,
			cy: 300,
			color: '#4a586e',
			icon: '🏡'
		},
		{
			id: 'orchard',
			label: 'The Apple Orchard',
			sub: 'Cottage grounds',
			desc: 'Traditional Normandy apple trees — the same varieties pressed for cider and distilled into Calvados. Tawny owls nest here at dusk.',
			cx: 190,
			cy: 360,
			color: '#6b8a5e',
			icon: '🍎'
		},
		{
			id: 'abbey',
			label: 'Cerisy-la-Forêt Abbey',
			sub: '~4km · 5 min drive',
			desc: 'Founded 1032 by Robert the Magnificent. One of the finest Norman Romanesque naves in existence — arrive before 9am for the light.',
			cx: 510,
			cy: 230,
			color: '#8a7a5a',
			icon: '⛪'
		},
		{
			id: 'omaha',
			label: 'Omaha Beach',
			sub: '~25km north · US Sector',
			desc: 'The American sector of the D-Day landings. The cemetery at Colleville-sur-Mer overlooks the beach where the 1st Infantry Division landed on 6 June 1944.',
			cx: 260,
			cy: 100,
			color: '#7a6060',
			icon: '⚔️'
		},
		{
			id: 'gold',
			label: 'Gold Beach',
			sub: '~20km north · British Sector',
			desc: 'The British sector. Arromanches, 3km east, still holds the visible remains of the Mulberry Harbour — a feat of wartime engineering visible from the beach.',
			cx: 450,
			cy: 85,
			color: '#7a6060',
			icon: '⚔️'
		},
		{
			id: 'bocage',
			label: 'The Bocage',
			sub: 'Surrounding countryside',
			desc: 'The ancient hedgerow network — earthen banks topped with trees — that has defined this landscape since Gallo-Roman times, and slowed the Allied advance in 1944.',
			cx: 150,
			cy: 220,
			color: '#7a9a7a',
			icon: '🌿'
		}
	];

	const LEAFLET_MARKERS = [
		{ lat: 49.1728, lng: -0.9887, title: 'Marianne Cottage', type: 'cottage', color: '#4a586e' },
		{ lat: 49.189, lng: -0.943, title: 'Cerisy-la-Forêt Abbey', type: 'abbey', color: '#8a7a5a' },
		{ lat: 49.369, lng: -0.8564, title: 'Omaha Beach', type: 'ww2', color: '#7a6060' },
		{ lat: 49.342, lng: -0.6295, title: 'Gold Beach (Arromanches)', type: 'ww2', color: '#7a6060' },
		{ lat: 49.274, lng: -0.704, title: 'Bayeux', type: 'town', color: '#5a6a8a' },
		{ lat: 49.115, lng: -1.089, title: 'Saint-Lô', type: 'town', color: '#5a6a8a' }
	];

	async function initLeaflet() {
		if (!mapEl || leafletMounted) return;
		leafletMounted = true;

		const { default: L } = await import('leaflet');
		await import('leaflet/dist/leaflet.css');

		leafletMap = L.map(mapEl).setView([49.25, -0.85], 10);

		L.tileLayer(
			'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
			{
				attribution:
					'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
				subdomains: 'abcd',
				maxZoom: 19
			}
		).addTo(leafletMap);

		for (const m of LEAFLET_MARKERS) {
			const icon = L.divIcon({
				className: '',
				html: `<div style="
					width:14px;height:14px;
					border-radius:50%;
					background:${m.color};
					border:2px solid #f0eee9;
					box-shadow:0 2px 6px rgba(0,0,0,0.25);
				"></div>`,
				iconSize: [14, 14],
				iconAnchor: [7, 7]
			});

			L.marker([m.lat, m.lng], { icon })
				.addTo(leafletMap)
				.bindPopup(
					`<strong style="font-family:'Playfair Display',serif;font-size:0.9rem">${m.title}</strong>`,
					{ className: 'mc-popup' }
				);
		}
	}

	$effect(() => {
		if (view === 'satellite' && mapEl && !leafletMounted) {
			initLeaflet();
		}
		if (view === 'satellite' && leafletMap) {
			setTimeout(() => leafletMap?.invalidateSize(), 100);
		}
	});

	onDestroy(() => {
		leafletMap?.remove();
	});

	const activeNode = $derived(NODES.find((n) => n.id === hoveredNode));
</script>

<svelte:head>
	<title>The Living Map — Marianne Cottage</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<header class="page-header">
		<div class="header-inner">
			<div>
				<p class="eyebrow">Marianne Cottage · Couvains, Normandy</p>
				<h1>The Living Map</h1>
				<p class="header-sub">Explore the cottage grounds and the history that surrounds them</p>
			</div>
			<!-- View toggle -->
			<div class="toggle" role="tablist" aria-label="Map view">
				<button
					role="tab"
					aria-selected={view === 'illustrated'}
					class:active={view === 'illustrated'}
					onclick={() => (view = 'illustrated')}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><path
							d="M3 6l9-4 9 4v12l-9 4-9-4V6z"
						/><path d="M12 2v20M3 6l9 4 9-4" /></svg
					>
					Illustrated
				</button>
				<button
					role="tab"
					aria-selected={view === 'satellite'}
					class:active={view === 'satellite'}
					onclick={() => (view = 'satellite')}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" /></svg
					>
					Satellite
				</button>
			</div>
		</div>
	</header>

	<!-- Map area -->
	<div class="map-area">
		<!-- ── Illustrated SVG Map ── -->
		{#if view === 'illustrated'}
			<div class="svg-wrap">
				<svg
					viewBox="0 0 680 480"
					xmlns="http://www.w3.org/2000/svg"
					class="illus-map"
					role="img"
					aria-label="Illustrated map of Marianne Cottage and surroundings"
				>
					<!-- Background terrain -->
					<rect width="680" height="480" fill="#f0eee9" />

					<!-- Bocage field patches -->
					{#each [[40,140,160,120],[200,150,140,100],[390,160,130,90],[540,180,110,100],[80,280,120,120],[380,340,160,100],[500,360,120,100],[60,390,140,80]] as [x,y,w,h]}
						<rect {x} {y} width={w} height={h} rx="8" fill="#e8e4da" opacity="0.7" />
					{/each}

					<!-- Bocage hedge lines -->
					{#each [[40,260,200,260],[240,260,330,260],[380,260,540,260],[40,380,680,380],[200,140,200,380],[400,140,400,380],[100,140,100,260]] as [x1,y1,x2,y2]}
						<line {x1} {y1} {x2} {y2} stroke="#c8c0b0" stroke-width="3" stroke-dasharray="6 4" opacity="0.6" />
					{/each}

					<!-- Tree clusters (bocage) -->
					{#each [[130,195],[175,210],[455,190],[495,205],[130,310],[165,325],[450,300]] as [cx, cy]}
						<circle {cx} {cy} r="8" fill="#a9b7ac" opacity="0.5" />
						<circle cx={cx+12} cy={cy-3} r="6" fill="#9aaa9c" opacity="0.5" />
					{/each}

					<!-- Road from cottage towards beaches (north) -->
					<path
						d="M340 300 Q310 240 280 180 Q270 140 265 100"
						stroke="#d6ccc2"
						stroke-width="4"
						fill="none"
						stroke-linecap="round"
					/>
					<!-- Road towards abbey (NE) -->
					<path
						d="M340 300 Q400 270 450 240 Q480 230 510 230"
						stroke="#d6ccc2"
						stroke-width="4"
						fill="none"
						stroke-linecap="round"
					/>
					<!-- Local lane (west) -->
					<path
						d="M340 300 Q270 330 200 360"
						stroke="#d6ccc2"
						stroke-width="3"
						fill="none"
						stroke-linecap="round"
						stroke-dasharray="8 5"
					/>

					<!-- Coastline hint at top -->
					<path
						d="M0 65 Q80 55 160 62 Q220 68 280 58 Q360 48 440 60 Q520 70 600 55 Q640 50 680 58"
						stroke="#a9b7ac"
						stroke-width="2"
						fill="none"
						opacity="0.6"
					/>
					<text x="20" y="42" font-size="9" fill="#a9b7ac" font-family="'Playfair Display',serif" font-style="italic" letter-spacing="2">English Channel</text>

					<!-- Distance label -->
					<text x="280" y="155" font-size="8" fill="#b0a898" font-family="Inter,sans-serif" text-anchor="middle">~25km to coast</text>

					<!-- Nodes -->
					{#each NODES as node}
						<!-- glow ring on hover -->
						{#if hoveredNode === node.id}
							<circle
								cx={node.cx}
								cy={node.cy}
								r="26"
								fill="none"
								stroke={node.color}
								stroke-width="2"
								opacity="0.3"
							/>
						{/if}

						<!-- Node circle -->
						<circle
							cx={node.cx}
							cy={node.cy}
							r="18"
							fill={node.color}
							opacity={hoveredNode === node.id ? 1 : 0.85}
							style="cursor:pointer;transition:opacity 0.15s"
							onmouseenter={() => (hoveredNode = node.id)}
							onmouseleave={() => (hoveredNode = null)}
							onfocus={() => (hoveredNode = node.id)}
							onblur={() => (hoveredNode = null)}
							role="button"
							tabindex="0"
							aria-label={node.label}
						/>
						<!-- Icon -->
						<text
							x={node.cx}
							y={node.cy + 5}
							text-anchor="middle"
							font-size="13"
							style="pointer-events:none;user-select:none"
						>
							{node.icon}
						</text>
						<!-- Label -->
						<text
							x={node.cx}
							y={node.cy + 32}
							text-anchor="middle"
							font-size="8.5"
							fill={node.color}
							font-family="'Playfair Display',serif"
							font-weight="600"
							style="pointer-events:none"
						>
							{node.label}
						</text>
					{/each}

					<!-- Compass rose -->
					<g transform="translate(630, 430)">
						<circle r="20" fill="rgba(240,238,233,0.9)" stroke="#d6ccc2" stroke-width="1" />
						<text y="-8" text-anchor="middle" font-size="9" fill="#4a586e" font-weight="600" font-family="Inter,sans-serif">N</text>
						<line x1="0" y1="-5" x2="0" y2="-14" stroke="#4a586e" stroke-width="1.5" />
					</g>

					<!-- Scale hint -->
					<g transform="translate(30, 455)">
						<line x1="0" y1="0" x2="40" y2="0" stroke="#b0a898" stroke-width="1.5" />
						<line x1="0" y1="-4" x2="0" y2="4" stroke="#b0a898" stroke-width="1.5" />
						<line x1="40" y1="-4" x2="40" y2="4" stroke="#b0a898" stroke-width="1.5" />
						<text x="20" y="-6" text-anchor="middle" font-size="7" fill="#b0a898" font-family="Inter,sans-serif">~5km</text>
					</g>
				</svg>

				<!-- Tooltip card -->
				{#if activeNode}
					<div class="tooltip-card">
						<div class="tooltip-header">
							<span class="tooltip-icon">{activeNode.icon}</span>
							<div>
								<strong>{activeNode.label}</strong>
								<span class="tooltip-sub">{activeNode.sub}</span>
							</div>
						</div>
						<p>{activeNode.desc}</p>
					</div>
				{/if}
			</div>

		<!-- ── Leaflet Map ── -->
		{:else}
			<div class="leaflet-wrap">
				<div bind:this={mapEl} class="leaflet-container"></div>
				<div class="leaflet-legend">
					{#each [{ color: '#4a586e', label: 'Marianne Cottage' }, { color: '#7a6060', label: 'D-Day Sites' }, { color: '#8a7a5a', label: 'Abbey' }, { color: '#5a6a8a', label: 'Towns' }] as item}
						<div class="legend-item">
							<span class="legend-dot" style="background:{item.color}"></span>
							<span>{item.label}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Node list (below map on mobile, always visible) -->
	<section class="node-list">
		<div class="node-list-inner">
			{#each NODES as node}
				<button
					class="node-card"
					class:active={hoveredNode === node.id}
					onmouseenter={() => (hoveredNode = node.id)}
					onmouseleave={() => (hoveredNode = null)}
					onclick={() => (hoveredNode = hoveredNode === node.id ? null : node.id)}
				>
					<span class="nc-icon" style="background:{node.color}">{node.icon}</span>
					<div class="nc-text">
						<strong>{node.label}</strong>
						<span>{node.sub}</span>
					</div>
				</button>
			{/each}
		</div>
	</section>
</div>

<nav class="demo-footer-nav" aria-label="Demo pages">
	<a href="/">← Site</a>
	<span>|</span>
	<a href="/historian">historian</a>
	<a href="/living" aria-current="page">living</a>
	<a href="/nature">nature</a>
	<a href="/story">story</a>
	<span>·</span>
	<a href="/brutal">brutal</a>
	<a href="/calm">calm</a>
	<a href="/bento">bento</a>
	<a href="/kinetic">kinetic</a>
	<a href="/adaptive">adaptive</a>
	<a href="/ambient">ambient</a>
	<a href="/context">context</a>
	<a href="/retro">retro</a>
	<a href="/expressive">expressive</a>
	<a href="/spatial">spatial</a>
	<a href="/micro">micro</a>
	<a href="/ergonomic">ergonomic</a>
	<a href="/liquid">liquid</a>
	· <a href="/scroll-anim">scroll-anim</a> · <a href="/morph">morph</a> · <a href="/handmade">handmade</a> · <a href="/iridescent">iridescent</a>
</nav>

<style>
	.page {
		min-height: 100dvh;
		background: #f0eee9;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.page-header {
		padding: 2.5rem 2rem 1.5rem;
		border-bottom: 1px solid #d6ccc2;
		background: #f0eee9;
	}
	.header-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #a9b7ac;
		margin-bottom: 0.4rem;
		font-weight: 500;
	}
	h1 {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #3a3a3a;
		line-height: 1.1;
	}
	.header-sub {
		font-size: 0.9rem;
		color: #7a7a7a;
		margin-top: 0.4rem;
	}

	/* Toggle tabs */
	.toggle {
		display: flex;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		overflow: hidden;
		flex-shrink: 0;
	}
	.toggle button {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.6rem 1.1rem;
		background: #f0eee9;
		border: none;
		color: #7a7a7a;
		font-size: 0.82rem;
		cursor: pointer;
		font-family: inherit;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.toggle button:first-child {
		border-right: 1px solid #d6ccc2;
	}
	.toggle button.active {
		background: #4a586e;
		color: #f0eee9;
	}

	/* Map area */
	.map-area {
		flex: 1;
		position: relative;
		min-height: 480px;
	}

	/* SVG illustrated map */
	.svg-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 480px;
	}
	.illus-map {
		width: 100%;
		height: 100%;
		max-height: 520px;
	}

	/* Tooltip */
	.tooltip-card {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		width: min(400px, 90vw);
		background: #faf8f4;
		border: 1px solid #d6ccc2;
		border-radius: 4px;
		padding: 1rem 1.25rem;
		box-shadow: 0 4px 20px rgba(58, 58, 58, 0.12);
		pointer-events: none;
	}
	.tooltip-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}
	.tooltip-icon {
		font-size: 1.5rem;
		line-height: 1;
	}
	.tooltip-header strong {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: 0.95rem;
		color: #3a3a3a;
	}
	.tooltip-sub {
		font-size: 0.72rem;
		color: #a9b7ac;
		letter-spacing: 0.04em;
	}
	.tooltip-card p {
		font-size: 0.82rem;
		line-height: 1.65;
		color: #5a5a5a;
	}

	/* Leaflet */
	.leaflet-wrap {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 480px;
	}
	.leaflet-container {
		width: 100%;
		height: 100%;
		min-height: 480px;
	}
	.leaflet-legend {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(250, 248, 244, 0.92);
		backdrop-filter: blur(8px);
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		z-index: 400;
	}
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: #3a3a3a;
	}
	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Node list */
	.node-list {
		border-top: 1px solid #d6ccc2;
		padding: 1.5rem 2rem;
		background: #f7f4ef;
	}
	.node-list-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}
	.node-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e4dfd8;
		border-radius: 3px;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}
	.node-card.active,
	.node-card:hover {
		border-color: #a9b7ac;
		box-shadow: 0 2px 8px rgba(58, 58, 58, 0.06);
	}
	.nc-icon {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		flex-shrink: 0;
		opacity: 0.9;
	}
	.nc-text strong {
		display: block;
		font-size: 0.8rem;
		color: #3a3a3a;
		font-weight: 600;
		margin-bottom: 0.15rem;
	}
	.nc-text span {
		font-size: 0.7rem;
		color: #9a9a9a;
	}

	@media (max-width: 600px) {
		.page-header {
			padding: 1.5rem 1rem 1rem;
		}
		.node-list {
			padding: 1rem;
		}
		.node-list-inner {
			grid-template-columns: 1fr 1fr;
		}
	}
	.demo-footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.75rem;
		align-items: center;
		justify-content: center;
		padding: 1rem 1.5rem;
		background: #1e2a1e;
		font-size: 0.72rem;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
	}
	.demo-footer-nav a { color: #8aab8a; text-decoration: none; }
	.demo-footer-nav a:hover { color: #fff; }
	.demo-footer-nav a[aria-current] { color: #fff; font-weight: 700; }
	.demo-footer-nav span { color: #4a6a4a; }
</style>
