<script>
	import { onMount } from 'svelte';

	let scrollY = $state(0);
	let winH = $state(600);

	// Section A: 200vh
	const heroProgress = $derived(Math.max(0, Math.min(1, scrollY / (winH * 2))));

	// Section B: starts after 200vh, is 300vh
	const proseStart = $derived(winH * 2);
	const proseProgress = $derived(Math.max(0, Math.min(1, (scrollY - proseStart) / (winH * 3))));
	const phrase1Opacity = $derived(
		proseProgress < 0.4
			? Math.min(1, proseProgress * 5)
			: Math.max(0, (0.5 - proseProgress) * 10)
	);
	const phrase2Opacity = $derived(
		proseProgress < 0.33
			? 0
			: proseProgress < 0.66
				? Math.min(1, (proseProgress - 0.33) * 5)
				: Math.max(0, (0.83 - proseProgress) * 10)
	);
	const phrase3Opacity = $derived(
		proseProgress < 0.66 ? 0 : Math.min(1, (proseProgress - 0.66) * 5)
	);

	// CTA letter fan
	const LETTERS = 'BOOK YOUR STAY'.split('');
	let letterWidths = $state(LETTERS.map(() => 100));

	function onCtaEnter() {
		letterWidths = LETTERS.map(() => 75 + Math.random() * 50);
	}
	function onCtaLeave() {
		letterWidths = LETTERS.map(() => 100);
	}

	// Room name animation via IntersectionObserver
	let roomEls = $state([]);

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

		// Room name intersection observer
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('room-visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.3 }
		);
		document.querySelectorAll('.room-name').forEach((el) => observer.observe(el));

		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			observer.disconnect();
		};
	});

	// Derived hero values
	const heroWdth = $derived(75 + heroProgress * 50);
	const heroWght = $derived(100 + heroProgress * 800);
	const heroFontSize = $derived(`clamp(4rem, ${8 + heroProgress * 6}vw, 18rem)`);
	const heroLetterSpacing = $derived(`${0.3 - heroProgress * 0.28}em`);
	const heroColorR = $derived(Math.round(26 + heroProgress * 219));
	const heroColorG = $derived(Math.round(26 + heroProgress * 214));
	const heroColorB = $derived(Math.round(24 + heroProgress * 208));
	const heroBgR = $derived(Math.round(245 - heroProgress * 219));
	const heroBgG = $derived(Math.round(240 - heroProgress * 214));
	const heroBgB = $derived(Math.round(232 - heroProgress * 208));
	const subtitleX = $derived(`${-100 + heroProgress * 100}vw`);
	const progressBarH = $derived(`${heroProgress * 100}%`);
</script>

<svelte:head>
	<title>MARIANNE COTTAGE — Kinetic</title>
	<link
		href="https://fonts.googleapis.com/css2?family=Anybody:ital,wdth,wght@0,75..125,100..900;1,75..125,100..900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<!-- Fixed Nav -->
<nav class="nav">
	<span class="nav-logo">MARIANNE COTTAGE</span>
	<div class="nav-links">
		<a href="/rooms">Rooms</a>
		<a href="/book">Book</a>
	</div>
</nav>

<!-- Section A: Kinetic Hero (200vh) -->
<section class="hero-scroll">
	<div
		class="hero-sticky"
		style="background: rgb({heroBgR}, {heroBgG}, {heroBgB});"
	>
		<div class="hero-content">
			<div
				class="hero-word"
				style="
					font-variation-settings: 'wdth' {heroWdth}, 'wght' {heroWght};
					font-size: {heroFontSize};
					letter-spacing: {heroLetterSpacing};
					color: rgb({heroColorR}, {heroColorG}, {heroColorB});
				"
			>
				NORMANDIE
			</div>
			<div
				class="hero-subtitle"
				style="transform: translateX({subtitleX});"
			>
				A Bed &amp; Breakfast
			</div>
		</div>
		<div class="progress-track">
			<div class="progress-fill" style="height: {progressBarH};"></div>
		</div>
	</div>
</section>

<!-- Section B: Morphing Prose (300vh) -->
<section class="prose-scroll">
	<div class="prose-sticky">
		<div class="phrase-layer" style="opacity: {phrase1Opacity};">
			<div
				class="phrase"
				style="font-size: clamp(3rem, 8vw, 8rem); font-variation-settings: 'wght' 800, 'wdth' 75;"
			>
				Historic.
			</div>
			<div class="phrase-sub">D-Day heritage at your door.</div>
		</div>
		<div class="phrase-layer" style="opacity: {phrase2Opacity};">
			<div
				class="phrase"
				style="font-size: clamp(2rem, 5vw, 5rem); font-variation-settings: 'wght' 300, 'wdth' 125;"
			>
				Peaceful.
			</div>
			<div class="phrase-sub">Two hectares of orchard.</div>
		</div>
		<div class="phrase-layer" style="opacity: {phrase3Opacity};">
			<div
				class="phrase"
				style="font-size: clamp(4rem, 10vw, 12rem); font-variation-settings: 'wght' 900, 'wdth' 100;"
			>
				Yours.
			</div>
			<div class="phrase-sub">From €120 per night.</div>
		</div>
	</div>
</section>

<!-- Section C: Room Names as Sculptures -->
<section class="rooms-section">
	<div class="room room-left">
		<div class="room-name">THE GARDEN ROOM</div>
		<div class="room-detail">From €120</div>
	</div>
	<div class="room room-right">
		<div class="room-name">THE ORCHARD SUITE</div>
		<div class="room-detail">From €140</div>
	</div>
	<div class="room room-left">
		<div class="room-name">THE STONE ROOM</div>
		<div class="room-detail">From €130</div>
	</div>
</section>

<!-- Section D: CTA -->
<section class="cta-section">
	<div class="cta-inner">
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="cta-heading"
			onmouseenter={onCtaEnter}
			onmouseleave={onCtaLeave}
			role="heading"
			aria-label="BOOK YOUR STAY"
		>
			{#each LETTERS as letter, i}
				{#if letter === ' '}
					<span class="cta-space">&nbsp;</span>
				{:else}
					<span
						class="cta-letter"
						style="font-variation-settings: 'wdth' {letterWidths[i]}, 'wght' 800; transition: font-variation-settings 0.3s ease {i * 0.02}s;"
					>{letter}</span>
				{/if}
			{/each}
		</div>
		<a class="cta-link" href="https://mariannecottage.netlify.app" target="_blank">
			→ mariannecottage.netlify.app
		</a>
		<p class="cta-meta">FROM €120 PER NIGHT · NORMANDY · FRANCE</p>
	</div>
</section>

<!-- Footer -->
<footer class="footer">
	<div class="footer-logo">MARIANNE COTTAGE</div>
	<div class="footer-demos">
		<a href="/demo">← All demos</a>
		<span>·</span>
		<a href="/historian">/historian</a>
		<span>·</span>
		<a href="/living">/living</a>
		<span>·</span>
		<a href="/nature">/nature</a>
		<span>·</span>
		<a href="/story">/story</a>
		<span>·</span>
		<a href="/brutal">/brutal</a>
		<span>·</span>
		<a href="/calm">/calm</a>
		<span>·</span>
		<a href="/bento">/bento</a>
		<span>·</span>
		<a href="/scroll-anim">/scroll-anim</a>
		<span>·</span>
		<a href="/morph">/morph</a>
		<span>·</span>
		<a href="/handmade">/handmade</a>
		<span>·</span>
		<a href="/iridescent">/iridescent</a>
		<span>·</span>
		<a href="/dday">/dday</a>
	</div>
	<div class="footer-badge">Demo #44</div>
</footer>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		padding-bottom: 100px;
		background: #f5f0e8;
	}

	/* Nav */
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2rem;
		background: rgba(245, 240, 232, 0.9);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.nav-logo {
		font-family: 'Anybody', sans-serif;
		font-weight: 200;
		letter-spacing: 0.08em;
		font-size: 0.85rem;
		color: #1a1a18;
		text-transform: uppercase;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-links a {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.85rem;
		color: #1a1a18;
		text-decoration: none;
		letter-spacing: 0.04em;
	}

	.nav-links a:hover {
		color: #6b8f71;
	}

	/* Section A: Hero */
	.hero-scroll {
		height: 200vh;
		position: relative;
	}

	.hero-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.05s linear;
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		overflow: hidden;
		width: 100%;
	}

	.hero-word {
		font-family: 'Anybody', sans-serif;
		text-align: center;
		line-height: 1;
		white-space: nowrap;
		will-change: font-variation-settings, font-size, letter-spacing, color;
	}

	.hero-subtitle {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: clamp(1rem, 2.5vw, 2rem);
		letter-spacing: 0.2em;
		color: #8a8a85;
		white-space: nowrap;
		will-change: transform;
	}

	.progress-track {
		position: absolute;
		right: 1rem;
		top: 10%;
		width: 2px;
		height: 80%;
		background: rgba(107, 143, 113, 0.2);
	}

	.progress-fill {
		width: 100%;
		background: #6b8f71;
		transition: height 0.05s linear;
	}

	/* Section B: Morphing Prose */
	.prose-scroll {
		height: 300vh;
		position: relative;
		background: #1a1a18;
	}

	.prose-sticky {
		position: sticky;
		top: 0;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1a1a18;
	}

	.phrase-layer {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		padding: 0 2rem;
		will-change: opacity;
		pointer-events: none;
	}

	.phrase {
		font-family: 'Anybody', sans-serif;
		color: #f5f0e8;
		line-height: 1;
		text-align: center;
	}

	.phrase-sub {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.85rem;
		letter-spacing: 0.12em;
		color: #6b8f71;
		text-transform: uppercase;
	}

	/* Section C: Rooms */
	.rooms-section {
		background: #f5f0e8;
		padding: 6rem 0;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.room {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.5rem 2rem;
		overflow: hidden;
	}

	.room-left {
		align-items: flex-start;
		text-align: left;
	}

	.room-right {
		align-items: flex-end;
		text-align: right;
	}

	.room-name {
		font-family: 'Anybody', sans-serif;
		font-size: clamp(3rem, 7vw, 8rem);
		line-height: 1;
		color: #1a1a18;
		font-variation-settings: 'wght' 100, 'wdth' 75;
		transition: font-variation-settings 0.8s ease;
		will-change: font-variation-settings;
		cursor: default;
	}

	.room-name.room-visible {
		font-variation-settings: 'wght' 700, 'wdth' 110;
	}

	.room-detail {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		color: #8a8a85;
	}

	/* Section D: CTA */
	.cta-section {
		min-height: 100vh;
		background: #6b8f71;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.cta-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		text-align: center;
		padding: 2rem;
	}

	.cta-heading {
		font-family: 'Anybody', sans-serif;
		font-size: clamp(2.5rem, 6vw, 7rem);
		color: #f5f0e8;
		line-height: 1;
		cursor: default;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		user-select: none;
	}

	.cta-letter {
		display: inline-block;
		will-change: font-variation-settings;
	}

	.cta-space {
		display: inline-block;
		width: 0.3em;
	}

	.cta-link {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 1.1rem;
		letter-spacing: 0.04em;
		color: #f5f0e8;
		opacity: 0.7;
		text-decoration: none;
	}

	.cta-link:hover {
		opacity: 1;
	}

	.cta-meta {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.75rem;
		letter-spacing: 0.15em;
		color: #f5f0e8;
		opacity: 0.6;
		margin: 0;
		text-transform: uppercase;
	}

	/* Footer */
	.footer {
		background: #1a1a18;
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
	}

	.footer-logo {
		font-family: 'Anybody', sans-serif;
		font-variation-settings: 'wght' 200, 'wdth' 100;
		font-size: 1.1rem;
		letter-spacing: 0.12em;
		color: #f5f0e8;
	}

	.footer-demos {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.6rem;
		align-items: center;
		justify-content: center;
	}

	.footer-demos a {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.8rem;
		letter-spacing: 0.04em;
		color: #8a8a85;
		text-decoration: none;
	}

	.footer-demos a:hover {
		color: #6b8f71;
	}

	.footer-demos span {
		color: #3a3a38;
		font-size: 0.8rem;
	}

	.footer-badge {
		font-family: 'Anybody', sans-serif;
		font-weight: 300;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: #3a3a38;
		text-transform: uppercase;
	}
</style>
