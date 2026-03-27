<script>
	import { onMount } from 'svelte';

	// ── Device context ────────────────────────────────────────────────────────
	let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 1200);

	const deviceMode = $derived(
		viewportWidth < 640 ? 'mobile' : viewportWidth <= 1024 ? 'tablet' : 'desktop'
	);

	const deviceIcon = $derived(
		deviceMode === 'mobile' ? '📱' : deviceMode === 'tablet' ? '📐' : '🖥'
	);

	// ── Time of day context ───────────────────────────────────────────────────
	const hour = new Date().getHours();

	const timeCtx = (() => {
		if (hour >= 6 && hour <= 11)
			return {
				label: 'morning',
				icon: '🌅',
				headline: 'Rise with the Normandy mist',
				callout: 'Perfect time for a guided bike ride',
				accentHue: '#c07850'
			};
		if (hour >= 12 && hour <= 17)
			return {
				label: 'afternoon',
				icon: '☀️',
				headline: 'The golden hour starts at check-in',
				callout: 'Join a wine tasting at 3pm',
				accentHue: '#7a9e7e'
			};
		if (hour >= 18 && hour <= 23)
			return {
				label: 'evening',
				icon: '🌆',
				headline: 'Your table at the terrace awaits',
				callout: "Reserve tonight's table d'hôte",
				accentHue: '#5a7a8a'
			};
		return {
			label: 'night',
			icon: '🌙',
			headline: 'The cottage is quietest at night',
			callout: 'Book ahead — summer fills fast',
			accentHue: '#3a3a5a'
		};
	})();

	// ── Scroll / engagement depth context ─────────────────────────────────────
	let scrollPct = $state(0);

	const ctaConfig = $derived(
		scrollPct <= 25
			? { label: 'Discover Marianne Cottage', urgent: false }
			: scrollPct <= 60
				? { label: 'Save your dates →', urgent: false }
				: { label: 'Ready to book? Reserve now', urgent: true }
	);

	// ── Layout overlay label ──────────────────────────────────────────────────
	const overlayLabel = $derived(
		`${deviceMode.charAt(0).toUpperCase() + deviceMode.slice(1)} · ${timeCtx.label.charAt(0).toUpperCase() + timeCtx.label.slice(1)} · ${Math.round(scrollPct)}% read`
	);

	// ── Mount ─────────────────────────────────────────────────────────────────
	onMount(() => {
		const onResize = () => { viewportWidth = window.innerWidth; };
		const onScroll = () => {
			const docH = document.documentElement.scrollHeight;
			const winH = window.innerHeight;
			const scrollable = docH - winH;
			scrollPct = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0;
		};

		window.addEventListener('resize', onResize, { passive: true });
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();

		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Context-Aware Layouts</title>
</svelte:head>

<div class="root" style="--sage: #7a9e7e; --cream: #f5f0e8; --terra: #c07850; --slate: #5a7a8a; --accent: {timeCtx.accentHue};">

	<!-- ── HEADER ────────────────────────────────────────────────────────────── -->
	<header class="site-header">
		<div class="logo">
			<span class="logo-serif">Marianne</span>
			<span class="logo-sans">Cottage</span>
		</div>

		<div class="signals-row" aria-label="Context signals">
			<span class="signal-badge device-badge" title="Viewport: {deviceMode}">
				{deviceIcon} {deviceMode}
			</span>
			<span class="signal-sep" aria-hidden="true">·</span>
			<span class="signal-badge time-badge" title="Time of day: {timeCtx.label}">
				{timeCtx.icon} {timeCtx.label}
			</span>
			<span class="signal-sep" aria-hidden="true">·</span>
			<span class="signal-badge scroll-badge" title="Scroll depth">
				{Math.round(scrollPct)}% read
			</span>
		</div>

		<!-- Live layout-mode pill top-right -->
		<div class="mode-pill" aria-live="polite" aria-label="Current layout mode: {deviceMode}">
			{deviceMode}
		</div>
	</header>

	<!-- ── HERO ──────────────────────────────────────────────────────────────── -->
	<section class="hero">
		<div class="hero-bg"></div>
		<div class="hero-overlay"></div>
		<div class="hero-content">
			<p class="hero-eyebrow">Normandy, France · Context-Aware</p>
			<h1 class="hero-title">{timeCtx.headline}</h1>
			<p class="hero-sub">The layout shifts with you — device, hour, intent.</p>
		</div>
		<div class="hero-scroll-cue" aria-hidden="true">scroll to explore</div>
	</section>

	<!-- ── CONTEXT CALLOUT BAR ───────────────────────────────────────────────── -->
	<div class="callout-bar" style="--bar-accent: {timeCtx.accentHue};">
		<span class="callout-label">Right now…</span>
		<span class="callout-text">{timeCtx.callout}</span>
		<span class="callout-time">{timeCtx.icon} {timeCtx.label}</span>
	</div>

	<!-- ── CONTENT CARDS ─────────────────────────────────────────────────────── -->
	<section class="cards-section">
		<p class="section-eyebrow">Cards reorder by device context</p>
		<div class="cards-grid" data-device={deviceMode}>

			<article class="card card-rooms" style="order: {deviceMode === 'desktop' ? 1 : 1};">
				<div class="card-img" style="background-image: url('/images/2024-08-15.jpg');"></div>
				<div class="card-body">
					<span class="card-tag">Rooms</span>
					<h3 class="card-title">Four quiet rooms</h3>
					<p class="card-text">Stone walls, linen sheets, the sound of the orchard at dusk. Each room reads the season differently.</p>
					<a href="#book" class="card-link">View rooms →</a>
				</div>
			</article>

			<article class="card card-gallery" style="order: {deviceMode === 'desktop' ? 2 : 3};">
				<div class="card-img" style="background-image: url('/images/2024-12-15.jpg');"></div>
				<div class="card-body">
					<span class="card-tag">Gallery</span>
					<h3 class="card-title">Light across the estate</h3>
					<p class="card-text">Photograph the mist before breakfast. The garden offers something different every hour.</p>
					<a href="#gallery" class="card-link">See gallery →</a>
				</div>
			</article>

			<article class="card card-explore" style="order: {deviceMode === 'desktop' ? 3 : 2};">
				<div class="card-img" style="background-image: url('/images/2024-12-15-(1).jpg');"></div>
				<div class="card-body">
					<span class="card-tag">Explore</span>
					<h3 class="card-title">Normandy, your way</h3>
					<p class="card-text">Cliffs, markets, cider farms, war memorials. We'll plan the day that fits your pace.</p>
					<a href="#explore" class="card-link">Explore region →</a>
				</div>
			</article>

		</div>

		<!-- Device context explainer -->
		<div class="layout-explainer">
			<div class="explainer-dot" style="background: {timeCtx.accentHue};"></div>
			<p>
				{#if deviceMode === 'mobile'}
					<strong>Mobile layout:</strong> Cards stack full-width, largest tap targets, essentials first.
				{:else if deviceMode === 'tablet'}
					<strong>Tablet layout:</strong> 2-column grid, rooms featured top-left, explore compressed.
				{:else}
					<strong>Desktop layout:</strong> 3-column grid, rooms featured with extra prominence at left.
				{/if}
			</p>
		</div>
	</section>

	<!-- ── ENGAGEMENT DEPTH VISUALISER ──────────────────────────────────────── -->
	<section class="depth-section">
		<h2 class="depth-heading">Engagement depth signals</h2>
		<div class="depth-track">
			<div class="depth-fill" style="width: {scrollPct}%; background: {timeCtx.accentHue};"></div>
		</div>
		<div class="depth-zones">
			<div class="depth-zone" class:active={scrollPct <= 25}>
				<span class="zone-pct">0–25%</span>
				<span class="zone-label">Discover</span>
				<span class="zone-desc">Browsing, first impression</span>
			</div>
			<div class="depth-zone" class:active={scrollPct > 25 && scrollPct <= 60}>
				<span class="zone-pct">26–60%</span>
				<span class="zone-label">Consider</span>
				<span class="zone-desc">Reading details, imagining</span>
			</div>
			<div class="depth-zone urgent" class:active={scrollPct > 60}>
				<span class="zone-pct">61–100%</span>
				<span class="zone-label">Ready</span>
				<span class="zone-desc">Intent to book — act now</span>
			</div>
		</div>
		<p class="depth-note">Scroll depth: <strong>{Math.round(scrollPct)}%</strong> — CTA below adapts in real time.</p>
	</section>

	<!-- ── ABOUT SECTION (adds scroll depth) ────────────────────────────────── -->
	<section class="about-section">
		<div class="about-inner">
			<h2 class="about-title">Why context changes everything</h2>
			<div class="about-grid">
				<div class="about-block">
					<h3>Device signals</h3>
					<p>A guest arriving on mobile at a trailhead needs different information than one planning from a desktop at home. The layout adjusts column counts, card ordering, and touch target sizes automatically.</p>
				</div>
				<div class="about-block">
					<h3>Temporal signals</h3>
					<p>Morning visitors think about breakfast and bike rides. Evening visitors wonder about the terrace menu. The same cottage, read at different hours, is a different invitation entirely.</p>
				</div>
				<div class="about-block">
					<h3>Engagement signals</h3>
					<p>A first-glance visitor needs discovery copy. A reader who has scrolled 80% of the page has already decided — they need a direct booking call-to-action, not more persuasion.</p>
				</div>
				<div class="about-block">
					<h3>No back-end needed</h3>
					<p>All three signals come from browser APIs: <code>window.innerWidth</code>, <code>new Date().getHours()</code>, and <code>window.scrollY</code>. Zero server round-trips, instant response.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- ── SPACER to make page scrollable ────────────────────────────────────── -->
	<section class="spacer-section">
		<div class="spacer-inner">
			<blockquote class="pull-quote">
				"The best interface is one that already knows what you need."
			</blockquote>
			<p class="spacer-sub">Keep scrolling to watch the CTA bar transform below.</p>
			<div class="scroll-indicators">
				{#each [0, 1, 2, 3, 4] as i}
					<div
						class="scroll-dot"
						class:lit={scrollPct > i * 20}
						style="background: {scrollPct > i * 20 ? timeCtx.accentHue : 'rgba(0,0,0,0.15)'};"
					></div>
				{/each}
			</div>
		</div>
	</section>

	<!-- ── STICKY CTA BAR ────────────────────────────────────────────────────── -->
	<div
		class="sticky-cta"
		class:urgent={ctaConfig.urgent}
		aria-live="polite"
		style="--cta-accent: {timeCtx.accentHue};"
	>
		<div class="sticky-cta-inner">
			<div class="sticky-cta-context">
				<span class="sticky-device">{deviceIcon} {deviceMode}</span>
				<span class="sticky-sep">·</span>
				<span class="sticky-time">{timeCtx.icon} {timeCtx.label}</span>
				<span class="sticky-sep">·</span>
				<span class="sticky-scroll">{Math.round(scrollPct)}%</span>
			</div>
			<a href="#book" class="sticky-cta-btn" class:btn-urgent={ctaConfig.urgent}>
				{ctaConfig.label}
			</a>
		</div>
	</div>

	<!-- ── LAYOUT MODE OVERLAY (bottom-left pill) ────────────────────────────── -->
	<div class="layout-overlay" aria-live="polite">
		{overlayLabel}
	</div>

	<!-- ── FOOTER NAV ─────────────────────────────────────────────────────────── -->
	<footer class="demo-footer">
		<p class="demo-footer-label">Design trend demos</p>
		<nav class="demo-nav" aria-label="Demo pages">
			<a href="/brutal">brutal</a>
			<span aria-hidden="true">·</span>
			<a href="/calm">calm</a>
			<span aria-hidden="true">·</span>
			<a href="/bento">bento</a>
			<span aria-hidden="true">·</span>
			<a href="/kinetic">kinetic</a>
			<span aria-hidden="true">·</span>
			<a href="/adaptive">adaptive</a>
			<span aria-hidden="true">·</span>
			<a href="/ambient">ambient</a>
			<span aria-hidden="true">·</span>
			<a href="/context" aria-current="page">context</a>
			<span aria-hidden="true">·</span>
			<a href="/retro">retro</a>
			<span aria-hidden="true">·</span>
			<a href="/expressive">expressive</a>
			<span aria-hidden="true">·</span>
			<a href="/spatial">spatial</a>
			<span aria-hidden="true">·</span>
			<a href="/micro">micro</a>
			<span aria-hidden="true">·</span>
			<a href="/ergonomic">ergonomic</a>
			<span aria-hidden="true">·</span>
			<a href="/liquid">liquid</a>
			<span aria-hidden="true">·</span>
			<a href="/scroll-anim">scroll-anim</a>
			<span aria-hidden="true">·</span>
			<a href="/morph">morph</a>
			<span aria-hidden="true">·</span>
			<a href="/handmade">handmade</a>
			<span aria-hidden="true">·</span>
			<a href="/iridescent">iridescent</a>
			<span aria-hidden="true">·</span>
			<a href="/dday">dday</a>
		</nav>
	</footer>

</div>

<style>
	/* ── Root ───────────────────────────────────────────────────────────────── */
	.root {
		width: 100%;
		min-height: 100vh;
		overflow-x: hidden;
		position: relative;
	}

	/* ── HEADER ─────────────────────────────────────────────────────────────── */
	.site-header {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.9rem 1.5rem;
		background: rgba(245, 240, 232, 0.92);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(58, 58, 58, 0.08);
	}

	.logo {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		margin-right: auto;
		flex-shrink: 0;
	}

	.logo-serif {
		font-family: 'Playfair Display', serif;
		font-size: 1.1rem;
		font-weight: 400;
		color: #3a3a3a;
	}

	.logo-sans {
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 500;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #3a3a3a;
		opacity: 0.5;
	}

	.signals-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.signal-badge {
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		font-weight: 500;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		white-space: nowrap;
		transition: background 0.4s ease, color 0.4s ease;
	}

	.device-badge {
		background: rgba(90, 122, 138, 0.12);
		color: var(--slate);
	}

	.time-badge {
		background: color-mix(in srgb, var(--accent) 14%, transparent);
		color: var(--accent);
	}

	.scroll-badge {
		background: rgba(122, 158, 126, 0.12);
		color: var(--sage);
	}

	.signal-sep {
		opacity: 0.25;
		font-size: 0.65rem;
	}

	.mode-pill {
		font-family: 'Inter', sans-serif;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		padding: 0.22rem 0.7rem;
		border-radius: 20px;
		background: var(--accent);
		color: #fff;
		transition: background 0.5s ease;
		flex-shrink: 0;
	}

	/* ── HERO ───────────────────────────────────────────────────────────────── */
	.hero {
		position: relative;
		width: 100%;
		height: 90svh;
		min-height: 480px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background-image: url('/images/2024-08-15.jpg');
		background-size: cover;
		background-position: center 30%;
		transition: filter 1.2s ease;
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			160deg,
			rgba(10, 10, 8, 0.55) 0%,
			rgba(10, 10, 8, 0.35) 50%,
			rgba(10, 10, 8, 0.65) 100%
		);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		text-align: center;
		color: #fff;
		padding: 0 1.5rem;
		max-width: 760px;
	}

	.hero-eyebrow {
		font-family: 'Inter', sans-serif;
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.6;
		margin-bottom: 1.25rem;
	}

	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 6.5vw, 5rem);
		font-weight: 400;
		font-style: italic;
		line-height: 1.12;
		margin-bottom: 1.25rem;
		transition: opacity 0.6s ease;
	}

	.hero-sub {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		opacity: 0.55;
		letter-spacing: 0.04em;
	}

	.hero-scroll-cue {
		position: absolute;
		bottom: 1.75rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		color: rgba(255, 255, 255, 0.35);
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		animation: gentle-bob 2.5s ease-in-out infinite;
	}

	@keyframes gentle-bob {
		0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.35; }
		50%       { transform: translateX(-50%) translateY(-5px); opacity: 0.6; }
	}

	/* ── CONTEXT CALLOUT BAR ────────────────────────────────────────────────── */
	.callout-bar {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 2rem;
		background: color-mix(in srgb, var(--bar-accent) 10%, var(--cream));
		border-top: 2px solid var(--bar-accent);
		flex-wrap: wrap;
		transition: background 0.6s ease, border-color 0.6s ease;
	}

	.callout-label {
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.4;
		white-space: nowrap;
	}

	.callout-text {
		font-family: 'Playfair Display', serif;
		font-size: 1.05rem;
		font-style: italic;
		color: #3a3a3a;
		flex: 1;
		min-width: 180px;
	}

	.callout-time {
		font-family: 'Inter', sans-serif;
		font-size: 0.7rem;
		padding: 0.2rem 0.7rem;
		border-radius: 20px;
		background: var(--bar-accent);
		color: #fff;
		white-space: nowrap;
		transition: background 0.6s ease;
	}

	/* ── CARDS SECTION ──────────────────────────────────────────────────────── */
	.cards-section {
		padding: 5rem 2rem 4rem;
		background: var(--cream);
	}

	.section-eyebrow {
		font-family: 'Inter', sans-serif;
		font-size: 0.62rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.35;
		text-align: center;
		margin-bottom: 2.5rem;
	}

	/* Mobile: 1 col */
	.cards-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	/* Tablet: 2 col */
	@media (min-width: 640px) {
		.cards-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Desktop: 3 col, first card featured wider */
	@media (min-width: 1025px) {
		.cards-grid {
			grid-template-columns: 1.4fr 1fr 1fr;
		}
	}

	.card {
		background: #fff;
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.card-img {
		aspect-ratio: 16 / 9;
		background-size: cover;
		background-position: center;
		flex-shrink: 0;
		transition: transform 0.5s ease;
	}

	.card:hover .card-img {
		transform: scale(1.03);
	}

	.card-body {
		padding: 1.5rem 1.25rem 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.card-tag {
		font-family: 'Inter', sans-serif;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--accent);
		opacity: 0.7;
	}

	.card-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.2rem;
		font-weight: 400;
		color: #3a3a3a;
		line-height: 1.3;
	}

	.card-text {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		line-height: 1.65;
		color: #3a3a3a;
		opacity: 0.65;
		flex: 1;
	}

	.card-link {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: var(--accent);
		text-decoration: none;
		margin-top: 0.25rem;
		transition: opacity 0.2s ease;
	}

	.card-link:hover {
		opacity: 0.7;
	}

	/* Layout explainer note */
	.layout-explainer {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		max-width: 1200px;
		margin: 2rem auto 0;
		padding: 1rem 1.25rem;
		background: rgba(58, 58, 58, 0.04);
		border-radius: 4px;
		border-left: 3px solid var(--accent);
	}

	.explainer-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
		margin-top: 0.35rem;
		transition: background 0.4s ease;
	}

	.layout-explainer p {
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #3a3a3a;
		opacity: 0.7;
		margin: 0;
	}

	.layout-explainer strong {
		opacity: 1;
		font-weight: 600;
	}

	/* ── ENGAGEMENT DEPTH SECTION ───────────────────────────────────────────── */
	.depth-section {
		padding: 5rem 2rem;
		background: #eceae4;
	}

	.depth-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.4rem, 3vw, 2rem);
		font-weight: 400;
		text-align: center;
		margin-bottom: 2.5rem;
		color: #3a3a3a;
	}

	.depth-track {
		max-width: 720px;
		margin: 0 auto 2rem;
		height: 6px;
		background: rgba(58, 58, 58, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.depth-fill {
		height: 100%;
		border-radius: 3px;
		transition: width 0.2s ease, background 0.6s ease;
		min-width: 3px;
	}

	.depth-zones {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		max-width: 720px;
		margin: 0 auto 2rem;
	}

	@media (max-width: 480px) {
		.depth-zones {
			grid-template-columns: 1fr;
		}
	}

	.depth-zone {
		padding: 1.25rem 1rem;
		background: #f5f0e8;
		border-radius: 4px;
		border: 1.5px solid transparent;
		transition: border-color 0.3s ease, background 0.3s ease;
		text-align: center;
	}

	.depth-zone.active {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 6%, #f5f0e8);
	}

	.depth-zone.urgent.active {
		border-color: var(--terra);
		background: color-mix(in srgb, var(--terra) 8%, #f5f0e8);
	}

	.zone-pct {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.35;
		margin-bottom: 0.4rem;
	}

	.zone-label {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		font-weight: 400;
		color: #3a3a3a;
		margin-bottom: 0.4rem;
	}

	.zone-desc {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		line-height: 1.5;
		opacity: 0.5;
	}

	.depth-note {
		text-align: center;
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		opacity: 0.55;
		margin: 0;
	}

	.depth-note strong {
		color: var(--accent);
		opacity: 1;
		font-weight: 600;
	}

	/* ── ABOUT SECTION ──────────────────────────────────────────────────────── */
	.about-section {
		padding: 6rem 2rem;
		background: #f7f5f0;
	}

	.about-inner {
		max-width: 1100px;
		margin: 0 auto;
	}

	.about-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.5rem, 3.5vw, 2.4rem);
		font-weight: 400;
		color: #3a3a3a;
		margin-bottom: 3rem;
		text-align: center;
	}

	.about-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2.5rem 3rem;
	}

	@media (max-width: 640px) {
		.about-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	.about-block h3 {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 0.75rem;
		transition: color 0.5s ease;
	}

	.about-block p {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		line-height: 1.75;
		color: #3a3a3a;
		opacity: 0.7;
		margin: 0;
	}

	.about-block code {
		font-family: 'Inter', monospace;
		font-size: 0.82rem;
		background: rgba(58, 58, 58, 0.07);
		padding: 0.1rem 0.35rem;
		border-radius: 3px;
	}

	/* ── SPACER SECTION ─────────────────────────────────────────────────────── */
	.spacer-section {
		padding: 8rem 2rem;
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--accent) 8%, #f0eee9) 0%,
			#f0eee9 100%
		);
		text-align: center;
		transition: background 0.8s ease;
	}

	.spacer-inner {
		max-width: 560px;
		margin: 0 auto;
	}

	.pull-quote {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.4rem, 4vw, 2.2rem);
		font-weight: 400;
		font-style: italic;
		color: #3a3a3a;
		line-height: 1.4;
		margin: 0 0 1.5rem;
		border: none;
		padding: 0;
	}

	.spacer-sub {
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		opacity: 0.45;
		letter-spacing: 0.05em;
		margin-bottom: 2rem;
	}

	.scroll-indicators {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
	}

	.scroll-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		transition: background 0.3s ease, transform 0.3s ease;
	}

	.scroll-dot.lit {
		transform: scale(1.3);
	}

	/* ── STICKY CTA BAR ─────────────────────────────────────────────────────── */
	.sticky-cta {
		position: sticky;
		bottom: 0;
		z-index: 90;
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--sage) 22%, #f5f0e8),
			color-mix(in srgb, var(--terra) 18%, #f5f0e8)
		);
		border-top: 1px solid rgba(58, 58, 58, 0.1);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		transition: background 0.5s ease;
	}

	.sticky-cta.urgent {
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--terra) 25%, #f5f0e8),
			color-mix(in srgb, var(--terra) 12%, #f5f0e8)
		);
	}

	.sticky-cta-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1.75rem;
		max-width: 1200px;
		margin: 0 auto;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.sticky-cta-context {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		color: #3a3a3a;
		opacity: 0.55;
	}

	.sticky-sep {
		opacity: 0.4;
	}

	.sticky-cta-btn {
		font-family: 'Inter', sans-serif;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.7rem 1.8rem;
		border-radius: 3px;
		text-decoration: none;
		background: var(--cta-accent);
		color: #fff;
		transition: background 0.4s ease, transform 0.25s ease, box-shadow 0.25s ease;
		white-space: nowrap;
	}

	.sticky-cta-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
	}

	.sticky-cta-btn.btn-urgent {
		background: var(--terra);
		animation: pulse-urgent 1.8s ease-in-out infinite;
	}

	@keyframes pulse-urgent {
		0%, 100% { box-shadow: 0 0 0 0 rgba(192, 120, 80, 0); }
		50%       { box-shadow: 0 0 0 6px rgba(192, 120, 80, 0.2); }
	}

	/* ── LAYOUT OVERLAY (bottom-left pill) ──────────────────────────────────── */
	.layout-overlay {
		position: fixed;
		bottom: 5.5rem;
		left: 1.25rem;
		z-index: 95;
		font-family: 'Inter', sans-serif;
		font-size: 0.62rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		padding: 0.35rem 0.9rem;
		border-radius: 20px;
		background: rgba(20, 20, 20, 0.72);
		color: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		pointer-events: none;
		transition: opacity 0.3s ease;
		white-space: nowrap;
	}

	/* ── FOOTER NAV ─────────────────────────────────────────────────────────── */
	.demo-footer {
		padding: 2.5rem 2rem;
		border-top: 1px solid rgba(58, 58, 58, 0.1);
		text-align: center;
		background: #f0eee9;
	}

	.demo-footer-label {
		font-family: 'Inter', sans-serif;
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.3;
		margin-bottom: 0.85rem;
	}

	.demo-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.6rem;
		justify-content: center;
		align-items: center;
	}

	.demo-nav a {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		color: #3a3a3a;
		text-decoration: none;
		opacity: 0.45;
		transition: opacity 0.2s ease;
		letter-spacing: 0.03em;
	}

	.demo-nav a:hover {
		opacity: 0.9;
	}

	.demo-nav a[aria-current='page'] {
		opacity: 1;
		font-weight: 600;
		color: var(--accent);
	}

	.demo-nav span {
		opacity: 0.2;
		font-size: 0.65rem;
	}
</style>
