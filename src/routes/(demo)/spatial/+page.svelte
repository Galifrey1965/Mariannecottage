<script>
	import { onMount } from 'svelte';

	// ── Mouse parallax ────────────────────────────────────────────────────────
	let mouseX = $state(0);
	let mouseY = $state(0);
	let targetX = 0;
	let targetY = 0;
	let rafId = 0;

	// ── Film strip ────────────────────────────────────────────────────────────
	let activeFilm = $state(2);

	const filmStrip = [
		{ color: '#c8b99a', label: 'The Orchard at Dawn' },
		{ color: '#9aac8a', label: 'Garden Gate' },
		{ color: '#8a9eac', label: 'Marianne Cottage' },
		{ color: '#ac9a8a', label: 'The Stone Room' },
		{ color: '#a89aac', label: 'Evening Terrace' }
	];

	// ── Room cards ────────────────────────────────────────────────────────────
	const rooms = [
		{
			name: 'The Garden Room',
			price: 'From €120',
			bg: '#9aac8a',
			desc: 'Wake to birdsong and orchard blossom. Ground floor, private terrace, oak furniture.'
		},
		{
			name: 'The Orchard Suite',
			price: 'From €140',
			bg: '#c8b99a',
			desc: 'The largest room. Exposed beams, a clawfoot bath, and views across two hectares.'
		},
		{
			name: 'The Stone Room',
			price: 'From €130',
			bg: '#8a9eac',
			desc: 'Thick Norman stone walls keep it cool in summer. Quiet, intimate, timeless.'
		}
	];

	onMount(() => {
		// Lerp RAF loop
		function lerp(a, b, t) {
			return a + (b - a) * t;
		}

		function tick() {
			mouseX = lerp(mouseX, targetX, 0.08);
			mouseY = lerp(mouseY, targetY, 0.08);
			rafId = requestAnimationFrame(tick);
		}

		rafId = requestAnimationFrame(tick);

		function onMouseMove(e) {
			targetX = e.clientX / window.innerWidth - 0.5;
			targetY = e.clientY / window.innerHeight - 0.5;
		}

		window.addEventListener('mousemove', onMouseMove, { passive: true });

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', onMouseMove);
		};
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Spatial 2.5D</title>
</svelte:head>

<div class="page" style="--mx: {mouseX}; --my: {mouseY};">

	<!-- ── 1. PARALLAX HERO ────────────────────────────────────────────────── -->
	<section class="hero" aria-label="Parallax landscape">

		<!-- Layer 0: sky -->
		<div
			class="layer layer-sky"
			aria-hidden="true"
			style="transform: translate(calc(var(--mx) * 5px), calc(var(--my) * 5px));"
		></div>

		<!-- Layer 1: distant hills -->
		<div
			class="layer layer-hills"
			aria-hidden="true"
			style="transform: translate(calc(var(--mx) * 10px), calc(var(--my) * 8px));"
		></div>

		<!-- Layer 2: cottage silhouette -->
		<div
			class="layer layer-cottage"
			aria-hidden="true"
			style="transform: translate(calc(var(--mx) * 14px), calc(var(--my) * 10px));"
		>
			<svg class="cottage-svg" viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<!-- Main house body -->
				<rect x="60" y="110" width="200" height="90" fill="#5a4e3a" opacity="0.85"/>
				<!-- Roof -->
				<polygon points="50,110 160,40 270,110" fill="#3a3028" opacity="0.9"/>
				<!-- Chimney -->
				<rect x="190" y="52" width="18" height="40" fill="#3a3028" opacity="0.9"/>
				<!-- Door -->
				<rect x="142" y="150" width="36" height="50" rx="18" fill="#2a2018" opacity="0.9"/>
				<!-- Window left -->
				<rect x="82" y="128" width="36" height="28" rx="2" fill="#c8b060" opacity="0.5"/>
				<!-- Window right -->
				<rect x="202" y="128" width="36" height="28" rx="2" fill="#c8b060" opacity="0.5"/>
			</svg>
		</div>

		<!-- Layer 3: foreground trees -->
		<div
			class="layer layer-trees"
			aria-hidden="true"
			style="transform: translate(calc(var(--mx) * 18px), calc(var(--my) * 14px));"
		>
			<div class="tree tree-1">
				<div class="tree-canopy"></div>
				<div class="tree-trunk"></div>
			</div>
			<div class="tree tree-2">
				<div class="tree-canopy"></div>
				<div class="tree-trunk"></div>
			</div>
			<div class="tree tree-3">
				<div class="tree-canopy tree-canopy--sm"></div>
				<div class="tree-trunk"></div>
			</div>
			<div class="tree tree-4">
				<div class="tree-canopy tree-canopy--sm"></div>
				<div class="tree-trunk"></div>
			</div>
		</div>

		<!-- Layer 4: foreground grass stripe -->
		<div
			class="layer layer-grass"
			aria-hidden="true"
			style="transform: translate(calc(var(--mx) * 22px), calc(var(--my) * 18px));"
		></div>

		<!-- Hero text -->
		<div class="hero-text" style="transform: translate(calc(var(--mx) * -6px), calc(var(--my) * -4px));">
			<p class="hero-eyebrow">Immersive 2.5D · Spatial Design</p>
			<h1 class="hero-title">Depth in<br><em>every layer</em></h1>
			<p class="hero-sub">Move your cursor to feel the parallax</p>
		</div>

	</section>

	<!-- ── 2. INTRO TEXT ──────────────────────────────────────────────────── -->
	<section class="intro">
		<div class="intro-inner">
			<span class="intro-tag">Design Trend</span>
			<h2 class="intro-heading">Spatial Graphics</h2>
			<p class="intro-body">
				CSS perspective transforms, layered composition, and mouse-driven parallax create the
				illusion of depth without a single 3D engine. Marianne Cottage — where every surface
				tells a story.
			</p>
			<div class="intro-rule"></div>
			<p class="intro-coords">48.8566° N · 2.3522° E · Normandy, France</p>
		</div>
	</section>

	<!-- ── 3. 3D FLIP CARDS ───────────────────────────────────────────────── -->
	<section class="cards-section">
		<h2 class="section-heading">Our Rooms</h2>
		<div class="cards-grid">
			{#each rooms as room, i}
				<div class="card-3d" style="--card-delay: {i * 0.08}s;">
					<div class="card-inner">
						<!-- Front -->
						<div class="card-face card-front" style="background: {room.bg};">
							<div class="card-front-content">
								<div class="card-icon" aria-hidden="true">
									<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
										<polygon points="4,36 20,8 36,36" fill="rgba(255,255,255,0.35)"/>
										<rect x="14" y="36" width="12" height="12" fill="rgba(255,255,255,0.25)"/>
									</svg>
								</div>
								<h3 class="card-title">{room.name}</h3>
								<p class="card-price">{room.price}</p>
								<span class="card-hint">Hover to explore →</span>
							</div>
						</div>
						<!-- Back -->
						<div class="card-face card-back">
							<div class="card-back-content">
								<h3 class="card-back-title">{room.name}</h3>
								<p class="card-back-desc">{room.desc}</p>
								<div class="card-back-price">{room.price} · per night</div>
								<a
									class="card-btn"
									href="https://mariannecottage.netlify.app"
									target="_blank"
									rel="noopener"
								>Book this room</a>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── 4. DEPTH-OF-FIELD FILM STRIP ──────────────────────────────────── -->
	<section class="film-section">
		<h2 class="section-heading section-heading--light">Through the Lens</h2>
		<p class="film-hint">Click a frame to bring it into focus</p>
		<div class="film-strip" role="listbox" aria-label="Photo film strip">
			{#each filmStrip as frame, i}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="film-frame"
					class:film-frame--active={activeFilm === i}
					class:film-frame--adjacent={Math.abs(activeFilm - i) === 1}
					class:film-frame--far={Math.abs(activeFilm - i) >= 2}
					role="option"
					aria-selected={activeFilm === i}
					tabindex="0"
					style="background: {frame.color};"
					onclick={() => (activeFilm = i)}
					onkeydown={(e) => e.key === 'Enter' && (activeFilm = i)}
				>
					<div class="film-sprocket film-sprocket--top" aria-hidden="true"></div>
					<div class="film-inner" aria-hidden="true">
						<!-- Placeholder gradient landscape -->
						<div class="film-landscape" style="
							background: linear-gradient(
								to bottom,
								color-mix(in srgb, {frame.color} 60%, #a8c8e0) 0%,
								{frame.color} 55%,
								color-mix(in srgb, {frame.color} 80%, #5a7a3a) 100%
							);
						"></div>
					</div>
					<div class="film-sprocket film-sprocket--bottom" aria-hidden="true"></div>
					<p class="film-label">{frame.label}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── 5. CTA ─────────────────────────────────────────────────────────── -->
	<section class="cta-section">
		<div class="cta-inner">
			<p class="cta-eyebrow">Ready to arrive?</p>
			<h2 class="cta-heading">Normandy awaits,<br><em>in three dimensions.</em></h2>
			<div class="cta-btn-wrap">
				<a
					class="cta-btn"
					href="https://mariannecottage.netlify.app"
					target="_blank"
					rel="noopener"
				>Book your stay</a>
			</div>
			<p class="cta-meta">FROM €120 PER NIGHT · NORMANDY · FRANCE</p>
		</div>
	</section>

	<!-- ── FOOTER NAV ─────────────────────────────────────────────────────── -->
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
			<a href="/context">context</a>
			<span aria-hidden="true">·</span>
			<a href="/retro">retro</a>
			<span aria-hidden="true">·</span>
			<a href="/expressive">expressive</a>
			<span aria-hidden="true">·</span>
			<a href="/spatial" aria-current="page">spatial</a>
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
	/* ── Page reset ─────────────────────────────────────────────────────────── */
	:global(body) {
		margin: 0;
		padding: 0;
		background: #f0eee9;
	}

	.page {
		width: 100%;
		min-height: 100vh;
		overflow-x: hidden;
	}

	/* ── 1. PARALLAX HERO ───────────────────────────────────────────────────── */
	.hero {
		position: relative;
		width: 100%;
		height: 100svh;
		min-height: 520px;
		overflow: hidden;
		perspective: 800px;
		transform-style: preserve-3d;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.layer {
		position: absolute;
		inset: 0;
		will-change: transform;
		transition: transform 0.05s linear;
	}

	/* Sky */
	.layer-sky {
		background: linear-gradient(
			180deg,
			#b8d4e8 0%,
			#d4e8d8 55%,
			#c8d4b0 100%
		);
	}

	/* Hills */
	.layer-hills {
		background: transparent;
		display: flex;
		align-items: flex-end;
	}

	.layer-hills::before {
		content: '';
		position: absolute;
		bottom: 28%;
		left: -10%;
		width: 120%;
		height: 35%;
		background: #7a9a7a;
		border-radius: 50% 50% 0 0 / 35% 35% 0 0;
		opacity: 0.55;
	}

	.layer-hills::after {
		content: '';
		position: absolute;
		bottom: 24%;
		left: 20%;
		width: 90%;
		height: 28%;
		background: #8aaa7a;
		border-radius: 50% 50% 0 0 / 30% 30% 0 0;
		opacity: 0.45;
	}

	/* Cottage silhouette */
	.layer-cottage {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 22%;
	}

	.cottage-svg {
		width: clamp(160px, 30vw, 360px);
		height: auto;
		filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.25));
	}

	/* Trees */
	.layer-trees {
		pointer-events: none;
	}

	.tree {
		position: absolute;
		bottom: 20%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.tree-1 { left: 6%; }
	.tree-2 { left: 14%; }
	.tree-3 { right: 8%; }
	.tree-4 { right: 18%; }

	.tree-canopy {
		width: 0;
		height: 0;
		border-left: 28px solid transparent;
		border-right: 28px solid transparent;
		border-bottom: 52px solid #4a7a4a;
		filter: drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.2));
	}

	.tree-canopy--sm {
		border-left-width: 20px;
		border-right-width: 20px;
		border-bottom-width: 38px;
		border-bottom-color: #5a8a5a;
	}

	.tree-trunk {
		width: 8px;
		height: 18px;
		background: #6a4a2a;
		border-radius: 0 0 2px 2px;
	}

	/* Grass */
	.layer-grass {
		background: transparent;
	}

	.layer-grass::before {
		content: '';
		position: absolute;
		bottom: 0;
		left: -5%;
		width: 110%;
		height: 22%;
		background: linear-gradient(180deg, #6a9a5a 0%, #4a7a3a 100%);
		border-radius: 60% 60% 0 0 / 30% 30% 0 0;
	}

	/* Hero text */
	.hero-text {
		position: relative;
		z-index: 10;
		text-align: center;
		color: #fff;
		text-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
		will-change: transform;
		padding: 0 2rem;
	}

	.hero-eyebrow {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.8;
		margin-bottom: 1rem;
	}

	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.75rem, 7vw, 6rem);
		font-weight: 400;
		line-height: 1.15;
		margin-bottom: 1.25rem;
		letter-spacing: -0.01em;
	}

	.hero-title em {
		font-style: italic;
		opacity: 0.88;
	}

	.hero-sub {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		opacity: 0.65;
		margin: 0;
		animation: float-hint 3s ease-in-out infinite;
	}

	@keyframes float-hint {
		0%, 100% { transform: translateY(0); }
		50%       { transform: translateY(-4px); }
	}

	/* ── 2. INTRO ───────────────────────────────────────────────────────────── */
	.intro {
		padding: 6rem 2rem;
		background: #f7f5f0;
	}

	.intro-inner {
		max-width: 640px;
		margin: 0 auto;
		text-align: center;
	}

	.intro-tag {
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: #7a9a6a;
		display: block;
		margin-bottom: 1rem;
	}

	.intro-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 400;
		color: #2a2a2a;
		margin-bottom: 1.5rem;
		line-height: 1.2;
	}

	.intro-body {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		line-height: 1.75;
		color: #5a5a5a;
		margin-bottom: 2rem;
	}

	.intro-rule {
		width: 48px;
		height: 2px;
		background: #7a9a6a;
		margin: 0 auto 1.5rem;
		border-radius: 1px;
	}

	.intro-coords {
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9a9a9a;
		margin: 0;
	}

	/* ── 3. ROOM FLIP CARDS ─────────────────────────────────────────────────── */
	.cards-section {
		padding: 5rem 2rem 6rem;
		background: #ebe8e2;
	}

	.section-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.5rem, 3.5vw, 2.5rem);
		font-weight: 400;
		text-align: center;
		color: #2a2a2a;
		margin-bottom: 3rem;
		font-style: italic;
	}

	.section-heading--light {
		color: #e8e4da;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
		max-width: 960px;
		margin: 0 auto;
	}

	/* 3D flip card */
	.card-3d {
		perspective: 1000px;
		height: 340px;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transform-style: preserve-3d;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
		transition-delay: var(--card-delay, 0s);
	}

	.card-3d:hover .card-inner,
	.card-3d:focus-within .card-inner {
		transform: rotateY(180deg);
	}

	.card-face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		border-radius: 4px;
		overflow: hidden;
	}

	/* Front face */
	.card-front {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-front-content {
		text-align: center;
		padding: 2rem;
		color: #fff;
	}

	.card-icon {
		width: 52px;
		height: 52px;
		margin: 0 auto 1.25rem;
		opacity: 0.7;
	}

	.card-icon svg {
		width: 100%;
		height: 100%;
	}

	.card-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.4rem;
		font-weight: 400;
		margin-bottom: 0.5rem;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
	}

	.card-price {
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		opacity: 0.8;
		text-transform: uppercase;
		margin-bottom: 1.5rem;
	}

	.card-hint {
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	/* Back face */
	.card-back {
		background: #2a2420;
		transform: rotateY(180deg);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.card-back-content {
		padding: 2rem;
		text-align: center;
		color: #e8e0d4;
	}

	.card-back-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.2rem;
		font-weight: 400;
		font-style: italic;
		margin-bottom: 1rem;
		color: #c8b99a;
	}

	.card-back-desc {
		font-family: 'Inter', sans-serif;
		font-size: 0.88rem;
		line-height: 1.65;
		opacity: 0.75;
		margin-bottom: 1.25rem;
	}

	.card-back-price {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #9aac8a;
		margin-bottom: 1.5rem;
	}

	.card-btn {
		display: inline-block;
		padding: 0.65rem 1.5rem;
		background: #7a9a6a;
		color: #fff;
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 2px;
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.card-btn:hover {
		background: #6a8a5a;
		transform: translateY(-2px);
	}

	/* ── 4. FILM STRIP ──────────────────────────────────────────────────────── */
	.film-section {
		padding: 5rem 0 6rem;
		background: #1a1a18;
		overflow: hidden;
	}

	.film-section .section-heading {
		margin-bottom: 0.5rem;
	}

	.film-hint {
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(232, 228, 218, 0.3);
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.film-strip {
		display: flex;
		gap: 0;
		align-items: center;
		justify-content: center;
		padding: 0 2rem;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.film-strip::-webkit-scrollbar {
		display: none;
	}

	.film-frame {
		flex-shrink: 0;
		width: 180px;
		cursor: pointer;
		transition:
			filter 0.5s ease,
			opacity 0.5s ease,
			transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		outline: none;
		position: relative;
	}

	.film-frame:focus-visible {
		outline: 2px solid #7a9a6a;
		outline-offset: 2px;
	}

	/* Depth-of-field states */
	.film-frame--active {
		filter: blur(0px);
		opacity: 1;
		transform: scale(1.08) translateZ(0);
		z-index: 2;
	}

	.film-frame--adjacent {
		filter: blur(2px);
		opacity: 0.8;
		transform: scale(0.96) translateZ(0);
	}

	.film-frame--far {
		filter: blur(4px);
		opacity: 0.6;
		transform: scale(0.9) translateZ(0);
	}

	.film-sprocket {
		display: flex;
		gap: 6px;
		padding: 4px 8px;
		background: #111;
		justify-content: center;
	}

	.film-sprocket--top {
		border-radius: 2px 2px 0 0;
	}

	.film-sprocket--bottom {
		border-radius: 0 0 2px 2px;
	}

	.film-sprocket::before,
	.film-sprocket::after {
		content: '';
		width: 10px;
		height: 8px;
		background: #1a1a18;
		border-radius: 1px;
		display: block;
	}

	/* generate multiple sprocket holes via box-shadow */
	.film-sprocket--top::before {
		box-shadow:
			16px 0 0 #1a1a18,
			32px 0 0 #1a1a18,
			48px 0 0 #1a1a18,
			64px 0 0 #1a1a18,
			80px 0 0 #1a1a18,
			96px 0 0 #1a1a18,
			112px 0 0 #1a1a18;
	}

	.film-sprocket--bottom::before {
		box-shadow:
			16px 0 0 #1a1a18,
			32px 0 0 #1a1a18,
			48px 0 0 #1a1a18,
			64px 0 0 #1a1a18,
			80px 0 0 #1a1a18,
			96px 0 0 #1a1a18,
			112px 0 0 #1a1a18;
	}

	.film-inner {
		aspect-ratio: 3 / 4;
		overflow: hidden;
		background: #0a0a0a;
	}

	.film-landscape {
		width: 100%;
		height: 100%;
	}

	.film-label {
		font-family: 'Inter', sans-serif;
		font-size: 0.6rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(200, 185, 154, 0.6);
		text-align: center;
		margin: 0.5rem 0 0;
		padding: 0 0.5rem;
		transition: color 0.3s ease;
	}

	.film-frame--active .film-label {
		color: #c8b99a;
	}

	/* ── 5. CTA ─────────────────────────────────────────────────────────────── */
	.cta-section {
		padding: 8rem 2rem;
		background: #3a5a3a;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cta-inner {
		text-align: center;
		max-width: 600px;
	}

	.cta-eyebrow {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(200, 220, 180, 0.7);
		margin-bottom: 1.25rem;
	}

	.cta-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 5vw, 3.75rem);
		font-weight: 400;
		color: #e8f0e0;
		line-height: 1.2;
		margin-bottom: 2.5rem;
	}

	.cta-heading em {
		font-style: italic;
		opacity: 0.85;
	}

	.cta-btn-wrap {
		perspective: 600px;
		display: inline-block;
		margin-bottom: 1.75rem;
	}

	.cta-btn {
		display: inline-block;
		padding: 1rem 3rem;
		background: #c8b99a;
		color: #2a2018;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 3px;
		transition:
			transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.25s ease,
			background 0.2s ease;
		transform: translateZ(0);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}

	.cta-btn:hover {
		transform: translateZ(8px) translateY(-3px);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
		background: #d4c8a8;
	}

	.cta-meta {
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(200, 220, 180, 0.45);
		margin: 0;
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
		color: #5a7a4a;
	}

	.demo-nav span {
		opacity: 0.2;
		font-size: 0.65rem;
	}
</style>
