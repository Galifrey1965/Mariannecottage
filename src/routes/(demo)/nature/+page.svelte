<script lang="ts">
	import { onMount } from 'svelte';

	let scrollY = $state(0);
	let sections: HTMLElement[] = [];
	let visibleSections = $state(new Set<string>());
	let navVisible = $state(false);

	const SECTIONS = [
		{ id: 'hero' },
		{ id: 'roots' },
		{ id: 'orchard' },
		{ id: 'gateway' },
		{ id: 'silence' },
		{ id: 'comforts' },
		{ id: 'book' }
	];

	onMount(() => {
		const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
		sections = els;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visibleSections = new Set([...visibleSections, entry.target.id]);
						if (entry.target.id === 'comforts' || entry.target.id === 'book') {
							navVisible = true;
						}
					}
				}
			},
			{ threshold: 0.25 }
		);

		for (const el of els) observer.observe(el);

		const onScroll = () => {
			scrollY = window.scrollY;
		};
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', onScroll);
		};
	});

	function visible(id: string) {
		return visibleSections.has(id);
	}

	// Parallax helper
	const heroParallax = $derived(scrollY * 0.35);
</script>

<svelte:head>
	<title>Nature Distilled — Marianne Cottage</title>
</svelte:head>

<!-- Liquid Glass sticky nav (appears after reaching Comforts section) -->
<nav class="glass-nav" class:show={navVisible}>
	<div class="glass-nav-inner">
		<span class="glass-nav-brand">Marianne Cottage</span>
		<div class="glass-nav-links">
			<a href="/historian">The Historian</a>
			<a href="/living">The Map</a>
			<a href="/story">The Story</a>
			<a href="/nature#book" class="glass-nav-cta">Check Availability</a>
		</div>
	</div>
</nav>

<!-- ── SECTION 1: Hero ── -->
<section id="hero" class="s-hero">
	<div class="hero-img-wrap" style="transform: translateY({heroParallax}px)">
		<img src="/images/2024-08-15.jpg" alt="Marianne Cottage" />
	</div>
	<div class="hero-vignette"></div>
	<div class="hero-content" class:fade-up={visible('hero')}>
		<p class="eyebrow">1 La Haye · Couvains · Normandy</p>
		<h1>Nature<br />Distilled</h1>
		<p class="hero-tagline">Where the bocage breathes, the owls call, and history lives in the stone</p>
		<a href="#roots" class="cta-ghost">Begin the Journey</a>
	</div>
	<div class="scroll-arrow" aria-hidden="true">
		<svg width="24" height="36" viewBox="0 0 24 36" fill="none" stroke="rgba(240,238,233,0.6)" stroke-width="1.5" stroke-linecap="round">
			<rect x="1" y="1" width="22" height="26" rx="11" />
			<line x1="12" y1="8" x2="12" y2="14" />
			<path d="M6 28l6 6 6-6" />
		</svg>
	</div>
</section>

<!-- ── SECTION 2: The Roots ── -->
<section id="roots" class="s-roots">
	<div class="stone-texture" aria-hidden="true"></div>
	<div class="roots-inner" class:reveal={visible('roots')}>
		<div class="ink-line">
			<span>I</span>
		</div>
		<h2 class="section-serif">The Roots</h2>
		<p class="section-date">c. 1820 — Couvains, Manche</p>
		<div class="prose-block">
			<p>
				In the early years of the nineteenth century, a mason from the Bessin quarried limestone from the fields of what is now the <em>commune</em> of Couvains and built a <em>longère</em> — a long, low farmhouse that would outlast everyone who raised its walls.
			</p>
			<p>
				The name we give it — <strong>Marianne</strong> — is the name France gives to Liberty herself. The cottage bears it honestly. Its walls of Pierre de Caen, its oak beams felled from the surrounding bocage, its floors worn smooth by two centuries of daily life: each material was chosen to be here, not merely to look as though it was.
			</p>
			<p>
				The restoration used only what was authentic. Lime-wash on the exterior walls — <em>chaux</em>, as it has always been. Reclaimed timber where timber was needed. Local stone where stone was needed. A house that breathes.
			</p>
		</div>
		<div class="roots-details">
			{#each [{ label: 'Built', value: 'c. 1820' }, { label: 'Style', value: 'Longère · Bessin tradition' }, { label: 'Walls', value: 'Pierre de Caen limestone' }, { label: 'Structure', value: 'Reclaimed oak frame' }, { label: 'Finish', value: 'Traditional lime-wash' }, { label: 'Restored', value: '2023–2024' }] as item}
				<div class="detail-item">
					<span class="detail-label">{item.label}</span>
					<span class="detail-value">{item.value}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ── SECTION 3: The Orchard ── -->
<section id="orchard" class="s-orchard">
	<div class="orchard-inner" class:reveal={visible('orchard')}>
		<div class="orchard-images">
			<img src="/images/2023-05-20.jpg" alt="Cottage garden in spring" class="img-main" />
			<img src="/images/2023-06-07.jpg" alt="Cottage grounds" class="img-secondary" />
		</div>
		<div class="orchard-text">
			<div class="ink-line"><span>II</span></div>
			<h2 class="section-serif">The Orchard</h2>
			<p class="section-date">The living grounds</p>
			<div class="prose-block">
				<p>
					The apple trees that grow in the cottage garden are the same varieties that have been pressed into cider and distilled into <em>Calvados</em> here since before anyone can remember. They are old trees: gnarled, patient, unhurried.
				</p>
				<p>
					The tawny owls that nest in their highest branches begin calling at dusk. If you are quiet — if you sit on the terrace with your glass and resist the impulse to speak — you will hear them answer each other across the bocage. Roe deer occasionally emerge from the hedgerows at dawn. Kestrels hunt the meadow to the east.
				</p>
				<p>
					The church bells of the village reach the garden on still mornings. That is the entire soundscape. It is, for most of our guests, the thing they remember most.
				</p>
			</div>
			<div class="nature-tags">
				{#each ['🦉 Tawny Owls', '🦌 Roe Deer', '🪁 Kestrels', '🍎 Apple Orchard', '🔔 Church Bells', '🌿 Bocage Hedgerows'] as tag}
					<span class="nature-tag">{tag}</span>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ── SECTION 4: The Gateway ── -->
<section id="gateway" class="s-gateway">
	<div class="gateway-inner" class:reveal={visible('gateway')}>
		<div class="ink-line"><span>III</span></div>
		<h2 class="section-serif">The Gateway</h2>
		<p class="section-date">A landscape of memory</p>
		<p class="gateway-intro">
			Marianne Cottage sits between two of the defining landscapes of the twentieth century — and one of its greatest architectural survivors. You are not a tourist here. You are a neighbour.
		</p>

		<!-- SVG map bloom -->
		<div class="bloom-map" class:bloomed={visible('gateway')}>
			<svg viewBox="0 0 500 300" class="bloom-svg">
				<!-- Centre dot: cottage -->
				<circle cx="250" cy="175" r="10" fill="#4a586e" />
				<text x="250" y="196" text-anchor="middle" font-size="9" fill="#4a586e" font-family="'Playfair Display',serif" font-weight="600">Marianne Cottage</text>

				<!-- Abbey (NE) -->
				<line class="bloom-line abbey" x1="250" y1="175" x2="350" y2="110" stroke="#8a7a5a" stroke-width="1.5" stroke-dasharray="4 3" />
				<circle class="bloom-node abbey" cx="350" cy="110" r="8" fill="#8a7a5a" />
				<text x="360" y="100" font-size="8" fill="#8a7a5a" font-family="'Playfair Display',serif">Cerisy Abbey · 5 min</text>

				<!-- Omaha (N) -->
				<line class="bloom-line omaha" x1="250" y1="175" x2="200" y2="40" stroke="#7a6060" stroke-width="1.5" stroke-dasharray="4 3" />
				<circle class="bloom-node omaha" cx="200" cy="40" r="8" fill="#7a6060" />
				<text x="170" y="30" font-size="8" fill="#7a6060" font-family="'Playfair Display',serif">Omaha Beach · 25km</text>

				<!-- Gold (NE coast) -->
				<line class="bloom-line gold" x1="250" y1="175" x2="320" y2="38" stroke="#7a6060" stroke-width="1.5" stroke-dasharray="4 3" />
				<circle class="bloom-node gold" cx="320" cy="38" r="8" fill="#7a6060" />
				<text x="325" y="28" font-size="8" fill="#7a6060" font-family="'Playfair Display',serif">Gold Beach · 20km</text>

				<!-- Bayeux (E) -->
				<line class="bloom-line bayeux" x1="250" y1="175" x2="420" y2="200" stroke="#5a6a8a" stroke-width="1.5" stroke-dasharray="4 3" />
				<circle class="bloom-node bayeux" cx="420" cy="200" r="7" fill="#5a6a8a" />
				<text x="428" y="204" font-size="8" fill="#5a6a8a" font-family="'Playfair Display',serif">Bayeux · 18km</text>

				<!-- Saint-Lô (S) -->
				<line class="bloom-line saintlo" x1="250" y1="175" x2="250" y2="270" stroke="#5a6a8a" stroke-width="1.5" stroke-dasharray="4 3" />
				<circle class="bloom-node saintlo" cx="250" cy="270" r="7" fill="#5a6a8a" />
				<text x="258" y="274" font-size="8" fill="#5a6a8a" font-family="'Playfair Display',serif">Saint-Lô · 12km</text>
			</svg>
		</div>

		<div class="gateway-cards">
			{#each [{ icon: '⚔️', title: 'D-Day Beaches', sub: 'Omaha · Gold · Juno · Sword', desc: 'The full D-Day circuit in a single day, with time to sit, reflect, and understand what happened here.' }, { icon: '⛪', title: 'Cerisy-la-Forêt Abbey', sub: 'Founded 1032 · 5 min drive', desc: 'Robert the Magnificent — father of William the Conqueror — founded this abbey. Its Romanesque nave is largely unchanged.' }, { icon: '🏺', title: 'Bayeux Tapestry', sub: 'Bayeux · 18km', desc: 'The 70-metre embroidered chronicle of the Norman Conquest. One of the most extraordinary artefacts in existence.' }] as card}
				<div class="gateway-card">
					<span class="gc-icon">{card.icon}</span>
					<strong class="gc-title">{card.title}</strong>
					<p class="gc-sub">{card.sub}</p>
					<p class="gc-desc">{card.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ── SECTION 5: The Silence ── -->
<section id="silence" class="s-silence">
	<div class="silence-inner" class:reveal={visible('silence')}>
		<div class="ink-line"><span>IV</span></div>
		<h2 class="section-serif">The Silence</h2>
		<blockquote class="pull-quote">
			"Take your coffee outside at dawn, before you have any plans, and simply listen to what Normandy sounds like when it is not performing for anyone."
		</blockquote>
		<div class="silence-gallery">
			<img src="/images/gallery/living-dining-room.jpeg" alt="Living room" />
			<img src="/images/gallery/breakfast-table-set.jpeg" alt="Breakfast" />
			<img src="/images/gallery/bedroom-double-bed.jpeg" alt="Double bedroom" />
		</div>
	</div>
</section>

<!-- ── SECTION 6: Modern Comforts ── -->
<section id="comforts" class="s-comforts">
	<div class="comforts-inner" class:reveal={visible('comforts')}>
		<div class="ink-line"><span>V</span></div>
		<h2 class="section-serif">Modern Comforts</h2>
		<p class="section-date">Two en-suite rooms · Garden views · Full breakfast included</p>
		<div class="rooms-grid">
			{#each [{ title: 'The Double Room', img: '/images/gallery/bedroom-double-bed.jpeg', features: ['King-size bed', 'Garden view', 'En-suite shower', 'Free WiFi'] }, { title: 'The Twin Room', img: '/images/gallery/bedroom-twin-full.jpeg', features: ['Two single beds', 'Garden outlook', 'En-suite shower', 'Free WiFi'] }] as room}
				<div class="room-card">
					<img src={room.img} alt={room.title} />
					<div class="room-info">
						<strong>{room.title}</strong>
						<ul>
							{#each room.features as f}<li>{f}</li>{/each}
						</ul>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ── SECTION 7: Booking Reveal ── -->
<section id="book" class="s-book">
	<div class="book-inner" class:reveal={visible('book')}>
		<div class="book-text">
			<p class="eyebrow-light">The journey begins here</p>
			<h2 class="section-serif light">Reserve Your Stay</h2>
			<p class="book-sub">
				Two rooms. Breakfast included. The bocage, the owls, the abbey, and the beaches — all within reach.
			</p>
		</div>

		<!-- Wax seal mock booking button -->
		<button class="wax-seal" aria-label="Check availability (demo)">
			<div class="seal-outer">
				<div class="seal-inner">
					<span class="seal-m">M</span>
					<span class="seal-text">CHECK<br />AVAILABILITY</span>
				</div>
			</div>
			<span class="seal-ribbon"></span>
		</button>

		<p class="book-note">
			This is a demonstration — <a href="/">visit the main site</a> to make a real booking.
		</p>
	</div>
</section>

<style>
	/* ── Global section base ── */
	section {
		position: relative;
		overflow: hidden;
	}

	/* ── Glass Nav ── */
	.glass-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 200;
		transform: translateY(-100%);
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		background: rgba(240, 238, 233, 0.75);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-bottom: 1px solid rgba(214, 204, 194, 0.6);
	}
	.glass-nav.show {
		transform: translateY(0);
	}
	.glass-nav-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0.85rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.glass-nav-brand {
		font-family: 'Playfair Display', serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #3a3a3a;
	}
	.glass-nav-links {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	.glass-nav-links a {
		font-size: 0.8rem;
		color: #5a5a5a;
		text-decoration: none;
		letter-spacing: 0.03em;
	}
	.glass-nav-links a:hover {
		color: #3a3a3a;
	}
	.glass-nav-cta {
		padding: 0.5rem 1.1rem;
		background: #4a586e;
		color: #f0eee9 !important;
		border-radius: 2px;
		transition: background 0.15s;
	}
	.glass-nav-cta:hover {
		background: #3a4a5c !important;
	}

	/* ── Eyebrow / shared ── */
	.eyebrow {
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(240, 238, 233, 0.7);
		margin-bottom: 1rem;
		font-weight: 500;
	}
	.ink-line {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.ink-line::before,
	.ink-line::after {
		content: '';
		flex: 1;
		height: 1px;
		background: currentColor;
		opacity: 0.2;
	}
	.ink-line span {
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: 0.85rem;
		opacity: 0.5;
		letter-spacing: 0.08em;
	}
	.section-serif {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		line-height: 1.1;
		margin-bottom: 0.4rem;
	}
	.section-date {
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.5;
		margin-bottom: 2rem;
		font-weight: 500;
	}
	.prose-block p {
		font-size: 1.05rem;
		line-height: 1.85;
		margin-bottom: 1.25rem;
		max-width: 620px;
	}

	/* ── Reveal animations ── */
	.roots-inner,
	.orchard-inner,
	.gateway-inner,
	.silence-inner,
	.comforts-inner,
	.book-inner {
		opacity: 0;
		transform: translateY(32px);
		transition:
			opacity 0.8s ease,
			transform 0.8s ease;
	}
	.roots-inner.reveal,
	.orchard-inner.reveal,
	.gateway-inner.reveal,
	.silence-inner.reveal,
	.comforts-inner.reveal,
	.book-inner.reveal {
		opacity: 1;
		transform: none;
	}
	.hero-content {
		opacity: 0;
		transform: translateY(24px);
		transition:
			opacity 1s ease 0.3s,
			transform 1s ease 0.3s;
	}
	.hero-content.fade-up {
		opacity: 1;
		transform: none;
	}

	/* ── HERO ── */
	.s-hero {
		height: 100dvh;
		min-height: 560px;
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding-bottom: 6rem;
	}
	.hero-img-wrap {
		position: absolute;
		inset: -80px 0 0 0;
		will-change: transform;
	}
	.hero-img-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 35%;
	}
	.hero-vignette {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(58, 58, 58, 0.1) 0%,
			rgba(58, 58, 58, 0.5) 55%,
			rgba(20, 20, 20, 0.8) 100%
		);
	}
	.hero-content {
		position: relative;
		text-align: center;
		color: #f0eee9;
		z-index: 1;
	}
	h1 {
		font-family: 'Playfair Display', serif;
		font-size: clamp(3.5rem, 10vw, 7rem);
		font-weight: 700;
		line-height: 0.95;
		margin-bottom: 1.25rem;
		color: #f0eee9;
	}
	.hero-tagline {
		font-size: 1rem;
		opacity: 0.8;
		font-weight: 300;
		max-width: 480px;
		margin: 0 auto 2.5rem;
		line-height: 1.7;
	}
	.cta-ghost {
		display: inline-block;
		padding: 0.9rem 2.2rem;
		border: 1px solid rgba(240, 238, 233, 0.5);
		border-radius: 2px;
		color: #f0eee9;
		text-decoration: none;
		font-size: 0.85rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		backdrop-filter: blur(8px);
		transition:
			background 0.2s,
			border-color 0.2s;
	}
	.cta-ghost:hover {
		background: rgba(240, 238, 233, 0.15);
		border-color: rgba(240, 238, 233, 0.8);
	}
	.scroll-arrow {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		animation: bounce 2s ease infinite;
	}
	@keyframes bounce {
		0%, 100% { transform: translateX(-50%) translateY(0); }
		50% { transform: translateX(-50%) translateY(6px); }
	}

	/* ── ROOTS ── */
	.s-roots {
		background: #2e2a24;
		color: #e8e4da;
		padding: 8rem 2rem;
	}
	.stone-texture {
		position: absolute;
		inset: 0;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
		opacity: 0.8;
		pointer-events: none;
	}
	.roots-inner {
		max-width: 780px;
		margin: 0 auto;
		position: relative;
	}
	.s-roots .ink-line {
		color: #e8e4da;
	}
	.s-roots .section-serif {
		color: #f0eee9;
	}
	.s-roots .prose-block p {
		color: #c8c4ba;
	}
	.s-roots .prose-block em {
		color: #d6ccc2;
		font-style: italic;
	}
	.s-roots .prose-block strong {
		color: #f0eee9;
	}
	.roots-details {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: rgba(214, 204, 194, 0.15);
		border: 1px solid rgba(214, 204, 194, 0.15);
		margin-top: 3rem;
	}
	.detail-item {
		padding: 1.1rem 1.25rem;
		background: rgba(58, 52, 44, 0.5);
	}
	.detail-label {
		display: block;
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #8a8078;
		margin-bottom: 0.3rem;
	}
	.detail-value {
		font-size: 0.85rem;
		color: #d6ccc2;
		font-weight: 500;
	}

	/* ── ORCHARD ── */
	.s-orchard {
		background: #f0eee9;
		padding: 8rem 2rem;
	}
	.orchard-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 5rem;
		align-items: start;
	}
	.orchard-images {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}
	.img-main {
		width: 100%;
		aspect-ratio: 4/3;
		object-fit: cover;
		border-radius: 2px;
	}
	.img-secondary {
		width: 70%;
		margin-left: auto;
		aspect-ratio: 4/3;
		object-fit: cover;
		border-radius: 2px;
		opacity: 0.85;
	}
	.nature-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 2rem;
	}
	.nature-tag {
		padding: 0.35rem 0.75rem;
		background: #fff;
		border: 1px solid #d6ccc2;
		border-radius: 2px;
		font-size: 0.78rem;
		color: #5a5a5a;
	}

	/* ── GATEWAY ── */
	.s-gateway {
		background: #f7f4ef;
		padding: 8rem 2rem;
	}
	.gateway-inner {
		max-width: 900px;
		margin: 0 auto;
	}
	.gateway-intro {
		font-size: 1.05rem;
		line-height: 1.8;
		color: #5a5a5a;
		max-width: 620px;
		margin-bottom: 3rem;
	}

	/* Bloom SVG animations */
	.bloom-map {
		margin: 3rem 0;
		background: #fff;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		padding: 1.5rem;
	}
	.bloom-svg {
		width: 100%;
		max-height: 280px;
	}
	.bloom-line {
		stroke-dashoffset: 200;
		transition: stroke-dashoffset 1.2s ease;
	}
	.bloom-node {
		transform: scale(0);
		transform-origin: center;
		transition: transform 0.4s ease;
	}
	.bloomed .bloom-line {
		stroke-dashoffset: 0;
	}
	.bloomed .bloom-node {
		transform: scale(1);
	}
	.bloomed .abbey { transition-delay: 0.3s; }
	.bloomed .bloom-line.abbey { transition-delay: 0.1s; }
	.bloomed .omaha { transition-delay: 0.5s; }
	.bloomed .bloom-line.omaha { transition-delay: 0.25s; }
	.bloomed .gold { transition-delay: 0.65s; }
	.bloomed .bloom-line.gold { transition-delay: 0.4s; }
	.bloomed .bayeux { transition-delay: 0.8s; }
	.bloomed .bloom-line.bayeux { transition-delay: 0.55s; }
	.bloomed .saintlo { transition-delay: 0.9s; }
	.bloomed .bloom-line.saintlo { transition-delay: 0.65s; }

	.gateway-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-top: 2rem;
	}
	.gateway-card {
		background: #fff;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		padding: 1.5rem;
	}
	.gc-icon {
		font-size: 1.5rem;
		display: block;
		margin-bottom: 0.75rem;
	}
	.gc-title {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: 1rem;
		font-weight: 600;
		color: #3a3a3a;
		margin-bottom: 0.25rem;
	}
	.gc-sub {
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a9b7ac;
		margin-bottom: 0.75rem;
	}
	.gc-desc {
		font-size: 0.82rem;
		line-height: 1.65;
		color: #6a6a6a;
	}

	/* ── SILENCE ── */
	.s-silence {
		background: #3a3a3a;
		color: #e8e4da;
		padding: 8rem 2rem;
	}
	.silence-inner {
		max-width: 900px;
		margin: 0 auto;
	}
	.s-silence .ink-line {
		color: #e8e4da;
	}
	.s-silence .section-serif {
		color: #f0eee9;
	}
	.pull-quote {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.2rem, 2.5vw, 1.7rem);
		font-style: italic;
		line-height: 1.6;
		color: #d6ccc2;
		border-left: 3px solid #a9b7ac;
		padding-left: 2rem;
		margin: 2rem 0 3rem;
		max-width: 700px;
	}
	.silence-gallery {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 0.75rem;
	}
	.silence-gallery img {
		width: 100%;
		height: 220px;
		object-fit: cover;
		border-radius: 2px;
		opacity: 0.85;
	}

	/* ── COMFORTS ── */
	.s-comforts {
		background: #f0eee9;
		padding: 8rem 2rem;
	}
	.comforts-inner {
		max-width: 900px;
		margin: 0 auto;
	}
	.rooms-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 2rem;
	}
	.room-card {
		background: #fff;
		border: 1px solid #d6ccc2;
		border-radius: 3px;
		overflow: hidden;
	}
	.room-card img {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}
	.room-info {
		padding: 1.25rem;
	}
	.room-info strong {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: 1.05rem;
		color: #3a3a3a;
		margin-bottom: 0.75rem;
	}
	.room-info ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.room-info li {
		font-size: 0.8rem;
		color: #6a6a6a;
	}
	.room-info li::before {
		content: '— ';
		color: #a9b7ac;
	}

	/* ── BOOKING ── */
	.s-book {
		background: #2a2e35;
		padding: 8rem 2rem;
		text-align: center;
	}
	.book-inner {
		max-width: 700px;
		margin: 0 auto;
	}
	.eyebrow-light {
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(169, 183, 172, 0.8);
		margin-bottom: 1rem;
		font-weight: 500;
	}
	.section-serif.light {
		color: #f0eee9;
		margin-bottom: 1rem;
	}
	.book-sub {
		font-size: 1rem;
		line-height: 1.75;
		color: rgba(240, 238, 233, 0.65);
		max-width: 480px;
		margin: 0 auto 3.5rem;
	}

	/* Wax seal */
	.wax-seal {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		margin-bottom: 2rem;
		transition: transform 0.2s;
	}
	.wax-seal:hover {
		transform: scale(1.04);
	}
	.wax-seal:active {
		transform: scale(0.97);
	}
	.seal-outer {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		background: radial-gradient(circle at 38% 35%, #8a2020, #5a1010 70%);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 6px 24px rgba(90, 16, 16, 0.5),
			inset 0 2px 4px rgba(255, 180, 180, 0.15),
			inset 0 -3px 8px rgba(0, 0, 0, 0.3);
		position: relative;
	}
	.seal-outer::before {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		border: 1px solid rgba(255, 200, 200, 0.2);
	}
	.seal-outer::after {
		content: '';
		position: absolute;
		inset: 14px;
		border-radius: 50%;
		border: 1px dashed rgba(255, 200, 200, 0.15);
	}
	.seal-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}
	.seal-m {
		font-family: 'Playfair Display', serif;
		font-size: 2rem;
		font-weight: 700;
		color: rgba(240, 238, 233, 0.9);
		line-height: 1;
	}
	.seal-text {
		font-size: 0.55rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: rgba(240, 238, 233, 0.65);
		text-align: center;
		line-height: 1.5;
	}
	.seal-ribbon {
		display: block;
		width: 4px;
		height: 32px;
		background: linear-gradient(to bottom, #6a1010, #8a2020);
		box-shadow: 3px 0 0 #5a1010;
	}

	.book-note {
		font-size: 0.78rem;
		color: rgba(240, 238, 233, 0.4);
		margin-top: 1rem;
	}
	.book-note a {
		color: rgba(169, 183, 172, 0.7);
		text-decoration: underline;
	}

	/* ── Responsive ── */
	@media (max-width: 900px) {
		.orchard-inner {
			grid-template-columns: 1fr;
		}
		.gateway-cards {
			grid-template-columns: 1fr;
		}
		.silence-gallery {
			grid-template-columns: 1fr 1fr;
		}
		.silence-gallery img:first-child {
			grid-column: span 2;
		}
		.roots-details {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 600px) {
		.rooms-grid {
			grid-template-columns: 1fr;
		}
		.silence-gallery {
			grid-template-columns: 1fr;
		}
		.silence-gallery img:first-child {
			grid-column: span 1;
		}
		.glass-nav-links a:not(.glass-nav-cta) {
			display: none;
		}
	}
</style>
