<script>
	import { onMount } from 'svelte';

	let loading = $state(true);
	let progress = $state(0);
	let glitching = $state(false);

	// Stats for count-up
	let statsVisible = $state(false);
	let stat1 = $state(0);
	let stat2 = $state(0);
	let stat3 = $state(0);
	let stat4 = $state(0);

	const STAT_TARGETS = [12, 98, 450, 5];
	const STAT_LABELS = ['ROOMS ONLINE', 'UPTIME %', 'GUESTS LOGGED', 'STAR RATING'];

	function countUp(setter, target, duration = 1800) {
		const steps = 60;
		const increment = target / steps;
		let current = 0;
		let step = 0;
		const timer = setInterval(() => {
			step++;
			current = Math.min(Math.round(increment * step), target);
			setter(current);
			if (step >= steps) clearInterval(timer);
		}, duration / steps);
	}

	onMount(() => {
		// Boot sequence
		const interval = setInterval(() => {
			progress = Math.min(progress + Math.random() * 8 + 2, 100);
			if (progress >= 100) {
				progress = 100;
				clearInterval(interval);
				setTimeout(() => (loading = false), 400);
			}
		}, 90);

		// Glitch toggle
		const glitchTimer = setInterval(() => {
			glitching = true;
			setTimeout(() => (glitching = false), 200);
		}, 3000);

		// Stats observer
		const statsEl = document.querySelector('.stats-section');
		if (statsEl) {
			const observer = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && !statsVisible) {
						statsVisible = true;
						countUp((v) => (stat1 = v), STAT_TARGETS[0]);
						countUp((v) => (stat2 = v), STAT_TARGETS[1]);
						countUp((v) => (stat3 = v), STAT_TARGETS[2]);
						countUp((v) => (stat4 = v), STAT_TARGETS[3]);
						observer.disconnect();
					}
				},
				{ threshold: 0.3 }
			);
			observer.observe(statsEl);
		}

		return () => {
			clearInterval(interval);
			clearInterval(glitchTimer);
		};
	});
</script>

<svelte:head>
	<title>MARIANNE COTTAGE — Retro-Futurism OS v2.0</title>
</svelte:head>

<!-- Boot Screen -->
{#if loading}
	<div class="boot-screen">
		<div class="boot-content">
			<div class="boot-logo">▶ MARIANNE COTTAGE OS</div>
			<div class="boot-version">VERSION 2.0 — NORMANDY NETWORK NODE</div>
			<div class="boot-line">INITIALIZING SYSTEM...</div>
			<div class="boot-line">LOADING MARIANNE COTTAGE OS v2.0</div>
			<div class="boot-line">ESTABLISHING COASTAL CONNECTION... OK</div>
			<div class="boot-line">MOUNTING ROOM DATABASE... OK</div>
			<div class="boot-line blink">READY TO BOOT [{Math.round(progress)}%]</div>
			<div class="progress-track">
				<div class="progress-bar" style="width: {progress}%"></div>
			</div>
		</div>
	</div>
{:else}
	<!-- NAV -->
	<nav class="nav">
		<div class="nav-inner">
			<a href="#hero" class="nav-logo">⬡ MARIANNE.COT</a>
			<div class="nav-links">
				<a href="#rooms" class="nav-btn">ROOMS</a>
				<a href="#stats" class="nav-btn">STATUS</a>
				<a href="#cta" class="nav-btn">BOOK</a>
				<a href="#rooms" class="nav-btn nav-btn--hot">▶ ENTER</a>
			</div>
		</div>
	</nav>

	<!-- HERO -->
	<section class="hero" id="hero">
		<div class="scanlines"></div>
		<div class="hero-inner">
			<div class="hero-geometry">
				<div class="wireframe-square"></div>
				<div class="wireframe-square wire2"></div>
			</div>
			<div class="hero-text">
				<div class="hero-eyebrow">// NORMANDY COASTAL ESCAPE //</div>
				<h1 class="hero-title" class:glitch={glitching}>
					<span class="glitch-layer" aria-hidden="true">MARIANNE COTTAGE</span>
					MARIANNE COTTAGE
					<span class="glitch-layer glitch-layer--2" aria-hidden="true">MARIANNE COTTAGE</span>
				</h1>
				<p class="hero-sub">LUXURY RETREAT SYSTEM — NODE FR-14-NRM</p>
				<a href="#rooms" class="hero-btn">
					<span>▶ ENTER SYSTEM</span>
				</a>
			</div>
		</div>
	</section>

	<!-- TICKER -->
	<div class="ticker-bar">
		<div class="ticker-track">
			<span class="ticker-text">
				★ LUXURY ESCAPE ★ NORMANDY COAST ★ PREMIUM ROOMS ★ BOOK NOW ★ SEA VIEWS ★ GOURMET BREAKFAST
				★ PRIVATE GARDEN ★ ULTRA-FAST WIFI ★ FREE CANCELLATION ★ LUXURY ESCAPE ★ NORMANDY COAST ★
				PREMIUM ROOMS ★ BOOK NOW ★ SEA VIEWS ★ GOURMET BREAKFAST ★ PRIVATE GARDEN ★ ULTRA-FAST WIFI
				★ FREE CANCELLATION ★
			</span>
		</div>
	</div>

	<!-- ROOMS GRID -->
	<section class="rooms-section" id="rooms">
		<div class="section-header">
			<div class="section-tag">// ROOM DATABASE //</div>
			<h2 class="section-title">SELECT ACCOMMODATION NODE</h2>
		</div>
		<div class="rooms-grid">
			{#each [
				{
					id: 'R-001',
					name: 'THE CHROME SUITE',
					sub: 'Superior Double — Sea View',
					specs: ['62 m²', 'King Bed', 'Ocean View', 'Bath+'],
					price: '€ 189 / NIGHT',
					status: 'AVAILABLE'
				},
				{
					id: 'R-002',
					name: 'PIXEL GARDEN ROOM',
					sub: 'Deluxe Double — Garden View',
					specs: ['48 m²', 'Queen Bed', 'Garden View', 'Shower'],
					price: '€ 139 / NIGHT',
					status: 'AVAILABLE'
				},
				{
					id: 'R-003',
					name: 'NEON COTTAGE LOFT',
					sub: 'Loft Suite — Panoramic',
					specs: ['80 m²', 'King+Sofa', 'Panoramic', 'Bath+'],
					price: '€ 229 / NIGHT',
					status: 'LIMITED'
				}
			] as room}
				<div class="room-card">
					<div class="room-card-header">
						<span class="room-id">{room.id}</span>
						<span class="room-status" class:hot={room.status === 'LIMITED'}>{room.status}</span>
					</div>
					<div class="room-img-placeholder">
						<div class="room-img-grid"></div>
						<div class="room-img-label">IMG_LOADING...</div>
					</div>
					<div class="room-body">
						<h3 class="room-name">{room.name}</h3>
						<p class="room-sub">{room.sub}</p>
						<ul class="room-specs">
							{#each room.specs as spec}
								<li>{spec}</li>
							{/each}
						</ul>
						<div class="room-footer">
							<span class="room-price">{room.price}</span>
							<button class="room-btn">SELECT ▶</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- STATS -->
	<section class="stats-section" id="stats">
		<div class="stats-tag">// SYSTEM METRICS //</div>
		<div class="stats-grid">
			{#each [
				{ val: stat1, label: STAT_LABELS[0], unit: '' },
				{ val: stat2, label: STAT_LABELS[1], unit: '%' },
				{ val: stat3, label: STAT_LABELS[2], unit: '+' },
				{ val: stat4, label: STAT_LABELS[3], unit: '★' }
			] as s}
				<div class="stat-card">
					<div class="stat-num">{s.val}{s.unit}</div>
					<div class="stat-label">{s.label}</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- CTA -->
	<section class="cta-section" id="cta">
		<div class="cta-inner">
			<div class="cta-tag">// INITIATE BOOKING SEQUENCE //</div>
			<h2 class="cta-title">READY TO CONNECT?</h2>
			<p class="cta-sub">RESERVE YOUR NODE ON THE NORMANDY NETWORK — INSTANT CONFIRMATION PROTOCOL</p>
			<button class="cta-btn">⬡ INITIATE BOOKING</button>
		</div>
	</section>

	<!-- DEMO NAV FOOTER -->
	<footer class="demo-footer">
		<div class="demo-footer-inner">
			<a href="/demo" class="demo-link">← ALL DEMOS</a>
			<span class="demo-footer-label">|</span>
			<span class="demo-footer-label">DEMOS:</span>
			{#each [
				['brutal', 'brutal'],
				['calm', 'calm'],
				['bento', 'bento'],
				['kinetic', 'kinetic'],
				['adaptive', 'adaptive'],
				['ambient', 'ambient'],
				['context', 'context'],
				['retro', 'retro'],
				['expressive', 'expressive'],
				['spatial', 'spatial'],
				['micro', 'micro'],
				['ergonomic', 'ergonomic'],
				['liquid', 'liquid'],
				['scroll-anim', 'scroll-anim'],
				['morph', 'morph'],
				['handmade', 'handmade'],
				['iridescent', 'iridescent'],
				['dday', 'dday']
			] as [slug, label]}
				<a href="/{slug}" class="demo-link" class:active={slug === 'retro'}>{label}</a>
			{/each}
		</div>
	</footer>
{/if}

<style>
	/* ── Reset & Body ── */
	:global(body) {
		background: #0a0a0f;
		color: #e0e0e8;
		margin: 0;
		font-family: 'Inter', sans-serif;
		overflow-x: hidden;
	}

	/* ── Boot Screen ── */
	.boot-screen {
		position: fixed;
		inset: 0;
		background: #000;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}
	.boot-content {
		width: min(600px, 90vw);
		padding: 2rem;
	}
	.boot-logo {
		font-family: 'Courier New', monospace;
		font-size: clamp(1.2rem, 3vw, 1.8rem);
		color: #39ff14;
		margin-bottom: 0.5rem;
		text-shadow: 0 0 12px #39ff14;
	}
	.boot-version {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #39ff14aa;
		margin-bottom: 1.5rem;
		letter-spacing: 0.1em;
	}
	.boot-line {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #39ff14cc;
		margin-bottom: 0.4rem;
		letter-spacing: 0.05em;
	}
	.blink {
		animation: blink 0.8s step-end infinite;
	}
	@keyframes blink {
		50% { opacity: 0; }
	}
	.progress-track {
		margin-top: 1.5rem;
		height: 8px;
		background: #0f2010;
		border: 1px solid #39ff14;
		border-radius: 0;
		overflow: hidden;
	}
	.progress-bar {
		height: 100%;
		background: linear-gradient(90deg, #39ff14, #00ff88);
		box-shadow: 0 0 10px #39ff14;
		transition: width 0.1s linear;
	}

	/* ── Nav ── */
	.nav {
		position: sticky;
		top: 0;
		z-index: 100;
		background: linear-gradient(180deg, #1a1a24 0%, #0f0f18 100%);
		border-bottom: 1px solid #00e5ff44;
		box-shadow: 0 2px 20px rgba(0, 229, 255, 0.1);
	}
	.nav-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.75rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.nav-logo {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		font-weight: 700;
		color: #00e5ff;
		text-decoration: none;
		text-shadow: 0 0 12px #00e5ff, 0 0 24px #00e5ff;
		letter-spacing: 0.1em;
	}
	.nav-links {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.nav-btn {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #c0c8d0;
		text-decoration: none;
		padding: 0.4rem 0.8rem;
		background: linear-gradient(135deg, #2a2a3a, #1a1a28);
		border: 1px solid #334;
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.08),
			inset -2px -2px 4px rgba(0, 0, 0, 0.5);
		letter-spacing: 0.08em;
		transition:
			color 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}
	.nav-btn:hover {
		color: #ff1f8f;
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.08),
			inset -2px -2px 4px rgba(0, 0, 0, 0.5),
			0 0 12px rgba(255, 31, 143, 0.4);
		border-color: #ff1f8f66;
	}
	.nav-btn--hot {
		color: #00e5ff;
		border-color: #00e5ff66;
		background: linear-gradient(135deg, #0a2030, #061520);
	}
	.nav-btn--hot:hover {
		color: #00e5ff;
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.08),
			inset -2px -2px 4px rgba(0, 0, 0, 0.5),
			0 0 16px rgba(0, 229, 255, 0.5);
	}

	/* ── Hero ── */
	.hero {
		position: relative;
		min-height: 92vh;
		background: linear-gradient(160deg, #08080f 0%, #0d0d1a 50%, #060611 100%);
		display: flex;
		align-items: center;
		overflow: hidden;
	}
	.scanlines {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.06) 2px,
			rgba(0, 0, 0, 0.06) 4px
		);
		pointer-events: none;
		z-index: 2;
	}
	.hero-inner {
		position: relative;
		z-index: 3;
		max-width: 1200px;
		margin: 0 auto;
		padding: 6rem 1.5rem 4rem;
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 3rem;
		width: 100%;
	}
	.hero-geometry {
		position: relative;
		width: 200px;
		height: 200px;
		flex-shrink: 0;
	}
	.wireframe-square {
		position: absolute;
		inset: 0;
		border: 2px solid #00e5ff44;
		animation: rotateWire 8s linear infinite;
		box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
	}
	.wire2 {
		inset: 20px;
		border-color: #ff1f8f33;
		animation: rotateWire 6s linear infinite reverse;
		box-shadow: 0 0 14px rgba(255, 31, 143, 0.15);
	}
	@keyframes rotateWire {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.hero-eyebrow {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #39ff14;
		letter-spacing: 0.2em;
		margin-bottom: 1rem;
		text-shadow: 0 0 8px #39ff14;
	}
	.hero-title {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.5rem, 7vw, 5.5rem);
		font-weight: 900;
		line-height: 1;
		margin: 0 0 1.5rem;
		color: #e8e8f0;
		position: relative;
		display: inline-block;
		text-shadow: 0 0 20px #00e5ff44;
		letter-spacing: -0.02em;
	}
	/* Glitch layers */
	.glitch-layer {
		position: absolute;
		inset: 0;
		color: #00e5ff;
		opacity: 0;
		pointer-events: none;
	}
	.glitch-layer--2 {
		color: #ff1f8f;
	}
	.hero-title.glitch .glitch-layer {
		opacity: 0.8;
		animation: glitchA 0.2s steps(2) forwards;
	}
	.hero-title.glitch .glitch-layer--2 {
		animation: glitchB 0.2s steps(2) forwards;
	}
	@keyframes glitchA {
		0%  { clip-path: inset(20% 0 60% 0); transform: translateX(-4px) skewX(-3deg); }
		33% { clip-path: inset(60% 0 10% 0); transform: translateX(4px) skewX(2deg); }
		66% { clip-path: inset(40% 0 30% 0); transform: translateX(-2px); }
		100%{ clip-path: inset(0% 0 100% 0); opacity: 0; }
	}
	@keyframes glitchB {
		0%  { clip-path: inset(50% 0 20% 0); transform: translateX(6px) skewX(4deg); }
		33% { clip-path: inset(10% 0 70% 0); transform: translateX(-4px); }
		66% { clip-path: inset(70% 0 5% 0);  transform: translateX(2px) skewX(-2deg); }
		100%{ clip-path: inset(0% 0 100% 0); opacity: 0; }
	}
	.hero-sub {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #8090a0;
		letter-spacing: 0.15em;
		margin: 0 0 2.5rem;
	}
	.hero-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		letter-spacing: 0.1em;
		color: #00e5ff;
		text-decoration: none;
		background: linear-gradient(135deg, #0a1f2f, #051018);
		border: 1px solid #00e5ff;
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.1),
			inset -2px -2px 4px rgba(0, 0, 0, 0.6),
			0 0 20px rgba(0, 229, 255, 0.3),
			0 0 40px rgba(0, 229, 255, 0.1);
		transition:
			box-shadow 0.3s,
			transform 0.2s;
	}
	.hero-btn:hover {
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.1),
			inset -2px -2px 4px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(0, 229, 255, 0.6),
			0 0 60px rgba(0, 229, 255, 0.2);
		transform: translateY(-1px);
	}

	/* ── Ticker ── */
	.ticker-bar {
		background: #060608;
		border-top: 1px solid #39ff1444;
		border-bottom: 1px solid #39ff1444;
		padding: 0.6rem 0;
		overflow: hidden;
	}
	.ticker-track {
		display: flex;
		white-space: nowrap;
	}
	.ticker-text {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #39ff14;
		letter-spacing: 0.1em;
		text-shadow: 0 0 8px #39ff14;
		animation: marquee 30s linear infinite;
		display: inline-block;
	}
	@keyframes marquee {
		from { transform: translateX(0); }
		to { transform: translateX(-50%); }
	}

	/* ── Rooms ── */
	.rooms-section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 5rem 1.5rem;
	}
	.section-header {
		margin-bottom: 3rem;
	}
	.section-tag {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #39ff14;
		letter-spacing: 0.2em;
		margin-bottom: 0.75rem;
		text-shadow: 0 0 6px #39ff14;
	}
	.section-title {
		font-family: 'Courier New', monospace;
		font-size: clamp(1.2rem, 3vw, 2rem);
		color: #c0c0c0;
		background: linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0;
		letter-spacing: 0.05em;
	}
	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	.room-card {
		background: linear-gradient(160deg, #12121e, #0c0c16);
		border: 1px solid #2a2a40;
		outline: 1px solid #00e5ff33;
		outline-offset: 4px;
		transition:
			outline-color 0.3s,
			box-shadow 0.3s;
	}
	.room-card:hover {
		outline-color: #00e5ff99;
		box-shadow: 0 0 30px rgba(0, 229, 255, 0.1);
	}
	.room-card-header {
		background: linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0);
		padding: 0.5rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.room-id {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #1a1a2e;
		font-weight: 700;
		letter-spacing: 0.1em;
	}
	.room-status {
		font-family: 'Courier New', monospace;
		font-size: 0.6rem;
		color: #1a3a1a;
		background: #39ff1466;
		padding: 0.1rem 0.4rem;
		letter-spacing: 0.05em;
	}
	.room-status.hot {
		color: #3a0a1a;
		background: #ff1f8f66;
	}
	.room-img-placeholder {
		position: relative;
		height: 160px;
		background: #080810;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.room-img-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(#00e5ff0a 1px, transparent 1px),
			linear-gradient(90deg, #00e5ff0a 1px, transparent 1px);
		background-size: 24px 24px;
	}
	.room-img-label {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #00e5ff44;
		letter-spacing: 0.1em;
		z-index: 1;
	}
	.room-body {
		padding: 1.25rem;
	}
	.room-name {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		color: #00e5ff;
		text-shadow: 0 0 10px #00e5ff, 0 0 20px #00e5ff66;
		margin: 0 0 0.3rem;
		letter-spacing: 0.05em;
	}
	.room-sub {
		font-size: 0.75rem;
		color: #607080;
		margin: 0 0 1rem;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
	}
	.room-specs {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.room-specs li {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #8090a0;
		background: #1a1a28;
		border: 1px solid #334;
		padding: 0.2rem 0.5rem;
		letter-spacing: 0.05em;
	}
	.room-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.room-price {
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: #ff1f8f;
		text-shadow: 0 0 8px #ff1f8f66;
		letter-spacing: 0.05em;
	}
	.room-btn {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #00e5ff;
		background: linear-gradient(135deg, #0a1a28, #051018);
		border: 1px solid #00e5ff66;
		padding: 0.4rem 0.8rem;
		cursor: pointer;
		letter-spacing: 0.1em;
		box-shadow:
			inset 1px 1px 3px rgba(255, 255, 255, 0.08),
			inset -1px -1px 3px rgba(0, 0, 0, 0.5);
		transition:
			box-shadow 0.2s,
			border-color 0.2s;
	}
	.room-btn:hover {
		border-color: #00e5ff;
		box-shadow:
			inset 1px 1px 3px rgba(255, 255, 255, 0.08),
			inset -1px -1px 3px rgba(0, 0, 0, 0.5),
			0 0 12px rgba(0, 229, 255, 0.4);
	}

	/* ── Stats ── */
	.stats-section {
		background: linear-gradient(160deg, #0c0c14, #080810);
		border-top: 1px solid #1a1a2c;
		border-bottom: 1px solid #1a1a2c;
		padding: 5rem 1.5rem;
		text-align: center;
	}
	.stats-tag {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #39ff14;
		letter-spacing: 0.2em;
		margin-bottom: 3rem;
		text-shadow: 0 0 6px #39ff14;
	}
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 2rem;
		max-width: 900px;
		margin: 0 auto;
	}
	.stat-card {
		padding: 2rem 1rem;
		background: linear-gradient(160deg, #10101c, #0a0a12);
		border: 1px solid #00e5ff22;
		box-shadow:
			inset 2px 2px 4px rgba(255, 255, 255, 0.04),
			inset -2px -2px 4px rgba(0, 0, 0, 0.5),
			0 0 20px rgba(0, 229, 255, 0.05);
	}
	.stat-num {
		font-family: 'Courier New', monospace;
		font-size: clamp(2.5rem, 5vw, 4rem);
		font-weight: 700;
		color: #00e5ff;
		text-shadow:
			0 0 20px #00e5ff,
			0 0 40px #00e5ff,
			0 0 80px #00e5ff44;
		line-height: 1;
		margin-bottom: 0.75rem;
	}
	.stat-label {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #506070;
		letter-spacing: 0.15em;
	}

	/* ── CTA ── */
	.cta-section {
		padding: 7rem 1.5rem;
		text-align: center;
		background: radial-gradient(ellipse at center, #0d0d1e 0%, #080808 70%);
		border-top: 1px solid #1a1a2c;
	}
	.cta-inner {
		max-width: 700px;
		margin: 0 auto;
	}
	.cta-tag {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #39ff14;
		letter-spacing: 0.2em;
		margin-bottom: 1.5rem;
		text-shadow: 0 0 6px #39ff14;
	}
	.cta-title {
		font-family: 'Courier New', monospace;
		font-size: clamp(1.8rem, 5vw, 3.5rem);
		color: #c0c0c0;
		background: linear-gradient(135deg, #c0c0c0, #e8e8e8, #a0a0a0);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0 0 1rem;
		letter-spacing: 0.05em;
	}
	.cta-sub {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		color: #506070;
		letter-spacing: 0.1em;
		line-height: 1.8;
		margin: 0 0 3rem;
	}
	.cta-btn {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		letter-spacing: 0.12em;
		color: #e0e0e8;
		background: linear-gradient(135deg, #2a2a3a 0%, #1a1a28 50%, #2a2a3a 100%);
		border: 1px solid #c0c0c066;
		padding: 1.2rem 3rem;
		cursor: pointer;
		box-shadow:
			inset 3px 3px 6px rgba(255, 255, 255, 0.15),
			inset -3px -3px 6px rgba(0, 0, 0, 0.6),
			0 0 0 0 transparent;
		transition:
			box-shadow 0.3s,
			border-color 0.3s;
	}
	.cta-btn:hover {
		border-color: #ff1f8f;
		box-shadow:
			inset 3px 3px 6px rgba(255, 255, 255, 0.15),
			inset -3px -3px 6px rgba(0, 0, 0, 0.6),
			0 0 24px rgba(255, 31, 143, 0.5),
			0 0 48px rgba(255, 31, 143, 0.2);
		color: #ff1f8f;
	}

	/* ── Demo Footer ── */
	.demo-footer {
		background: #050508;
		border-top: 1px solid #1a1a2c;
		padding: 1.25rem 1.5rem;
	}
	.demo-footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		align-items: center;
	}
	.demo-footer-label {
		font-family: 'Courier New', monospace;
		font-size: 0.6rem;
		color: #334;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-right: 0.25rem;
	}
	.demo-link {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		color: #405060;
		text-decoration: none;
		letter-spacing: 0.05em;
		transition: color 0.2s;
		padding: 0.15rem 0.3rem;
	}
	.demo-link:hover {
		color: #00e5ff;
		text-shadow: 0 0 6px #00e5ff;
	}
	.demo-link.active {
		color: #00e5ff;
		text-shadow: 0 0 8px #00e5ff;
	}

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.hero-inner {
			grid-template-columns: 1fr;
			text-align: center;
		}
		.hero-geometry {
			width: 120px;
			height: 120px;
			margin: 0 auto;
			order: -1;
		}
		.nav-links {
			gap: 0.3rem;
		}
		.nav-btn {
			font-size: 0.6rem;
			padding: 0.3rem 0.5rem;
		}
	}
</style>
