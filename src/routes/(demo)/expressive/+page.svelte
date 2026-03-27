<script>
	import { onMount } from 'svelte';

	// ── Segmented control ──────────────────────────────────────────────
	let activeTab = $state(0);
	const tabs = ['Rooms', 'Gallery', 'Explore'];

	// ── Form state ────────────────────────────────────────────────────
	let checkIn = $state('');
	let checkOut = $state('');
	let guests = $state('');

	// ── FAB press state ───────────────────────────────────────────────
	let fabPressed = $state(false);

	// ── Room card hover ───────────────────────────────────────────────
	let hoveredCard = $state(-1);

	// ── Scroll-reveal ─────────────────────────────────────────────────
	onMount(() => {
		const els = document.querySelectorAll('.reveal');
		const io = new IntersectionObserver(
			(entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
			{ threshold: 0.08 }
		);
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	});

	// ── Pill indicator offset ─────────────────────────────────────────
	let pillLeft = $derived(activeTab * (100 / tabs.length) + '%');

	// ── Rooms data ────────────────────────────────────────────────────
	const rooms = [
		{
			name: 'La Suite Jardin',
			img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
			desc: 'Garden views, exposed stone walls, and a claw-foot tub beneath a skylight.',
			tags: ['King bed', 'Garden view', 'Ensuite'],
			color: 'hsl(130,22%,55%)'
		},
		{
			name: 'La Chambre Dorée',
			img: 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80',
			desc: 'Golden afternoon light floods through south-facing French windows.',
			tags: ['Queen bed', 'Courtyard', 'Balcony'],
			color: 'hsl(25,40%,55%)'
		},
		{
			name: 'L\'Atelier Bleu',
			img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80',
			desc: 'A converted artist\'s studio with vaulted ceiling and original oak beams.',
			tags: ['Twin or King', 'Loft', 'Studio'],
			color: 'hsl(220,30%,55%)'
		}
	];

	// ── Gallery images ─────────────────────────────────────────────────
	const gallery = [
		'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70',
		'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=70',
		'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=70',
		'https://images.unsplash.com/photo-1510784722466-f2aa240a2c66?w=400&q=70',
		'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&q=70',
		'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=70'
	];

	// ── Explore POIs ───────────────────────────────────────────────────
	const pois = [
		{ icon: '🌿', label: 'Herb garden walk', dist: '50 m' },
		{ icon: '🏰', label: 'Château de Balleroy', dist: '3.2 km' },
		{ icon: '🍎', label: 'Farmers\' market', dist: '1.1 km' },
		{ icon: '🚴', label: 'Véloscénie trail', dist: '0.4 km' }
	];

	const demos = [
		'brutal','calm','bento','kinetic','adaptive',
		'ambient','context','retro','expressive',
		'spatial','micro','ergonomic','liquid',
		'scroll-anim','morph','handmade','iridescent','dday'
	];
</script>

<svelte:head>
	<title>Marianne Cottage — Material Expressive</title>
</svelte:head>

<!-- ══════════════════════════════════════════════════════════════
     HERO
═══════════════════════════════════════════════════════════════ -->
<section class="hero">
	<div class="hero-bg-layer"></div>
	<div class="hero-content">
		<p class="hero-eyebrow">Material Expressive · M3+</p>
		<h1 class="display-large">Where comfort<br/><em>meets character</em></h1>
		<p class="hero-sub">
			Bold, joyful, personality-driven — Marianne Cottage, Normandy.
		</p>
		<a href="#book" class="btn-filled hero-cta">Explore rooms</a>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════
     COLOR PALETTE STRIP
═══════════════════════════════════════════════════════════════ -->
<section class="section reveal" id="palette">
	<h2 class="section-label">Tonal Palette</h2>
	<div class="palette-strip">
		<div class="swatch swatch-primary">
			<span class="swatch-name">Primary</span>
			<code class="swatch-code">hsl(130 22% 55%)</code>
		</div>
		<div class="swatch swatch-primary-container">
			<span class="swatch-name">Primary Container</span>
			<code class="swatch-code">hsl(130 30% 88%)</code>
		</div>
		<div class="swatch swatch-secondary">
			<span class="swatch-name">Secondary</span>
			<code class="swatch-code">hsl(25 40% 55%)</code>
		</div>
		<div class="swatch swatch-surface-variant">
			<span class="swatch-name">Surface Variant</span>
			<code class="swatch-code">hsl(130 12% 92%)</code>
		</div>
		<div class="swatch swatch-error">
			<span class="swatch-name">Error</span>
			<code class="swatch-code">hsl(0 72% 51%)</code>
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════
     SEGMENTED CONTROL + TAB CONTENT
═══════════════════════════════════════════════════════════════ -->
<section class="section reveal" id="tabs">
	<div class="segment-wrap">
		<div class="segment-track">
			<div
				class="segment-pill"
				style="width:{100/tabs.length}%; left:{pillLeft}"
			></div>
			{#each tabs as tab, i}
				<button
					class="segment-btn"
					class:active={activeTab === i}
					onclick={() => (activeTab = i)}
				>
					{tab}
				</button>
			{/each}
		</div>
	</div>

	<!-- TAB: Rooms -->
	{#if activeTab === 0}
		<div class="cards-grid">
			{#each rooms as room, i}
				<article
					class="room-card"
					class:hovered={hoveredCard === i}
					onmouseenter={() => (hoveredCard = i)}
					onmouseleave={() => (hoveredCard = -1)}
					style="--accent:{room.color}"
				>
					<div class="card-img-wrap">
						<img src={room.img} alt={room.name} loading="lazy" />
					</div>
					<div class="card-body">
						<h3 class="display-medium card-name">{room.name}</h3>
						<p class="body-large card-desc">{room.desc}</p>
						<div class="chip-row">
							{#each room.tags as tag}
								<span class="chip">{tag}</span>
							{/each}
						</div>
						<button class="btn-filled card-btn" style="background:{room.color}">
							View room
						</button>
					</div>
					<div class="card-state-layer"></div>
				</article>
			{/each}
		</div>
	{/if}

	<!-- TAB: Gallery -->
	{#if activeTab === 1}
		<div class="gallery-grid">
			{#each gallery as src, i}
				<div class="gallery-item" style="--i:{i}">
					<img src={src} alt="Gallery {i + 1}" loading="lazy" />
				</div>
			{/each}
		</div>
	{/if}

	<!-- TAB: Explore -->
	{#if activeTab === 2}
		<div class="explore-list">
			{#each pois as poi}
				<div class="poi-card">
					<span class="poi-icon">{poi.icon}</span>
					<div class="poi-info">
						<span class="poi-label">{poi.label}</span>
						<span class="poi-dist">{poi.dist}</span>
					</div>
					<button class="btn-tonal poi-btn">Directions</button>
				</div>
			{/each}
		</div>
	{/if}
</section>

<!-- ══════════════════════════════════════════════════════════════
     M3 FORM
═══════════════════════════════════════════════════════════════ -->
<section class="section reveal" id="book">
	<h2 class="section-label">Book your stay</h2>
	<div class="form-surface">
		<div class="form-row">
			<!-- Outlined: check-in -->
			<div class="field-outlined">
				<input
					id="checkin"
					type="date"
					bind:value={checkIn}
					placeholder=" "
					class="field-input"
				/>
				<label for="checkin" class="field-label">Check-in</label>
				<fieldset class="field-border" aria-hidden="true">
					<legend class="field-legend"><span>Check-in</span></legend>
				</fieldset>
			</div>

			<!-- Outlined: check-out -->
			<div class="field-outlined">
				<input
					id="checkout"
					type="date"
					bind:value={checkOut}
					placeholder=" "
					class="field-input"
				/>
				<label for="checkout" class="field-label">Check-out</label>
				<fieldset class="field-border" aria-hidden="true">
					<legend class="field-legend"><span>Check-out</span></legend>
				</fieldset>
			</div>
		</div>

		<!-- Filled: guests -->
		<div class="field-filled">
			<input
				id="guests"
				type="number"
				min="1"
				max="8"
				bind:value={guests}
				placeholder=" "
				class="field-input"
			/>
			<label for="guests" class="field-label-filled">Number of guests</label>
			<div class="field-active-indicator"></div>
		</div>

		<button class="btn-filled form-submit">Check availability</button>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════
     SHAPE SHOWCASE — expressiveness in radius
═══════════════════════════════════════════════════════════════ -->
<section class="section reveal" id="shapes">
	<h2 class="section-label">Shape Expressiveness</h2>
	<div class="shapes-row">
		<div class="shape shape-sharp"><span>Sharp 4px</span></div>
		<div class="shape shape-small"><span>Small 8px</span></div>
		<div class="shape shape-medium"><span>Medium 16px</span></div>
		<div class="shape shape-large"><span>Large 28px</span></div>
		<div class="shape shape-extra"><span>Extra 36px</span></div>
		<div class="shape shape-full"><span>Full pill</span></div>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════
     STICKY EXTENDED FAB
═══════════════════════════════════════════════════════════════ -->
<button
	class="fab-extended"
	class:fab-pressed={fabPressed}
	onmousedown={() => (fabPressed = true)}
	onmouseup={() => (fabPressed = false)}
	onmouseleave={() => (fabPressed = false)}
	aria-label="Plan your escape"
>
	<span class="fab-icon">✦</span>
	<span class="fab-label">Plan your escape</span>
	<div class="fab-state-layer"></div>
</button>

<a href="/demo" class="demo-home-btn" title="Back to demo home">
	<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
	<span>Demo home</span>
</a>

<style>
	/* ── CSS custom properties (M3 tonal palette) ───────────────── */
	:root {
		--md-primary:            hsl(130, 22%, 55%);
		--md-on-primary:         #ffffff;
		--md-primary-container:  hsl(130, 30%, 88%);
		--md-on-primary-cont:    hsl(130, 40%, 18%);
		--md-secondary:          hsl(25, 40%, 55%);
		--md-on-secondary:       #ffffff;
		--md-sec-container:      hsl(25, 50%, 90%);
		--md-surface:            #fef7ff;
		--md-surface-variant:    hsl(130, 12%, 92%);
		--md-on-surface:         #1c1b1e;
		--md-outline:            hsl(130, 8%, 60%);
		--md-outline-variant:    hsl(130, 10%, 82%);
		--md-error:              hsl(0, 72%, 51%);
		--md-error-container:    hsl(0, 100%, 90%);
		--spring:                cubic-bezier(0.34, 1.56, 0.64, 1);
		--ease-std:              cubic-bezier(0.2, 0, 0, 1);
	}

	/* ── Global resets (scoped) ─────────────────────────────────── */
	* {
		box-sizing: border-box;
	}

	/* ── Typography helpers ──────────────────────────────────────── */
	.display-large {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(3rem, 8vw, 6rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}
	.display-medium {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1.5rem, 3.5vw, 2.5rem);
		font-weight: 600;
		line-height: 1.15;
	}
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--md-primary);
		margin-bottom: 1.5rem;
	}
	.body-large {
		font-size: 1rem;
		line-height: 1.6;
		color: hsl(0,0%,35%);
	}

	/* ── HERO ────────────────────────────────────────────────────── */
	.hero {
		position: relative;
		min-height: 100svh;
		display: flex;
		align-items: center;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			hsl(130, 28%, 28%) 0%,
			hsl(130, 22%, 44%) 50%,
			hsl(150, 20%, 52%) 100%
		);
		color: #fff;
		padding: 6rem 2rem 8rem;
	}
	.hero-bg-layer {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 60% 80% at 75% 40%, hsl(130,30%,60%,0.35) 0%, transparent 70%),
			radial-gradient(ellipse 40% 60% at 20% 70%, hsl(25,40%,55%,0.2) 0%, transparent 60%);
		pointer-events: none;
	}
	.hero-content {
		position: relative;
		max-width: 900px;
		margin: 0 auto;
		z-index: 1;
	}
	.hero-eyebrow {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		opacity: 0.75;
		margin-bottom: 1.25rem;
	}
	.hero .display-large em {
		font-style: italic;
		color: hsl(130, 60%, 80%);
	}
	.hero-sub {
		font-size: 1.125rem;
		opacity: 0.85;
		margin-top: 1.5rem;
		max-width: 480px;
		line-height: 1.6;
	}
	.hero-cta {
		margin-top: 2.5rem;
		display: inline-flex;
		background: #fff;
		color: hsl(130, 40%, 28%);
		font-size: 1rem;
	}
	.hero-cta:hover {
		background: hsl(130,30%,92%);
	}

	/* ── Sections ────────────────────────────────────────────────── */
	.section {
		max-width: 1100px;
		margin: 0 auto;
		padding: 5rem 2rem;
	}
	#shapes {
	}

	/* ── Scroll reveal ───────────────────────────────────────────── */
	.reveal {
		opacity: 0;
		transform: translateY(32px);
		transition: opacity 0.6s var(--ease-std), transform 0.6s var(--ease-std);
	}
	.reveal.visible {
		opacity: 1;
		transform: none;
	}

	/* ── PALETTE STRIP ───────────────────────────────────────────── */
	.palette-strip {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.swatch {
		flex: 1 1 140px;
		min-height: 100px;
		border-radius: 16px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 0.25rem;
	}
	.swatch-primary         { background: var(--md-primary); color: var(--md-on-primary); }
	.swatch-primary-container { background: var(--md-primary-container); color: var(--md-on-primary-cont); }
	.swatch-secondary       { background: var(--md-secondary); color: var(--md-on-secondary); }
	.swatch-surface-variant { background: var(--md-surface-variant); color: var(--md-on-surface); }
	.swatch-error           { background: var(--md-error); color: #fff; }

	.swatch-name {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.swatch-code {
		font-size: 0.65rem;
		font-family: 'JetBrains Mono', 'Fira Mono', monospace;
		opacity: 0.7;
	}

	/* ── SEGMENTED CONTROL ───────────────────────────────────────── */
	.segment-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: 3rem;
	}
	.segment-track {
		position: relative;
		display: flex;
		background: var(--md-surface-variant);
		border-radius: 9999px;
		padding: 4px;
		width: 360px;
		max-width: 100%;
	}
	.segment-pill {
		position: absolute;
		top: 4px;
		bottom: 4px;
		width: calc(100% / 3);
		background: var(--md-primary);
		border-radius: 9999px;
		transition: left 0.3s var(--spring);
		z-index: 0;
	}
	.segment-btn {
		flex: 1;
		position: relative;
		z-index: 1;
		border: none;
		background: transparent;
		border-radius: 9999px;
		padding: 0.5rem 0;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		color: var(--md-on-surface);
		transition: color 0.2s;
	}
	.segment-btn.active {
		color: var(--md-on-primary);
		font-weight: 600;
	}

	/* ── ROOM CARDS ──────────────────────────────────────────────── */
	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	.room-card {
		position: relative;
		background: var(--md-surface);
		border-radius: 28px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0,0,0,0.07);
		transition: transform 0.4s var(--spring), box-shadow 0.3s var(--ease-std);
		cursor: pointer;
	}
	.room-card.hovered {
		transform: scale(1.02) translateY(-4px);
		box-shadow: 0 10px 28px rgba(0,0,0,0.14);
	}
	.card-img-wrap {
		width: 100%;
		aspect-ratio: 4/3;
		overflow: hidden;
	}
	.card-img-wrap img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s var(--ease-std);
	}
	.room-card.hovered .card-img-wrap img {
		transform: scale(1.05);
	}
	.card-body {
		padding: 1.5rem;
		position: relative;
		z-index: 1;
	}
	.card-name {
		margin-bottom: 0.75rem;
		color: var(--md-on-surface);
	}
	.card-desc {
		margin-bottom: 1.25rem;
		font-size: 0.9375rem;
	}
	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.875rem;
		background: var(--md-surface-variant);
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--md-on-surface);
		border: 1px solid var(--md-outline-variant);
	}
	.card-btn {
		font-size: 0.875rem;
		padding: 0.625rem 1.5rem;
	}
	.card-state-layer {
		position: absolute;
		inset: 0;
		background: var(--accent, var(--md-primary));
		opacity: 0;
		border-radius: 28px;
		pointer-events: none;
		transition: opacity 0.2s;
	}
	.room-card:hover .card-state-layer {
		opacity: 0.05;
	}
	.room-card:active .card-state-layer {
		opacity: 0.1;
	}

	/* ── GALLERY GRID ────────────────────────────────────────────── */
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.gallery-item {
		border-radius: 16px;
		overflow: hidden;
		aspect-ratio: 1;
		animation: galleryIn 0.5s var(--spring) both;
		animation-delay: calc(var(--i) * 60ms);
	}
	.gallery-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s var(--ease-std);
	}
	.gallery-item:hover img {
		transform: scale(1.06);
	}
	@keyframes galleryIn {
		from { opacity: 0; transform: scale(0.88); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* ── EXPLORE LIST ────────────────────────────────────────────── */
	.explore-list {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}
	.poi-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--md-surface);
		border-radius: 20px;
		padding: 1rem 1.25rem;
		box-shadow: 0 1px 4px rgba(0,0,0,0.06);
		transition: transform 0.3s var(--spring), box-shadow 0.2s;
	}
	.poi-card:hover {
		transform: translateX(6px);
		box-shadow: 0 4px 16px rgba(0,0,0,0.1);
	}
	.poi-icon {
		font-size: 1.75rem;
		flex-shrink: 0;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--md-primary-container);
		border-radius: 50%;
	}
	.poi-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.poi-label {
		font-weight: 500;
		font-size: 0.9375rem;
		color: var(--md-on-surface);
	}
	.poi-dist {
		font-size: 0.8125rem;
		color: hsl(0,0%,50%);
	}
	.poi-btn {
		flex-shrink: 0;
	}

	/* ── FORM ────────────────────────────────────────────────────── */
	.form-surface {
		background: var(--md-surface);
		border-radius: 28px;
		padding: 2.5rem;
		box-shadow: 0 2px 12px rgba(0,0,0,0.07);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	/* Outlined text field */
	.field-outlined {
		position: relative;
	}
	.field-outlined .field-input {
		width: 100%;
		padding: 1rem 1rem 0.75rem;
		font-size: 1rem;
		font-family: 'Inter', sans-serif;
		background: transparent;
		border: none;
		outline: none;
		color: var(--md-on-surface);
		position: relative;
		z-index: 1;
	}
	.field-outlined .field-label {
		position: absolute;
		top: 1rem;
		left: 1rem;
		font-size: 1rem;
		color: var(--md-outline);
		pointer-events: none;
		transition: top 0.2s var(--ease-std), font-size 0.2s, color 0.2s;
		z-index: 2;
		background: var(--md-surface);
		padding: 0 0.25rem;
	}
	.field-outlined .field-input:focus ~ .field-label,
	.field-outlined .field-input:not(:placeholder-shown) ~ .field-label {
		top: -0.55rem;
		font-size: 0.75rem;
		color: var(--md-primary);
	}
	.field-border {
		position: absolute;
		inset: 0;
		margin: 0;
		border: 1.5px solid var(--md-outline-variant);
		border-radius: 4px;
		padding: 0 0.75rem;
		pointer-events: none;
		transition: border-color 0.2s;
	}
	.field-outlined .field-input:focus ~ .field-label ~ .field-border {
		border-color: var(--md-primary);
		border-width: 2px;
	}
	.field-legend {
		display: block;
		height: 0;
		overflow: hidden;
		width: auto;
		font-size: 0.75rem;
		padding: 0;
		max-width: 0;
		transition: max-width 0.15s var(--ease-std);
	}
	.field-outlined .field-input:focus ~ .field-label ~ .field-border .field-legend,
	.field-outlined .field-input:not(:placeholder-shown) ~ .field-label ~ .field-border .field-legend {
		max-width: 100%;
	}
	.field-legend span {
		padding: 0 4px;
		visibility: hidden;
	}

	/* Filled text field */
	.field-filled {
		position: relative;
		background: var(--md-surface-variant);
		border-radius: 4px 4px 0 0;
		overflow: hidden;
	}
	.field-filled .field-input {
		width: 100%;
		padding: 1.5rem 1rem 0.5rem;
		font-size: 1rem;
		font-family: 'Inter', sans-serif;
		background: transparent;
		border: none;
		outline: none;
		color: var(--md-on-surface);
		position: relative;
		z-index: 1;
	}
	.field-label-filled {
		position: absolute;
		top: 1rem;
		left: 1rem;
		font-size: 1rem;
		color: var(--md-outline);
		pointer-events: none;
		transition: top 0.2s var(--ease-std), font-size 0.2s, color 0.2s;
	}
	.field-filled .field-input:focus ~ .field-label-filled,
	.field-filled .field-input:not(:placeholder-shown) ~ .field-label-filled {
		top: 0.35rem;
		font-size: 0.75rem;
		color: var(--md-primary);
	}
	.field-active-indicator {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--md-outline);
		transition: height 0.2s, background 0.2s;
	}
	.field-filled .field-input:focus ~ .field-active-indicator {
		height: 2px;
		background: var(--md-primary);
	}
	.form-submit {
		align-self: flex-start;
		font-size: 1rem;
		padding: 0.875rem 2rem;
	}

	/* ── BUTTONS ─────────────────────────────────────────────────── */
	.btn-filled {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.75rem;
		border: none;
		border-radius: 9999px;
		background: var(--md-primary);
		color: var(--md-on-primary);
		font-size: 0.875rem;
		font-weight: 600;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		text-decoration: none;
		transition:
			transform 0.3s var(--spring),
			box-shadow 0.2s var(--ease-std),
			background 0.2s;
		box-shadow: 0 2px 8px rgba(0,0,0,0.12);
	}
	.btn-filled:hover {
		transform: scale(1.04);
		box-shadow: 0 6px 20px rgba(0,0,0,0.18);
	}
	.btn-filled:active {
		transform: scale(0.97);
	}
	.btn-tonal {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: 9999px;
		background: var(--md-primary-container);
		color: var(--md-on-primary-cont);
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		transition: transform 0.3s var(--spring), box-shadow 0.2s;
	}
	.btn-tonal:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	/* ── SHAPE SHOWCASE ──────────────────────────────────────────── */
	.shapes-row {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: center;
	}
	.shape {
		flex: 1 1 120px;
		aspect-ratio: 1;
		background: var(--md-primary-container);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--md-on-primary-cont);
		text-align: center;
		transition: transform 0.4s var(--spring), box-shadow 0.3s;
		cursor: default;
	}
	.shape:hover {
		transform: scale(1.08);
		box-shadow: 0 8px 24px rgba(0,0,0,0.12);
	}
	.shape-sharp   { border-radius: 4px; }
	.shape-small   { border-radius: 8px; }
	.shape-medium  { border-radius: 16px; }
	.shape-large   { border-radius: 28px; }
	.shape-extra   { border-radius: 36px; background: var(--md-sec-container); color: hsl(25,40%,22%); }
	.shape-full    { border-radius: 9999px; background: var(--md-primary); color: var(--md-on-primary); }

	/* ── EXTENDED FAB ────────────────────────────────────────────── */
	.fab-extended {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 100;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 1.5rem;
		height: 56px;
		border-radius: 28px;
		background: var(--md-primary);
		color: var(--md-on-primary);
		border: none;
		font-family: 'Inter', sans-serif;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		overflow: hidden;
		box-shadow: 0 6px 20px rgba(0,0,0,0.18);
		transition:
			transform 0.4s var(--spring),
			box-shadow 0.3s var(--ease-std);
	}
	.fab-extended:hover {
		transform: scale(1.04) translateY(-2px);
		box-shadow: 0 10px 28px rgba(0,0,0,0.22);
	}
	.fab-extended.fab-pressed {
		transform: scale(0.96);
		box-shadow: 0 3px 10px rgba(0,0,0,0.16);
	}
	.fab-icon {
		font-size: 1.1rem;
		transition: transform 0.4s var(--spring);
	}
	.fab-extended:hover .fab-icon {
		transform: rotate(90deg) scale(1.2);
	}
	.fab-state-layer {
		position: absolute;
		inset: 0;
		background: currentColor;
		opacity: 0;
		border-radius: inherit;
		pointer-events: none;
		transition: opacity 0.2s;
	}
	.fab-extended:hover .fab-state-layer {
		opacity: 0.08;
	}
	.fab-extended.fab-pressed .fab-state-layer {
		opacity: 0.12;
	}

	/* ── Demo home button ─────────────────────────── */
	.demo-home-btn {
		position: fixed;
		top: 14px;
		right: 14px;
		z-index: 9999;
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 9px 16px 9px 11px;
		background: #b8ff3c;
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(140, 210, 0, 0.35);
		border-radius: 999px;
		color: #0d1a05;
		text-decoration: none;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
		box-shadow: 0 2px 20px rgba(130, 220, 0, 0.35), 0 1px 4px rgba(0, 0, 0, 0.15);
	}

	.demo-home-btn:hover {
		background: #caff52;
		transform: translateY(-1px);
		box-shadow: 0 4px 28px rgba(130, 220, 0, 0.55);
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 600px) {
		.form-row {
			grid-template-columns: 1fr;
		}
		.gallery-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.shapes-row {
			gap: 0.625rem;
		}
		.fab-extended {
			bottom: 1.25rem;
			right: 1.25rem;
		}
	}
</style>
