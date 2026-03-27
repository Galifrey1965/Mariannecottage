<script lang="ts">
	import { onMount } from 'svelte';

	let hoveredCard: string | null = $state(null);

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

	onMount(() => {
		const sections = document.querySelectorAll<HTMLElement>('.category-section');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.08 }
		);
		sections.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Design Showcase — Marianne Cottage</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<header class="hero">
		<div class="hero-inner">
			<a class="back-link" href="https://mariannecottage.netlify.app" target="_blank" rel="noopener">
				← mariannecottage.netlify.app
			</a>
			<p class="pretitle">MARIANNE COTTAGE · DESIGN SHOWCASE</p>
			<h1 class="headline">22 Demos. Every Trend.</h1>
			<p class="subline">
				A living catalogue of modern web design patterns — from CSS scroll-driven animations to WW2
				scrollytelling. Each demo is self-contained and built for a luxury Normandy cottage.
			</p>
			<div class="pills">
				<span class="pill">22 demos</span>
				<span class="pill">Built with SvelteKit</span>
			</div>
		</div>
	</header>

	<!-- Categories -->
	<main class="main">
		{#each categories as category}
			<section class="category-section" style="--accent: {category.accent}">
				<h2 class="category-heading">{category.label}</h2>
				<div class="card-grid">
					{#each category.demos as demo, i}
						<a
							class="card"
							href={demo.route}
							style="--delay: {i * 0.07}s"
							onmouseenter={() => (hoveredCard = category.id + demo.route)}
							onmouseleave={() => (hoveredCard = null)}
							class:card--hovered={hoveredCard === category.id + demo.route}
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

	<!-- Footer -->
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
		max-width: 900px;
		margin: 0 auto;
		position: relative;
	}

	.back-link {
		position: absolute;
		top: 0;
		right: 0;
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		color: rgba(240, 238, 233, 0.55);
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
		color: rgba(240, 238, 233, 0.5);
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
		color: rgba(240, 238, 233, 0.72);
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
		border: 1px solid rgba(240, 238, 233, 0.25);
		border-radius: 999px;
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		font-weight: 500;
		color: rgba(240, 238, 233, 0.75);
		letter-spacing: 0.03em;
	}

	/* ── Main content ────────────────────────────────────────── */
	.main {
		flex: 1;
		max-width: 960px;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
		width: 100%;
	}

	/* ── Category sections ───────────────────────────────────── */
	.category-section {
		margin-bottom: 3.5rem;
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}

	.category-section.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.category-heading {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		font-variant: small-caps;
		color: var(--accent);
		margin-bottom: 1.1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(58, 58, 58, 0.1);
	}

	/* ── Card grid ───────────────────────────────────────────── */
	.card-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (min-width: 840px) {
		.card-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	/* ── Demo card ───────────────────────────────────────────── */
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
		opacity: 0;
		transform: translateY(16px);
	}

	.category-section.visible .card {
		opacity: 1;
		transform: translateY(0);
		transition:
			opacity 0.4s ease var(--delay, 0s),
			transform 0.4s ease var(--delay, 0s),
			box-shadow 0.2s ease,
			box-shadow 0.2s ease;
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
		font-size: 0.68rem;
		font-weight: 600;
		background: #1a2418;
		color: #f0eee9;
		padding: 0.18rem 0.5rem;
		border-radius: 4px;
		letter-spacing: 0.03em;
	}

	.card-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.05rem;
		font-weight: 700;
		color: #1a2418;
		line-height: 1.25;
		margin-top: 0.1rem;
	}

	.card-desc {
		font-family: 'Inter', sans-serif;
		font-size: 0.845rem;
		color: #6a6a6a;
		line-height: 1.5;
		flex: 1;
	}

	.view-link {
		font-family: 'Inter', sans-serif;
		font-size: 0.78rem;
		font-weight: 600;
		color: #7a9e7e;
		text-align: right;
		display: block;
		margin-top: 0.5rem;
		letter-spacing: 0.02em;
	}

	/* ── Footer ──────────────────────────────────────────────── */
	.footer {
		background: #1a2418;
		color: rgba(240, 238, 233, 0.55);
		padding: 2rem 1.5rem;
	}

	.footer-inner {
		max-width: 900px;
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
		color: rgba(240, 238, 233, 0.5);
		text-decoration: none;
		transition: color 0.2s;
	}

	.footer-back:hover {
		color: rgba(240, 238, 233, 0.9);
	}
</style>
