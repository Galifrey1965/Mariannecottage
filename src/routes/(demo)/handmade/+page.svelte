<script>
	import { onMount } from 'svelte';

	let visible = $state({
		hero: false,
		about: false,
		rooms: false,
		textures: false,
		guestbook: false,
		cta: false
	});

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const key = entry.target.dataset.section;
						if (key) visible = { ...visible, [key]: true };
					}
				});
			},
			{ threshold: 0.12 }
		);

		document.querySelectorAll('[data-section]').forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Crafted by Hand</title>
	<meta name="description" content="Handmade / Crafted Aesthetic — Authentic imperfection as luxury" />
</svelte:head>

<!-- Grain overlay -->
<div class="grain" aria-hidden="true"></div>

<!-- ── HERO ── -->
<section class="hero" data-section="hero" class:visible={visible.hero}>
	<div class="hero-inner">
		<!-- Wax seal -->
		<div class="wax-seal" aria-hidden="true">
			<span class="wax-initials">MC</span>
		</div>

		<p class="typewriter-label">Marianne Cottage · Normandy, France</p>

		<h1 class="ink-heading hero-heading">
			Crafted by hand.<br /><em>Lived with love.</em>
		</h1>

		<!-- Wobbly SVG underline -->
		<svg class="wobbly-underline" viewBox="0 0 400 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M4,14 C30,4 68,18 110,11 C152,4 188,17 230,10 C272,3 308,16 348,9 C368,5 384,13 396,10"
				stroke="#8b3a2a"
				stroke-width="2.5"
				fill="none"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>

		<p class="hero-sub">
			A stone farmhouse where every beam, every latch, every worn floorboard tells a story.
			No algorithms decided this place. Human hands did.
		</p>

		<a href="#rooms" class="stamp-btn">Book your stay</a>
	</div>

	<!-- Wobbly SVG divider bottom -->
	<div class="section-divider" aria-hidden="true">
		<svg viewBox="0 0 1200 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M0,22 C60,8 130,32 210,18 C290,4 370,28 450,16 C530,4 600,26 680,14 C760,2 840,24 920,12 C1000,0 1080,22 1140,16 L1200,18 L1200,40 L0,40 Z"
				fill="#f5efe0"
			/>
		</svg>
	</div>
</section>

<!-- ── ABOUT ── -->
<section class="about" data-section="about" class:visible={visible.about}>
	<div class="notebook-page wonky-left">
		<div class="notebook-lines" aria-hidden="true"></div>
		<div class="notebook-margin" aria-hidden="true"></div>
		<div class="notebook-content">
			<h2 class="ink-heading section-heading">About the cottage</h2>
			<p class="body-text">
				Built in the early 1800s from local Normandy stone, Marianne Cottage has been home
				to farmers, teachers, and dreamers. The walls remember all of them.
			</p>
			<p class="body-text">
				We have restored — not renovated. The exposed beams remain. The original clay
				floor tiles remain. The apple orchard outside the kitchen window remains. What
				we've added is warmth, quiet, and the faint smell of woodsmoke.
			</p>
			<p class="body-text">
				If you are looking for a place that feels like somewhere, not like everywhere —
				you have found it.
			</p>
			<span class="typewriter-label small-label">Est. 1812 · Restored 2019</span>
		</div>
	</div>
</section>

<!-- ── ROOMS ── -->
<section class="rooms-section" data-section="rooms" class:visible={visible.rooms} id="rooms">
	<div class="section-header-wrap">
		<h2 class="ink-heading section-heading centered">The rooms</h2>
		<svg class="section-squiggle" viewBox="0 0 200 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M2,8 C20,2 40,10 60,5 C80,0 100,9 120,4 C140,-1 160,8 180,4 C188,2 194,6 198,5"
				stroke="#8aaa8a"
				stroke-width="1.8"
				fill="none"
				stroke-linecap="round"
			/>
		</svg>
	</div>

	<div class="rooms-grid">
		<!-- Room 1 -->
		<article class="room-card wonky-room-1">
			<div class="torn-top" aria-hidden="true">
				<svg viewBox="0 0 300 18" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0,0 L8,14 L18,4 L30,16 L44,6 L54,15 L68,3 L80,13 L94,5 L106,14 L118,2 L132,12 L146,7 L158,15 L170,4 L184,13 L196,3 L210,11 L224,6 L238,14 L250,2 L264,12 L278,5 L290,13 L300,8 L300,18 L0,18 Z"
						fill="#f5efe0"
					/>
				</svg>
			</div>
			<div class="room-card-inner">
				<span class="typewriter-label room-label">ROOM № 01</span>
				<h3 class="ink-heading room-name">La Chambre Principale</h3>
				<p class="room-desc">King bed with linen sheets, south-facing windows onto the orchard. Original oak beams overhead.</p>
				<div class="room-details">
					<span class="room-detail">2 guests</span>
					<span class="room-dot">·</span>
					<span class="room-detail">30 m²</span>
					<span class="room-dot">·</span>
					<span class="room-detail">Garden view</span>
				</div>
			</div>
		</article>

		<!-- Room 2 -->
		<article class="room-card wonky-room-2">
			<div class="torn-top" aria-hidden="true">
				<svg viewBox="0 0 300 18" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0,10 L12,2 L24,14 L36,4 L50,12 L62,1 L76,10 L88,5 L100,13 L114,3 L126,11 L140,4 L152,14 L166,3 L178,11 L192,5 L206,14 L218,2 L232,10 L246,6 L260,14 L272,3 L284,12 L296,5 L300,9 L300,18 L0,18 Z"
						fill="#f5efe0"
					/>
				</svg>
			</div>
			<div class="room-card-inner">
				<span class="typewriter-label room-label">ROOM № 02</span>
				<h3 class="ink-heading room-name">La Petite Chambre</h3>
				<p class="room-desc">Twin beds tucked under the eaves. A dormer window with a view to the church spire. Whitewashed plaster walls.</p>
				<div class="room-details">
					<span class="room-detail">2 guests</span>
					<span class="room-dot">·</span>
					<span class="room-detail">18 m²</span>
					<span class="room-dot">·</span>
					<span class="room-detail">Attic light</span>
				</div>
			</div>
		</article>

		<!-- Room 3 -->
		<article class="room-card wonky-room-3">
			<div class="torn-top" aria-hidden="true">
				<svg viewBox="0 0 300 18" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M0,6 L14,14 L26,3 L38,12 L52,2 L64,10 L78,4 L90,14 L102,5 L116,13 L128,2 L142,10 L156,5 L168,13 L182,4 L194,12 L208,3 L220,11 L234,6 L248,14 L260,3 L274,11 L286,5 L300,13 L300,18 L0,18 Z"
						fill="#f5efe0"
					/>
				</svg>
			</div>
			<div class="room-card-inner">
				<span class="typewriter-label room-label">ROOM № 03</span>
				<h3 class="ink-heading room-name">Le Grenier</h3>
				<p class="room-desc">The converted hayloft. Exposed stone on one wall, a cast-iron bath, a reading nook with no wifi — intentionally.</p>
				<div class="room-details">
					<span class="room-detail">2 guests</span>
					<span class="room-dot">·</span>
					<span class="room-detail">24 m²</span>
					<span class="room-dot">·</span>
					<span class="room-detail">No signal</span>
				</div>
			</div>
		</article>
	</div>
</section>

<!-- Torn paper section break -->
<div class="torn-paper-break" aria-hidden="true">
	<svg viewBox="0 0 1200 50" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
		<path
			d="M0,10 L15,28 L28,8 L44,32 L58,12 L72,35 L88,5 L100,26 L116,9 L130,30 L144,14 L158,36 L174,6 L188,28 L202,11 L218,33 L232,7 L248,25 L262,13 L278,34 L292,8 L308,28 L324,12 L338,30 L354,5 L368,26 L384,14 L398,36 L414,9 L428,30 L444,6 L458,28 L472,13 L488,34 L502,8 L518,26 L532,11 L548,32 L562,7 L578,28 L594,13 L608,35 L624,9 L638,29 L654,5 L668,27 L684,12 L698,34 L714,8 L728,26 L742,14 L758,36 L772,6 L788,28 L804,11 L818,33 L834,7 L848,25 L864,13 L878,34 L894,8 L908,28 L922,12 L938,30 L952,5 L966,26 L982,14 L996,36 L1012,9 L1026,30 L1042,6 L1058,28 L1072,13 L1088,34 L1102,8 L1118,26 L1132,11 L1148,32 L1164,7 L1180,28 L1200,16 L1200,50 L0,50 Z"
			fill="#2a1f0e"
			opacity="0.06"
		/>
	</svg>
</div>

<!-- ── HANDMADE DETAILS / TEXTURE SWATCHES ── -->
<section class="textures-section" data-section="textures" class:visible={visible.textures}>
	<div class="section-header-wrap">
		<h2 class="ink-heading section-heading centered">Made by hand</h2>
		<p class="section-subtext">Every surface you touch was chosen, not generated.</p>
	</div>

	<div class="textures-grid">
		<div class="texture-card swatch-linen wonky-tex-1">
			<div class="swatch-block linen-swatch" aria-label="Linen texture swatch"></div>
			<span class="typewriter-label swatch-label">LINEN · 100%</span>
			<p class="swatch-desc">Washed Belgian linen, pre-softened by hand. Threads you can see.</p>
		</div>

		<div class="texture-card swatch-paper wonky-tex-2">
			<div class="swatch-block paper-swatch" aria-label="Aged paper texture swatch"></div>
			<span class="typewriter-label swatch-label">AGED PAPER</span>
			<p class="swatch-desc">Writing paper from 1940, found in the attic. Still blank on one side.</p>
		</div>

		<div class="texture-card swatch-cotton wonky-tex-3">
			<div class="swatch-block cotton-swatch" aria-label="Cotton texture swatch"></div>
			<span class="typewriter-label swatch-label">NATURAL COTTON</span>
			<p class="swatch-desc">Undyed cotton towels from a mill in Lisieux that has run since 1887.</p>
		</div>
	</div>
</section>

<!-- ── GUESTBOOK ── -->
<section class="guestbook-section" data-section="guestbook" class:visible={visible.guestbook}>
	<div class="section-header-wrap">
		<h2 class="ink-heading section-heading centered">From the guestbook</h2>
	</div>

	<div class="guestbook-page">
		<div class="ruled-lines" aria-hidden="true"></div>
		<div class="guestbook-content">
			<p class="handwritten-entry">
				"We arrived expecting a cottage. We found a feeling. The kind you've been
				looking for without knowing it — the sound of rain on old tiles, the weight
				of a proper cast-iron pan, the way the light falls through shutters at six
				in the morning. We will return. We must."
			</p>

			<!-- Squiggly SVG underline -->
			<svg class="squiggle-sig" viewBox="0 0 280 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<path
					d="M2,9 C18,2 36,11 54,6 C72,1 90,10 108,5 C126,0 144,9 162,5 C180,1 198,10 216,6 C234,2 252,10 270,6 L278,5"
					stroke="#8b3a2a"
					stroke-width="1.5"
					fill="none"
					stroke-linecap="round"
				/>
			</svg>

			<div class="guestbook-sig">
				<span class="typewriter-label">— Sophie &amp; Thomas, Paris · July 2024</span>
			</div>
		</div>
	</div>
</section>

<!-- ── CTA ── -->
<section class="cta-section" data-section="cta" class:visible={visible.cta}>
	<div class="cta-inner">
		<div class="wax-seal wax-seal-sm" aria-hidden="true">
			<span class="wax-initials">MC</span>
		</div>
		<h2 class="ink-heading cta-heading">Ready to slow down?</h2>
		<p class="cta-sub">
			Three rooms. One farmhouse. Normandy at its most unhurried.
			<br />Stays from two nights. Available year-round.
		</p>
		<div class="cta-buttons">
			<a href="#" class="stamp-btn">Check availability</a>
			<a href="#" class="stamp-btn stamp-btn--outline">Write to us</a>
		</div>
		<p class="typewriter-label cta-contact">hello@mariannecottage.fr · +33 2 31 00 00 00</p>
	</div>
</section>

<a href="/demo" class="demo-home-btn" title="Back to demo home">
	<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
	<span>Demo home</span>
</a>

<style>
	/* ── Palette ── */
	:root {
		--parchment: #f5efe0;
		--ink: #2a1f0e;
		--sage: #8aaa8a;
		--rust: #8b3a2a;
		--cream: #f0eee9;
		--ink-light: rgba(42, 31, 14, 0.55);
	}

	/* ── Grain overlay ── */
	.grain::before {
		content: '';
		position: fixed;
		inset: 0;
		z-index: 9999;
		pointer-events: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
		opacity: 0.045;
		mix-blend-mode: multiply;
	}

	/* ── Shared ── */
	.ink-heading {
		font-family: 'Playfair Display', Georgia, serif;
		color: var(--ink);
		text-shadow:
			1px 1px 0 rgba(60, 40, 20, 0.09),
			-0.5px 0.5px 0 rgba(60, 40, 20, 0.06);
		letter-spacing: -0.015em;
		line-height: 1.2;
	}

	.typewriter-label {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		color: var(--ink-light);
		text-transform: uppercase;
	}

	.stamp-btn {
		display: inline-block;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--ink);
		background: #e8d5b0;
		border: 2px solid rgba(42, 31, 14, 0.68);
		padding: 0.65rem 1.6rem;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.18),
			inset 0 -1px 2px rgba(255, 255, 255, 0.28),
			2px 2px 0 rgba(42, 31, 14, 0.15);
		transition: transform 0.1s, box-shadow 0.1s;
		cursor: pointer;
	}

	.stamp-btn:hover {
		transform: translate(1px, 1px);
		box-shadow:
			inset 0 3px 5px rgba(0, 0, 0, 0.22),
			inset 0 -1px 2px rgba(255, 255, 255, 0.2),
			1px 1px 0 rgba(42, 31, 14, 0.2);
	}

	.stamp-btn--outline {
		background: transparent;
		color: var(--ink);
		box-shadow:
			inset 0 1px 3px rgba(0, 0, 0, 0.1),
			2px 2px 0 rgba(42, 31, 14, 0.1);
	}

	/* ── Wax seal ── */
	.wax-seal {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: radial-gradient(circle at 38% 35%, #b84a36 0%, #8b3a2a 45%, #6a2a1c 100%);
		box-shadow:
			0 3px 8px rgba(0, 0, 0, 0.35),
			inset 0 1px 3px rgba(255, 180, 150, 0.25),
			inset 0 -2px 4px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem;
		position: relative;
	}

	.wax-seal::after {
		content: '';
		position: absolute;
		inset: 5px;
		border-radius: 50%;
		border: 1.5px solid rgba(255, 200, 170, 0.2);
	}

	.wax-seal-sm {
		width: 56px;
		height: 56px;
		margin-bottom: 1.2rem;
	}

	.wax-initials {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: rgba(255, 235, 220, 0.9);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
		letter-spacing: 0.05em;
		position: relative;
		z-index: 1;
	}

	.wax-seal-sm .wax-initials {
		font-size: 0.85rem;
	}

	/* ── Wonky transforms ── */
	.wonky-left  { transform: rotate(-0.4deg); }
	.wonky-room-1 { transform: rotate(0.35deg); }
	.wonky-room-2 { transform: rotate(-0.55deg); }
	.wonky-room-3 { transform: rotate(0.8deg); }
	.wonky-tex-1  { transform: rotate(-0.6deg); }
	.wonky-tex-2  { transform: rotate(0.45deg); }
	.wonky-tex-3  { transform: rotate(-0.3deg); }

	/* ── Fade-in on scroll ── */
	[data-section] { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.7s ease; }
	[data-section].visible { opacity: 1; transform: translateY(0); }

	/* ── HERO ── */
	.hero {
		background: var(--parchment);
		min-height: 92vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5rem 1.5rem 0;
		position: relative;
		text-align: center;
	}

	.hero-inner {
		max-width: 680px;
		width: 100%;
	}

	.hero-heading {
		font-size: clamp(2.4rem, 6vw, 4.2rem);
		font-weight: 400;
		margin: 0.6rem 0 0.4rem;
	}

	.hero-heading em {
		font-style: italic;
		color: var(--rust);
	}

	.wobbly-underline {
		width: min(380px, 90%);
		height: 20px;
		display: block;
		margin: 0 auto 1.4rem;
		overflow: visible;
	}

	.hero-sub {
		font-size: 1.05rem;
		line-height: 1.7;
		color: var(--ink-light);
		max-width: 480px;
		margin: 0 auto 2rem;
	}

	.section-divider {
		width: 100%;
		margin-top: auto;
		line-height: 0;
	}

	.section-divider svg {
		width: 100%;
		height: 40px;
		display: block;
	}

	/* ── ABOUT / Notebook ── */
	.about {
		background: var(--parchment);
		padding: 3.5rem 1.5rem 4rem;
	}

	.notebook-page {
		max-width: 640px;
		margin: 0 auto;
		background: #fffdf5;
		border: 1px solid rgba(42, 31, 14, 0.12);
		padding: 2.5rem 2.5rem 2.5rem 4rem;
		position: relative;
		box-shadow: 3px 3px 12px rgba(42, 31, 14, 0.08), -1px -1px 4px rgba(42, 31, 14, 0.04);
	}

	/* Notebook lines — CSS-only repeating horizontal rules */
	.notebook-lines {
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 31px,
			rgba(100, 140, 200, 0.12) 31px,
			rgba(100, 140, 200, 0.12) 32px
		);
		background-position: 0 56px;
		pointer-events: none;
	}

	/* Red margin line */
	.notebook-margin {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 3rem;
		width: 1.5px;
		background: rgba(180, 60, 50, 0.25);
		pointer-events: none;
	}

	.notebook-content {
		position: relative;
		z-index: 1;
	}

	.section-heading {
		font-size: clamp(1.6rem, 4vw, 2.4rem);
		font-weight: 600;
		margin-bottom: 1.2rem;
	}

	.body-text {
		font-size: 0.95rem;
		line-height: 2rem; /* matches notebook line height */
		color: var(--ink);
		margin-bottom: 1rem;
	}

	.small-label {
		display: block;
		margin-top: 1.2rem;
	}

	/* ── ROOMS ── */
	.rooms-section {
		background: var(--cream);
		padding: 4rem 1.5rem;
	}

	.section-header-wrap {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.centered { text-align: center; }

	.section-squiggle {
		width: 180px;
		height: 12px;
		display: block;
		margin: 0.5rem auto 0;
	}

	.section-subtext {
		font-size: 0.9rem;
		color: var(--ink-light);
		margin-top: 0.5rem;
		font-style: italic;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 2rem;
		max-width: 960px;
		margin: 0 auto;
	}

	.room-card {
		background: var(--parchment);
		border: 2px solid rgba(42, 31, 14, 0.6);
		box-shadow: 4px 4px 0 rgba(42, 31, 14, 0.12);
		overflow: visible;
		position: relative;
	}

	.torn-top {
		display: block;
		line-height: 0;
		margin-bottom: -1px;
	}

	.torn-top svg {
		width: 100%;
		height: 18px;
		display: block;
	}

	.room-card-inner {
		padding: 1.2rem 1.4rem 1.5rem;
	}

	.room-label {
		display: block;
		margin-bottom: 0.4rem;
	}

	.room-name {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.7rem;
	}

	.room-desc {
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--ink-light);
		margin-bottom: 0.9rem;
	}

	.room-details {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.room-detail {
		font-family: 'Courier New', monospace;
		font-size: 0.68rem;
		color: var(--rust);
		letter-spacing: 0.06em;
	}

	.room-dot {
		color: var(--ink-light);
		font-size: 0.7rem;
	}

	/* ── TORN PAPER BREAK ── */
	.torn-paper-break {
		line-height: 0;
		overflow: hidden;
		height: 50px;
	}

	.torn-paper-break svg {
		width: 100%;
		height: 50px;
		display: block;
	}

	/* ── TEXTURES ── */
	.textures-section {
		background: var(--parchment);
		padding: 4rem 1.5rem;
	}

	.textures-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.8rem;
		max-width: 780px;
		margin: 0 auto;
	}

	.texture-card {
		background: #fffdf5;
		border: 1.5px solid rgba(42, 31, 14, 0.25);
		padding: 1.2rem;
		box-shadow: 2px 2px 6px rgba(42, 31, 14, 0.08);
	}

	.swatch-block {
		width: 100%;
		height: 80px;
		margin-bottom: 0.8rem;
		border: 1px solid rgba(42, 31, 14, 0.15);
	}

	/* Linen — CSS crosshatch */
	.linen-swatch {
		background-color: #e8dfc8;
		background-image:
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 3px,
				rgba(42, 31, 14, 0.07) 3px,
				rgba(42, 31, 14, 0.07) 4px
			),
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 3px,
				rgba(42, 31, 14, 0.07) 3px,
				rgba(42, 31, 14, 0.07) 4px
			);
	}

	/* Aged paper — subtle spots */
	.paper-swatch {
		background-color: #ede3c4;
		background-image:
			radial-gradient(ellipse 8px 5px at 20% 30%, rgba(42,31,14,0.06) 0%, transparent 100%),
			radial-gradient(ellipse 5px 8px at 70% 60%, rgba(42,31,14,0.05) 0%, transparent 100%),
			radial-gradient(ellipse 10px 4px at 50% 80%, rgba(42,31,14,0.04) 0%, transparent 100%),
			repeating-linear-gradient(
				92deg,
				transparent,
				transparent 14px,
				rgba(42, 31, 14, 0.03) 14px,
				rgba(42, 31, 14, 0.03) 15px
			);
	}

	/* Natural cotton — loose weave */
	.cotton-swatch {
		background-color: #f0ece0;
		background-image:
			repeating-linear-gradient(
				45deg,
				transparent,
				transparent 5px,
				rgba(42, 31, 14, 0.05) 5px,
				rgba(42, 31, 14, 0.05) 6px
			),
			repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 5px,
				rgba(42, 31, 14, 0.04) 5px,
				rgba(42, 31, 14, 0.04) 6px
			);
	}

	.swatch-label {
		display: block;
		margin-bottom: 0.35rem;
	}

	.swatch-desc {
		font-size: 0.8rem;
		line-height: 1.55;
		color: var(--ink-light);
	}

	/* ── GUESTBOOK ── */
	.guestbook-section {
		background: var(--cream);
		padding: 4rem 1.5rem;
	}

	.guestbook-page {
		max-width: 580px;
		margin: 0 auto;
		background: #fffdf5;
		border: 1px solid rgba(42, 31, 14, 0.1);
		padding: 3rem 2.5rem 2.5rem;
		position: relative;
		box-shadow: 3px 4px 14px rgba(42, 31, 14, 0.08);
	}

	.ruled-lines {
		position: absolute;
		inset: 0;
		background-image: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 35px,
			rgba(100, 140, 200, 0.1) 35px,
			rgba(100, 140, 200, 0.1) 36px
		);
		background-position: 0 64px;
		pointer-events: none;
	}

	.guestbook-content {
		position: relative;
		z-index: 1;
	}

	.handwritten-entry {
		font-family: 'Playfair Display', Georgia, serif;
		font-style: italic;
		font-size: clamp(1.05rem, 2.5vw, 1.25rem);
		line-height: 2.25rem;
		color: var(--ink);
		margin-bottom: 1rem;
		text-shadow:
			0.5px 1px 0 rgba(60, 40, 20, 0.07),
			-0.3px 0.5px 0 rgba(60, 40, 20, 0.05);
	}

	.squiggle-sig {
		width: 260px;
		height: 14px;
		display: block;
		margin-bottom: 0.5rem;
	}

	.guestbook-sig {
		margin-top: 0.2rem;
	}

	/* ── CTA ── */
	.cta-section {
		background: var(--parchment);
		padding: 5rem 1.5rem 4rem;
		text-align: center;
		border-top: 1.5px solid rgba(42, 31, 14, 0.1);
	}

	.cta-inner {
		max-width: 560px;
		margin: 0 auto;
	}

	.cta-heading {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 400;
		margin-bottom: 1rem;
	}

	.cta-sub {
		font-size: 0.975rem;
		line-height: 1.75;
		color: var(--ink-light);
		margin-bottom: 2rem;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}

	.cta-contact {
		display: block;
	}

	/* ── Demo home button ─────────────────────────── */
	.demo-home-btn {
		position: fixed;
		top: 14px;
		right: 14px;
		z-index: 9999;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 16px 9px 11px;
		background: #b8ff3c;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(140, 210, 0, 0.35);
		border-radius: 999px;
		color: #0d1a05;
		text-decoration: none;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
		box-shadow: 0 2px 20px rgba(130, 220, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.15);
	}

	.demo-home-btn:hover {
		background: #caff52;
		transform: translateY(-1px);
		box-shadow: 0 4px 28px rgba(130, 220, 0, 0.55);
	}

	/* ── Responsive ── */
	@media (max-width: 640px) {
		.notebook-page {
			padding: 2rem 1.5rem 2rem 3rem;
		}
		.notebook-margin {
			left: 2.2rem;
		}
		.rooms-grid {
			grid-template-columns: 1fr;
		}
		.textures-grid {
			grid-template-columns: 1fr;
		}
		.wonky-room-1,
		.wonky-room-2,
		.wonky-room-3 {
			transform: none;
		}
	}
</style>
