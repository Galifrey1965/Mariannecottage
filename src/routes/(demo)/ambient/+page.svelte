<script>
	import { onMount } from 'svelte';

	// ── Time of day ───────────────────────────────────────────────────────────
	const hour = new Date().getHours();

	const timeConfig = (() => {
		if (hour >= 6 && hour <= 11)
			return { label: 'morning',   accent: '#f5c842', bg: '#fdf8ec', text: '#3a3020', greeting: 'Start your day with us' };
		if (hour >= 12 && hour <= 17)
			return { label: 'afternoon', accent: '#7ab5d4', bg: '#edf5fa', text: '#1a2e3a', greeting: 'The afternoon light is golden' };
		if (hour >= 18 && hour <= 22)
			return { label: 'evening',   accent: '#6b5b8e', bg: '#f0edf7', text: '#1e1830', greeting: 'The evening calls' };
		return   { label: 'night',     accent: '#2a2a3a', bg: '#1a1a28', text: '#e8e4d4', greeting: 'Slip away in the quiet' };
	})();

	// ── Hero hover ────────────────────────────────────────────────────────────
	let heroHovered = $state(false);

	// ── Stats ─────────────────────────────────────────────────────────────────
	const statsData = [
		{ value: 14, suffix: ' yrs', label: 'Years welcoming guests' },
		{ value: 4,  suffix: '',     label: 'Quiet rooms' },
		{ value: 2,  suffix: ' ha',  label: 'Of garden & orchard' },
		{ value: 6,  suffix: ' km',  label: 'From the sea' }
	];

	let statCounts = $state(statsData.map(() => 0));
	let statHovered = $state(statsData.map(() => false));

	// ── Place cards ───────────────────────────────────────────────────────────
	const cards = [
		{
			image: '/images/2024-08-15.jpg',
			caption: 'Morning mist hangs over the orchard, patient as memory.'
		},
		{
			image: '/images/2024-12-15.jpg',
			caption: 'Stone walls hold centuries of quiet, warm to the touch.'
		},
		{
			image: '/images/2024-12-15-(1).jpg',
			caption: 'The garden asks nothing of you. Only to be here.'
		}
	];

	let cardHovered = $state(cards.map(() => false));

	// ── Booking widget ────────────────────────────────────────────────────────
	let arrival = $state('');
	let departure = $state('');
	let guests = $state(2);

	// ── Mount: IntersectionObserver for stats ─────────────────────────────────
	onMount(() => {
		const statEls = document.querySelectorAll('.stat-item');
		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					const idx = parseInt(entry.target.dataset.idx);
					const target = statsData[idx].value;
					const duration = 1400;
					const step = duration / target;
					let current = 0;
					const timer = setInterval(() => {
						current++;
						statCounts[idx] = current;
						if (current >= target) clearInterval(timer);
					}, step);
					obs.unobserve(entry.target);
				});
			},
			{ threshold: 0.5 }
		);
		statEls.forEach((el) => obs.observe(el));
		return () => obs.disconnect();
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Zero-UI · Ambient</title>
</svelte:head>

<!-- Root with CSS custom property for accent colour -->
<div
	class="root"
	style="--accent: {timeConfig.accent}; --accent-bg: {timeConfig.bg}; --text: {timeConfig.text};"
>

	<!-- ── 1. HERO ──────────────────────────────────────────────────────────── -->
	<section
		class="hero"
		role="banner"
		on:mouseenter={() => (heroHovered = true)}
		on:mouseleave={() => (heroHovered = false)}
		on:touchstart={() => (heroHovered = true)}
		on:touchend={() => setTimeout(() => (heroHovered = false), 2000)}
	>
		<div class="hero-bg" style="background-image: url('/images/2024-08-15.jpg');"></div>
		<div class="hero-overlay"></div>

		<!-- Ambient pulse hint (visible at rest) -->
		<div class="pulse-hint" class:hidden={heroHovered} aria-hidden="true">
			<span class="pulse-ring"></span>
		</div>

		<!-- CTA (appears on hover/touch) -->
		<div class="hero-cta" class:visible={heroHovered}>
			<p class="hero-eyebrow">Normandy, France</p>
			<h1 class="hero-title">Marianne Cottage</h1>
			<a href="#book" class="hero-btn">Book your stay</a>
		</div>

		<p class="hero-scroll-hint" class:hidden={heroHovered} aria-hidden="true">
			<span>hover to begin</span>
		</p>
	</section>

	<!-- ── 2. TIME GREETING ─────────────────────────────────────────────────── -->
	<section class="time-section" style="background: {timeConfig.bg}; color: {timeConfig.text};">
		<div class="time-inner">
			<span class="time-tag">{timeConfig.label}</span>
			<p class="time-greeting">{timeConfig.greeting}</p>
			<div class="time-rule" style="background: {timeConfig.accent};"></div>
			<p class="time-sub">
				A place that listens to the hour. However you arrive, Marianne Cottage meets you there.
			</p>
		</div>
	</section>

	<!-- ── 3. AMBIENT STATS ─────────────────────────────────────────────────── -->
	<section class="stats-section">
		<p class="stats-eyebrow">Hover to learn more</p>
		<div class="stats-grid">
			{#each statsData as stat, i}
				<div
					class="stat-item"
					data-idx={i}
					role="group"
					aria-label="{stat.label}: {stat.value}{stat.suffix}"
					on:mouseenter={() => (statHovered[i] = true)}
					on:mouseleave={() => (statHovered[i] = false)}
					on:focusin={() => (statHovered[i] = true)}
					on:focusout={() => (statHovered[i] = false)}
					tabindex="0"
				>
					<span class="stat-number">{statCounts[i]}{stat.suffix}</span>
					<span class="stat-label" class:visible={statHovered[i]}>{stat.label}</span>
					<span class="stat-line" class:visible={statHovered[i]}></span>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── 4. VOICE OF PLACE CARDS ──────────────────────────────────────────── -->
	<section class="place-section">
		<h2 class="place-heading">A place speaks, if you listen.</h2>
		<div class="place-grid">
			{#each cards as card, i}
				<div
					class="place-card"
					role="img"
					aria-label={card.caption}
					on:mouseenter={() => (cardHovered[i] = true)}
					on:mouseleave={() => (cardHovered[i] = false)}
					on:focusin={() => (cardHovered[i] = true)}
					on:focusout={() => (cardHovered[i] = false)}
					tabindex="0"
				>
					<img src={card.image} alt="" loading="lazy" />
					<div class="place-caption" class:visible={cardHovered[i]}>
						<p>{card.caption}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- ── 5. BOOKING WIDGET ─────────────────────────────────────────────────── -->
	<section class="book-section" id="book">
		<div class="book-inner">
			<p class="book-eyebrow">When would you like to arrive?</p>
			<form class="book-form" on:submit|preventDefault>
				<div class="book-field">
					<label for="arrival">Arrival</label>
					<input
						id="arrival"
						type="date"
						bind:value={arrival}
						class="ghost-input"
					/>
				</div>
				<div class="book-sep" aria-hidden="true">→</div>
				<div class="book-field">
					<label for="departure">Departure</label>
					<input
						id="departure"
						type="date"
						bind:value={departure}
						class="ghost-input"
					/>
				</div>
				<div class="book-field book-guests">
					<label for="guests">Guests</label>
					<input
						id="guests"
						type="number"
						min="1"
						max="8"
						bind:value={guests}
						class="ghost-input"
					/>
				</div>
				<button type="submit" class="book-btn">
					Check availability
				</button>
			</form>
			<p class="book-note">No payment required to enquire. We reply within 24 hours.</p>
		</div>
	</section>

	<!-- ── FOOTER NAV ────────────────────────────────────────────────────────── -->
	<footer class="demo-footer">
		<p class="demo-footer-label">Design trend demos</p>
		<nav class="demo-nav" aria-label="Demo pages">
			<a href="/demo">← All demos</a>
			<span aria-hidden="true">·</span>
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
			<a href="/ambient" aria-current="page">ambient</a>
			<span aria-hidden="true">·</span>
			<a href="/context">context</a>
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
		padding-bottom: 100px;
	}

	/* ── 1. HERO ────────────────────────────────────────────────────────────── */
	.hero {
		position: relative;
		width: 100%;
		height: 100svh;
		min-height: 520px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: default;
		overflow: hidden;
	}

	.hero-bg {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center 30%;
		transition: transform 8s ease;
	}

	.hero:hover .hero-bg {
		transform: scale(1.04);
	}

	.hero-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.18) 0%,
			rgba(0, 0, 0, 0.44) 60%,
			rgba(0, 0, 0, 0.62) 100%
		);
	}

	/* Pulse hint */
	.pulse-hint {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		transition: opacity 0.6s ease;
	}

	.pulse-hint.hidden {
		opacity: 0;
	}

	.pulse-ring {
		display: block;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: 1.5px solid rgba(255, 255, 255, 0.35);
		animation: pulse-expand 2.8s ease-out infinite;
	}

	@keyframes pulse-expand {
		0%   { transform: scale(0.85); opacity: 0.6; }
		70%  { transform: scale(1.4);  opacity: 0; }
		100% { transform: scale(0.85); opacity: 0; }
	}

	/* CTA */
	.hero-cta {
		position: relative;
		z-index: 2;
		text-align: center;
		color: #fff;
		opacity: 0;
		transform: translateY(12px);
		transition: opacity 0.6s ease, transform 0.6s ease;
		pointer-events: none;
	}

	.hero-cta.visible {
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
	}

	.hero-eyebrow {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.75;
		margin-bottom: 0.75rem;
	}

	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 7vw, 5.5rem);
		font-weight: 400;
		line-height: 1.1;
		margin-bottom: 2rem;
		letter-spacing: -0.01em;
	}

	.hero-btn {
		display: inline-block;
		padding: 0.85rem 2.4rem;
		background: var(--accent);
		color: #1a1a1a;
		font-family: 'Inter', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		border-radius: 2px;
		transition: opacity 0.25s ease, transform 0.25s ease;
	}

	.hero-btn:hover {
		opacity: 0.88;
		transform: translateY(-2px);
	}

	/* Scroll hint */
	.hero-scroll-hint {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.7rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		transition: opacity 0.5s ease;
	}

	.hero-scroll-hint.hidden {
		opacity: 0;
	}

	/* ── 2. TIME SECTION ────────────────────────────────────────────────────── */
	.time-section {
		padding: 6rem 2rem;
		transition: background 1.2s ease, color 1.2s ease;
	}

	.time-inner {
		max-width: 640px;
		margin: 0 auto;
		text-align: center;
	}

	.time-tag {
		font-family: 'Inter', sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		opacity: 0.45;
		display: block;
		margin-bottom: 1.5rem;
	}

	.time-greeting {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.75rem, 4.5vw, 3rem);
		font-weight: 400;
		font-style: italic;
		line-height: 1.25;
		margin-bottom: 1.75rem;
	}

	.time-rule {
		width: 48px;
		height: 2px;
		margin: 0 auto 1.75rem;
		border-radius: 1px;
		transition: background 1.2s ease;
	}

	.time-sub {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		line-height: 1.7;
		opacity: 0.65;
		max-width: 460px;
		margin: 0 auto;
	}

	/* ── 3. STATS ───────────────────────────────────────────────────────────── */
	.stats-section {
		padding: 5rem 2rem 6rem;
		background: #f0eee9;
	}

	.stats-eyebrow {
		text-align: center;
		font-family: 'Inter', sans-serif;
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		opacity: 0.35;
		margin-bottom: 3.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2px;
		max-width: 800px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		.stats-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.stat-item {
		position: relative;
		padding: 3rem 1.5rem 2.5rem;
		text-align: center;
		background: #f7f5f1;
		cursor: default;
		outline: none;
		transition: background 0.3s ease;
	}

	.stat-item:hover,
	.stat-item:focus {
		background: #fff;
	}

	.stat-number {
		display: block;
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 5vw, 3.75rem);
		font-weight: 400;
		color: var(--accent, #6b5b8e);
		line-height: 1;
		transition: color 0.4s ease;
	}

	.stat-label {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		margin-top: 0.75rem;
		opacity: 0;
		transform: translateY(6px);
		transition: opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s;
		color: #3a3a3a;
	}

	.stat-label.visible {
		opacity: 0.7;
		transform: translateY(0);
	}

	.stat-line {
		display: block;
		width: 0;
		height: 1.5px;
		background: var(--accent, #6b5b8e);
		margin: 0.6rem auto 0;
		transition: width 0.4s ease 0.1s;
	}

	.stat-line.visible {
		width: 32px;
	}

	/* ── 4. PLACE CARDS ─────────────────────────────────────────────────────── */
	.place-section {
		padding: 6rem 2rem;
		background: #e8e5df;
	}

	.place-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.25rem, 3vw, 2rem);
		font-weight: 400;
		font-style: italic;
		text-align: center;
		margin-bottom: 3rem;
		opacity: 0.6;
		letter-spacing: 0.01em;
	}

	.place-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		.place-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.place-card {
		position: relative;
		aspect-ratio: 3 / 4;
		overflow: hidden;
		cursor: pointer;
		outline: none;
	}

	.place-card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.7s ease;
	}

	.place-card:hover img,
	.place-card:focus img {
		transform: scale(1.06);
	}

	.place-caption {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		padding: 1.75rem 1.5rem;
		background: linear-gradient(
			to top,
			rgba(10, 8, 6, 0.72) 0%,
			rgba(10, 8, 6, 0) 55%
		);
		opacity: 0;
		transform: translateY(8px);
		transition: opacity 0.55s ease, transform 0.55s ease;
	}

	.place-caption.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.place-caption p {
		font-family: 'Playfair Display', serif;
		font-size: 0.95rem;
		font-style: italic;
		color: rgba(255, 255, 255, 0.92);
		line-height: 1.55;
	}

	/* ── 5. BOOKING WIDGET ──────────────────────────────────────────────────── */
	.book-section {
		padding: 7rem 2rem;
		background: #f7f5f0;
	}

	.book-inner {
		max-width: 720px;
		margin: 0 auto;
		text-align: center;
	}

	.book-eyebrow {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.5rem, 3.5vw, 2.25rem);
		font-weight: 400;
		font-style: italic;
		margin-bottom: 3rem;
		opacity: 0.72;
	}

	.book-form {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: center;
		gap: 1.5rem 2rem;
		margin-bottom: 1.5rem;
	}

	.book-field {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
	}

	.book-field label {
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		opacity: 0.38;
	}

	/* Ghost input — no border/bg at rest */
	.ghost-input {
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(58, 58, 58, 0.2);
		border-radius: 0;
		padding: 0.5rem 0.25rem;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		color: #3a3a3a;
		outline: none;
		transition:
			border-color 0.3s ease,
			box-shadow 0.3s ease;
		min-width: 150px;
	}

	.ghost-input:focus {
		border-bottom-color: var(--accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 22%, transparent);
	}

	.book-guests .ghost-input {
		min-width: 64px;
		text-align: center;
	}

	.book-sep {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		opacity: 0.25;
		padding-bottom: 0.5rem;
		align-self: flex-end;
	}

	.book-btn {
		padding: 0.8rem 2.2rem;
		background: var(--accent);
		border: none;
		border-radius: 2px;
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #1a1a1a;
		cursor: pointer;
		transition: opacity 0.25s ease, transform 0.25s ease;
		align-self: flex-end;
		margin-bottom: 1px;
	}

	.book-btn:hover {
		opacity: 0.82;
		transform: translateY(-2px);
	}

	.book-note {
		font-family: 'Inter', sans-serif;
		font-size: 0.72rem;
		opacity: 0.38;
		letter-spacing: 0.04em;
	}

	/* ── FOOTER NAV ─────────────────────────────────────────────────────────── */
	.demo-footer {
		padding: 2.5rem 2rem;
		border-top: 1px solid rgba(58, 58, 58, 0.1);
		text-align: center;
		background: #f0eee9;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
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
