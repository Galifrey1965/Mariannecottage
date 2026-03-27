<script lang="ts">
	import { onMount } from 'svelte';

	let guests = $state(2);
	let arrival = $state('2025-06-14');
	let departure = $state('2025-06-21');

	const PRICE_PER_NIGHT = 120;
	const NIGHTS = 7;
	let total = $derived(guests * PRICE_PER_NIGHT * NIGHTS);

	onMount(() => {
		const cells = document.querySelectorAll('.bento-cell');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('entered');
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1 }
		);
		cells.forEach((cell) => observer.observe(cell));
		return () => observer.disconnect();
	});
</script>

<!-- NAV -->
<nav>
	<span class="nav-brand">Marianne Cottage</span>
	<div class="nav-links">
		<a href="/rooms">Rooms</a>
		<span class="sep">·</span>
		<a href="/booking">Book</a>
		<span class="sep">·</span>
		<a href="/contact">Contact</a>
	</div>
</nav>

<!-- HERO BENTO -->
<section class="hero-bento-wrap">
	<div class="hero-grid">
		<!-- hero -->
		<div class="bento-cell cell-hero" style="--delay:0ms">
			<img src="/images/2024-08-15.jpg" alt="Marianne Cottage exterior" />
			<div class="hero-overlay">
				<p class="hero-tagline"><em>A corner of Normandy</em></p>
				<p class="hero-sub">Bed &amp; Breakfast · Est. 2019</p>
			</div>
		</div>

		<!-- weather -->
		<div class="bento-cell cell-weather" style="--delay:60ms">
			<div class="weather-temp">18°C</div>
			<div class="weather-cond">☀ Sunny · Normandy</div>
			<div class="weather-note">Perfect for the garden</div>
		</div>

		<!-- quote -->
		<div class="bento-cell cell-quote" style="--delay:120ms">
			<blockquote>
				<p>"We came for a weekend. We stayed a week."</p>
				<footer>— Sarah, London</footer>
			</blockquote>
		</div>

		<!-- avail -->
		<div class="bento-cell cell-avail" style="--delay:180ms">
			<div class="avail-status">✓ Available</div>
			<div class="avail-dates">Jun 14–21</div>
			<a href="/booking" class="avail-link">Book now →</a>
		</div>

		<!-- room2 -->
		<div class="bento-cell cell-room2" style="--delay:240ms">
			<img src="/images/2024-12-15-(1).jpg" alt="The Garden Room" />
			<div class="room2-overlay">The Garden Room · €120/night</div>
		</div>

		<!-- rooms -->
		<div class="bento-cell cell-rooms" style="--delay:300ms">
			<img src="/images/2024-12-15.jpg" alt="Rooms overview" />
			<div class="rooms-overlay">
				<span class="rooms-big"><em>3 Rooms</em></span>
			</div>
		</div>

		<!-- dates -->
		<div class="bento-cell cell-dates" style="--delay:360ms">
			<div class="dates-month">Jun</div>
			<div class="dates-range">14–21</div>
			<div class="dates-sub">7 nights · 2 guests</div>
		</div>

		<!-- guests -->
		<div class="bento-cell cell-guests" style="--delay:420ms">
			<div class="guests-num">{guests}</div>
			<div class="guests-label">guests</div>
			<div class="guests-controls">
				<button class="stepper-btn" onclick={() => (guests = Math.max(1, guests - 1))} aria-label="Remove guest">−</button>
				<button class="stepper-btn" onclick={() => (guests = Math.min(8, guests + 1))} aria-label="Add guest">+</button>
			</div>
		</div>

		<!-- map -->
		<div class="bento-cell cell-map" style="--delay:480ms">
			<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg" class="map-svg">
				<!-- outer ring -->
				<circle cx="100" cy="90" r="70" fill="none" stroke="#6B8F71" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
				<circle cx="100" cy="90" r="40" fill="none" stroke="#6B8F71" stroke-width="1" stroke-dasharray="4 4" opacity="0.3"/>
				<!-- MC dot -->
				<circle cx="100" cy="90" r="6" fill="#D4694A"/>
				<text x="108" y="87" font-family="Georgia,serif" font-size="10" fill="#2A2A28" font-weight="bold">MC</text>
				<!-- Bayeux -->
				<line x1="100" y1="90" x2="60" y2="70" stroke="#2A2A28" stroke-width="0.8" opacity="0.4"/>
				<circle cx="60" cy="70" r="3" fill="#6B8F71"/>
				<text x="26" y="66" font-family="system-ui,sans-serif" font-size="9" fill="#2A2A28">Bayeux 8km</text>
				<!-- Omaha -->
				<line x1="100" y1="90" x2="55" y2="32" stroke="#2A2A28" stroke-width="0.8" opacity="0.4"/>
				<circle cx="55" cy="32" r="3" fill="#6B8F71"/>
				<text x="20" y="28" font-family="system-ui,sans-serif" font-size="9" fill="#2A2A28">Omaha 30km</text>
				<!-- Caen -->
				<line x1="100" y1="90" x2="158" y2="60" stroke="#2A2A28" stroke-width="0.8" opacity="0.4"/>
				<circle cx="158" cy="60" r="3" fill="#6B8F71"/>
				<text x="143" y="50" font-family="system-ui,sans-serif" font-size="9" fill="#2A2A28">Caen 40km</text>
				<!-- compass rose -->
				<text x="94" y="170" font-family="system-ui,sans-serif" font-size="8" fill="#2A2A28" opacity="0.5">N ↑</text>
			</svg>
		</div>

		<!-- fact1 -->
		<div class="bento-cell cell-fact1" style="--delay:540ms">
			<div class="fact-big">30 MIN</div>
			<div class="fact-small">to Omaha Beach</div>
		</div>

		<!-- fact2 -->
		<div class="bento-cell cell-fact2" style="--delay:600ms">
			<div class="fact-big dark">2 HA</div>
			<div class="fact-small dark">of grounds</div>
		</div>

		<!-- fact3 -->
		<div class="bento-cell cell-fact3" style="--delay:660ms">
			<div class="fact-big">★ 4.9</div>
			<div class="fact-small">Guest rating</div>
		</div>
	</div>
</section>

<!-- ROOMS SECTION -->
<section class="section-rooms">
	<h2 class="section-heading">OUR ROOMS</h2>
	<div class="rooms-grid">
		<div class="bento-cell room-card room-cream" style="--delay:0ms">
			<div class="room-num">01</div>
			<div class="room-body">
				<h3>The Garden Room</h3>
				<p>Overlooking the walled garden, light-filled mornings.</p>
				<span class="room-price">From €120</span>
			</div>
			<div class="room-bg-img">
				<img src="/images/2024-12-15.jpg" alt="The Garden Room" />
			</div>
		</div>
		<div class="bento-cell room-card room-sage" style="--delay:80ms">
			<div class="room-num">02</div>
			<div class="room-body">
				<h3>The Orchard Suite</h3>
				<p>Spacious suite with views of the old apple orchard.</p>
				<span class="room-price">From €140</span>
			</div>
			<div class="room-bg-img">
				<img src="/images/2024-12-15-(2).jpg" alt="The Orchard Suite" />
			</div>
		</div>
		<div class="bento-cell room-card room-dark" style="--delay:160ms">
			<div class="room-num">03</div>
			<div class="room-body">
				<h3>The Stone Room</h3>
				<p>Exposed Norman stone walls, cosy and quiet.</p>
				<span class="room-price">From €130</span>
			</div>
			<div class="room-bg-img">
				<img src="/images/2024-12-15-(3).jpg" alt="The Stone Room" />
			</div>
		</div>
	</div>
</section>

<!-- BOOKING SECTION -->
<section class="section-booking">
	<h2 class="section-heading">RESERVE YOUR STAY</h2>
	<div class="booking-grid">
		<div class="bento-cell booking-when" style="--delay:0ms">
			<div class="booking-label">When?</div>
			<div class="booking-fields">
				<label>
					<span>Arrival</span>
					<input type="date" bind:value={arrival} />
				</label>
				<label>
					<span>Departure</span>
					<input type="date" bind:value={departure} />
				</label>
			</div>
		</div>
		<div class="bento-cell booking-summary" style="--delay:80ms">
			<div class="summary-row">
				<span>Guests</span>
				<div class="summary-stepper">
					<button class="stepper-btn" onclick={() => (guests = Math.max(1, guests - 1))} aria-label="Remove guest">−</button>
					<span class="summary-guests">{guests}</span>
					<button class="stepper-btn" onclick={() => (guests = Math.min(8, guests + 1))} aria-label="Add guest">+</button>
				</div>
			</div>
			<div class="summary-row">
				<span>Duration</span>
				<span>{NIGHTS} nights</span>
			</div>
			<div class="summary-row summary-total">
				<span>Total</span>
				<span>€{total.toLocaleString()}</span>
			</div>
			<a href="/booking" class="book-btn">BOOK NOW</a>
		</div>
	</div>
</section>

<!-- FOOTER -->
<footer class="site-footer">
	<p class="footer-title">MARIANNE COTTAGE · NORMANDY · FRANCE</p>
	<div class="footer-demos">
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
		<a href="/kinetic">/kinetic</a>
		<span>·</span>
		<a href="/scroll-anim">/scroll-anim</a>
		<span>·</span>
		<a href="/morph">/morph</a>
		<span>·</span>
		<a href="/handmade">/handmade</a>
		<span>·</span>
		<a href="/iridescent">/iridescent</a>
	</div>
	<p class="footer-demo-tag">Demo #44</p>
</footer>

<style>
	/* ── Reset & base ─────────────────────────────────── */
	*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

	/* ── Nav ─────────────────────────────────────────── */
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #2A2A28;
		padding: 0 24px;
		height: 52px;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.nav-brand {
		color: #fff;
		font-family: Georgia, serif;
		font-size: 0.85rem;
		font-variant: small-caps;
		letter-spacing: 0.1em;
		text-transform: lowercase;
	}
	.nav-links {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.nav-links a {
		color: #fff;
		opacity: 0.6;
		text-decoration: none;
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		transition: opacity 0.2s;
	}
	.nav-links a:hover { opacity: 1; }
	.sep { color: #fff; opacity: 0.3; font-size: 0.8rem; }

	/* ── Bento cell base ─────────────────────────────── */
	.bento-cell {
		border-radius: 16px;
		overflow: hidden;
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity 0.45s ease calc(var(--delay, 0ms)),
			transform 0.45s ease calc(var(--delay, 0ms)),
			box-shadow 0.2s ease;
	}
	.bento-cell.entered {
		opacity: 1;
		transform: scale(1);
	}
	.bento-cell:hover {
		transform: scale(1.02);
		box-shadow: 0 12px 40px rgba(42,42,40,0.22);
		z-index: 10;
		position: relative;
	}

	/* ── Hero grid ───────────────────────────────────── */
	.hero-bento-wrap {
		background: #F5F0E8;
		padding: 12px;
	}
	.hero-grid {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		grid-template-rows: repeat(6, calc((100svh - 52px - 24px) / 6));
		gap: 12px;
		grid-template-areas:
			"hero hero hero hero hero hero hero hero weather weather weather weather"
			"hero hero hero hero hero hero hero hero quote   quote   quote   quote"
			"hero hero hero hero hero hero hero hero avail   avail   room2   room2"
			"rooms rooms rooms rooms dates dates dates dates avail   avail   room2   room2"
			"rooms rooms rooms rooms dates dates dates dates guests  guests  map     map"
			"fact1 fact1 fact1 fact2 fact2 fact2 fact3 fact3 fact3   guests  map     map";
	}

	/* hero cell */
	.cell-hero {
		grid-area: hero;
		position: relative;
	}
	.cell-hero img {
		width: 100%; height: 100%;
		object-fit: cover;
		display: block;
	}
	.hero-overlay {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		background: linear-gradient(transparent, rgba(42,42,40,0.7));
		padding: 32px 24px 20px;
	}
	.hero-tagline {
		font-family: Georgia, serif;
		font-size: clamp(1.2rem, 2vw, 1.6rem);
		color: #fff;
		margin-bottom: 4px;
	}
	.hero-sub {
		font-family: system-ui, sans-serif;
		font-size: 0.75rem;
		color: rgba(255,255,255,0.75);
		letter-spacing: 0.05em;
	}

	/* weather */
	.cell-weather {
		grid-area: weather;
		background: #6B8F71;
		color: #fff;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 20px 24px;
	}
	.weather-temp {
		font-family: Georgia, serif;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
		font-weight: normal;
		line-height: 1;
	}
	.weather-cond {
		font-family: system-ui, sans-serif;
		font-size: 0.85rem;
		margin-top: 6px;
		opacity: 0.9;
	}
	.weather-note {
		font-family: system-ui, sans-serif;
		font-size: 0.75rem;
		margin-top: 4px;
		opacity: 0.65;
	}

	/* quote */
	.cell-quote {
		grid-area: quote;
		background: #F5F0E8;
		display: flex;
		align-items: center;
		padding: 20px 24px;
	}
	.cell-quote blockquote p {
		font-family: Georgia, serif;
		font-style: italic;
		font-size: clamp(0.85rem, 1.2vw, 1rem);
		color: #2A2A28;
		line-height: 1.5;
	}
	.cell-quote blockquote footer {
		font-family: system-ui, sans-serif;
		font-size: 0.72rem;
		color: #6B8F71;
		margin-top: 8px;
	}

	/* avail */
	.cell-avail {
		grid-area: avail;
		background: #2A2A28;
		color: #fff;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 20px 24px;
		gap: 8px;
	}
	.avail-status {
		font-family: Georgia, serif;
		font-size: clamp(1rem, 1.5vw, 1.3rem);
		color: #6B8F71;
	}
	.avail-dates {
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		opacity: 0.7;
	}
	.avail-link {
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		color: #C4A265;
		text-decoration: none;
		font-weight: 500;
	}
	.avail-link:hover { text-decoration: underline; }

	/* room2 */
	.cell-room2 {
		grid-area: room2;
		position: relative;
	}
	.cell-room2 img {
		width: 100%; height: 100%;
		object-fit: cover;
		display: block;
	}
	.room2-overlay {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		background: linear-gradient(transparent, rgba(42,42,40,0.75));
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 0.75rem;
		padding: 20px 14px 10px;
	}

	/* rooms */
	.cell-rooms {
		grid-area: rooms;
		position: relative;
	}
	.cell-rooms img {
		width: 100%; height: 100%;
		object-fit: cover;
		display: block;
	}
	.rooms-overlay {
		position: absolute;
		top: 0; left: 0;
		padding: 16px 20px;
	}
	.rooms-big {
		font-family: Georgia, serif;
		font-size: clamp(1.4rem, 2.5vw, 2rem);
		color: #fff;
		text-shadow: 0 2px 12px rgba(0,0,0,0.4);
	}

	/* dates */
	.cell-dates {
		grid-area: dates;
		background: #C4A265;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #2A2A28;
		gap: 2px;
	}
	.dates-month {
		font-family: Georgia, serif;
		font-size: clamp(1rem, 1.8vw, 1.4rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}
	.dates-range {
		font-family: Georgia, serif;
		font-size: clamp(2rem, 4vw, 3.5rem);
		line-height: 1;
		font-weight: normal;
	}
	.dates-sub {
		font-family: system-ui, sans-serif;
		font-size: 0.72rem;
		opacity: 0.7;
		margin-top: 4px;
	}

	/* guests */
	.cell-guests {
		grid-area: guests;
		background: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #2A2A28;
		gap: 4px;
	}
	.guests-num {
		font-family: Georgia, serif;
		font-size: clamp(3rem, 5vw, 5rem);
		line-height: 1;
		font-weight: normal;
	}
	.guests-label {
		font-family: system-ui, sans-serif;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.5;
	}
	.guests-controls {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}
	.stepper-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1.5px solid #2A2A28;
		background: transparent;
		color: #2A2A28;
		font-size: 1.1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
		line-height: 1;
	}
	.stepper-btn:hover {
		background: #2A2A28;
		color: #fff;
	}

	/* map */
	.cell-map {
		grid-area: map;
		background: #F5F0E8;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px;
	}
	.map-svg {
		width: 100%;
		height: 100%;
		max-height: 180px;
	}

	/* facts */
	.cell-fact1 {
		grid-area: fact1;
		background: #D4694A;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.cell-fact2 {
		grid-area: fact2;
		background: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.cell-fact3 {
		grid-area: fact3;
		background: #6B8F71;
		color: #fff;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.fact-big {
		font-family: Georgia, serif;
		font-size: clamp(1.4rem, 2.5vw, 2.2rem);
		font-weight: normal;
		line-height: 1;
	}
	.fact-big.dark { color: #2A2A28; }
	.fact-small {
		font-family: system-ui, sans-serif;
		font-size: 0.72rem;
		opacity: 0.8;
		text-align: center;
		letter-spacing: 0.03em;
	}
	.fact-small.dark { color: #2A2A28; }

	/* ── Rooms section ───────────────────────────────── */
	.section-rooms {
		background: #F5F0E8;
		padding: 48px 12px 24px;
	}
	.section-heading {
		font-family: system-ui, sans-serif;
		font-size: 0.72rem;
		letter-spacing: 0.2em;
		color: #2A2A28;
		opacity: 0.5;
		margin-bottom: 16px;
		padding: 0 4px;
	}
	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
	.room-card {
		position: relative;
		min-height: 260px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
	}
	.room-cream { background: #F5F0E8; }
	.room-sage  { background: #6B8F71; }
	.room-dark  { background: #2A2A28; }
	.room-num {
		position: absolute;
		top: 20px;
		left: 24px;
		font-family: Georgia, serif;
		font-size: 3rem;
		line-height: 1;
		font-weight: normal;
		opacity: 0.12;
	}
	.room-sage .room-num,
	.room-dark .room-num { color: #fff; opacity: 0.15; }
	.room-body {
		position: relative;
		z-index: 1;
	}
	.room-body h3 {
		font-family: Georgia, serif;
		font-size: 1.1rem;
		font-weight: normal;
		color: #2A2A28;
		margin-bottom: 6px;
	}
	.room-sage .room-body h3,
	.room-dark .room-body h3 { color: #fff; }
	.room-body p {
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		color: #2A2A28;
		opacity: 0.65;
		line-height: 1.4;
		margin-bottom: 12px;
	}
	.room-sage .room-body p,
	.room-dark .room-body p { color: #fff; opacity: 0.7; }
	.room-price {
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		font-weight: 600;
		color: #C4A265;
		letter-spacing: 0.02em;
	}
	.room-dark .room-price { color: #C4A265; }
	.room-bg-img {
		position: absolute;
		inset: 0;
		z-index: 0;
		border-radius: 16px;
		overflow: hidden;
	}
	.room-bg-img img {
		width: 100%; height: 100%;
		object-fit: cover;
		opacity: 0.15;
		display: block;
	}

	/* ── Booking section ─────────────────────────────── */
	.section-booking {
		background: #F5F0E8;
		padding: 24px 12px 48px;
	}
	.booking-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	.booking-when {
		background: #2A2A28;
		color: #fff;
		padding: 32px 32px;
	}
	.booking-label {
		font-family: Georgia, serif;
		font-size: clamp(1.8rem, 3vw, 2.5rem);
		color: #fff;
		font-weight: normal;
		margin-bottom: 24px;
	}
	.booking-fields {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.booking-fields label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.booking-fields label span {
		font-family: system-ui, sans-serif;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.5;
	}
	.booking-fields input[type="date"] {
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(255,255,255,0.3);
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 1rem;
		padding: 8px 0;
		outline: none;
		cursor: pointer;
		width: 100%;
		color-scheme: dark;
	}
	.booking-fields input[type="date"]:focus {
		border-bottom-color: #C4A265;
	}
	.booking-summary {
		background: #6B8F71;
		color: #fff;
		padding: 32px 32px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		justify-content: center;
	}
	.summary-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: system-ui, sans-serif;
		font-size: 0.9rem;
	}
	.summary-row span:first-child { opacity: 0.7; }
	.summary-stepper {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.summary-stepper .stepper-btn {
		border-color: rgba(255,255,255,0.6);
		color: #fff;
	}
	.summary-stepper .stepper-btn:hover {
		background: rgba(255,255,255,0.2);
		color: #fff;
	}
	.summary-guests {
		font-family: Georgia, serif;
		font-size: 1.2rem;
		min-width: 24px;
		text-align: center;
	}
	.summary-total {
		border-top: 1px solid rgba(255,255,255,0.2);
		padding-top: 16px;
		margin-top: 4px;
	}
	.summary-total span:last-child {
		font-family: Georgia, serif;
		font-size: 1.4rem;
	}
	.book-btn {
		display: block;
		background: #fff;
		color: #2A2A28;
		text-align: center;
		text-decoration: none;
		font-family: system-ui, sans-serif;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		padding: 16px;
		border-radius: 8px;
		margin-top: 8px;
		transition: background 0.2s, color 0.2s;
	}
	.book-btn:hover {
		background: #2A2A28;
		color: #fff;
	}

	/* ── Footer ──────────────────────────────────────── */
	.site-footer {
		background: #2A2A28;
		color: rgba(255,255,255,0.5);
		text-align: center;
		padding: 40px 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.footer-title {
		font-family: system-ui, sans-serif;
		font-size: 0.72rem;
		letter-spacing: 0.2em;
		color: rgba(255,255,255,0.7);
	}
	.footer-demos {
		display: flex;
		gap: 8px;
		justify-content: center;
		flex-wrap: wrap;
	}
	.footer-demos a {
		color: rgba(255,255,255,0.4);
		text-decoration: none;
		font-family: system-ui, sans-serif;
		font-size: 0.75rem;
		transition: color 0.2s;
	}
	.footer-demos a:hover { color: #C4A265; }
	.footer-demos span { color: rgba(255,255,255,0.2); font-size: 0.75rem; }
	.footer-demo-tag {
		font-family: system-ui, sans-serif;
		font-size: 0.7rem;
		color: rgba(255,255,255,0.25);
	}

	/* ── Mobile ──────────────────────────────────────── */
	@media (max-width: 768px) {
		.hero-grid {
			grid-template-columns: 1fr 1fr;
			grid-template-rows: 40vh repeat(5, auto);
			gap: 8px;
			grid-template-areas:
				"hero    hero"
				"weather quote"
				"avail   avail"
				"rooms   dates"
				"fact1   fact2"
				"fact3   guests"
				"room2   map";
			/* hide nothing, just reorder */
		}
		.hero-grid { height: auto; }

		.cell-hero { min-height: 40vh; }
		.cell-weather, .cell-quote { min-height: 120px; }
		.cell-avail  { min-height: 100px; }
		.cell-rooms, .cell-dates { min-height: 140px; }
		.cell-fact1, .cell-fact2, .cell-fact3 { min-height: 100px; }
		.cell-guests { min-height: 120px; }
		.cell-room2, .cell-map { min-height: 140px; }

		.rooms-grid { grid-template-columns: 1fr; }
		.room-card { min-height: 200px; }

		.booking-grid { grid-template-columns: 1fr; }
		.booking-when, .booking-summary { padding: 24px; }

		.hero-grid {
			grid-template-rows: 40vh auto auto auto auto auto auto;
		}
	}
</style>
