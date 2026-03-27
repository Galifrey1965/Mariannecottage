<script>
	import { onMount } from 'svelte';

	let currentField = $state(0);
	let arrival = $state('');
	let departure = $state('');
	let name = $state('');
	let email = $state('');

	let allFilled = $derived(arrival && departure && name && email);

	function advance() {
		if (currentField < 3) currentField += 1;
	}

	function handleKeydown(e) {
		if (e.key === 'Enter') advance();
	}

	onMount(() => {
		const sections = document.querySelectorAll('.snap-section');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.3 }
		);
		sections.forEach((s) => observer.observe(s));
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Breathe. You're Already There.</title>
</svelte:head>

<div class="scroll-root">

	<!-- 1. HERO -->
	<section class="snap-section hero visible" style="--bg: #F9EDE0;">
		<div class="bg-image" style="background-image: url('/images/2024-08-15.jpg');"></div>

		<nav class="top-nav">
			<span class="logo">Marianne Cottage</span>
			<div class="nav-links">
				<a href="#room">Rooms</a>
				<a href="#garden">Garden</a>
				<a href="#book">Book</a>
			</div>
		</nav>

		<div class="hero-center">
			<p class="hero-title">A cottage in Normandy.</p>
			<p class="scroll-hint">Scroll to begin</p>
		</div>
	</section>

	<!-- 2. THE ROOM -->
	<section id="room" class="snap-section room" style="--bg: #E8EDE8;">
		<div class="room-image">
			<img src="/images/2024-12-15-(1).jpg" alt="The Garden Room" />
		</div>
		<div class="room-text">
			<p class="label">ACCOMMODATION</p>
			<h2 class="room-heading">The Garden Room</h2>
			<p class="room-body">Stone walls, morning light, and the sound of the orchard. A room that asks nothing of you.</p>
			<p class="room-price">From €120 per night</p>
		</div>
	</section>

	<!-- 3. THE GARDEN -->
	<section id="garden" class="snap-section garden" style="--bg: #EDE8E0;">
		<div class="bg-image garden-img" style="background-image: url('/images/2023-05-20.jpg');"></div>
		<div class="garden-center">
			<h2 class="garden-heading">The garden</h2>
			<p class="garden-body">Two hectares of orchard, wildflower meadow, and bocage hedge. Silence, mostly. Birdsong, occasionally.</p>
		</div>
	</section>

	<!-- 4. FIND YOUR DATES -->
	<section id="book" class="snap-section booking" style="--bg: #F5F0E8;">
		<div class="booking-inner">
			<p class="label">RESERVATION</p>
			<h2 class="booking-heading">When would you like to stay?</h2>

			<div class="form-area">
				{#if currentField === 0}
					<div class="field-wrap">
						<input
							class="calm-input"
							type="date"
							placeholder="Arrival"
							bind:value={arrival}
							onblur={advance}
							onkeydown={handleKeydown}
							autofocus
						/>
						<span class="field-hint">departure →</span>
					</div>
				{/if}
				{#if currentField === 1}
					<div class="field-wrap">
						<input
							class="calm-input"
							type="date"
							placeholder="Departure"
							bind:value={departure}
							onblur={advance}
							onkeydown={handleKeydown}
							autofocus
						/>
						<span class="field-hint">your name →</span>
					</div>
				{/if}
				{#if currentField === 2}
					<div class="field-wrap">
						<input
							class="calm-input"
							type="text"
							placeholder="Your name"
							bind:value={name}
							onblur={advance}
							onkeydown={handleKeydown}
							autofocus
						/>
						<span class="field-hint">email →</span>
					</div>
				{/if}
				{#if currentField === 3}
					<div class="field-wrap">
						<input
							class="calm-input"
							type="email"
							placeholder="Email address"
							bind:value={email}
							onblur={() => {}}
							onkeydown={handleKeydown}
							autofocus
						/>
					</div>
				{/if}

				{#if allFilled}
					<div class="continue-wrap">
						<button class="continue-btn">Continue →</button>
					</div>
				{/if}
			</div>

			<p class="booking-note">We'll confirm by email within 24 hours.</p>
		</div>
	</section>

	<!-- 5. UNTIL THEN -->
	<section class="snap-section footer-section" style="--bg: #2A2A28;">
		<div class="footer-center">
			<p class="footer-title">Until then, Normandy waits.</p>
			<p class="footer-sub">Marianne Cottage · Normandy · France</p>
			<p class="demo-links">
				<a href="/">← site</a> ·
				<a href="/historian">historian</a> ·
				<a href="/living">living</a> ·
				<a href="/nature">nature</a> ·
				<a href="/story">story</a> ·
				<a href="/brutal">brutal</a> ·
				<a href="/calm" aria-current="page">calm</a> ·
				<a href="/bento">bento</a> ·
				<a href="/kinetic">kinetic</a> ·
				<a href="/adaptive">adaptive</a> ·
				<a href="/ambient">ambient</a> ·
				<a href="/context">context</a> ·
				<a href="/retro">retro</a> ·
				<a href="/expressive">expressive</a> ·
				<a href="/spatial">spatial</a> ·
				<a href="/micro">micro</a> ·
				<a href="/ergonomic">ergonomic</a> ·
				<a href="/liquid">liquid</a> · <a href="/scroll-anim">scroll-anim</a> · <a href="/morph">morph</a> · <a href="/handmade">handmade</a> · <a href="/iridescent">iridescent</a>
			</p>
			<p class="demo-number">Demo #44</p>
		</div>
	</section>

</div>

<style>
	:global(html), :global(body) {
		margin: 0;
		padding: 0;
		height: 100%;
		overflow: hidden;
	}

	* {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		font-family: Georgia, serif;
		font-weight: 300;
		color: #2A2A28;
	}

	.scroll-root {
		height: 100vh;
		overflow-y: scroll;
		scroll-snap-type: y mandatory;
	}

	/* ── SECTIONS ── */
	.snap-section {
		position: relative;
		height: 100vh;
		background-color: var(--bg);
		scroll-snap-align: start;
		opacity: 0;
		transition: opacity 1.2s ease;
		overflow: hidden;
	}

	.snap-section.visible {
		opacity: 1;
	}

	/* hero starts visible */
	.hero {
		opacity: 1;
	}

	/* ── BG IMAGE ── */
	.bg-image {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		opacity: 0.15;
		mix-blend-mode: multiply;
		z-index: 0;
		filter: saturate(0.7);
	}

	/* ── NAV ── */
	.top-nav {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 10;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2rem 4rem;
	}

	.logo {
		font-size: 0.9rem;
		font-weight: 400;
		letter-spacing: 0.02em;
	}

	.nav-links {
		display: flex;
		gap: 2.5rem;
	}

	.nav-links a {
		font-size: 0.85rem;
		text-decoration: none;
		opacity: 0.5;
		transition: opacity 0.3s ease;
		font-weight: 300;
	}

	.nav-links a:hover {
		opacity: 0.9;
	}

	/* ── HERO CENTER ── */
	.hero-center {
		position: relative;
		z-index: 1;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3rem;
	}

	.hero-title {
		font-size: clamp(2rem, 5vw, 4rem);
		font-style: italic;
		text-align: center;
		letter-spacing: -0.02em;
		font-weight: 400;
	}

	.scroll-hint {
		font-size: 0.9rem;
		opacity: 0.5;
		text-align: center;
	}

	/* ── ROOM ── */
	.room {
		display: flex;
		flex-direction: row;
	}

	.room-image {
		width: 45%;
		height: 100%;
		flex-shrink: 0;
		overflow: hidden;
	}

	.room-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(0.7);
		display: block;
	}

	.room-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 4rem 5rem;
		gap: 0;
	}

	.label {
		font-size: 0.75rem;
		opacity: 0.5;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		font-weight: 300;
		margin-bottom: 1.5rem;
	}

	.room-heading {
		font-size: clamp(2rem, 4vw, 3.5rem);
		font-style: italic;
		font-weight: 400;
		margin-bottom: 1rem;
	}

	.room-body {
		font-size: 0.95rem;
		line-height: 2;
		opacity: 0.75;
		max-width: 40ch;
		margin-bottom: 2rem;
	}

	.room-price {
		font-size: 0.85rem;
		opacity: 0.5;
	}

	/* ── GARDEN ── */
	.garden {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.garden-img {
		opacity: 0.3;
	}

	.garden-center {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 4rem;
		gap: 2rem;
	}

	.garden-heading {
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-style: italic;
		font-weight: 400;
	}

	.garden-body {
		font-size: 1rem;
		opacity: 0.6;
		line-height: 1.9;
		max-width: 45ch;
	}

	/* ── BOOKING ── */
	.booking {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.booking-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		width: 100%;
		max-width: 480px;
		padding: 4rem 2rem;
		gap: 0;
	}

	.booking-heading {
		font-size: clamp(1.75rem, 4vw, 3rem);
		font-style: italic;
		font-weight: 400;
		margin-bottom: 2rem;
	}

	.form-area {
		width: 100%;
		margin-bottom: 2rem;
	}

	.field-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		opacity: 0;
		animation: fadeField 0.6s ease forwards;
	}

	@keyframes fadeField {
		to { opacity: 1; }
	}

	.calm-input {
		width: 100%;
		border: none;
		border-bottom: 1px solid rgba(42, 42, 40, 0.25);
		background: transparent;
		font-size: 1.1rem;
		font-style: italic;
		font-weight: 300;
		padding: 0.5rem 0;
		text-align: center;
		outline: none;
		color: #2A2A28;
		font-family: Georgia, serif;
	}

	.calm-input::placeholder {
		opacity: 0.4;
		font-style: italic;
		color: #2A2A28;
	}

	.field-hint {
		font-size: 0.8rem;
		opacity: 0.3;
		letter-spacing: 0.05em;
	}

	.continue-wrap {
		margin-top: 2rem;
		opacity: 0;
		animation: fadeField 0.6s ease 0.3s forwards;
	}

	.continue-btn {
		background: none;
		border: none;
		font-size: 0.9rem;
		font-weight: 400;
		opacity: 0.7;
		cursor: pointer;
		font-family: Georgia, serif;
		font-style: italic;
		color: #2A2A28;
		transition: opacity 0.3s ease;
		padding: 0;
	}

	.continue-btn:hover {
		opacity: 0.75;
	}

	.booking-note {
		font-size: 0.75rem;
		opacity: 0.35;
	}

	/* ── FOOTER ── */
	.footer-section {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.footer-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0;
		padding: 4rem;
	}

	.footer-title {
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		font-style: italic;
		opacity: 0.85;
		color: #F5F0E8;
		font-weight: 400;
		margin-bottom: 3rem;
	}

	.footer-sub {
		font-size: 0.8rem;
		opacity: 0.4;
		color: #F5F0E8;
		margin-bottom: 2rem;
	}

	.demo-links {
		font-size: 0.8rem;
		opacity: 0.25;
		color: #F5F0E8;
		margin-bottom: 1rem;
	}

	.demo-links a {
		color: #F5F0E8;
		text-decoration: none;
		transition: opacity 0.3s ease;
	}

	.demo-links a:hover {
		opacity: 0.75;
	}

	.demo-number {
		font-size: 0.7rem;
		opacity: 0.15;
		color: #F5F0E8;
	}

	/* ── MOBILE ── */
	@media (max-width: 768px) {
		.top-nav {
			padding: 1.5rem 2rem;
		}

		.nav-links {
			gap: 1.5rem;
		}

		.room {
			flex-direction: column;
		}

		.room-image {
			width: 100%;
			height: 50vh;
		}

		.room-text {
			padding: 2.5rem 2rem;
			height: 50vh;
			overflow-y: auto;
		}

		.garden-center {
			padding: 2rem;
		}

		.booking-inner {
			padding: 3rem 2rem;
		}
	}
</style>
