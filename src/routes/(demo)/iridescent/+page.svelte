<script>
	import { onMount } from 'svelte';

	// ── core state ──────────────────────────────────────────────────
	let mouseX = $state(0.5);  // normalised 0-1
	let mouseY = $state(0.5);
	let hue       = $state(220);
	let scrollHue = $state(0);
	let lockedHue = $state(null); // number | null — set by swatch hover

	// ── card tilt per card ──────────────────────────────────────────
	let cardTilt = $state([
		{ rx: 0, ry: 0 },
		{ rx: 0, ry: 0 },
		{ rx: 0, ry: 0 }
	]);

	// ── computed effective hue ──────────────────────────────────────
	const effectiveHue = $derived(lockedHue ?? (hue + scrollHue) % 360);

	// ── iridescent gradient string ──────────────────────────────────
	const gradientStr = $derived(
		`linear-gradient(135deg,` +
		`hsl(${effectiveHue},70%,72%),` +
		`hsl(${(effectiveHue+60)%360},80%,68%),` +
		`hsl(${(effectiveHue+120)%360},75%,64%),` +
		`hsl(${(effectiveHue+180)%360},70%,68%),` +
		`hsl(${(effectiveHue+240)%360},80%,72%))`
	);

	// ── subtle gradient for silk section ───────────────────────────
	const silkGradient = $derived(
		`linear-gradient(135deg,` +
		`hsl(${effectiveHue},30%,90%),` +
		`hsl(${(effectiveHue+60)%360},35%,88%),` +
		`hsl(${(effectiveHue+120)%360},28%,92%))`
	);

	// ── button gradient ─────────────────────────────────────────────
	const btnGradient = $derived(
		`linear-gradient(135deg,` +
		`hsl(${effectiveHue},75%,58%),` +
		`hsl(${(effectiveHue+80)%360},85%,52%),` +
		`hsl(${(effectiveHue+160)%360},70%,60%))`
	);

	// ── swatches ─────────────────────────────────────────────────────
	const swatchOffsets = [0, 60, 120, 180, 240, 300];
	const swatchLabels  = ['Violet', 'Cyan', 'Lime', 'Rose', 'Blue', 'Amber'];

	function swatchGrad(offset) {
		const h = (effectiveHue + offset) % 360;
		return `linear-gradient(145deg,hsl(${h},75%,75%),hsl(${(h+40)%360},85%,65%),hsl(${(h+80)%360},70%,72%))`;
	}

	// ── room data ────────────────────────────────────────────────────
	const rooms = [
		{ name: 'The Pearl Room',       price: '€240', desc: 'Where morning light dances on white linen and silence feels luminous.' },
		{ name: 'The Silk Suite',       price: '€310', desc: 'Draped in handwoven fabric, each surface holds its own quiet spectrum.' },
		{ name: 'The Holograph Loft',   price: '€275', desc: 'Industrial bones wrapped in shifting colour — urban iridescence.' }
	];

	// ── tech pills ───────────────────────────────────────────────────
	const tech = [
		{ label: 'Real iridescence',     hueOff: 0,   desc: 'Angle-dependent colour — butterfly wings, mother-of-pearl' },
		{ label: 'Mouse-tracked hue',    hueOff: 60,  desc: 'cursor X → hue 0–360° via JS mousemove listener' },
		{ label: 'Scroll-driven palette',hueOff: 120, desc: 'scrollY / maxScroll × 360° layered over mouse hue' },
		{ label: 'CSS hsl() math',       hueOff: 180, desc: 'hsl(h+0), hsl(h+60) … hsl(h+240) — the whole spectrum from one value' }
	];

	// ── lifecycle ─────────────────────────────────────────────────────
	onMount(() => {
		function onMove(e) {
			if (lockedHue !== null) return;
			mouseX = e.clientX / window.innerWidth;
			mouseY = e.clientY / window.innerHeight;
			hue = Math.round(mouseX * 360);
		}

		function onScroll() {
			const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
			if (maxScroll > 0) {
				scrollHue = Math.round((window.scrollY / maxScroll) * 120); // 0→120° shift over full scroll
			}
		}

		window.addEventListener('mousemove', onMove, { passive: true });
		window.addEventListener('scroll',    onScroll, { passive: true });
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('scroll', onScroll);
		};
	});

	function handleCardMove(e, i) {
		const rect = e.currentTarget.getBoundingClientRect();
		const rx = ((e.clientY - rect.top)  / rect.height - 0.5) * 16;
		const ry = ((e.clientX - rect.left) / rect.width  - 0.5) * -16;
		cardTilt = cardTilt.map((c, idx) => (idx === i ? { rx, ry } : c));
	}

	function handleCardLeave(i) {
		cardTilt = cardTilt.map((c, idx) => (idx === i ? { rx: 0, ry: 0 } : c));
	}
</script>

<svelte:head>
	<title>Marianne Cottage — Spectral / Iridescent</title>
</svelte:head>

<!-- Root wrapper: exposes CSS custom props everywhere -->
<div
	class="iri-root"
	style="--hue:{effectiveHue}; --iri-gradient:{gradientStr}; --silk-gradient:{silkGradient}; --btn-gradient:{btnGradient}; --mx:{mouseX}; --my:{mouseY}"
>

<!-- ═══════════════════════════════════════════════════════
     1. HERO
     ═══════════════════════════════════════════════════════ -->
<section class="hero">
	<!-- floating orbs -->
	<div class="orb orb-1" style="background:{gradientStr}" aria-hidden="true"></div>
	<div class="orb orb-2" style="background:linear-gradient(135deg,hsl({(effectiveHue+90)%360},80%,68%),hsl({(effectiveHue+200)%360},70%,60%))" aria-hidden="true"></div>
	<div class="orb orb-3" style="background:linear-gradient(135deg,hsl({(effectiveHue+180)%360},75%,65%),hsl({(effectiveHue+300)%360},80%,72%))" aria-hidden="true"></div>

	<div class="hero-content">
		<p class="hero-eyebrow">Spectral / Iridescent — 2025/26 Colour Trend</p>
		<h1 class="hero-headline pearl-text">Where light becomes colour</h1>
		<p class="hero-sub">Move your cursor. Watch the world shift.</p>
		<div class="hero-hint">
			<span class="hint-dot" style="background:{gradientStr}"></span>
			<span>Hue: {effectiveHue}°</span>
			<span class="hint-dot" style="background:linear-gradient(90deg,hsl({(effectiveHue+120)%360},70%,65%),hsl({(effectiveHue+240)%360},70%,65%))"></span>
			<span>X: {(mouseX*100).toFixed(0)}%</span>
		</div>
	</div>

	<div class="hero-scroll-cue" aria-hidden="true">
		<div class="scroll-line" style="background:{gradientStr}"></div>
		<span>scroll</span>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════
     2. PALETTE SHOWCASE
     ═══════════════════════════════════════════════════════ -->
<section class="palette-section">
	<div class="section-header">
		<h2 class="section-title pearl-text">The Spectrum</h2>
		<p class="section-sub">Hover a swatch to lock its hue across the entire page</p>
	</div>

	<div class="swatches">
		{#each swatchOffsets as offset, i}
			<button
				class="swatch"
				class:active={lockedHue === (effectiveHue + offset) % 360}
				style="background:{swatchGrad(offset)}"
				onmouseenter={() => lockedHue = (effectiveHue + offset) % 360}
				onmouseleave={() => lockedHue = null}
				aria-label="Lock hue to {swatchLabels[i]}"
			>
				<span class="swatch-label">{swatchLabels[i]}</span>
				<span class="swatch-deg">{(effectiveHue + offset) % 360}°</span>
			</button>
		{/each}
	</div>

	<p class="palette-note">
		Each swatch is offset +{swatchOffsets[1]}° from the previous —
		together they complete a full 360° spectral rotation.
	</p>
</section>

<!-- ═══════════════════════════════════════════════════════
     3. HOLOGRAPHIC CARDS
     ═══════════════════════════════════════════════════════ -->
<section class="cards-section">
	<div class="section-header">
		<h2 class="section-title pearl-text">Holographic Rooms</h2>
		<p class="section-sub">Tilt with your cursor — the foil follows</p>
	</div>

	<div class="cards-grid">
		{#each rooms as room, i}
			<article
				class="holo-card"
				style="transform: perspective(800px) rotateX({cardTilt[i].rx}deg) rotateY({cardTilt[i].ry}deg); --card-hue:{(effectiveHue + i*80)%360}"
				onmousemove={(e) => handleCardMove(e, i)}
				onmouseleave={() => handleCardLeave(i)}
				role="button"
				tabindex="0"
			>
				<!-- foil shimmer layer -->
				<div class="foil-layer" style="background:linear-gradient(135deg,hsl({(effectiveHue+i*80)%360},80%,70%),hsl({(effectiveHue+i*80+60)%360},85%,65%),hsl({(effectiveHue+i*80+120)%360},75%,68%),hsl({(effectiveHue+i*80+180)%360},70%,72%))" aria-hidden="true"></div>

				<div class="card-body">
					<div class="card-icon" style="background:linear-gradient(135deg,hsl({(effectiveHue+i*80)%360},70%,60%),hsl({(effectiveHue+i*80+90)%360},80%,55%))">
						{#if i === 0}✦{:else if i === 1}◈{:else}⬡{/if}
					</div>
					<h3 class="card-name pearl-text">{room.name}</h3>
					<p class="card-desc">{room.desc}</p>
					<div class="card-footer">
						<span class="card-price pearl-text">{room.price} / night</span>
						<button class="card-btn" style="background:linear-gradient(135deg,hsl({(effectiveHue+i*80)%360},70%,55%),hsl({(effectiveHue+i*80+80)%360},75%,50%))">
							View room
						</button>
					</div>
				</div>
			</article>
		{/each}
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════
     4. SILK SECTION
     ═══════════════════════════════════════════════════════ -->
<section class="silk-section" style="background:{silkGradient}">
	<div class="silk-border-top" style="background:{gradientStr}"></div>

	<div class="silk-content">
		<p class="silk-eyebrow" style="color:hsl({effectiveHue},50%,45%)">The Silk Principle</p>
		<blockquote class="silk-quote pearl-text">
			Every surface holds a spectrum
		</blockquote>
		<p class="silk-body">
			True iridescence is not a colour — it is a relationship between light, angle, and the
			microscopic geometry of a surface. Butterfly wings, soap bubbles, abalone shell: none
			contain pigment. They contain <em>structure</em>. We replicate that logic here, mapping
			your cursor's journey across the screen to a continuous rotation of the colour wheel.
		</p>
		<div class="silk-divider" style="background:{gradientStr}"></div>
		<p class="silk-caption" style="color:hsl({(effectiveHue+180)%360},40%,45%)">
			Marianne Cottage — where light is the furnishing
		</p>
	</div>

	<div class="silk-border-bottom" style="background:{gradientStr}"></div>
</section>

<!-- ═══════════════════════════════════════════════════════
     5. COLOUR THEORY STRIP
     ═══════════════════════════════════════════════════════ -->
<section class="theory-section">
	<div class="section-header">
		<h2 class="section-title pearl-text">How It Works</h2>
		<p class="section-sub">Four techniques, one shifting spectrum</p>
	</div>

	<div class="theory-grid">
		{#each tech as t, i}
			<div class="theory-card">
				<div
					class="theory-pill"
					style="background:linear-gradient(135deg,hsl({(effectiveHue+t.hueOff)%360},70%,62%),hsl({(effectiveHue+t.hueOff+50)%360},80%,58%))"
				>
					{t.label}
				</div>
				<p class="theory-desc">{t.desc}</p>
			</div>
		{/each}
	</div>

	<!-- Live CSS preview -->
	<div class="code-preview">
		<p class="code-label">Live values right now</p>
		<code class="code-block">
			hsl(<span style="color:hsl({effectiveHue},80%,70%)">{effectiveHue}</span>, 70%, 72%)  →
			hsl(<span style="color:hsl({(effectiveHue+60)%360},80%,70%)">{(effectiveHue+60)%360}</span>, 80%, 68%)  →
			hsl(<span style="color:hsl({(effectiveHue+120)%360},80%,70%)">{(effectiveHue+120)%360}</span>, 75%, 64%)  →
			hsl(<span style="color:hsl({(effectiveHue+180)%360},80%,70%)">{(effectiveHue+180)%360}</span>, 70%, 68%)
		</code>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════
     6. CTA
     ═══════════════════════════════════════════════════════ -->
<section class="cta-section">
	<div class="cta-orb cta-orb-1" style="background:{gradientStr}" aria-hidden="true"></div>
	<div class="cta-orb cta-orb-2" style="background:linear-gradient(135deg,hsl({(effectiveHue+120)%360},75%,60%),hsl({(effectiveHue+240)%360},70%,65%))" aria-hidden="true"></div>

	<div class="cta-content">
		<p class="cta-eyebrow">Ready to stay?</p>
		<h2 class="cta-headline pearl-text">Book a night inside the spectrum</h2>
		<p class="cta-sub">Three rooms. One valley. Infinite colour.</p>
		<button class="cta-btn" style="background:{btnGradient}">
			Check availability
		</button>
		<p class="cta-note">
			Hue at this moment: <strong style="color:hsl({effectiveHue},80%,75%)">{effectiveHue}°</strong> —
			scroll or move your cursor to change everything.
		</p>
	</div>
</section>

<!-- ═══════════════════════════════════════════════════════
     DEMO FOOTER NAV
     ═══════════════════════════════════════════════════════ -->
<footer class="demo-footer">
	<p class="footer-label">Demo explorations</p>
	<nav class="footer-nav" aria-label="Demo pages">
		{#each [
			['historian',   '/historian'],
			['living',      '/living'],
			['nature',      '/nature'],
			['story',       '/story'],
			['brutal',      '/brutal'],
			['calm',        '/calm'],
			['bento',       '/bento'],
			['kinetic',     '/kinetic'],
			['adaptive',    '/adaptive'],
			['ambient',     '/ambient'],
			['context',     '/context'],
			['retro',       '/retro'],
			['expressive',  '/expressive'],
			['spatial',     '/spatial'],
			['micro',       '/micro'],
			['ergonomic',   '/ergonomic'],
			['liquid',      '/liquid'],
			['scroll-anim', '/scroll-anim'],
			['morph',       '/morph'],
			['handmade',    '/handmade'],
			['iridescent',  '/iridescent'],
			['dday',        '/dday'],
		] as [label, href]}
			<a
				{href}
				class="footer-link"
				class:active={href === '/iridescent'}
				style={href === '/iridescent' ? `background:${gradientStr}; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;` : ''}
			>{label}</a>
		{/each}
	</nav>
</footer>

</div><!-- .iri-root -->

<style>
/* ══════════════════════════════════════════
   PEARL SHIMMER — the hero text effect
   ══════════════════════════════════════════ */
@keyframes pearl-sweep {
	0%   { background-position: -200% center }
	100% { background-position:  200% center }
}

.pearl-text {
	background: linear-gradient(
		90deg,
		#b090d8 0%,
		#f0d8ff 20%,
		#90d4f8 40%,
		#f8f0d8 60%,
		#d8c0f0 80%,
		#a8e8d8 100%
	);
	background-size: 200% auto;
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
	animation: pearl-sweep 4s linear infinite;
}

/* ══════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════ */
.iri-root {
	min-height: 100vh;
	overflow-x: hidden;
}

/* ══════════════════════════════════════════
   1. HERO
   ══════════════════════════════════════════ */
.hero {
	position: relative;
	min-height: 100vh;
	background: #0d0b14;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	padding: 2rem;
}

.orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);
	opacity: 0.55;
	pointer-events: none;
	transition: background 0.4s ease;
}
.orb-1 { width: 500px; height: 500px; top: -120px; left: -100px; }
.orb-2 { width: 400px; height: 400px; bottom: -80px; right: -60px; }
.orb-3 { width: 300px; height: 300px; top: 40%; left: 55%; }

.hero-content {
	position: relative;
	z-index: 2;
	text-align: center;
	max-width: 780px;
}

.hero-eyebrow {
	font-family: 'Inter', sans-serif;
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.45);
	margin-bottom: 1.5rem;
}

.hero-headline {
	font-family: 'Playfair Display', serif;
	font-size: clamp(3rem, 8vw, 7rem);
	font-weight: 700;
	line-height: 1.05;
	margin-bottom: 1.5rem;
}

.hero-sub {
	font-family: 'Inter', sans-serif;
	font-size: clamp(1rem, 2.5vw, 1.35rem);
	font-weight: 300;
	color: rgba(255,255,255,0.55);
	margin-bottom: 2.5rem;
	letter-spacing: 0.02em;
}

.hero-hint {
	display: inline-flex;
	align-items: center;
	gap: 0.75rem;
	background: rgba(255,255,255,0.06);
	border: 1px solid rgba(255,255,255,0.12);
	border-radius: 2rem;
	padding: 0.5rem 1.25rem;
	font-size: 0.8rem;
	color: rgba(255,255,255,0.6);
	letter-spacing: 0.05em;
	font-family: 'Inter', monospace;
}

.hint-dot {
	width: 10px;
	height: 10px;
	border-radius: 50%;
	display: inline-block;
	flex-shrink: 0;
}

.hero-scroll-cue {
	position: absolute;
	bottom: 2.5rem;
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	color: rgba(255,255,255,0.3);
	font-size: 0.65rem;
	letter-spacing: 0.15em;
	text-transform: uppercase;
}

.scroll-line {
	width: 1px;
	height: 48px;
	opacity: 0.6;
	animation: scroll-pulse 2s ease-in-out infinite;
}

@keyframes scroll-pulse {
	0%, 100% { transform: scaleY(1); opacity: 0.4 }
	50% { transform: scaleY(1.4); opacity: 0.9 }
}

/* ══════════════════════════════════════════
   SHARED SECTION LAYOUT
   ══════════════════════════════════════════ */
.section-header {
	text-align: center;
	margin-bottom: 3rem;
}

.section-title {
	font-family: 'Playfair Display', serif;
	font-size: clamp(2rem, 4vw, 3.2rem);
	font-weight: 700;
	margin-bottom: 0.75rem;
}

.section-sub {
	font-size: 0.95rem;
	color: rgba(58,58,58,0.6);
	font-weight: 300;
	letter-spacing: 0.02em;
}

/* ══════════════════════════════════════════
   2. PALETTE SWATCHES
   ══════════════════════════════════════════ */
.palette-section {
	padding: 6rem 2rem;
	background: #0d0b14;
}

.palette-section .section-sub {
	color: rgba(255,255,255,0.4);
}

.swatches {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
	gap: 1rem;
	max-width: 960px;
	margin: 0 auto 2rem;
}

.swatch {
	aspect-ratio: 3/4;
	border-radius: 1.25rem;
	border: 2px solid transparent;
	cursor: pointer;
	position: relative;
	overflow: hidden;
	transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-end;
	padding-bottom: 1rem;
}

.swatch:hover,
.swatch.active {
	transform: translateY(-8px) scale(1.03);
	border-color: rgba(255,255,255,0.5);
	box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.swatch-label {
	font-size: 0.8rem;
	font-weight: 600;
	color: rgba(255,255,255,0.9);
	letter-spacing: 0.05em;
	text-shadow: 0 1px 4px rgba(0,0,0,0.4);
}

.swatch-deg {
	font-size: 0.65rem;
	color: rgba(255,255,255,0.6);
	font-family: monospace;
	margin-top: 0.2rem;
}

.palette-note {
	text-align: center;
	font-size: 0.8rem;
	color: rgba(255,255,255,0.3);
	letter-spacing: 0.04em;
	max-width: 540px;
	margin: 0 auto;
}

/* ══════════════════════════════════════════
   3. HOLOGRAPHIC CARDS
   ══════════════════════════════════════════ */
.cards-section {
	padding: 6rem 2rem;
	background: #111019;
}

.cards-section .section-sub {
	color: rgba(255,255,255,0.4);
}

.cards-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
	gap: 1.5rem;
	max-width: 1080px;
	margin: 0 auto;
}

.holo-card {
	position: relative;
	border-radius: 1.5rem;
	overflow: hidden;
	background: #1a1825;
	border: 1px solid rgba(255,255,255,0.1);
	transition: transform 0.08s ease, box-shadow 0.3s ease;
	cursor: pointer;
	will-change: transform;
}

.holo-card:hover {
	box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 40px hsla(var(--card-hue, 220),70%,60%,0.2);
}

.foil-layer {
	position: absolute;
	inset: 0;
	opacity: 0.18;
	mix-blend-mode: screen;
	pointer-events: none;
	transition: background 0.3s ease;
}

.holo-card:hover .foil-layer {
	opacity: 0.32;
}

.card-body {
	position: relative;
	z-index: 1;
	padding: 2rem;
}

.card-icon {
	width: 52px;
	height: 52px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.4rem;
	margin-bottom: 1.25rem;
	color: #fff;
}

.card-name {
	font-family: 'Playfair Display', serif;
	font-size: 1.4rem;
	font-weight: 700;
	margin-bottom: 0.75rem;
}

.card-desc {
	font-size: 0.88rem;
	line-height: 1.65;
	color: rgba(255,255,255,0.5);
	margin-bottom: 1.5rem;
	font-weight: 300;
}

.card-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 0.75rem;
}

.card-price {
	font-family: 'Playfair Display', serif;
	font-size: 1.15rem;
	font-weight: 600;
}

.card-btn {
	padding: 0.5rem 1.25rem;
	border-radius: 2rem;
	border: none;
	color: #fff;
	font-size: 0.78rem;
	font-weight: 600;
	letter-spacing: 0.04em;
	cursor: pointer;
	transition: opacity 0.2s;
}

.card-btn:hover { opacity: 0.85; }

/* ══════════════════════════════════════════
   4. SILK SECTION
   ══════════════════════════════════════════ */
.silk-section {
	position: relative;
	padding: 0;
	transition: background 0.5s ease;
}

.silk-border-top,
.silk-border-bottom {
	height: 3px;
	transition: background 0.4s ease;
}

.silk-content {
	padding: 6rem 2rem;
	max-width: 720px;
	margin: 0 auto;
	text-align: center;
}

.silk-eyebrow {
	font-size: 0.75rem;
	font-weight: 600;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	margin-bottom: 1.5rem;
	transition: color 0.4s ease;
}

.silk-quote {
	font-family: 'Playfair Display', serif;
	font-size: clamp(2rem, 5vw, 3.8rem);
	font-weight: 700;
	font-style: italic;
	line-height: 1.15;
	margin-bottom: 2.5rem;
}

.silk-body {
	font-size: 1rem;
	line-height: 1.8;
	color: rgba(58,58,58,0.75);
	font-weight: 300;
	margin-bottom: 2.5rem;
}

.silk-body em {
	font-style: italic;
	color: rgba(58,58,58,0.9);
}

.silk-divider {
	height: 1px;
	max-width: 200px;
	margin: 0 auto 1.5rem;
	opacity: 0.6;
	transition: background 0.4s ease;
}

.silk-caption {
	font-size: 0.8rem;
	letter-spacing: 0.1em;
	font-style: italic;
	transition: color 0.4s ease;
}

/* ══════════════════════════════════════════
   5. COLOUR THEORY
   ══════════════════════════════════════════ */
.theory-section {
	padding: 6rem 2rem;
	background: #f8f6f2;
}

.theory-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	gap: 1.5rem;
	max-width: 1000px;
	margin: 0 auto 3rem;
}

.theory-card {
	background: #fff;
	border-radius: 1rem;
	padding: 1.5rem;
	border: 1px solid rgba(0,0,0,0.07);
	box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.theory-pill {
	display: inline-block;
	padding: 0.4rem 1rem;
	border-radius: 2rem;
	font-size: 0.78rem;
	font-weight: 600;
	color: #fff;
	letter-spacing: 0.04em;
	margin-bottom: 0.9rem;
	text-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.theory-desc {
	font-size: 0.85rem;
	line-height: 1.6;
	color: rgba(58,58,58,0.7);
}

.code-preview {
	max-width: 760px;
	margin: 0 auto;
	background: #1a1825;
	border-radius: 1rem;
	padding: 1.5rem 2rem;
}

.code-label {
	font-size: 0.7rem;
	color: rgba(255,255,255,0.35);
	letter-spacing: 0.1em;
	text-transform: uppercase;
	margin-bottom: 0.75rem;
}

.code-block {
	font-family: 'Courier New', monospace;
	font-size: 0.82rem;
	color: rgba(255,255,255,0.75);
	line-height: 1.8;
	display: block;
	word-break: break-word;
}

/* ══════════════════════════════════════════
   6. CTA
   ══════════════════════════════════════════ */
.cta-section {
	position: relative;
	padding: 8rem 2rem;
	background: #0d0b14;
	overflow: hidden;
	text-align: center;
}

.cta-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(100px);
	opacity: 0.4;
	pointer-events: none;
	transition: background 0.4s ease;
}

.cta-orb-1 { width: 600px; height: 600px; top: -200px; left: -150px; }
.cta-orb-2 { width: 400px; height: 400px; bottom: -100px; right: -80px; }

.cta-content {
	position: relative;
	z-index: 2;
	max-width: 640px;
	margin: 0 auto;
}

.cta-eyebrow {
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.2em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.4);
	margin-bottom: 1.25rem;
}

.cta-headline {
	font-family: 'Playfair Display', serif;
	font-size: clamp(2rem, 5vw, 3.5rem);
	font-weight: 700;
	line-height: 1.15;
	margin-bottom: 1rem;
}

.cta-sub {
	font-size: 1rem;
	color: rgba(255,255,255,0.45);
	font-weight: 300;
	margin-bottom: 2.5rem;
	letter-spacing: 0.02em;
}

.cta-btn {
	display: inline-block;
	padding: 1rem 2.75rem;
	border-radius: 3rem;
	border: none;
	color: #fff;
	font-size: 1rem;
	font-weight: 600;
	letter-spacing: 0.05em;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.3s ease, background 0.4s ease;
	text-shadow: 0 1px 4px rgba(0,0,0,0.25);
	margin-bottom: 1.5rem;
}

.cta-btn:hover {
	transform: translateY(-3px) scale(1.03);
	box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}

.cta-note {
	font-size: 0.8rem;
	color: rgba(255,255,255,0.3);
	font-family: monospace;
	letter-spacing: 0.04em;
}

/* ══════════════════════════════════════════
   DEMO FOOTER NAV
   ══════════════════════════════════════════ */
.demo-footer {
	background: #09080f;
	padding: 2.5rem 2rem;
	text-align: center;
	border-top: 1px solid rgba(255,255,255,0.07);
}

.footer-label {
	font-size: 0.65rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: rgba(255,255,255,0.25);
	margin-bottom: 1.25rem;
}

.footer-nav {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.35rem 0.6rem;
	max-width: 900px;
	margin: 0 auto;
}

.footer-link {
	font-size: 0.78rem;
	color: rgba(255,255,255,0.35);
	text-decoration: none;
	padding: 0.25rem 0.5rem;
	border-radius: 0.35rem;
	transition: color 0.2s;
	letter-spacing: 0.03em;
}

.footer-link:hover {
	color: rgba(255,255,255,0.8);
}

.footer-link.active {
	font-weight: 600;
}

/* ══════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════ */
@media (max-width: 600px) {
	.orb-1 { width: 280px; height: 280px; }
	.orb-2 { width: 220px; height: 220px; }
	.orb-3 { width: 160px; height: 160px; }
	.swatches { grid-template-columns: repeat(3, 1fr); }
	.swatch { aspect-ratio: 1; }
	.cards-grid { grid-template-columns: 1fr; }
	.cta-orb-1 { width: 300px; height: 300px; }
	.cta-orb-2 { width: 200px; height: 200px; }
}
</style>
