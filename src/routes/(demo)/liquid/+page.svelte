<script>
	import { onMount } from 'svelte';

	// --- nav scroll state ---
	let scrolled = $state(false);

	// --- active stacked panel ---
	let activePanel = $state(1);

	// --- booking form ---
	let checkin = $state('');
	let checkout = $state('');
	let guests = $state('2');

	// --- mouse tracking per card (3 room cards) ---
	let cardLight = $state([
		{ x: 50, y: 50 },
		{ x: 50, y: 50 },
		{ x: 50, y: 50 }
	]);

	function handleCardMouseMove(e, index) {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		cardLight = cardLight.map((c, i) => (i === index ? { x, y } : c));
	}

	function handleCardMouseLeave(index) {
		cardLight = cardLight.map((c, i) => (i === index ? { x: 50, y: 50 } : c));
	}

	onMount(() => {
		const onScroll = () => {
			scrolled = window.scrollY > 100;
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

<svelte:head>
	<title>Marianne Cottage — Liquid Glass</title>
</svelte:head>

<!-- ═══════════════════════════════════════════
     BACKGROUND — fixed, always below everything
     ═══════════════════════════════════════════ -->
<div class="bg-scene" aria-hidden="true">
	<div class="orb orb-amber"></div>
	<div class="orb orb-sage"></div>
	<div class="orb orb-rose"></div>
	<div class="orb orb-teal"></div>
</div>

<!-- ═══════════════════════════════════════════
     NAV
     ═══════════════════════════════════════════ -->
<nav class="glass-nav" class:scrolled>
	<div class="nav-inner">
		<span class="nav-logo">Marianne Cottage</span>
		<ul class="nav-links">
			<li><a href="#rooms">Rooms</a></li>
			<li><a href="#amenities">Amenities</a></li>
			<li><a href="#book">Book</a></li>
		</ul>
	</div>
</nav>

<!-- ═══════════════════════════════════════════
     HERO
     ═══════════════════════════════════════════ -->
<section class="hero">
	<div class="hero-card glass-card">
		<div class="hero-eyebrow">Normandy · France</div>
		<h1 class="hero-headline">
			<span class="refract-text">The art of</span>
			<span class="refract-text refract-gold">transparency</span>
		</h1>
		<p class="hero-sub">
			Where morning light filters through centuries of stone and glass, and every surface
			tells the story of the land beyond.
		</p>
		<a href="#book" class="pill-btn">Reserve your stay</a>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     ROOM CARDS
     ═══════════════════════════════════════════ -->
<section class="section rooms-section" id="rooms">
	<div class="section-header">
		<h2 class="section-title">Our Rooms</h2>
		<p class="section-sub">Each space a different quality of light</p>
	</div>

	<div class="rooms-grid">
		{#each [
			{ name: 'La Chambre Verte', desc: 'Garden-level suite with floor-to-ceiling oak shutters and a private terrace.', grad: 'linear-gradient(135deg, #1e3d28 0%, #2e5c38 50%, #4a7c54 100%)', label: 'Forest Suite', price: '€240' },
			{ name: 'La Chambre Pierre', desc: 'Original exposed stonework, cedar beams, deep window seats overlooking the orchard.', grad: 'linear-gradient(135deg, #3a3228 0%, #5c4e3e 50%, #7a6a5a 100%)', label: 'Stone Room', price: '€180' },
			{ name: 'La Chambre Lumière', desc: 'Top-floor retreat. Three skylights. The stars come to you.', grad: 'linear-gradient(135deg, #1a2a3a 0%, #2a4060 50%, #3a6080 100%)', label: 'Light Loft', price: '€210' }
		] as room, i}
			<div
				class="room-card glass-card"
				onmousemove={(e) => handleCardMouseMove(e, i)}
				onmouseleave={() => handleCardMouseLeave(i)}
				role="article"
			>
				<!-- gradient background image placeholder -->
				<div class="room-bg" style="background: {room.grad}">
					<span class="room-label">{room.label}</span>
				</div>
				<!-- mouse-tracked light overlay -->
				<div
					class="room-light-overlay"
					style="background: radial-gradient(circle at {cardLight[i].x}% {cardLight[i].y}%, rgba(255,255,255,0.22) 0%, transparent 60%)"
				></div>
				<div class="room-info">
					<h3 class="room-name">{room.name}</h3>
					<p class="room-desc">{room.desc}</p>
					<div class="room-footer">
						<span class="room-price">{room.price} / night</span>
						<button class="ghost-btn">View</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ═══════════════════════════════════════════
     LAYERED GLASS PANELS — Amenities
     ═══════════════════════════════════════════ -->
<section class="section panels-section" id="amenities">
	<div class="section-header">
		<h2 class="section-title">The Experience</h2>
		<p class="section-sub">Click a card to bring it forward</p>
	</div>

	<div class="panels-stage">
		{#each [
			{ icon: '🌿', title: 'Kitchen Garden', body: 'Two acres of organic kitchen garden. Guests harvest their own herbs, tomatoes and courgettes each morning. We leave the basket at your door.' },
			{ icon: '🛁', title: 'Copper Bath', body: 'Hand-hammered copper soaking tub. Fill it with lavender from the garden, light the candles, and let an hour become an evening.' },
			{ icon: '📚', title: 'The Library', body: 'Over 800 volumes. French novels, illustrated botanical guides, maps of old Normandy. A leather chair by the fire waits for you.' }
		] as panel, i}
			<button
				class="panel-card glass-card"
				class:panel-active={activePanel === i}
				style="--rot: {[-2, 0, 2][i]}deg; --z: {activePanel === i ? 10 : 3 - i}"
				onclick={() => activePanel = i}
			>
				<div class="panel-icon">{panel.icon}</div>
				<h3 class="panel-title">{panel.title}</h3>
				<p class="panel-body">{panel.body}</p>
			</button>
		{/each}
	</div>
</section>

<!-- ═══════════════════════════════════════════
     LIGHT REFRACTION TEXT
     ═══════════════════════════════════════════ -->
<section class="section refraction-section">
	<div class="refraction-wrap">
		<p class="refract-layer refract-l1" aria-hidden="true">A place between</p>
		<p class="refract-layer refract-l2" aria-hidden="true">A place between</p>
		<p class="refract-layer refract-l3">A place between</p>
		<p class="refract-tagline">stillness and light</p>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     BOOKING WIDGET
     ═══════════════════════════════════════════ -->
<section class="section booking-section" id="book">
	<div class="booking-card glass-card booking-tint">
		<div class="booking-header">
			<h2 class="booking-title">Plan your stay</h2>
			<p class="booking-sub">Availability is limited — we host only one party at a time</p>
		</div>

		<div class="booking-inputs">
			<label class="glass-input-wrap">
				<span class="input-label">Check-in</span>
				<input class="glass-input" type="date" bind:value={checkin} />
			</label>
			<label class="glass-input-wrap">
				<span class="input-label">Check-out</span>
				<input class="glass-input" type="date" bind:value={checkout} />
			</label>
			<label class="glass-input-wrap">
				<span class="input-label">Guests</span>
				<select class="glass-input" bind:value={guests}>
					{#each ['1','2','3','4','5','6'] as n}
						<option value={n}>{n} guest{n === '1' ? '' : 's'}</option>
					{/each}
				</select>
			</label>
		</div>

		<button class="pill-btn booking-cta">Check availability</button>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     DEMO FOOTER NAV
     ═══════════════════════════════════════════ -->
<footer class="demo-footer">
	<nav class="demo-nav-pill glass-card">
		{#each [
			['brutal','brutal'],['calm','calm'],['bento','bento'],['kinetic','kinetic'],
			['adaptive','adaptive'],['ambient','ambient'],['context','context'],
			['retro','retro'],['expressive','expressive'],['spatial','spatial'],
			['micro','micro'],['ergonomic','ergonomic'],['liquid','liquid'],
			['scroll-anim','scroll-anim'],['morph','morph'],['handmade','handmade'],['iridescent','iridescent']
		] as [slug, label]}
			<a href="/{ slug}" class="demo-link" class:demo-active={slug === 'liquid'}>{label}</a>
		{/each}
	</nav>
</footer>

<style>
	/* ── Layout root ─────────────────────────── */
	:global(body) {
		background: #0d1f14 !important;
		color: #f0ece4 !important;
		overflow-x: hidden;
	}

	/* ── Fixed background scene ──────────────── */
	.bg-scene {
		position: fixed;
		inset: 0;
		z-index: 0;
		background: linear-gradient(135deg, #1a3a2a 0%, #2d5016 50%, #0a2a1a 100%);
		overflow: hidden;
		pointer-events: none;
	}

	.orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		animation: float 10s ease-in-out infinite alternate;
	}

	.orb-amber {
		width: 520px; height: 520px;
		background: rgba(245, 180, 60, 0.35);
		top: -120px; left: -80px;
		animation-duration: 9s;
	}
	.orb-sage {
		width: 440px; height: 440px;
		background: rgba(122, 210, 140, 0.28);
		top: 40%; right: -100px;
		animation-duration: 11s;
		animation-delay: -3s;
	}
	.orb-rose {
		width: 360px; height: 360px;
		background: rgba(210, 140, 160, 0.22);
		bottom: 10%; left: 20%;
		animation-duration: 13s;
		animation-delay: -6s;
	}
	.orb-teal {
		width: 300px; height: 300px;
		background: rgba(60, 180, 200, 0.18);
		bottom: -80px; right: 30%;
		animation-duration: 8s;
		animation-delay: -1.5s;
	}

	@keyframes float {
		0%   { transform: translateY(0px) scale(1); }
		50%  { transform: translateY(-30px) scale(1.04); }
		100% { transform: translateY(12px) scale(0.97); }
	}

	/* ── Glass card base ─────────────────────── */
	.glass-card {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(22px) saturate(180%);
		-webkit-backdrop-filter: blur(22px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-bottom-color: rgba(0, 0, 0, 0.12);
		border-right-color: rgba(0, 0, 0, 0.08);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.5),
			inset 1px 0 0 rgba(255, 255, 255, 0.2),
			0 8px 32px rgba(0, 0, 0, 0.3),
			0 2px 8px rgba(0, 0, 0, 0.15);
		border-radius: 20px;
	}

	/* ── Nav ─────────────────────────────────── */
	.glass-nav {
		position: fixed;
		top: 0; left: 0; right: 0;
		z-index: 100;
		transition: background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease;
		border-bottom: 1px solid transparent;
	}

	.glass-nav.scrolled {
		background: rgba(20, 50, 30, 0.55);
		backdrop-filter: blur(20px) saturate(160%);
		-webkit-backdrop-filter: blur(20px) saturate(160%);
		border-bottom-color: rgba(255, 255, 255, 0.12);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
	}

	.nav-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 18px 32px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.nav-logo {
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #fff;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 8px rgba(0,0,0,0.4);
	}

	.nav-links {
		list-style: none;
		display: flex;
		gap: 32px;
	}

	.nav-links a {
		color: rgba(255, 255, 255, 0.85);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		transition: color 0.2s;
	}
	.nav-links a:hover { color: #f5c060; }

	/* ── Hero ────────────────────────────────── */
	.hero {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 100px 24px 60px;
	}

	.hero-card {
		width: min(620px, 92%);
		padding: 56px 52px;
		text-align: center;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(28px) saturate(200%);
		-webkit-backdrop-filter: blur(28px) saturate(200%);
	}

	.hero-eyebrow {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #7fd190;
		margin-bottom: 20px;
	}

	.hero-headline {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.6rem, 6vw, 4rem);
		font-weight: 700;
		line-height: 1.1;
		margin-bottom: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	/* refraction headline effect */
	.refract-text {
		color: #fff;
		text-shadow:
			0 1px 0 rgba(255,255,255,0.6),
			0 -1px 0 rgba(0,0,0,0.2),
			2px 0 12px rgba(255,255,255,0.1);
	}

	.refract-gold {
		background: linear-gradient(135deg, #f5c060 0%, #f0a040 40%, #ffe0a0 70%, #f5c060 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		filter: drop-shadow(0 2px 8px rgba(245,192,96,0.4));
	}

	.hero-sub {
		color: rgba(255, 255, 255, 0.72);
		font-size: 1.05rem;
		line-height: 1.7;
		max-width: 440px;
		margin: 0 auto 36px;
	}

	/* pill button */
	.pill-btn {
		display: inline-block;
		padding: 14px 36px;
		border-radius: 100px;
		background: rgba(245, 192, 96, 0.25);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(245, 192, 96, 0.55);
		box-shadow:
			inset 0 1px 0 rgba(255,255,255,0.35),
			0 4px 20px rgba(245, 192, 96, 0.2);
		color: #f5c060;
		font-size: 0.9rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.25s, box-shadow 0.25s, transform 0.15s;
		font-family: inherit;
	}
	.pill-btn:hover {
		background: rgba(245, 192, 96, 0.38);
		box-shadow:
			inset 0 1px 0 rgba(255,255,255,0.45),
			0 6px 28px rgba(245, 192, 96, 0.35);
		transform: translateY(-1px);
	}
	.pill-btn:active { transform: translateY(0); }

	/* ── Sections shared ─────────────────────── */
	.section {
		position: relative;
		z-index: 1;
		max-width: 1100px;
		margin: 0 auto;
		padding: 80px 24px;
	}

	.section-header {
		text-align: center;
		margin-bottom: 52px;
	}

	.section-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #fff;
		text-shadow: 0 2px 16px rgba(0,0,0,0.3);
		margin-bottom: 10px;
	}

	.section-sub {
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.9rem;
		letter-spacing: 0.04em;
	}

	/* ── Room cards ──────────────────────────── */
	.rooms-section { padding-top: 40px; }

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 24px;
	}

	.room-card {
		position: relative;
		overflow: hidden;
		cursor: default;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		background: rgba(122, 158, 126, 0.08);
	}
	.room-card:hover {
		transform: translateY(-4px);
		box-shadow:
			inset 0 1px 0 rgba(255,255,255,0.55),
			0 16px 48px rgba(0,0,0,0.4);
	}

	.room-bg {
		height: 200px;
		border-radius: 14px 14px 0 0;
		position: relative;
		display: flex;
		align-items: flex-end;
		padding: 14px 16px;
	}

	.room-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.75);
		background: rgba(0,0,0,0.3);
		backdrop-filter: blur(8px);
		padding: 4px 10px;
		border-radius: 100px;
		border: 1px solid rgba(255,255,255,0.2);
	}

	/* light tracking overlay */
	.room-light-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 2;
		border-radius: 20px;
		transition: background 0.1s;
	}

	.room-info {
		padding: 22px 22px 20px;
		position: relative;
		z-index: 3;
	}

	.room-name {
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 8px;
	}

	.room-desc {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.62);
		line-height: 1.6;
		margin-bottom: 18px;
	}

	.room-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.room-price {
		font-size: 0.9rem;
		font-weight: 600;
		color: #f5c060;
	}

	.ghost-btn {
		padding: 7px 18px;
		border-radius: 100px;
		border: 1px solid rgba(255,255,255,0.28);
		background: rgba(255,255,255,0.08);
		color: rgba(255,255,255,0.8);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
		font-family: inherit;
	}
	.ghost-btn:hover {
		background: rgba(255,255,255,0.16);
		border-color: rgba(255,255,255,0.45);
	}

	/* ── Layered panels ──────────────────────── */
	.panels-section { padding-bottom: 120px; }

	.panels-stage {
		position: relative;
		height: 360px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.panel-card {
		position: absolute;
		width: min(440px, 88%);
		padding: 40px 40px 36px;
		text-align: left;
		cursor: pointer;
		border: none;
		outline: none;
		transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1), z-index 0s, box-shadow 0.4s;
		transform: rotate(var(--rot));
		z-index: var(--z);
		background: rgba(255, 255, 255, 0.09);
	}

	.panel-card.panel-active {
		transform: rotate(0deg) translateY(-12px) scale(1.03);
		background: rgba(255, 255, 255, 0.16);
		box-shadow:
			inset 0 1px 0 rgba(255,255,255,0.6),
			0 20px 60px rgba(0,0,0,0.45);
	}

	.panel-icon {
		font-size: 2rem;
		margin-bottom: 16px;
		filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
	}

	.panel-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.3rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 12px;
	}

	.panel-body {
		font-size: 0.9rem;
		color: rgba(255,255,255,0.65);
		line-height: 1.7;
	}

	/* ── Light refraction text ───────────────── */
	.refraction-section {
		padding: 100px 24px;
		text-align: center;
	}

	.refraction-wrap {
		position: relative;
		display: inline-block;
	}

	.refract-layer {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.4rem, 7vw, 5rem);
		font-weight: 700;
		line-height: 1;
		position: absolute;
		left: 0; right: 0;
		white-space: nowrap;
	}

	.refract-l1 {
		color: rgba(122, 210, 140, 0.25);
		transform: translate(-3px, -4px);
	}
	.refract-l2 {
		color: rgba(245, 192, 96, 0.2);
		transform: translate(3px, 2px);
	}
	.refract-l3 {
		color: rgba(255,255,255,0.9);
		position: relative;
		text-shadow:
			0 0 40px rgba(255,255,255,0.12),
			0 2px 0 rgba(255,255,255,0.4),
			0 -1px 0 rgba(0,0,0,0.3);
	}

	.refract-tagline {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.4rem, 7vw, 5rem);
		font-weight: 700;
		font-style: italic;
		color: transparent;
		background: linear-gradient(135deg, #7fd190 0%, #f5c060 50%, #f0a8c8 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-top: clamp(2.6rem, 7.5vw, 5.4rem);
		filter: drop-shadow(0 2px 20px rgba(127,209,144,0.3));
	}

	/* ── Booking ─────────────────────────────── */
	.booking-section {
		max-width: 700px;
		padding-bottom: 100px;
	}

	.booking-card {
		padding: 52px 48px;
		background: rgba(240, 200, 160, 0.08);
		backdrop-filter: blur(28px) saturate(180%);
		-webkit-backdrop-filter: blur(28px) saturate(180%);
	}

	.booking-header {
		text-align: center;
		margin-bottom: 40px;
	}

	.booking-title {
		font-family: 'Playfair Display', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #fff;
		margin-bottom: 8px;
	}

	.booking-sub {
		font-size: 0.85rem;
		color: rgba(255,255,255,0.5);
		letter-spacing: 0.02em;
	}

	.booking-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 16px;
		margin-bottom: 32px;
	}

	.glass-input-wrap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255,255,255,0.5);
	}

	.glass-input {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-radius: 12px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
		color: #fff;
		font-family: inherit;
		font-size: 0.9rem;
		padding: 12px 14px;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
		width: 100%;
		cursor: pointer;
	}
	.glass-input:focus {
		border-color: rgba(245, 192, 96, 0.6);
		box-shadow:
			inset 0 1px 0 rgba(255,255,255,0.25),
			0 0 0 3px rgba(245, 192, 96, 0.12);
	}
	.glass-input option {
		background: #1a3a2a;
		color: #fff;
	}

	/* fix date input color in webkit */
	.glass-input::-webkit-calendar-picker-indicator {
		filter: invert(1) opacity(0.6);
		cursor: pointer;
	}

	.booking-cta {
		display: block;
		width: 100%;
		text-align: center;
		font-size: 0.95rem;
		padding: 16px 36px;
	}

	/* ── Demo footer ─────────────────────────── */
	.demo-footer {
		position: relative;
		z-index: 1;
		padding: 40px 24px 56px;
		display: flex;
		justify-content: center;
	}

	.demo-nav-pill {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 2px;
		justify-content: center;
		padding: 14px 20px;
		border-radius: 100px;
		background: rgba(10, 20, 14, 0.6);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		max-width: 900px;
	}

	.demo-link {
		padding: 6px 14px;
		border-radius: 100px;
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		color: rgba(255,255,255,0.5);
		text-decoration: none;
		transition: color 0.2s, background 0.2s;
	}
	.demo-link:hover {
		color: rgba(255,255,255,0.9);
		background: rgba(255,255,255,0.08);
	}
	.demo-link.demo-active {
		color: #f5c060;
		background: rgba(245, 192, 96, 0.12);
	}

	/* ── Responsive ──────────────────────────── */
	@media (max-width: 700px) {
		.hero-card { padding: 40px 28px; }
		.booking-card { padding: 36px 24px; }
		.booking-inputs { grid-template-columns: 1fr; }
		.rooms-grid { overflow-x: auto; display: flex; padding-bottom: 12px; }
		.room-card { min-width: 280px; flex-shrink: 0; }
		.panels-stage { height: 420px; }
		.panel-card { width: 88%; }
		.nav-links { display: none; }
	}
</style>
