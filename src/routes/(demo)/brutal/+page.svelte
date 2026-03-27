<script>
	import { onMount } from 'svelte';

	let pressed = $state(false);
	let formPressed = $state(false);

	let formName = $state('');
	let formEmail = $state('');
	let formCheckin = $state('');
	let formCheckout = $state('');

	onMount(() => {
		const sections = document.querySelectorAll('.observe');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1 }
		);
		sections.forEach((s) => observer.observe(s));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>MARIANNE COTTAGE — No Filters. Just Normandy.</title>
</svelte:head>

<!-- HERO -->
<section class="hero observe">
	<nav class="topbar">
		<div class="nav-links">
			<a href="#rooms">01 ROOMS</a>
			<a href="#garden">02 GARDEN</a>
			<a href="#book">03 BOOK</a>
		</div>
		<div class="logo-box">MC</div>
	</nav>

	<div class="hero-center">
		<div class="hero-text-block">
			<h1 class="hero-headline">SLEEP<br />HERE.</h1>
		</div>
		<div class="hero-tagline-box">
			NORMANDY, FRANCE — BED &amp; BREAKFAST — EST. 2019
		</div>
		<button
			class="cta-btn"
			class:pressed
			onpointerdown={() => (pressed = true)}
			onpointerup={() => (pressed = false)}
			onpointerleave={() => (pressed = false)}
		>
			BOOK A ROOM →
		</button>
	</div>

	<div class="price-strip">FROM €120/NIGHT</div>
</section>

<!-- ROOMS STRIP -->
<section id="rooms" class="rooms-strip observe">
	<div class="rooms-inner">
		{#each [
			{ num: '01', name: 'The Garden Room', price: '€120', img: '/images/2024-12-15-(1).jpg', rot: 0.5 },
			{ num: '02', name: 'The Orchard Suite', price: '€150', img: '/images/2024-12-15-(2).jpg', rot: -0.5 },
			{ num: '03', name: 'The Stone Room', price: '€135', img: '/images/2024-12-15-(3).jpg', rot: 0.5 }
		] as room}
			<div class="room-card" style="transform: rotate({room.rot}deg)">
				<div class="room-number">{room.num}</div>
				<div class="room-img-wrap">
					<img src={room.img} alt={room.name} class="room-img" />
				</div>
				<div class="room-name">{room.name}</div>
				<div class="room-price">{room.price}<span class="room-price-label">/NIGHT</span></div>
			</div>
		{/each}
	</div>
</section>

<!-- FACTS STRIP -->
<section class="facts-strip observe">
	<div class="facts-inner">
		{#each [
			{ num: '3', label: 'BEDROOMS' },
			{ num: '6', label: 'GUESTS MAX' },
			{ num: '2KM', label: 'TO THE VILLAGE' },
			{ num: '30MIN', label: 'TO OMAHA BEACH' }
		] as fact, i}
			<div class="fact-item" class:fact-border-left={i > 0}>
				<div class="fact-num">{fact.num}</div>
				<div class="fact-label">{fact.label}</div>
			</div>
		{/each}
	</div>
</section>

<!-- BOOKING CTA -->
<section id="book" class="booking-section observe">
	<div class="booking-inner">
		<h2 class="booking-heading">MAKE YOUR<br />RESERVATION</h2>
		<div class="booking-underline"></div>

		<form class="booking-form" onsubmit={(e) => e.preventDefault()}>
			<div class="form-row">
				<div class="form-field">
					<label for="f-name">NAME</label>
					<input id="f-name" type="text" placeholder="JEAN DUPONT" bind:value={formName} />
				</div>
				<div class="form-field">
					<label for="f-email">EMAIL</label>
					<input id="f-email" type="email" placeholder="YOU@EXAMPLE.COM" bind:value={formEmail} />
				</div>
			</div>
			<div class="form-row">
				<div class="form-field">
					<label for="f-checkin">CHECK-IN</label>
					<input id="f-checkin" type="text" placeholder="DD/MM/YYYY" bind:value={formCheckin} />
				</div>
				<div class="form-field">
					<label for="f-checkout">CHECK-OUT</label>
					<input id="f-checkout" type="text" placeholder="DD/MM/YYYY" bind:value={formCheckout} />
				</div>
			</div>

			<button
				type="submit"
				class="cta-btn form-cta"
				class:pressed={formPressed}
				onpointerdown={() => (formPressed = true)}
				onpointerup={() => (formPressed = false)}
				onpointerleave={() => (formPressed = false)}
			>
				BOOK A ROOM →
			</button>
		</form>

		<p class="booking-note">↗ FULL BOOKING AT MARIANNECOTTAGE.NETLIFY.APP</p>
	</div>
</section>

<!-- FOOTER -->
<footer class="site-footer observe">
	<div class="footer-title">MARIANNE COTTAGE — NORMANDY — FRANCE</div>
	<div class="footer-demos">
		<a href="/demo">← ALL DEMOS</a>
		<span class="footer-sep">|</span>
		<a href="/">← BACK TO SITE</a>
		<span class="footer-sep">|</span>
		<a href="/historian">HISTORIAN</a>
		<a href="/living">LIVING</a>
		<a href="/nature">NATURE</a>
		<a href="/story">STORY</a>
		<span class="footer-sep">·</span>
		<a href="/brutal" aria-current="page">BRUTAL</a>
		<a href="/calm">CALM</a>
		<a href="/bento">BENTO</a>
		<a href="/kinetic">KINETIC</a>
		<a href="/adaptive">ADAPTIVE</a>
		<a href="/ambient">AMBIENT</a>
		<a href="/context">CONTEXT</a>
		<a href="/retro">RETRO</a>
		<a href="/expressive">EXPRESSIVE</a>
		<a href="/spatial">SPATIAL</a>
		<a href="/micro">MICRO</a>
		<a href="/ergonomic">ERGONOMIC</a>
		<a href="/liquid">LIQUID</a>
		<a href="/scroll-anim">SCROLL-ANIM</a>
		<a href="/morph">MORPH</a>
		<a href="/handmade">HANDMADE</a>
		<a href="/iridescent">IRIDESCENT</a>
		<a href="/dday">DDAY</a>
	</div>
	<div class="footer-issue">DEMO #44</div>
</footer>

<style>
	/* ── reset ── */
	*, *::before, *::after {
		box-sizing: border-box;
		border-radius: 0 !important;
		margin: 0;
		padding: 0;
	}

	/* ── scroll reveal ── */
	:global(.observe) {
		opacity: 0;
		transition: opacity 0.3s ease;
	}
	:global(.observe.visible) {
		opacity: 1;
	}

	/* ════════════════════════
	   HERO
	════════════════════════ */
	.hero {
		position: relative;
		min-height: 100dvh;
		background: #F5F0E8;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.topbar {
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		border-bottom: 4px solid #0D0D0D;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0;
	}

	.nav-links a {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		font-weight: 700;
		color: #0D0D0D;
		text-decoration: none;
		padding: 1rem 1.5rem;
		border-right: 4px solid #0D0D0D;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.nav-links a:hover {
		background: #0D0D0D;
		color: #FAFAF8;
	}

	.logo-box {
		font-family: 'Courier New', monospace;
		font-size: 1.25rem;
		font-weight: 900;
		color: #FAFAF8;
		background: #0D0D0D;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		letter-spacing: 0.1em;
	}

	.hero-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		padding: 4rem 6vw 6rem;
		gap: 2rem;
	}

	.hero-text-block {
		transform: rotate(-1.5deg);
		transform-origin: left center;
	}

	.hero-headline {
		font-family: 'Georgia', serif;
		font-size: clamp(4rem, 12vw, 10rem);
		font-weight: 900;
		line-height: 0.9;
		color: #0D0D0D;
		letter-spacing: -0.02em;
	}

	.hero-tagline-box {
		border: 8px solid #0D0D0D;
		padding: 0.75rem 1.5rem;
		font-family: 'Courier New', monospace;
		font-size: clamp(0.7rem, 1.5vw, 1rem);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #0D0D0D;
		background: #F5F0E8;
	}

	.cta-btn {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #0D0D0D;
		background: #F5E642;
		border: 4px solid #0D0D0D;
		padding: 1rem 2rem;
		cursor: pointer;
		box-shadow: 6px 6px 0 #0D0D0D;
		transition: box-shadow 0.05s, transform 0.05s;
		user-select: none;
	}

	.cta-btn.pressed {
		transform: translate(4px, 4px);
		box-shadow: 2px 2px 0 #0D0D0D;
	}

	.price-strip {
		position: absolute;
		bottom: 0;
		left: 0;
		background: #E03030;
		color: #FAFAF8;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		padding: 0.6rem 1.5rem;
		border-top: 4px solid #0D0D0D;
		border-right: 4px solid #0D0D0D;
	}

	/* ════════════════════════
	   ROOMS STRIP
	════════════════════════ */
	.rooms-strip {
		background: #0D0D0D;
		padding: 5rem 4vw;
		border-top: 8px solid #0D0D0D;
	}

	.rooms-inner {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
	}

	@media (max-width: 768px) {
		.rooms-inner {
			grid-template-columns: 1fr;
		}
	}

	.room-card {
		border: 8px solid #FAFAF8;
		padding: 1.5rem;
		background: #0D0D0D;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.room-number {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		font-weight: 700;
		color: #F5E642;
		letter-spacing: 0.15em;
	}

	.room-img-wrap {
		border: 4px solid #FAFAF8;
		overflow: hidden;
		aspect-ratio: 4/3;
	}

	.room-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		filter: grayscale(1) contrast(1.1);
	}

	.room-name {
		font-family: 'Georgia', serif;
		font-size: clamp(1.2rem, 2.5vw, 1.8rem);
		font-weight: 700;
		color: #FAFAF8;
		line-height: 1.1;
	}

	.room-price {
		font-family: 'Courier New', monospace;
		font-size: 1.4rem;
		font-weight: 900;
		color: #0D0D0D;
		background: #F5E642;
		display: inline-flex;
		align-items: baseline;
		gap: 0.25rem;
		padding: 0.3rem 0.75rem;
		border: 4px solid #FAFAF8;
		align-self: flex-start;
	}

	.room-price-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	/* ════════════════════════
	   FACTS STRIP
	════════════════════════ */
	.facts-strip {
		background: #F5E642;
		border-top: 8px solid #0D0D0D;
		border-bottom: 8px solid #0D0D0D;
	}

	.facts-inner {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}

	@media (max-width: 600px) {
		.facts-inner {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.fact-item {
		padding: 3rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.fact-border-left {
		border-left: 4px solid #0D0D0D;
	}

	.fact-num {
		font-family: 'Courier New', monospace;
		font-size: clamp(3rem, 8vw, 6rem);
		font-weight: 900;
		color: #0D0D0D;
		line-height: 1;
	}

	.fact-label {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #0D0D0D;
		font-variant: small-caps;
	}

	/* ════════════════════════
	   BOOKING
	════════════════════════ */
	.booking-section {
		background: #FAFAF8;
		padding: 6rem 6vw;
		border-bottom: 8px solid #0D0D0D;
	}

	.booking-inner {
		max-width: 800px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.booking-heading {
		font-family: 'Georgia', serif;
		font-size: clamp(2.5rem, 7vw, 6rem);
		font-weight: 900;
		color: #0D0D0D;
		line-height: 0.95;
		letter-spacing: -0.02em;
	}

	.booking-underline {
		width: 100%;
		height: 8px;
		background: #E03030;
		margin-top: -0.5rem;
	}

	.booking-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.form-field label {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #0D0D0D;
		text-transform: uppercase;
	}

	.form-field input {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		color: #0D0D0D;
		background: #FAFAF8;
		border: 4px solid #0D0D0D;
		padding: 0.75rem 1rem;
		outline: none;
		width: 100%;
	}

	.form-field input::placeholder {
		color: #999;
		font-size: 0.85rem;
	}

	.form-field input:focus {
		background: #F5E642;
	}

	.form-cta {
		align-self: flex-start;
	}

	.booking-note {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #555;
		letter-spacing: 0.08em;
	}

	/* ════════════════════════
	   FOOTER
	════════════════════════ */
	.site-footer {
		background: #0D0D0D;
		padding: 2.5rem 4vw;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-top: 8px solid #0D0D0D;
	}

	.footer-title {
		font-family: 'Courier New', monospace;
		font-size: clamp(0.75rem, 2vw, 1rem);
		font-weight: 700;
		color: #FAFAF8;
		letter-spacing: 0.15em;
	}

	.footer-demos {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.footer-demos a {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #888;
		text-decoration: none;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.footer-demos a:hover {
		color: #F5E642;
	}

	.footer-sep {
		color: #444;
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
	}

	.footer-issue {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #444;
		letter-spacing: 0.1em;
	}
</style>
