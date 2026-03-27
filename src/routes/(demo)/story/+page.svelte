<script lang="ts">
	import { onMount } from 'svelte';

	let scrollY = $state(0);
	let winH = $state(600);

	// Progress 0→1 over first "scroll zone" (1.5x viewport height)
	const sketchProgress = $derived(Math.min(1, scrollY / (winH * 1.2)));
	const colorProgress = $derived(Math.min(1, scrollY / (winH * 1.0)));

	// CSS filter values derived from scroll
	const grayscale = $derived(Math.max(0, 1 - colorProgress));
	const sketchOpacity = $derived(Math.max(0, 1 - sketchProgress * 1.8));

	let sections: HTMLElement[] = [];
	let visibleSections = $state(new Set<string>());

	const SECTION_IDS = ['scroll-hero', 'roots', 'restoration', 'today', 'footer-book'];

	onMount(() => {
		winH = window.innerHeight;

		const onScroll = () => {
			scrollY = window.scrollY;
		};
		const onResize = () => {
			winH = window.innerHeight;
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });

		const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
			Boolean
		) as HTMLElement[];
		sections = els;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visibleSections = new Set([...visibleSections, entry.target.id]);
					}
				}
			},
			{ threshold: 0.2 }
		);
		for (const el of els) observer.observe(el);

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			observer.disconnect();
		};
	});

	function vis(id: string) {
		return visibleSections.has(id);
	}

	// Parallax for hero image
	const heroParallax = $derived(scrollY * 0.3);
</script>

<svelte:head>
	<title>The Tactile Story — Marianne Cottage</title>
</svelte:head>

<!-- Fixed sketch-to-photo hero that transitions on scroll -->
<div class="scroll-stage" id="scroll-hero" aria-label="Marianne Cottage — scroll to reveal">
	<!-- The photograph (colorizes as you scroll) -->
	<div
		class="photo-layer"
		style="transform: translateY({heroParallax}px); filter: grayscale({grayscale}) brightness({0.85 + colorProgress * 0.15}) contrast({1.05 - colorProgress * 0.05})"
	>
		<img src="/images/2024-08-15.jpg" alt="Marianne Cottage" />
	</div>

	<!-- SVG Sketch overlay (fades out as you scroll) -->
	<div class="sketch-layer" style="opacity: {sketchOpacity}">
		<svg
			viewBox="0 0 900 600"
			xmlns="http://www.w3.org/2000/svg"
			class="sketch-svg"
			aria-hidden="true"
		>
			<!-- Ground line -->
			<line x1="80" y1="420" x2="820" y2="420" stroke="#3a3a3a" stroke-width="2" stroke-linecap="round" />

			<!-- Main building body (longère — long, low) -->
			<rect x="120" y="260" width="660" height="160" fill="none" stroke="#3a3a3a" stroke-width="2.5" />

			<!-- Roof (pitched) -->
			<polyline points="100,260 450,150 800,260" fill="none" stroke="#3a3a3a" stroke-width="2.5" stroke-linejoin="round" />

			<!-- Roof cross-hatching (right slope) -->
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
				<line
					x1={460 + i * 42}
					y1={152 + i * 13}
					x2={480 + i * 42}
					y2={152 + i * 13 + 20}
					stroke="#3a3a3a"
					stroke-width="0.8"
					opacity="0.45"
				/>
			{/each}
			<!-- Roof cross-hatching (left slope) -->
			{#each [0, 1, 2, 3, 4, 5, 6, 7] as i}
				<line
					x1={440 - i * 42}
					y1={152 + i * 13}
					x2={420 - i * 42}
					y2={152 + i * 13 + 20}
					stroke="#3a3a3a"
					stroke-width="0.8"
					opacity="0.45"
				/>
			{/each}

			<!-- Left chimney -->
			<rect x="200" y="190" width="30" height="75" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<rect x="195" y="185" width="40" height="10" fill="none" stroke="#3a3a3a" stroke-width="1.5" />

			<!-- Right chimney -->
			<rect x="670" y="190" width="30" height="75" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<rect x="665" y="185" width="40" height="10" fill="none" stroke="#3a3a3a" stroke-width="1.5" />

			<!-- Windows (left cluster) -->
			<rect x="160" y="300" width="60" height="70" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<line x1="190" y1="300" x2="190" y2="370" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<line x1="160" y1="335" x2="220" y2="335" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<rect x="260" y="300" width="60" height="70" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<line x1="290" y1="300" x2="290" y2="370" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<line x1="260" y1="335" x2="320" y2="335" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<!-- Central door -->
			<rect x="400" y="305" width="100" height="115" fill="none" stroke="#3a3a3a" stroke-width="2.5" />
			<path d="M400 305 Q450 280 500 305" fill="none" stroke="#3a3a3a" stroke-width="1.5" />
			<circle cx="408" cy="365" r="4" fill="none" stroke="#3a3a3a" stroke-width="1.5" />
			<line x1="450" y1="305" x2="450" y2="420" stroke="#3a3a3a" stroke-width="1" opacity="0.5" />

			<!-- Windows (right cluster) -->
			<rect x="560" y="300" width="60" height="70" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<line x1="590" y1="300" x2="590" y2="370" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<line x1="560" y1="335" x2="620" y2="335" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<rect x="660" y="300" width="60" height="70" fill="none" stroke="#3a3a3a" stroke-width="2" />
			<line x1="690" y1="300" x2="690" y2="370" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<line x1="660" y1="335" x2="720" y2="335" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<!-- Apple tree (left) -->
			<line x1="90" y1="420" x2="90" y2="340" stroke="#3a3a3a" stroke-width="2" />
			<circle cx="90" cy="318" r="26" fill="none" stroke="#3a3a3a" stroke-width="1.5" />
			<circle cx="75" cy="306" r="16" fill="none" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<circle cx="108" cy="310" r="14" fill="none" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<!-- Apple tree (right) -->
			<line x1="810" y1="420" x2="810" y2="340" stroke="#3a3a3a" stroke-width="2" />
			<circle cx="810" cy="318" r="24" fill="none" stroke="#3a3a3a" stroke-width="1.5" />
			<circle cx="795" cy="308" r="14" fill="none" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />
			<circle cx="826" cy="308" r="16" fill="none" stroke="#3a3a3a" stroke-width="1" opacity="0.6" />

			<!-- Bocage hedge suggestion -->
			{#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as i}
				<ellipse
					cx={80 + i * 60}
					cy={445}
					rx="28"
					ry="18"
					fill="none"
					stroke="#3a3a3a"
					stroke-width="1"
					opacity="0.3"
				/>
			{/each}

			<!-- Artist signature hint -->
			<text x="820" y="470" font-family="'Playfair Display',serif" font-style="italic" font-size="11" fill="#3a3a3a" opacity="0.35" text-anchor="end">Marianne · c.1820</text>
		</svg>
	</div>

	<!-- Overlay text fades in as sketch fades -->
	<div
		class="stage-overlay"
		style="opacity: {Math.min(1, colorProgress * 1.4)}"
	>
		<p class="stage-eyebrow">Marianne Cottage · Couvains, Normandy</p>
		<h1 class="stage-title">The Tactile Story</h1>
		<p class="stage-sub">Scroll to reveal two centuries</p>
	</div>

	<!-- Scroll progress bar -->
	<div class="progress-bar">
		<div class="progress-fill" style="width: {Math.round(colorProgress * 100)}%"></div>
	</div>

	<!-- Scroll cue (fades once you start) -->
	<div class="scroll-cue" style="opacity: {Math.max(0, 1 - scrollY / 120)}">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(240,238,233,0.6)" stroke-width="1.5" stroke-linecap="round">
			<path d="M12 5v14M5 12l7 7 7-7" />
		</svg>
		<span>scroll</span>
	</div>
</div>

<!-- ── Narrative sections below ── -->

<!-- Section I: 1800s Origins -->
<section id="roots" class="s-chapter dark" class:reveal={vis('roots')}>
	<div class="chapter-inner">
		<div class="chapter-num">I</div>
		<div class="chapter-content">
			<h2 class="chapter-title">The Stone is Laid</h2>
			<p class="chapter-date">Couvains, Manche · c. 1820</p>
			<div class="chapter-text">
				<p>
					The mason who built this house in the early years of the nineteenth century would not have known the word <em>longère</em> — it was simply how houses were built in the Bessin. One storey, long and low, following the contour of the land. Walls thick enough to outlast the centuries.
				</p>
				<p>
					The stone came from local fields — Pierre de Caen, the same pale limestone that the Normans would later carry across the Channel to build the Tower of London and Canterbury Cathedral. The oak beams were felled from the bocage that surrounded the property on all sides.
				</p>
			</div>
			<div class="chapter-aside">
				<div class="aside-item">
					<strong>Material</strong>
					<span>Pierre de Caen · Limestone</span>
				</div>
				<div class="aside-item">
					<strong>Structure</strong>
					<span>Bocage oak · Hand-hewn</span>
				</div>
				<div class="aside-item">
					<strong>Finish</strong>
					<span>Chaux · Traditional lime-wash</span>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Section II: The Restoration -->
<section id="restoration" class="s-chapter light" class:reveal={vis('restoration')}>
	<div class="chapter-inner">
		<div class="chapter-num muted">II</div>
		<div class="chapter-content">
			<h2 class="chapter-title">The Restoration</h2>
			<p class="chapter-date">2023–2024 · Sympathetic renewal</p>
			<div class="chapter-text">
				<p>
					When the work began in 2023, the guiding principle was simple: do not invent, do not improve upon what was already here. Strip back. Understand what the house wanted to be. Then let it become that.
				</p>
				<p>
					The lime-wash went back on the walls. Salvaged oak replaced what the decades had taken. The floors were laid in the local stone. And gradually, across eighteen months, the house remembered itself.
				</p>
			</div>
			<div class="restoration-images">
				<img src="/images/gallery/living-dining-room.jpeg" alt="Restored living room" />
				<img src="/images/gallery/dining-table.jpeg" alt="Dining room" />
			</div>
		</div>
	</div>
</section>

<!-- Section III: Today -->
<section id="today" class="s-chapter green" class:reveal={vis('today')}>
	<div class="chapter-inner">
		<div class="chapter-num light">III</div>
		<div class="chapter-content">
			<h2 class="chapter-title">Today</h2>
			<p class="chapter-date">Marianne Cottage · Open for guests</p>
			<div class="chapter-text">
				<p>
					Two en-suite rooms. Breakfast from local produce. A garden that borders the bocage. Tawny owls at dusk. The abbey in five minutes. The beaches in twenty.
				</p>
				<p>
					The house has become what it was always meant to be: not a museum of a past life, but a place to live one. <em>Bienvenue.</em>
				</p>
			</div>
			<div class="today-rooms">
				{#each [{ img: '/images/gallery/bedroom-double-bed.jpeg', title: 'The Double Room', sub: 'King bed · Garden view · En-suite' }, { img: '/images/gallery/bedroom-twin-full.jpeg', title: 'The Twin Room', sub: '2 singles · Garden outlook · En-suite' }, { img: '/images/gallery/breakfast-table-set.jpeg', title: 'Breakfast Included', sub: 'Local produce · Daily' }] as r}
					<div class="today-card">
						<img src={r.img} alt={r.title} />
						<div class="today-card-text">
							<strong>{r.title}</strong>
							<span>{r.sub}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Footer / Booking reveal -->
<footer id="footer-book" class="s-book-footer" class:reveal={vis('footer-book')}>
	<div class="footer-inner">
		<div class="footer-content">
			<p class="footer-eyebrow">The story continues with your visit</p>
			<h2 class="footer-title">Begin Your Stay</h2>
			<p class="footer-sub">
				Couvains, Normandy · Two rooms · Breakfast included<br />
				The bocage, the owls, the abbey, the beaches.
			</p>
		</div>

		<!-- Wax seal -->
		<div class="seal-group">
			<button class="seal-btn" aria-label="Check availability (demo)">
				<div class="seal-face">
					<span class="seal-initial">M</span>
					<span class="seal-label">CHECK<br />AVAILABILITY</span>
				</div>
			</button>
			<div class="seal-drip"></div>
		</div>

		<p class="footer-note">
			Demonstration only — <a href="/">visit the main site</a> for real bookings
		</p>

		<div class="footer-links">
			<a href="/historian">The Historian</a>
			<span aria-hidden="true">·</span>
			<a href="/living">The Map</a>
			<span aria-hidden="true">·</span>
			<a href="/nature">Nature Distilled</a>
		</div>
	</div>
</footer>

<nav class="demo-footer-nav" aria-label="Demo pages">
	<a href="/">← Site</a>
	<span>|</span>
	<a href="/historian">historian</a>
	<a href="/living">living</a>
	<a href="/nature">nature</a>
	<a href="/story" aria-current="page">story</a>
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
</nav>

<style>
	/* ── Scroll stage ── */
	.scroll-stage {
		position: relative;
		height: 100dvh;
		min-height: 560px;
		overflow: hidden;
		background: #1a1a18;
	}

	.photo-layer {
		position: absolute;
		inset: -80px 0 0 0;
		will-change: transform, filter;
		transition: filter 0.05s linear;
	}
	.photo-layer img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 40%;
	}

	/* Sketch overlay */
	.sketch-layer {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		will-change: opacity;
		transition: opacity 0.05s linear;
		background: rgba(240, 238, 233, 0.88);
	}
	.sketch-svg {
		width: 90%;
		max-width: 860px;
		max-height: 72vh;
	}

	/* Stage overlay text */
	.stage-overlay {
		position: absolute;
		bottom: 5rem;
		left: 0;
		right: 0;
		text-align: center;
		color: #f0eee9;
		will-change: opacity;
		pointer-events: none;
	}
	.stage-eyebrow {
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.7;
		margin-bottom: 0.75rem;
	}
	.stage-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 7vw, 5.5rem);
		font-weight: 700;
		color: #f0eee9;
		line-height: 1;
		margin-bottom: 0.75rem;
		text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
	}
	.stage-sub {
		font-size: 0.9rem;
		opacity: 0.7;
		letter-spacing: 0.08em;
	}

	/* Progress bar */
	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.15);
	}
	.progress-fill {
		height: 100%;
		background: #a9b7ac;
		transition: width 0.05s linear;
	}

	/* Scroll cue */
	.scroll-cue {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
		animation: pulse-cue 2s ease infinite;
	}
	.scroll-cue span {
		font-size: 0.6rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(240, 238, 233, 0.5);
	}
	@keyframes pulse-cue {
		0%, 100% { opacity: 0.6; transform: translateX(-50%) translateY(0); }
		50% { opacity: 1; transform: translateX(-50%) translateY(4px); }
	}

	/* ── Chapter sections ── */
	.s-chapter {
		padding: 8rem 2rem;
		opacity: 0;
		transform: translateY(40px);
		transition: opacity 0.9s ease, transform 0.9s ease;
	}
	.s-chapter.reveal {
		opacity: 1;
		transform: none;
	}
	.s-chapter.dark {
		background: #1e1c18;
		color: #e8e4da;
	}
	.s-chapter.light {
		background: #f0eee9;
		color: #3a3a3a;
	}
	.s-chapter.green {
		background: #d8e4d8;
		color: #2a3a2a;
	}
	.chapter-inner {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 80px 1fr;
		gap: 3rem;
		align-items: start;
	}
	.chapter-num {
		font-family: 'Playfair Display', serif;
		font-size: 5rem;
		font-weight: 700;
		line-height: 1;
		opacity: 0.12;
		color: inherit;
		text-align: center;
		padding-top: 0.3rem;
	}
	.chapter-num.muted { opacity: 0.08; }
	.chapter-num.light { color: #2a3a2a; opacity: 0.15; }

	.chapter-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 700;
		line-height: 1.1;
		margin-bottom: 0.3rem;
		color: inherit;
	}
	.chapter-date {
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		opacity: 0.45;
		margin-bottom: 2rem;
	}
	.chapter-text p {
		font-size: 1.05rem;
		line-height: 1.85;
		margin-bottom: 1.25rem;
		max-width: 580px;
	}
	.s-chapter.dark .chapter-text p { color: #b8b4aa; }
	.s-chapter.dark .chapter-text em { color: #d6ccc2; }
	.s-chapter.light .chapter-text p { color: #5a5a5a; }
	.s-chapter.green .chapter-text p { color: #3a4a3a; }
	.s-chapter.green .chapter-text em { color: #2a3a2a; }

	/* Chapter aside (dark section details) */
	.chapter-aside {
		display: flex;
		gap: 2rem;
		margin-top: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(214, 204, 194, 0.15);
		flex-wrap: wrap;
	}
	.aside-item strong {
		display: block;
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #7a7870;
		margin-bottom: 0.3rem;
	}
	.aside-item span {
		font-size: 0.85rem;
		color: #d6ccc2;
	}

	/* Restoration images */
	.restoration-images {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 1rem;
		margin-top: 2.5rem;
	}
	.restoration-images img {
		width: 100%;
		aspect-ratio: 4/3;
		object-fit: cover;
		border-radius: 2px;
	}

	/* Today rooms */
	.today-rooms {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem;
		margin-top: 2.5rem;
	}
	.today-card {
		background: rgba(255, 255, 255, 0.5);
		border: 1px solid rgba(58, 90, 58, 0.15);
		border-radius: 2px;
		overflow: hidden;
	}
	.today-card img {
		width: 100%;
		height: 140px;
		object-fit: cover;
	}
	.today-card-text {
		padding: 0.9rem;
	}
	.today-card-text strong {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: 0.88rem;
		color: #2a3a2a;
		margin-bottom: 0.25rem;
	}
	.today-card-text span {
		font-size: 0.72rem;
		color: #5a7a5a;
		line-height: 1.5;
	}

	/* ── Footer / booking ── */
	.s-book-footer {
		background: #141210;
		color: #f0eee9;
		padding: 8rem 2rem;
		text-align: center;
		opacity: 0;
		transform: translateY(40px);
		transition: opacity 0.9s ease, transform 0.9s ease;
	}
	.s-book-footer.reveal {
		opacity: 1;
		transform: none;
	}
	.footer-inner {
		max-width: 600px;
		margin: 0 auto;
	}
	.footer-eyebrow {
		font-size: 0.68rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(169, 183, 172, 0.7);
		margin-bottom: 1rem;
	}
	.footer-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		color: #f0eee9;
		margin-bottom: 1rem;
	}
	.footer-sub {
		font-size: 0.95rem;
		line-height: 1.75;
		color: rgba(240, 238, 233, 0.55);
		margin-bottom: 3.5rem;
	}

	/* Wax seal */
	.seal-group {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;
	}
	.seal-btn {
		width: 136px;
		height: 136px;
		border-radius: 50%;
		background: radial-gradient(circle at 36% 32%, #7a1a1a, #4a0808 70%);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 8px 28px rgba(90, 10, 10, 0.55),
			inset 0 2px 4px rgba(255, 160, 160, 0.12),
			inset 0 -3px 10px rgba(0, 0, 0, 0.35);
		transition: transform 0.2s, box-shadow 0.2s;
		position: relative;
	}
	.seal-btn::before {
		content: '';
		position: absolute;
		inset: 8px;
		border-radius: 50%;
		border: 1px solid rgba(255, 200, 200, 0.18);
	}
	.seal-btn::after {
		content: '';
		position: absolute;
		inset: 16px;
		border-radius: 50%;
		border: 1px dashed rgba(255, 200, 200, 0.12);
	}
	.seal-btn:hover {
		transform: scale(1.05);
		box-shadow:
			0 12px 36px rgba(90, 10, 10, 0.65),
			inset 0 2px 4px rgba(255, 160, 160, 0.15),
			inset 0 -3px 10px rgba(0, 0, 0, 0.35);
	}
	.seal-btn:active {
		transform: scale(0.96);
	}
	.seal-face {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
	}
	.seal-initial {
		font-family: 'Playfair Display', serif;
		font-size: 2rem;
		font-weight: 700;
		color: rgba(240, 238, 233, 0.88);
		line-height: 1;
	}
	.seal-label {
		font-size: 0.5rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(240, 238, 233, 0.6);
		text-align: center;
		line-height: 1.6;
	}
	.seal-drip {
		width: 5px;
		height: 36px;
		background: linear-gradient(to bottom, #4a0808, #6a1010 40%, #4a0808 80%, transparent);
		border-radius: 0 0 3px 3px;
	}

	.footer-note {
		font-size: 0.75rem;
		color: rgba(240, 238, 233, 0.3);
		margin-bottom: 2rem;
	}
	.footer-note a {
		color: rgba(169, 183, 172, 0.6);
		text-decoration: underline;
	}
	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.footer-links a {
		font-size: 0.78rem;
		color: rgba(240, 238, 233, 0.4);
		text-decoration: none;
		letter-spacing: 0.04em;
		transition: color 0.15s;
	}
	.footer-links a:hover {
		color: rgba(240, 238, 233, 0.7);
	}
	.footer-links span {
		color: rgba(240, 238, 233, 0.2);
		font-size: 0.75rem;
	}

	/* ── Responsive ── */
	@media (max-width: 700px) {
		.chapter-inner {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}
		.chapter-num {
			font-size: 3rem;
			text-align: left;
			padding-top: 0;
		}
		.today-rooms {
			grid-template-columns: 1fr;
		}
		.restoration-images {
			grid-template-columns: 1fr;
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
