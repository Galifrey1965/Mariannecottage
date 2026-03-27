<script>
	import { onMount } from 'svelte';

	// Section counter — the ONLY JS on this page (IntersectionObserver)
	let currentSection = $state(1);
	const totalSections = 5;

	onMount(() => {
		const sections = document.querySelectorAll('[data-section]');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						currentSection = Number(entry.target.dataset.section);
					}
				});
			},
			{ threshold: 0.4 }
		);
		sections.forEach((s) => observer.observe(s));
		return () => observer.disconnect();
	});

	// Booking form state
	let checkin = $state('');
	let checkout = $state('');
	let guests = $state('2');
</script>

<svelte:head>
	<title>Marianne Cottage — CSS Scroll-Driven Animations</title>
</svelte:head>

<!-- ══════════════════════════════════════
     SCROLL PROGRESS BAR (pure CSS)
     ══════════════════════════════════════ -->
<div class="progress-bar" aria-hidden="true"></div>

<!-- ══════════════════════════════════════
     COLOUR SHIFT OVERLAY (pure CSS)
     ══════════════════════════════════════ -->
<div class="colour-shift" aria-hidden="true"></div>

<!-- ══════════════════════════════════════
     TECH BADGE (sticky top-right)
     ══════════════════════════════════════ -->
<aside class="tech-badge" aria-label="CSS features used">
	<p class="badge-title">CSS Scroll-Driven Animations</p>
	<ul>
		<li>✓ animation-timeline: view()</li>
		<li>✓ animation-timeline: scroll()</li>
		<li>✓ 0 scroll event listeners</li>
	</ul>
</aside>

<!-- ══════════════════════════════════════
     SECTION COUNTER (JS IntersectionObserver)
     ══════════════════════════════════════ -->
<div class="section-counter" aria-live="polite">
	<span class="counter-label">Section</span>
	<span class="counter-num">{currentSection}</span>
	<span class="counter-sep">/</span>
	<span class="counter-total">{totalSections}</span>
</div>

<!-- ══════════════════════════════════════
     1. HERO
     ══════════════════════════════════════ -->
<section class="section hero" data-section="1">
	<div class="hero-parallax-wrap">
		<div class="hero-bg" aria-hidden="true"></div>
	</div>
	<div class="hero-content">
		<p class="hero-kicker fade-up">CSS Scroll-Driven Animations</p>
		<h1 class="hero-headline fade-up delay-1">The page that<br/>moves with you</h1>
		<p class="hero-sub fade-up delay-2">Zero JavaScript. Pure CSS. All motion.</p>
		<a href="#about" class="hero-cta fade-up delay-3">Explore the technique ↓</a>
	</div>
	<div class="hero-scroll-hint fade-up delay-4" aria-hidden="true">
		<div class="scroll-line"></div>
		<span>scroll</span>
	</div>
</section>

<!-- ══════════════════════════════════════
     2. ABOUT
     ══════════════════════════════════════ -->
<section class="section about" id="about" data-section="2">
	<div class="about-inner">
		<h2 class="section-heading scale-reveal">
			How it works
		</h2>
		<div class="about-grid">
			<div class="about-card fade-up-card">
				<div class="about-icon">◎</div>
				<h3>animation-timeline: scroll()</h3>
				<p>Links an animation's progress to the scroll position of a container (or the root viewport). As the page scrolls, the animation advances — no JavaScript, no requestAnimationFrame.</p>
			</div>
			<div class="about-card fade-up-card">
				<div class="about-icon">◈</div>
				<h3>animation-timeline: view()</h3>
				<p>Links an animation to the element's position within the viewport. As an element enters or exits, the animation progresses. Perfect for entrance effects.</p>
			</div>
			<div class="about-card fade-up-card">
				<div class="about-icon">◉</div>
				<h3>animation-range</h3>
				<p>Fine-tunes exactly when within the view timeline the animation plays. <code>entry 0% entry 30%</code> means "animate only while this element is entering the top 30% of the viewport."</p>
			</div>
		</div>
		<div class="about-note fade-up-card">
			<strong>Browser support (2025):</strong> Chrome 115+, Edge 115+, Safari 18+, Firefox 110+ (partial). This demo includes a <code>@supports</code> fallback so all content remains visible on older browsers.
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════
     3. ROOMS
     ══════════════════════════════════════ -->
<section class="section rooms" data-section="3">
	<div class="rooms-inner">
		<h2 class="section-heading scale-reveal">The Rooms</h2>
		<p class="section-sub fade-up-card">Each card slides in from alternating sides — pure CSS, no JS.</p>

		<div class="room-row slide-left">
			<div class="room-image room-image-1" role="img" aria-label="Garden Room"></div>
			<div class="room-info">
				<span class="room-label">Room 01</span>
				<h3 class="room-name">The Garden Room</h3>
				<p class="room-desc">French doors open onto the walled kitchen garden. Morning sun fills the room by 7am. A cast-iron radiator ticks quietly in winter.</p>
				<p class="room-detail">King bed · En-suite · Garden access</p>
				<a href="#booking" class="room-link">Check availability →</a>
			</div>
		</div>

		<div class="room-row slide-right">
			<div class="room-info room-info-rev">
				<span class="room-label">Room 02</span>
				<h3 class="room-name">The Meadow Suite</h3>
				<p class="room-desc">Elevated views across open meadowland. A freestanding copper tub. Evening light turns everything amber around 6pm — plan accordingly.</p>
				<p class="room-detail">Super-king · Roll-top bath · Meadow view</p>
				<a href="#booking" class="room-link">Check availability →</a>
			</div>
			<div class="room-image room-image-2" role="img" aria-label="Meadow Suite"></div>
		</div>

		<div class="room-row slide-left">
			<div class="room-image room-image-3" role="img" aria-label="The Attic"></div>
			<div class="room-info">
				<span class="room-label">Room 03</span>
				<h3 class="room-name">The Attic</h3>
				<p class="room-desc">Tucked under the eaves with exposed beams and a skylight for watching stars. The smallest room — also the most requested.</p>
				<p class="room-detail">Double bed · Skylight · Shared bath</p>
				<a href="#booking" class="room-link">Check availability →</a>
			</div>
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════
     4. GALLERY STRIP
     ══════════════════════════════════════ -->
<section class="section gallery" data-section="4">
	<div class="gallery-inner">
		<h2 class="section-heading scale-reveal">A glimpse of the grounds</h2>
		<div class="gallery-strip">
			<div class="gallery-swatch g1" role="img" aria-label="The kitchen garden">
				<span>Kitchen<br/>Garden</span>
			</div>
			<div class="gallery-swatch g2" role="img" aria-label="The parlour">
				<span>The<br/>Parlour</span>
			</div>
			<div class="gallery-swatch g3" role="img" aria-label="Morning light">
				<span>Morning<br/>Light</span>
			</div>
			<div class="gallery-swatch g4" role="img" aria-label="The meadow">
				<span>The<br/>Meadow</span>
			</div>
			<div class="gallery-swatch g5" role="img" aria-label="Dusk">
				<span>Dusk</span>
			</div>
		</div>
		<p class="gallery-caption fade-up-card">Each tile enters independently — staggered via <code>animation-range</code> offsets, no JS delay needed.</p>
	</div>
</section>

<!-- ══════════════════════════════════════
     5. BOOKING CTA
     ══════════════════════════════════════ -->
<section class="section booking" id="booking" data-section="5">
	<div class="booking-inner">
		<h2 class="section-heading scale-reveal">Ready to visit?</h2>
		<p class="booking-sub fade-up-card">Book directly. No booking fees. Breakfast included.</p>

		<form class="booking-form fade-up-card" onsubmit={(e) => e.preventDefault()}>
			<div class="form-row">
				<label class="form-field">
					<span>Check in</span>
					<input type="date" bind:value={checkin} />
				</label>
				<label class="form-field">
					<span>Check out</span>
					<input type="date" bind:value={checkout} />
				</label>
				<label class="form-field">
					<span>Guests</span>
					<select bind:value={guests}>
						<option value="1">1 guest</option>
						<option value="2">2 guests</option>
						<option value="3">3 guests</option>
						<option value="4">4 guests</option>
					</select>
				</label>
			</div>
			<button type="submit" class="booking-btn scale-reveal-btn">
				Check Availability
			</button>
		</form>

		<div class="booking-trust fade-up-card">
			<span>🌿 Organic breakfast</span>
			<span>🧺 Locally sourced</span>
			<span>🔑 Flexible check-in</span>
			<span>📞 Direct booking</span>
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════
     DEMO NAV FOOTER
     ══════════════════════════════════════ -->
<footer class="demo-footer">
	<p class="demo-footer-label">MarianneCottage Design Demos</p>
	<nav class="demo-nav" aria-label="All demos">
		{#each [
			['historian','Historian'],
			['living','Living'],
			['nature','Nature'],
			['story','Story'],
			['brutal','Brutal'],
			['calm','Calm'],
			['bento','Bento'],
			['kinetic','Kinetic'],
			['adaptive','Adaptive'],
			['ambient','Ambient'],
			['context','Context'],
			['retro','Retro'],
			['expressive','Expressive'],
			['spatial','Spatial'],
			['micro','Micro'],
			['ergonomic','Ergonomic'],
			['liquid','Liquid'],
			['scroll-anim','Scroll-Anim'],
			['morph','Morph'],
			['handmade','Handmade'],
			['iridescent','Iridescent'],
		] as [slug, label]}
			<a
				href="/{slug}"
				class="demo-link"
				class:demo-link--active={slug === 'scroll-anim'}
				aria-current={slug === 'scroll-anim' ? 'page' : undefined}
			>{label}</a>
		{/each}
	</nav>
</footer>

<style>
	/* ═══════════════════════════════════════
	   KEYFRAMES
	   ═══════════════════════════════════════ */
	@keyframes progress {
		from { width: 0 }
		to   { width: 100% }
	}

	@keyframes fade-up {
		from { opacity: 0; transform: translateY(40px) }
		to   { opacity: 1; transform: translateY(0) }
	}

	@keyframes fade-up-fast {
		from { opacity: 0; transform: translateY(24px) }
		to   { opacity: 1; transform: translateY(0) }
	}

	@keyframes parallax {
		from { transform: translateY(-12%) scale(1.15) }
		to   { transform: translateY(12%)  scale(1.15) }
	}

	@keyframes scale-reveal {
		from { opacity: 0; transform: scale(0.8) }
		to   { opacity: 1; transform: scale(1) }
	}

	@keyframes slide-from-left {
		from { transform: translateX(-70px); opacity: 0 }
		to   { transform: translateX(0);     opacity: 1 }
	}

	@keyframes slide-from-right {
		from { transform: translateX(70px); opacity: 0 }
		to   { transform: translateX(0);    opacity: 1 }
	}

	@keyframes gallery-scale {
		from { opacity: 0; transform: scale(0.85) translateY(20px) }
		to   { opacity: 1; transform: scale(1)    translateY(0) }
	}

	@keyframes colour-shift {
		from { opacity: 0 }
		to   { opacity: 0.35 }
	}

	/* ═══════════════════════════════════════
	   PAGE BASE
	   ═══════════════════════════════════════ */
	:global(html) {
		scroll-behavior: smooth;
	}

	/* ═══════════════════════════════════════
	   PROGRESS BAR
	   ═══════════════════════════════════════ */
	.progress-bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		width: 0;
		background: linear-gradient(90deg, #7a9e7e, #a8c5a0);
		z-index: 200;
		transform-origin: left;

		@supports (animation-timeline: scroll()) {
			animation: progress linear both;
			animation-timeline: scroll(root);
		}
	}

	/* ═══════════════════════════════════════
	   COLOUR SHIFT OVERLAY
	   ═══════════════════════════════════════ */
	.colour-shift {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		background: linear-gradient(160deg, #e8f0e8 0%, #d6ead6 100%);
		opacity: 0;

		@supports (animation-timeline: scroll()) {
			animation: colour-shift linear both;
			animation-timeline: scroll(root);
		}
	}

	/* ═══════════════════════════════════════
	   TECH BADGE
	   ═══════════════════════════════════════ */
	.tech-badge {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 100;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(122, 158, 126, 0.3);
		border-radius: 10px;
		padding: 0.65rem 0.9rem;
		font-size: 0.68rem;
		color: #3a3a3a;
		max-width: 230px;
		box-shadow: 0 2px 16px rgba(0,0,0,0.08);
	}
	.badge-title {
		font-weight: 600;
		font-size: 0.7rem;
		color: #7a9e7e;
		margin-bottom: 0.35rem;
		font-family: 'Playfair Display', serif;
	}
	.tech-badge ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.tech-badge li {
		font-family: 'Courier New', monospace;
		font-size: 0.62rem;
		color: #555;
	}

	/* ═══════════════════════════════════════
	   SECTION COUNTER
	   ═══════════════════════════════════════ */
	.section-counter {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 100;
		background: rgba(255,255,255,0.9);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(122,158,126,0.25);
		border-radius: 100px;
		padding: 0.4rem 0.85rem;
		font-size: 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.2rem;
		color: #888;
		font-family: 'Inter', sans-serif;
	}
	.counter-num {
		font-weight: 700;
		color: #7a9e7e;
		font-size: 0.85rem;
		min-width: 0.9rem;
		text-align: center;
		transition: color 0.25s;
	}
	.counter-sep { color: #ccc; }

	/* ═══════════════════════════════════════
	   SECTIONS
	   ═══════════════════════════════════════ */
	.section {
		position: relative;
		z-index: 1;
		min-height: 90vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	/* ═══════════════════════════════════════
	   1. HERO
	   ═══════════════════════════════════════ */
	.hero {
		overflow: hidden;
		min-height: 100vh;
		align-items: center;
		text-align: center;
		background: transparent;
	}

	.hero-parallax-wrap {
		position: absolute;
		inset: -20%;
		z-index: 0;
		overflow: hidden;
	}

	.hero-bg {
		width: 100%;
		height: 100%;
		background:
			linear-gradient(165deg, #7a9e7e22 0%, transparent 60%),
			repeating-linear-gradient(
				0deg,
				transparent,
				transparent 80px,
				rgba(122,158,126,0.06) 80px,
				rgba(122,158,126,0.06) 81px
			),
			repeating-linear-gradient(
				90deg,
				transparent,
				transparent 80px,
				rgba(122,158,126,0.06) 80px,
				rgba(122,158,126,0.06) 81px
			),
			linear-gradient(135deg, #f0eee9 0%, #e4ede4 50%, #dde8dd 100%);
		transform-origin: center;

		@supports (animation-timeline: scroll()) {
			animation: parallax linear both;
			animation-timeline: scroll(root);
		}
	}

	.hero-content {
		position: relative;
		z-index: 2;
		max-width: 680px;
		margin: 0 auto;
		padding: 2rem 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.hero-kicker {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #7a9e7e;
		background: rgba(122,158,126,0.1);
		border: 1px solid rgba(122,158,126,0.25);
		padding: 0.4rem 1rem;
		border-radius: 100px;
	}

	.hero-headline {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 7vw, 5rem);
		font-weight: 700;
		line-height: 1.1;
		color: #2a2a2a;
		letter-spacing: -0.02em;
	}

	.hero-sub {
		font-size: 1.1rem;
		color: #888;
		max-width: 420px;
		line-height: 1.6;
	}

	.hero-cta {
		display: inline-block;
		background: #7a9e7e;
		color: #fff;
		text-decoration: none;
		padding: 0.8rem 2rem;
		border-radius: 100px;
		font-size: 0.9rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		transition: background 0.2s, transform 0.2s;
	}
	.hero-cta:hover { background: #5e8662; transform: translateY(-2px); }

	.hero-scroll-hint {
		position: absolute;
		bottom: 2.5rem;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.65rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #aaa;
	}

	.scroll-line {
		width: 1px;
		height: 40px;
		background: linear-gradient(to bottom, #7a9e7e, transparent);
		animation: scroll-hint-line 1.8s ease-in-out infinite;
	}

	@keyframes scroll-hint-line {
		0%   { transform: scaleY(0); transform-origin: top; }
		50%  { transform: scaleY(1); transform-origin: top; }
		51%  { transform: scaleY(1); transform-origin: bottom; }
		100% { transform: scaleY(0); transform-origin: bottom; }
	}

	/* Hero fade-up animations (CSS scroll-driven via view() on body load feel,
	   but since these are above the fold we use regular keyframe + delay) */
	.fade-up {
		@supports (animation-timeline: scroll()) {
			animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both;
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
		}
	}
	.delay-1 { animation-delay: 0.1s }
	.delay-2 { animation-delay: 0.22s }
	.delay-3 { animation-delay: 0.36s }
	.delay-4 { animation-delay: 0.5s }

	/* ═══════════════════════════════════════
	   FADE-UP CARDS (view-driven)
	   ═══════════════════════════════════════ */
	.fade-up-card {
		@supports (animation-timeline: scroll()) {
			animation: fade-up-fast linear both;
			animation-timeline: view();
			animation-range: entry 0% entry 30%;
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
			transform: none;
		}
	}

	/* ═══════════════════════════════════════
	   SCALE REVEAL (headings)
	   ═══════════════════════════════════════ */
	.scale-reveal {
		@supports (animation-timeline: scroll()) {
			animation: scale-reveal linear both;
			animation-timeline: view();
			animation-range: entry 0% entry 40%;
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
			transform: none;
		}
	}

	/* ═══════════════════════════════════════
	   2. ABOUT
	   ═══════════════════════════════════════ */
	.about {
		background: transparent;
		padding: 6rem 2rem;
	}

	.about-inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.section-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 700;
		color: #2a2a2a;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.section-sub {
		font-size: 1rem;
		color: #888;
		margin-top: -2rem;
	}

	.about-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.about-card {
		background: rgba(255,255,255,0.7);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(122,158,126,0.15);
		border-radius: 16px;
		padding: 1.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.about-icon {
		font-size: 1.5rem;
		color: #7a9e7e;
	}

	.about-card h3 {
		font-family: 'Playfair Display', serif;
		font-size: 1rem;
		font-weight: 600;
		color: #2a2a2a;
		font-style: italic;
	}

	.about-card p {
		font-size: 0.875rem;
		color: #666;
		line-height: 1.7;
	}

	.about-card code {
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		background: rgba(122,158,126,0.12);
		padding: 0.1em 0.35em;
		border-radius: 4px;
		color: #4a7a4e;
	}

	.about-note {
		background: rgba(122,158,126,0.08);
		border: 1px solid rgba(122,158,126,0.2);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		font-size: 0.85rem;
		color: #555;
		line-height: 1.7;
	}
	.about-note strong { color: #3a3a3a; }
	.about-note code {
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		background: rgba(122,158,126,0.15);
		padding: 0.1em 0.35em;
		border-radius: 4px;
		color: #4a7a4e;
	}

	/* ═══════════════════════════════════════
	   3. ROOMS
	   ═══════════════════════════════════════ */
	.rooms {
		padding: 6rem 2rem;
		background: transparent;
	}

	.rooms-inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 3.5rem;
	}

	.room-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
		align-items: center;
	}

	/* Slide-left: the whole row slides in from the left */
	.slide-left {
		@supports (animation-timeline: scroll()) {
			animation: slide-from-left linear both;
			animation-timeline: view();
			animation-range: entry 10% entry 50%;
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
			transform: none;
		}
	}

	/* Slide-right: the whole row slides in from the right */
	.slide-right {
		@supports (animation-timeline: scroll()) {
			animation: slide-from-right linear both;
			animation-timeline: view();
			animation-range: entry 10% entry 50%;
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
			transform: none;
		}
	}

	.room-image {
		aspect-ratio: 4 / 3;
		border-radius: 16px;
		overflow: hidden;
	}

	.room-image-1 {
		background: linear-gradient(135deg, #c8dfc8 0%, #9ec09e 50%, #7a9e7e 100%);
		position: relative;
	}
	.room-image-1::after {
		content: 'Garden Room';
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-family: 'Playfair Display', serif;
		font-style: italic;
		color: rgba(255,255,255,0.9);
		font-size: 1.1rem;
	}

	.room-image-2 {
		background: linear-gradient(135deg, #d4c5a9 0%, #b8a882 50%, #9a8a60 100%);
		position: relative;
	}
	.room-image-2::after {
		content: 'Meadow Suite';
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-family: 'Playfair Display', serif;
		font-style: italic;
		color: rgba(255,255,255,0.9);
		font-size: 1.1rem;
	}

	.room-image-3 {
		background: linear-gradient(135deg, #b8c8d4 0%, #8aa8bc 50%, #6888a0 100%);
		position: relative;
	}
	.room-image-3::after {
		content: 'The Attic';
		position: absolute;
		bottom: 1rem;
		left: 1rem;
		font-family: 'Playfair Display', serif;
		font-style: italic;
		color: rgba(255,255,255,0.9);
		font-size: 1.1rem;
	}

	.room-info {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.room-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #7a9e7e;
	}

	.room-name {
		font-family: 'Playfair Display', serif;
		font-size: 1.6rem;
		font-weight: 700;
		color: #2a2a2a;
		line-height: 1.2;
	}

	.room-desc {
		font-size: 0.9rem;
		color: #666;
		line-height: 1.75;
	}

	.room-detail {
		font-size: 0.78rem;
		color: #888;
		letter-spacing: 0.03em;
	}

	.room-link {
		display: inline-block;
		color: #7a9e7e;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		border-bottom: 1px solid rgba(122,158,126,0.4);
		padding-bottom: 2px;
		transition: color 0.2s, border-color 0.2s;
		align-self: flex-start;
	}
	.room-link:hover { color: #5e8662; border-color: #5e8662; }

	/* ═══════════════════════════════════════
	   4. GALLERY STRIP
	   ═══════════════════════════════════════ */
	.gallery {
		padding: 6rem 2rem;
		background: transparent;
	}

	.gallery-inner {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.gallery-strip {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.75rem;
	}

	.gallery-swatch {
		aspect-ratio: 3 / 4;
		border-radius: 12px;
		display: flex;
		align-items: flex-end;
		padding: 0.75rem;
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: 0.75rem;
		color: rgba(255,255,255,0.9);
		overflow: hidden;
		position: relative;
	}
	.gallery-swatch::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 60%);
		border-radius: inherit;
	}
	.gallery-swatch span { position: relative; z-index: 1; line-height: 1.3; }

	.g1 { background: linear-gradient(145deg, #8db88d, #5a8a5a); }
	.g2 { background: linear-gradient(145deg, #c4aa80, #8a7050); }
	.g3 { background: linear-gradient(145deg, #e8d5b0, #c0a870); }
	.g4 { background: linear-gradient(145deg, #a8c8a0, #688860); }
	.g5 { background: linear-gradient(145deg, #8890b0, #505878); }

	/* Sequential scale-in via animation-range offsets */
	.gallery-swatch {
		@supports (animation-timeline: scroll()) {
			animation: gallery-scale linear both;
			animation-timeline: view();
		}
		@supports not (animation-timeline: scroll()) {
			opacity: 1;
			transform: none;
		}
	}
	.gallery-swatch:nth-child(1) { animation-range: entry 0%  entry 25% }
	.gallery-swatch:nth-child(2) { animation-range: entry 10% entry 35% }
	.gallery-swatch:nth-child(3) { animation-range: entry 15% entry 40% }
	.gallery-swatch:nth-child(4) { animation-range: entry 20% entry 45% }
	.gallery-swatch:nth-child(5) { animation-range: entry 25% entry 50% }

	.gallery-caption {
		font-size: 0.82rem;
		color: #888;
		font-style: italic;
		text-align: center;
	}
	.gallery-caption code {
		font-family: 'Courier New', monospace;
		font-size: 0.78rem;
		background: rgba(122,158,126,0.12);
		padding: 0.1em 0.35em;
		border-radius: 4px;
		color: #4a7a4e;
		font-style: normal;
	}

	/* ═══════════════════════════════════════
	   5. BOOKING CTA
	   ═══════════════════════════════════════ */
	.booking {
		padding: 6rem 2rem 8rem;
		background: transparent;
	}

	.booking-inner {
		max-width: 700px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
		align-items: center;
		text-align: center;
	}

	.booking-sub {
		font-size: 1rem;
		color: #888;
		margin-top: -1.5rem;
	}

	.booking-form {
		width: 100%;
		background: rgba(255,255,255,0.75);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(122,158,126,0.2);
		border-radius: 20px;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		box-shadow: 0 4px 32px rgba(0,0,0,0.06);
	}

	.form-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		text-align: left;
	}

	.form-field span {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #888;
	}

	.form-field input,
	.form-field select {
		border: 1px solid rgba(122,158,126,0.3);
		border-radius: 10px;
		padding: 0.65rem 0.85rem;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		color: #3a3a3a;
		background: rgba(255,255,255,0.8);
		outline: none;
		transition: border-color 0.2s;
	}
	.form-field input:focus,
	.form-field select:focus { border-color: #7a9e7e; }

	.booking-btn {
		background: #7a9e7e;
		color: #fff;
		border: none;
		border-radius: 100px;
		padding: 1rem 2.5rem;
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		letter-spacing: 0.02em;
		transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 20px rgba(122,158,126,0.35);

		@supports (animation-timeline: scroll()) {
			animation: scale-reveal linear both;
			animation-timeline: view();
			animation-range: entry 0% entry 50%;
		}
	}
	.booking-btn:hover {
		background: #5e8662;
		transform: translateY(-2px);
		box-shadow: 0 6px 28px rgba(122,158,126,0.45);
	}

	.booking-trust {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: center;
		font-size: 0.8rem;
		color: #888;
	}

	/* ═══════════════════════════════════════
	   GRACEFUL FALLBACK
	   ═══════════════════════════════════════ */
	@supports not (animation-timeline: scroll()) {
		.fade-up,
		.fade-up-card,
		.scale-reveal,
		.slide-left,
		.slide-right,
		.gallery-swatch,
		.booking-btn,
		.hero-bg {
			opacity: 1 !important;
			transform: none !important;
			animation: none !important;
		}
		.progress-bar {
			width: 100%;
			opacity: 0.3;
		}
		.colour-shift {
			display: none;
		}
		/* Show a browser support note */
		.tech-badge::after {
			content: '⚠ Upgrade to Chrome 115+ / Safari 18+ for animations';
			display: block;
			margin-top: 0.5rem;
			font-size: 0.62rem;
			color: #b07a50;
			font-style: italic;
			font-family: 'Inter', sans-serif;
		}
	}

	/* ═══════════════════════════════════════
	   DEMO FOOTER NAV
	   ═══════════════════════════════════════ */
	.demo-footer {
		position: relative;
		z-index: 10;
		background: #2a2a2a;
		padding: 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}

	.demo-footer-label {
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.35);
	}

	.demo-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.35rem 0.5rem;
		max-width: 860px;
	}

	.demo-link {
		color: rgba(255,255,255,0.5);
		text-decoration: none;
		font-size: 0.75rem;
		padding: 0.3rem 0.65rem;
		border-radius: 100px;
		border: 1px solid transparent;
		transition: color 0.2s, border-color 0.2s, background 0.2s;
	}
	.demo-link:hover {
		color: rgba(255,255,255,0.9);
		border-color: rgba(255,255,255,0.2);
		background: rgba(255,255,255,0.06);
	}
	.demo-link--active {
		color: #7a9e7e;
		border-color: rgba(122,158,126,0.5);
		background: rgba(122,158,126,0.1);
	}

	/* ═══════════════════════════════════════
	   RESPONSIVE
	   ═══════════════════════════════════════ */
	@media (max-width: 680px) {
		.room-row {
			grid-template-columns: 1fr;
		}
		.room-info-rev {
			order: 2;
		}
		.gallery-strip {
			grid-template-columns: repeat(3, 1fr);
		}
		.gallery-swatch:nth-child(4),
		.gallery-swatch:nth-child(5) {
			display: none;
		}
		.tech-badge {
			display: none;
		}
		.hero-headline {
			font-size: clamp(2rem, 9vw, 3rem);
		}
	}

	@media (max-width: 420px) {
		.gallery-strip {
			grid-template-columns: repeat(2, 1fr);
		}
		.gallery-swatch:nth-child(3) {
			display: none;
		}
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
