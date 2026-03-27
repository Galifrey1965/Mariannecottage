<script lang="ts">
	let hoveredProto: string | null = $state(null);
	let hoveredDemo: string | null = $state(null);

	const prototypes = [
		{
			file: '/prototypes/prototype.html',
			name: 'Liquid Glass',
			desc: 'Animated mesh gradient, layered glassmorphism, mouse-tracked cyan & amber accents — complete pages with real property images',
			palette: ['#0a1a2e', '#00d4ff', '#ff8c00', '#1a3a5c'],
			label: 'Dark · Glass',
		},
		{
			file: '/prototypes/prototype-02.html',
			name: 'Neo-Brutalist Editorial',
			desc: 'Raw black & electric yellow, Bebas Neue, zero border-radius, offset press-effect shadows, scanline texture',
			palette: ['#0a0a0a', '#f5e642', '#f0f0f0', '#333333'],
			label: 'Dark · Bold',
		},
		{
			file: '/prototypes/prototype-03.html',
			name: 'Bento Spatial Light',
			desc: 'White-mode asymmetric bento grid, Plus Jakarta Sans, Apple blue accents, spatial depth layering',
			palette: ['#ffffff', '#0066ff', '#f5f5f7', '#1d1d1f'],
			label: 'Light · Grid',
		},
		{
			file: '/prototypes/prototype-04.html',
			name: 'Cinematic Luxury',
			desc: 'Deep charcoal, Cormorant Garamond italic, warm gold highlights, diagonal clip-path section cuts',
			palette: ['#0c0a07', '#c9a96e', '#1a1410', '#f5f0e8'],
			label: 'Dark · Luxury',
		},
		{
			file: '/prototypes/prototype-05.html',
			name: 'Terrain & Organic',
			desc: 'Parchment warmth, Playfair Display, forest green, topographic SVG patterns, trail-style POI timeline',
			palette: ['#f5efe0', '#5a7c5a', '#c8b89a', '#2c3e28'],
			label: 'Light · Organic',
		},
	];

	const categories = [
		{
			id: 'original',
			label: 'Original',
			accent: '#c9a84c',
			demos: [
				{ route: '/historian', name: 'The Historian', desc: 'Editorial long-read layout with antique maps and historical typography' },
				{ route: '/living', name: 'The Map', desc: 'Interactive SVG map exploring the local Normandy area' },
				{ route: '/nature', name: 'Nature Distilled', desc: 'Organic, nature-immersed aesthetic with glass navigation' },
				{ route: '/story', name: 'The Story', desc: "Narrative scrollytelling tracing the cottage's history by chapter" },
			],
		},
		{
			id: 'visual',
			label: 'Visual / UX Trends',
			accent: '#c07850',
			demos: [
				{ route: '/brutal', name: 'Neo-Brutalism', desc: 'Zero border-radius, thick borders, press-effect buttons, raw monospace typography' },
				{ route: '/calm', name: 'Neo-Minimalism', desc: 'Scroll-snap five-section journey with one-field-at-a-time form' },
				{ route: '/bento', name: 'Bento Grid', desc: 'Named CSS Grid areas, inline SVG map, reactive guest stepper' },
				{ route: '/kinetic', name: 'Kinetic Typography', desc: 'Anybody variable font with scroll-driven font-variation-settings' },
				{ route: '/retro', name: 'Retro-Futurism', desc: 'Y2K aesthetic: chrome gradients, neon glow, animated boot screen' },
			],
		},
		{
			id: 'adaptive',
			label: 'Adaptive Systems',
			accent: '#7a9e7e',
			demos: [
				{ route: '/adaptive', name: 'Hyper-Personalisation', desc: 'localStorage travel style selector morphs layout, colours and recommendations' },
				{ route: '/ambient', name: 'Zero-UI / Ambient', desc: 'Interface fades away at rest, reveals on hover; time-of-day colour modes' },
				{ route: '/context', name: 'Context-Aware Layouts', desc: 'Reacts to device width, time of day, and scroll depth in real time' },
				{ route: '/ergonomic', name: 'Ergonomic Patterns', desc: 'Thumb-zone visualiser, bottom sheet, swipe-to-act rows, FAB cluster' },
			],
		},
		{
			id: 'material',
			label: 'Material & Visual',
			accent: '#5a8a8a',
			demos: [
				{ route: '/liquid', name: 'Liquid Glass', desc: 'Glassmorphism with mouse-tracked light refraction and layered glass panels' },
				{ route: '/expressive', name: 'Material Expressive', desc: 'M3+ spring motion, large border-radius, tonal palettes, segmented controls' },
				{ route: '/micro', name: 'Micro-interactions', desc: '8 purposeful widgets: heartbeat, loading states, skeleton, magnetic button, stars' },
				{ route: '/spatial', name: '2.5D Spatial', desc: 'Mouse parallax depth layers, 3D card flip, depth-of-field film strip' },
			],
		},
		{
			id: 'cutting',
			label: 'Cutting Edge',
			accent: '#5a5a9e',
			demos: [
				{ route: '/scroll-anim', name: 'Scroll-Driven Animations', desc: 'Pure CSS animation-timeline: view() and scroll() — zero JavaScript' },
				{ route: '/morph', name: 'View Transitions API', desc: 'document.startViewTransition() morphs cards, tabs, and booking steps' },
				{ route: '/handmade', name: 'Crafted Aesthetic', desc: 'Grain overlays, wobbly SVG dividers, wax seals, ink-bleed typography' },
				{ route: '/iridescent', name: 'Iridescent Colour', desc: 'Spectral hue rotation tracking mouse position, pearl shimmer text, holographic card tilt' },
			],
		},
		{
			id: 'special',
			label: 'Special',
			accent: '#8b1a1a',
			demos: [
				{ route: '/dday', name: 'D-Day · June 6, 1944', desc: 'Five nations, five beaches: an interactive WW2 Normandy liberation scrollytelling experience' },
			],
		},
	];

</script>

<svelte:head>
	<title>Design Showcase — Marianne Cottage</title>
	<meta name="description" content="27 UI/UX design explorations for Marianne Cottage — 5 standalone prototypes and 22 SvelteKit demos." />
</svelte:head>

<div class="page">
	<!-- Hero -->
	<header class="hero">
		<div class="hero-inner">
			<a class="back-link" href="https://mariannecottage.netlify.app" target="_blank" rel="noopener">
				← mariannecottage.netlify.app
			</a>
			<p class="pretitle">MARIANNE COTTAGE · DESIGN SHOWCASE</p>
			<h1 class="headline">27 Designs.<br />Every Direction.</h1>
			<p class="subline">
				Five standalone HTML/CSS prototypes exploring different aesthetic directions for the cottage,
				plus 22 SvelteKit demos covering every major modern web design trend.
			</p>
			<div class="pills">
				<span class="pill">5 prototypes</span>
				<span class="pill">22 SvelteKit demos</span>
				<span class="pill">Marianne Cottage, Normandy</span>
			</div>
		</div>
	</header>

	<main class="main">
		<!-- Prototypes section -->
		<section class="animate-section proto-section">
			<div class="section-header">
				<h2 class="section-title">Standalone Prototypes</h2>
				<p class="section-sub">Complete HTML/CSS/JS multi-page experiences — no framework required</p>
			</div>
			<div class="proto-grid">
				{#each prototypes as proto, i}
					<a
						class="proto-card"
						href={proto.file}
						target="_blank"
						rel="noopener"
						style="--delay: {i * 0.09}s"
						onmouseenter={() => (hoveredProto = proto.file)}
						onmouseleave={() => (hoveredProto = null)}
						class:proto-card--hovered={hoveredProto === proto.file}
					>
						<div class="proto-palette">
							{#each proto.palette as swatch}
								<span class="swatch" style="background: {swatch}"></span>
							{/each}
						</div>
						<div class="proto-body">
							<span class="proto-label">{proto.label}</span>
							<p class="proto-name">{proto.name}</p>
							<p class="proto-desc">{proto.desc}</p>
							<span class="view-link">Open prototype →</span>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<div class="divider"></div>

		<!-- Demo categories -->
		<div class="demos-header animate-section">
			<h2 class="section-title">SvelteKit Demos</h2>
			<p class="section-sub">22 self-contained demos — each a fully-built design system for the cottage</p>
		</div>

		{#each categories as category}
			<section class="animate-section category-section" style="--accent: {category.accent}">
				<h3 class="category-heading">{category.label}</h3>
				<div class="card-grid">
					{#each category.demos as demo, i}
						<a
							class="card"
							href={demo.route}
							style="--delay: {i * 0.07}s"
							onmouseenter={() => (hoveredDemo = category.id + demo.route)}
							onmouseleave={() => (hoveredDemo = null)}
							class:card--hovered={hoveredDemo === category.id + demo.route}
						>
							<div class="card-accent-bar"></div>
							<div class="card-body">
								<span class="route-pill">{demo.route}</span>
								<p class="card-name">{demo.name}</p>
								<p class="card-desc">{demo.desc}</p>
								<span class="view-link">View →</span>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/each}
	</main>

	<footer class="footer">
		<div class="footer-inner">
			<p class="footer-copy">
				Built with SvelteKit · Deployed on Netlify · Marianne Cottage, Bayeux, Normandy
			</p>
			<a class="footer-back" href="https://mariannecottage.netlify.app" target="_blank" rel="noopener">
				← Back to mariannecottage.netlify.app
			</a>
		</div>
	</footer>
</div>

<style>
	/* ── Page shell ──────────────────────────────────────────── */
	.page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* ── Hero ────────────────────────────────────────────────── */
	.hero {
		background: #1a2418;
		color: #f0eee9;
		padding: 3.5rem 1.5rem 3rem;
	}

	.hero-inner {
		max-width: 960px;
		margin: 0 auto;
		position: relative;
	}

	.back-link {
		position: absolute;
		top: 0;
		right: 0;
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		color: rgba(240, 238, 233, 0.5);
		text-decoration: none;
		letter-spacing: 0.02em;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: rgba(240, 238, 233, 0.9);
	}

	.pretitle {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		color: rgba(240, 238, 233, 0.45);
		margin-bottom: 1.25rem;
		text-transform: uppercase;
	}

	.headline {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(2.4rem, 6vw, 4rem);
		font-weight: 700;
		line-height: 1.08;
		color: #f0eee9;
		margin-bottom: 1rem;
	}

	.subline {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 300;
		line-height: 1.65;
		color: rgba(240, 238, 233, 0.7);
		max-width: 640px;
		margin-bottom: 1.75rem;
	}

	.pills {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.pill {
		display: inline-block;
		padding: 0.35rem 0.85rem;
		border: 1px solid rgba(240, 238, 233, 0.22);
		border-radius: 999px;
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		font-weight: 500;
		color: rgba(240, 238, 233, 0.72);
		letter-spacing: 0.03em;
	}

	/* ── Main ────────────────────────────────────────────────── */
	.main {
		flex: 1;
		max-width: 1040px;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
		width: 100%;
	}

	/* ── Animate sections ─────────────────────────────────────── */
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(18px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.animate-section {
		animation: fadeUp 0.5s ease both;
	}

	/* ── Section headers ──────────────────────────────────────── */
	.section-header,
	.demos-header {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.6rem;
		font-weight: 700;
		color: #1a2418;
		margin-bottom: 0.35rem;
	}

	.section-sub {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		color: #7a7a72;
		font-weight: 300;
	}

	.divider {
		border: none;
		border-top: 1px solid rgba(58, 58, 58, 0.1);
		margin: 3rem 0;
	}

	/* ── Prototype grid ───────────────────────────────────────── */
	.proto-section {
		margin-bottom: 0;
	}

	.proto-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 680px) {
		.proto-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 900px) {
		.proto-grid {
			grid-template-columns: repeat(5, 1fr);
		}
	}

	/* ── Prototype card ───────────────────────────────────────── */
	.proto-card {
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 2px 8px rgba(0, 0, 0, 0.04);
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		animation: fadeUp 0.4s ease var(--delay, 0s) both;
	}

	.proto-card--hovered,
	.proto-card:hover {
		transform: translateY(-3px) !important;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.13), 0 12px 32px rgba(0, 0, 0, 0.06) !important;
	}

	.proto-palette {
		display: flex;
		height: 36px;
		flex-shrink: 0;
	}

	.swatch {
		flex: 1;
		display: block;
	}

	.proto-body {
		padding: 0.85rem 0.9rem 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		flex: 1;
	}

	.proto-label {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #9a9a92;
		text-transform: uppercase;
	}

	.proto-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1a2418;
		line-height: 1.2;
	}

	.proto-desc {
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		color: #6a6a6a;
		line-height: 1.5;
		flex: 1;
	}

	.view-link {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 600;
		color: #7a9e7e;
		display: block;
		margin-top: 0.4rem;
		letter-spacing: 0.02em;
	}

	/* ── Category sections ────────────────────────────────────── */
	.category-section {
		margin-bottom: 3rem;
	}

	.category-heading {
		font-family: 'Inter', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(58, 58, 58, 0.1);
	}

	/* ── Demo card grid ───────────────────────────────────────── */
	.card-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}

	@media (min-width: 840px) {
		.card-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.card {
		background: #ffffff;
		border-radius: 12px;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 2px 8px rgba(0, 0, 0, 0.04);
		text-decoration: none;
		color: inherit;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		animation: fadeUp 0.4s ease var(--delay, 0s) both;
	}

	.card--hovered,
	.card:hover {
		transform: translateY(-2px) !important;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.06) !important;
	}

	.card-accent-bar {
		height: 4px;
		background: var(--accent);
		flex-shrink: 0;
	}

	.card-body {
		padding: 0.9rem 1rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
	}

	.route-pill {
		display: inline-block;
		align-self: flex-start;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.67rem;
		font-weight: 600;
		background: #1a2418;
		color: #f0eee9;
		padding: 0.18rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.03em;
	}

	.card-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1rem;
		font-weight: 700;
		color: #1a2418;
		line-height: 1.25;
		margin-top: 0.1rem;
	}

	.card-desc {
		font-family: 'Inter', sans-serif;
		font-size: 0.83rem;
		color: #6a6a6a;
		line-height: 1.5;
		flex: 1;
	}

	/* ── Footer ──────────────────────────────────────────────── */
	.footer {
		background: #1a2418;
		color: rgba(240, 238, 233, 0.55);
		padding: 2rem 1.5rem;
	}

	.footer-inner {
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		align-items: center;
		text-align: center;
	}

	.footer-copy {
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		letter-spacing: 0.02em;
	}

	.footer-back {
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		color: rgba(240, 238, 233, 0.48);
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-back:hover {
		color: rgba(240, 238, 233, 0.9);
	}
</style>
