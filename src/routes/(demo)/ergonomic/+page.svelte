<script>
	import { onMount } from 'svelte';

	// ── Thumb zone ────────────────────────────────────────────────────────────
	let handedness = $state('right');

	// ── Bottom sheet ──────────────────────────────────────────────────────────
	let sheetOpen = $state(false);
	let dragY = $state(0);
	let dragStartY = 0;
	let isDragging = false;

	function onSheetPointerDown(e) {
		isDragging = true;
		dragStartY = e.clientY;
		e.currentTarget.setPointerCapture(e.pointerId);
	}
	function onSheetPointerMove(e) {
		if (!isDragging) return;
		const delta = e.clientY - dragStartY;
		if (sheetOpen) {
			dragY = Math.max(0, Math.min(300, delta));
		} else {
			dragY = Math.max(-300, Math.min(0, delta));
		}
	}
	function onSheetPointerUp() {
		isDragging = false;
		if (sheetOpen) {
			if (dragY > 100) {
				sheetOpen = false;
			}
		} else {
			if (dragY < -80) {
				sheetOpen = true;
			}
		}
		dragY = 0;
	}

	// ── Bottom tab nav ────────────────────────────────────────────────────────
	let activeTab = $state(0);
	const tabs = ['Rooms', 'Gallery', 'Explore', 'Book'];
	const tabContent = [
		'Three beautifully appointed rooms await — each with its own character, from the sun-drenched Garden Room to the cool, vaulted Stone Room.',
		'Wander through our gallery of light-filled mornings, orchard evenings, and quiet corners that make Marianne Cottage feel like home.',
		'Discover the Normandy coast, local markets, forest trails, and hidden villages — all within easy reach of the cottage.',
		'Ready to arrive? Secure your dates in just a few taps. Flexible cancellation, instant confirmation, no hidden fees.'
	];

	// ── FAB cluster ───────────────────────────────────────────────────────────
	let fanOpen = $state(false);
	const miniFabs = [
		{ label: 'Call', icon: '📞', offset: 80 },
		{ label: 'Map', icon: '🗺', offset: 148 },
		{ label: 'Chat', icon: '💬', offset: 216 }
	];

	// ── Swipe-to-act ──────────────────────────────────────────────────────────
	const rooms = [
		{ name: 'The Garden Room', price: '€120/night', color: '#9aac8a' },
		{ name: 'The Orchard Suite', price: '€140/night', color: '#c8b99a' },
		{ name: 'The Stone Room', price: '€130/night', color: '#8a9eac' }
	];
	let swipeDragX = $state([0, 0, 0]);
	let swipeStart = [0, 0, 0];
	let swipeDragging = [false, false, false];

	function onSwipeDown(i, e) {
		swipeDragging[i] = true;
		swipeStart[i] = e.clientX;
		e.currentTarget.setPointerCapture(e.pointerId);
	}
	function onSwipeMove(i, e) {
		if (!swipeDragging[i]) return;
		const delta = e.clientX - swipeStart[i];
		swipeDragX[i] = Math.max(-120, Math.min(120, delta));
	}
	function onSwipeUp(i) {
		swipeDragging[i] = false;
		// snap back
		swipeDragX[i] = swipeDragX[i] > 60 ? 90 : swipeDragX[i] < -60 ? -90 : 0;
	}
	function resetSwipe(i) {
		swipeDragX[i] = 0;
	}

	// ── Tap target tiles ─────────────────────────────────────────────────────
	const experiences = [
		{ label: 'Orchard Walk', sub: 'Dawn to dusk trails', color: '#9aac8a' },
		{ label: 'Local Market', sub: 'Every Saturday', color: '#c8b99a' },
		{ label: 'Coastal Drive', sub: '20 min to the sea', color: '#8a9eac' },
		{ label: 'Farmhouse Dinner', sub: 'Seasonal menu', color: '#b59a8a' },
		{ label: 'Wine Tasting', sub: 'Calvados & ciders', color: '#ac9a8a' },
		{ label: 'Quiet Reading', sub: 'Library & log fire', color: '#8aac9a' }
	];
</script>

<svelte:head>
	<title>Ergonomic Patterns — Marianne Cottage</title>
	<meta name="description" content="Thumb-zone optimisation and ergonomic mobile design patterns." />
</svelte:head>

<!-- ── Hero ─────────────────────────────────────────────────────────────── -->
<header class="hero">
	<div class="hero-inner">
		<p class="hero-kicker">Design Trend · 12 of 13</p>
		<h1 class="hero-title">Ergonomic Patterns</h1>
		<p class="hero-sub">Designing for the human hand — thumb-zone theory, comfort-first interactions, and one-handed mobile UX.</p>
	</div>
</header>

<main>

	<!-- ── 1. Thumb Zone Visualiser ────────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">01</span>
			<h2 class="section-title">Thumb Zone Visualiser</h2>
			<p class="section-desc">The coloured zones show how far your thumb comfortably reaches across a standard phone screen.</p>
		</div>

		<div class="thumb-demo">
			<div class="thumb-handedness">
				<button
					class="hand-btn"
					class:active={handedness === 'left'}
					onclick={() => (handedness = 'left')}
				>Left hand</button>
				<button
					class="hand-btn"
					class:active={handedness === 'right'}
					onclick={() => (handedness = 'right')}
				>Right hand</button>
			</div>

			<div class="phone-wrap" style:transform={handedness === 'left' ? 'scaleX(-1)' : 'none'}>
				<svg
					viewBox="0 0 375 812"
					xmlns="http://www.w3.org/2000/svg"
					class="phone-svg"
					aria-label="Thumb zone diagram"
				>
					<!-- Phone shell -->
					<rect x="8" y="8" width="359" height="796" rx="44" ry="44" fill="#1a1a1a" />
					<rect x="18" y="18" width="339" height="776" rx="36" ry="36" fill="#f5f0e8" />

					<!-- Zone: Red / Awkward — top 25% of screen area -->
					<clipPath id="screen-clip">
						<rect x="18" y="18" width="339" height="776" rx="36" ry="36" />
					</clipPath>
					<g clip-path="url(#screen-clip)">
						<!-- Awkward zone (top 25%) -->
						<rect x="18" y="18" width="339" height="194" fill="#e05050" opacity="0.22" />
						<!-- Reachable zone (middle 35%) -->
						<rect x="18" y="212" width="339" height="272" fill="#e09b3d" opacity="0.22" />
						<!-- Comfortable zone (bottom 40%) -->
						<rect x="18" y="484" width="339" height="310" fill="#7a9e7e" opacity="0.28" />
					</g>

					<!-- Zone labels -->
					<text x="188" y="120" text-anchor="middle" font-size="22" font-family="Inter" fill="#e05050" font-weight="600">Awkward</text>
					<text x="188" y="148" text-anchor="middle" font-size="14" font-family="Inter" fill="#e05050" opacity="0.85">Strain risk · avoid critical actions</text>

					<text x="188" y="355" text-anchor="middle" font-size="22" font-family="Inter" fill="#b07a20" font-weight="600">Reachable</text>
					<text x="188" y="383" text-anchor="middle" font-size="14" font-family="Inter" fill="#b07a20" opacity="0.85">Stretch · use for secondary actions</text>

					<text x="188" y="600" text-anchor="middle" font-size="22" font-family="Inter" fill="#4a7e4e" font-weight="600">Comfortable</text>
					<text x="188" y="628" text-anchor="middle" font-size="14" font-family="Inter" fill="#4a7e4e" opacity="0.85">Natural reach · primary actions here</text>

					<!-- Thumb arc guide -->
					<path
						d="M 340 780 Q 60 600 200 100"
						stroke="#3a3a3a"
						stroke-width="2"
						stroke-dasharray="8 6"
						fill="none"
						opacity="0.25"
					/>

					<!-- Home indicator -->
					<rect x="148" y="785" width="79" height="5" rx="3" fill="#3a3a3a" opacity="0.3" />
					<!-- Notch -->
					<rect x="148" y="22" width="79" height="22" rx="11" fill="#1a1a1a" opacity="0.7" />
				</svg>
			</div>

			<p class="thumb-note">Our booking flow keeps critical actions in the <strong style="color:#4a7e4e">green zone</strong></p>

			<div class="zone-legend">
				<span class="legend-item green">Comfortable (bottom 40%)</span>
				<span class="legend-item amber">Reachable (middle 35%)</span>
				<span class="legend-item red">Awkward (top 25%)</span>
			</div>
		</div>
	</section>

	<!-- ── 2. Bottom Sheet Booking ─────────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">02</span>
			<h2 class="section-title">Bottom Sheet Booking</h2>
			<p class="section-desc">Critical booking actions anchored to thumb reach — drag or tap to open.</p>
		</div>

		<div class="sheet-container">
			<!-- Content behind sheet -->
			<div class="sheet-backdrop-content">
				<div class="room-preview-img"></div>
				<p class="room-preview-label">The Orchard Suite</p>
				<p class="room-preview-sub">Normandy · France</p>
			</div>

			<!-- Backdrop -->
			{#if sheetOpen}
				<div
					class="sheet-backdrop"
					onclick={() => { sheetOpen = false; dragY = 0; }}
					role="button"
					tabindex="-1"
					aria-label="Close sheet"
				></div>
			{/if}

			<!-- Sheet -->
			<div
				class="bottom-sheet"
				class:open={sheetOpen}
				style:transform="translateY({sheetOpen ? Math.max(0, dragY) : Math.min(0, -dragY) + 260}px)"
			>
				<!-- Handle -->
				<div
					class="sheet-handle-area"
					onpointerdown={onSheetPointerDown}
					onpointermove={onSheetPointerMove}
					onpointerup={onSheetPointerUp}
					role="button"
					tabindex="0"
					aria-label="Drag to open booking sheet"
					onclick={() => { if (!isDragging) { sheetOpen = !sheetOpen; dragY = 0; } }}
				>
					<div class="sheet-handle"></div>
					<div class="sheet-peek">
						<span class="sheet-peek-label">Book a room</span>
						<span class="sheet-peek-price">from <strong>€125</strong>/night</span>
					</div>
				</div>

				<!-- Full form -->
				<div class="sheet-body">
					{#if sheetOpen}
						<button class="sheet-close" onclick={() => { sheetOpen = false; dragY = 0; }} aria-label="Close">✕</button>
					{/if}
					<h3 class="sheet-form-title">Reserve your stay</h3>

					<div class="form-row">
						<div class="form-field">
							<label for="checkin">Check in</label>
							<input id="checkin" type="date" />
						</div>
						<div class="form-field">
							<label for="checkout">Check out</label>
							<input id="checkout" type="date" />
						</div>
					</div>

					<div class="form-row">
						<div class="form-field">
							<label for="guests-label">Guests</label>
							<div class="stepper" id="guests-label">
								<button class="stepper-btn" aria-label="Remove guest">−</button>
								<span class="stepper-val">2</span>
								<button class="stepper-btn" aria-label="Add guest">+</button>
							</div>
						</div>
						<div class="form-field">
							<label for="room-select">Room</label>
							<select id="room-select">
								<option>Garden Room — €120</option>
								<option>Orchard Suite — €140</option>
								<option>Stone Room — €130</option>
							</select>
						</div>
					</div>

					<button class="book-cta">Check availability</button>
				</div>
			</div>
		</div>
	</section>

	<!-- ── 3. One-Thumb Navigation ─────────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">03</span>
			<h2 class="section-title">One-Thumb Navigation</h2>
			<p class="section-desc">Tab bar pinned to thumb reach. 48px+ targets, active slide indicator.</p>
		</div>

		<div class="tab-demo">
			<div class="tab-content">
				<p class="tab-body">{tabContent[activeTab]}</p>
			</div>
			<nav class="tab-bar" aria-label="Section navigation">
				{#each tabs as tab, i}
					<button
						class="tab-btn"
						class:tab-active={activeTab === i}
						onclick={() => (activeTab = i)}
						aria-current={activeTab === i ? 'page' : undefined}
					>{tab}</button>
				{/each}
			</nav>
		</div>
	</section>

	<!-- ── 4. Large Tap Target Gallery ────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">04</span>
			<h2 class="section-title">Large Tap Target Gallery</h2>
			<p class="section-desc">Every tile meets the 48 × 48 px minimum. Tap-target audit badge confirms compliance.</p>
		</div>

		<div class="tap-grid">
			{#each experiences as exp}
				<button class="tap-tile" style:background={exp.color}>
					<div class="tap-tile-inner">
						<span class="tap-tile-label">{exp.label}</span>
						<span class="tap-tile-sub">{exp.sub}</span>
					</div>
					<span class="tap-badge" title="Tap target compliant">✓ 48px+</span>
				</button>
			{/each}
		</div>
	</section>

	<!-- ── 5. Floating Action Cluster ────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">05</span>
			<h2 class="section-title">Floating Action Cluster</h2>
			<p class="section-desc">Primary FAB in bottom-right thumb zone. Secondary actions fan out on tap.</p>
		</div>

		<div class="fab-demo">
			<p class="fab-hint">Tap the <strong>Book Now</strong> button →</p>

			<div class="fab-cluster" class:fan-open={fanOpen}>
				<!-- Mini FABs -->
				{#each miniFabs as fab, i}
					<button
						class="mini-fab"
						style:transform="translateY({fanOpen ? -fab.offset : 0}px)"
						style:opacity={fanOpen ? 1 : 0}
						style:pointer-events={fanOpen ? 'auto' : 'none'}
						style:transition-delay="{fanOpen ? i * 60 : (miniFabs.length - 1 - i) * 40}ms"
						aria-label={fab.label}
					>
						<span class="mini-fab-icon">{fab.icon}</span>
						<span class="mini-fab-label">{fab.label}</span>
					</button>
				{/each}

				<!-- Primary FAB -->
				<button
					class="primary-fab"
					onclick={() => (fanOpen = !fanOpen)}
					aria-label="Book Now"
					aria-expanded={fanOpen}
				>
					<span class="fab-icon" style:transform={fanOpen ? 'rotate(45deg)' : 'none'}>✕</span>
					{#if !fanOpen}<span class="fab-label">Book Now</span>{/if}
				</button>
			</div>
		</div>
	</section>

	<!-- ── 6. Swipe-to-Act ────────────────────────────────────────────────── -->
	<section class="section">
		<div class="section-header">
			<span class="section-tag">06</span>
			<h2 class="section-title">Swipe-to-Act</h2>
			<p class="section-desc">Swipe right to enquire, swipe left to skip. Gestural shortcuts for power users.</p>
		</div>

		<div class="swipe-list">
			{#each rooms as room, i}
				<div class="swipe-row">
					<!-- Action backgrounds -->
					<div
						class="swipe-action-left"
						style:opacity={Math.max(0, swipeDragX[i] / 90)}
					>Enquire →</div>
					<div
						class="swipe-action-right"
						style:opacity={Math.max(0, -swipeDragX[i] / 90)}
					>← Skip</div>

					<!-- Draggable card -->
					<div
						class="swipe-card"
						style:transform="translateX({swipeDragX[i]}px)"
						style:border-left="4px solid {room.color}"
						onpointerdown={(e) => onSwipeDown(i, e)}
						onpointermove={(e) => onSwipeMove(i, e)}
						onpointerup={() => onSwipeUp(i)}
						role="button"
						tabindex="0"
						aria-label="Swipe {room.name}"
					>
						<div class="swipe-card-dot" style:background={room.color}></div>
						<div class="swipe-card-text">
							<span class="swipe-card-name">{room.name}</span>
							<span class="swipe-card-price">{room.price}</span>
						</div>
						{#if Math.abs(swipeDragX[i]) > 10}
							<button class="swipe-reset" onclick={() => resetSwipe(i)} aria-label="Reset">↺</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<p class="swipe-hint">← Swipe left to skip &nbsp;·&nbsp; Swipe right to enquire →</p>
	</section>
</main>

<!-- ── Footer nav ─────────────────────────────────────────────────────────── -->
<footer class="demo-footer">
	<p class="footer-label">Design Trend Demos</p>
	<nav class="footer-nav" aria-label="Demo pages">
		<a class="footer-link" href="/demo">← All demos</a>
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
		] as [href, label]}
			<a
				class="footer-link"
				class:footer-active={href === 'ergonomic'}
				href="/{href}"
			>{label}</a>
		{/each}
	</nav>
</footer>

<style>
	/* ── Variables ───────────────────────────────────────────────────────── */
	:root {
		--sage: #7a9e7e;
		--sage-dark: #4a7e4e;
		--amber: #e09b3d;
		--red: #e05050;
		--cream: #f5f0e8;
		--ink: #3a3a3a;
		--muted: #777;
		--radius: 16px;
		--radius-sm: 8px;
	}

	/* ── Hero ────────────────────────────────────────────────────────────── */
	.hero {
		background: var(--ink);
		color: var(--cream);
		padding: 3rem 1.5rem 2.5rem;
	}
	.hero-inner {
		max-width: 720px;
		margin: 0 auto;
	}
	.hero-kicker {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--sage);
		margin-bottom: 0.75rem;
	}
	.hero-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(2rem, 6vw, 3.25rem);
		font-weight: 700;
		line-height: 1.1;
		margin-bottom: 1rem;
	}
	.hero-sub {
		font-size: 1rem;
		color: #c8c0b4;
		max-width: 52ch;
		line-height: 1.6;
	}

	/* ── Sections ────────────────────────────────────────────────────────── */
	main {
		max-width: 900px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	.section {
		padding: 3rem 0;
		border-bottom: 1px solid #ddd8d0;
	}
	.section:last-child { border-bottom: none; }

	.section-header { margin-bottom: 2rem; }
	.section-tag {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--sage);
		margin-bottom: 0.4rem;
	}
	.section-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1.4rem, 4vw, 2rem);
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	.section-desc {
		color: var(--muted);
		font-size: 0.95rem;
		line-height: 1.6;
		max-width: 58ch;
	}

	/* ── 1. Thumb zone ────────────────────────────────────────────────────── */
	.thumb-demo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
	}
	.thumb-handedness {
		display: flex;
		gap: 0.5rem;
	}
	.hand-btn {
		padding: 0.5rem 1.25rem;
		border-radius: 999px;
		border: 2px solid #ddd8d0;
		background: transparent;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 48px;
	}
	.hand-btn.active {
		background: var(--sage);
		color: #fff;
		border-color: var(--sage);
	}
	.phone-wrap {
		transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.phone-svg {
		width: min(260px, 70vw);
		height: auto;
		filter: drop-shadow(0 8px 24px rgba(0,0,0,0.15));
	}
	.thumb-note {
		text-align: center;
		font-size: 0.95rem;
		color: var(--ink);
		max-width: 40ch;
	}
	.zone-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}
	.legend-item {
		font-size: 0.78rem;
		font-weight: 500;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
	}
	.legend-item.green { background: #d4ecd5; color: var(--sage-dark); }
	.legend-item.amber { background: #fde9c4; color: #9a6a10; }
	.legend-item.red   { background: #fdd8d8; color: #b03030; }

	/* ── 2. Bottom sheet ──────────────────────────────────────────────────── */
	.sheet-container {
		position: relative;
		height: 420px;
		border-radius: var(--radius);
		overflow: hidden;
		background: #2a2a2a;
	}
	.room-preview-img {
		width: 100%;
		height: 100%;
		background: linear-gradient(160deg, #9aac8a 0%, #c8b99a 60%, #8a9eac 100%);
		opacity: 0.7;
	}
	.room-preview-label {
		position: absolute;
		top: 1.5rem;
		left: 1.5rem;
		font-family: 'Playfair Display', serif;
		font-size: 1.5rem;
		color: #fff;
		text-shadow: 0 2px 8px rgba(0,0,0,0.4);
	}
	.room-preview-sub {
		position: absolute;
		top: 3.2rem;
		left: 1.5rem;
		font-size: 0.85rem;
		color: rgba(255,255,255,0.8);
	}

	.sheet-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,0.35);
		backdrop-filter: blur(2px);
		z-index: 1;
		animation: fadeIn 0.2s ease;
	}
	@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

	.bottom-sheet {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		border-radius: var(--radius) var(--radius) 0 0;
		z-index: 2;
		transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
		touch-action: none;
		max-height: 390px;
		overflow: hidden;
	}
	.sheet-handle-area {
		padding: 0.75rem 1.25rem 0.5rem;
		cursor: grab;
		user-select: none;
	}
	.sheet-handle {
		width: 40px;
		height: 4px;
		background: #ddd;
		border-radius: 2px;
		margin: 0 auto 0.75rem;
	}
	.sheet-peek {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.sheet-peek-label {
		font-weight: 600;
		font-size: 1rem;
	}
	.sheet-peek-price {
		font-size: 0.9rem;
		color: var(--muted);
	}
	.sheet-peek-price strong { color: var(--ink); font-size: 1.05rem; }

	.sheet-body {
		padding: 0.25rem 1.25rem 1.5rem;
		position: relative;
	}
	.sheet-close {
		position: absolute;
		top: 0;
		right: 1rem;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: #f0eee9;
		cursor: pointer;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.sheet-form-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		margin-bottom: 1rem;
	}
	.form-row {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.form-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.form-field label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.form-field input,
	.form-field select {
		min-height: 48px;
		border: 1.5px solid #ddd8d0;
		border-radius: var(--radius-sm);
		padding: 0 0.75rem;
		font-size: 0.9rem;
		font-family: inherit;
		background: #fafaf8;
	}
	.stepper {
		display: flex;
		align-items: center;
		height: 48px;
		border: 1.5px solid #ddd8d0;
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.stepper-btn {
		width: 44px;
		height: 100%;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		cursor: pointer;
		flex-shrink: 0;
	}
	.stepper-val {
		flex: 1;
		text-align: center;
		font-weight: 600;
	}
	.book-cta {
		margin-top: 0.75rem;
		width: 100%;
		min-height: 52px;
		background: var(--sage);
		color: #fff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 1rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		transition: background 0.2s;
	}
	.book-cta:hover { background: var(--sage-dark); }

	/* ── 3. Tab nav ───────────────────────────────────────────────────────── */
	.tab-demo {
		border-radius: var(--radius);
		overflow: hidden;
		border: 1.5px solid #ddd8d0;
		background: #fff;
	}
	.tab-content {
		padding: 1.75rem 1.5rem;
		min-height: 120px;
	}
	.tab-body {
		font-size: 1rem;
		line-height: 1.7;
		color: var(--ink);
		animation: fadeIn 0.25s ease;
	}
	.tab-bar {
		display: flex;
		border-top: 1.5px solid #ddd8d0;
		background: #fafaf8;
	}
	.tab-btn {
		flex: 1;
		min-height: 56px;
		border: none;
		background: transparent;
		font-size: 0.9rem;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
		padding: 0 0.5rem;
		color: var(--muted);
		border-bottom: 3px solid transparent;
		transition: color 0.2s, border-color 0.2s;
	}
	.tab-btn.tab-active {
		color: var(--sage-dark);
		border-bottom-color: var(--sage);
		font-weight: 600;
	}

	/* ── 4. Tap target gallery ────────────────────────────────────────────── */
	.tap-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}
	.tap-tile {
		min-height: 80px;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 0;
		position: relative;
		text-align: left;
		transition: transform 0.15s, filter 0.15s;
	}
	.tap-tile:active { transform: scale(0.97); filter: brightness(0.95); }
	.tap-tile-inner {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 1rem 1rem 1.5rem;
	}
	.tap-tile-label {
		font-weight: 700;
		font-size: 1rem;
		color: #fff;
		text-shadow: 0 1px 3px rgba(0,0,0,0.2);
	}
	.tap-tile-sub {
		font-size: 0.78rem;
		color: rgba(255,255,255,0.85);
	}
	.tap-badge {
		position: absolute;
		bottom: 0.5rem;
		right: 0.5rem;
		font-size: 0.65rem;
		font-weight: 700;
		background: rgba(255,255,255,0.9);
		color: var(--sage-dark);
		border-radius: 999px;
		padding: 0.15rem 0.5rem;
		letter-spacing: 0.05em;
	}

	/* ── 5. FAB cluster ───────────────────────────────────────────────────── */
	.fab-demo {
		position: relative;
		height: 260px;
		border-radius: var(--radius);
		background: linear-gradient(135deg, #e8e4dc 0%, #d8d0c4 100%);
		overflow: hidden;
		display: flex;
		align-items: center;
		padding: 1.5rem;
	}
	.fab-hint {
		font-size: 0.95rem;
		color: var(--muted);
		max-width: 20ch;
	}
	.fab-cluster {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.mini-fab {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #fff;
		border: none;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
		            opacity 0.25s ease;
	}
	.mini-fab-icon { font-size: 1.1rem; line-height: 1; }
	.mini-fab-label {
		font-size: 0.55rem;
		font-weight: 600;
		color: var(--muted);
		letter-spacing: 0.04em;
	}
	.primary-fab {
		width: 64px;
		height: 64px;
		border-radius: 999px;
		background: var(--sage);
		color: #fff;
		border: none;
		box-shadow: 0 6px 20px rgba(122,158,126,0.5);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		padding: 0 1.1rem;
		width: auto;
		min-width: 64px;
		transition: background 0.2s, transform 0.2s;
		z-index: 1;
	}
	.primary-fab:hover { background: var(--sage-dark); }
	.fab-icon {
		font-style: normal;
		font-size: 1rem;
		transition: transform 0.3s;
	}

	/* ── 6. Swipe-to-act ─────────────────────────────────────────────────── */
	.swipe-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.swipe-row {
		position: relative;
		height: 72px;
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.swipe-action-left {
		position: absolute;
		inset: 0;
		background: var(--sage);
		display: flex;
		align-items: center;
		padding-left: 1.5rem;
		font-weight: 700;
		color: #fff;
		font-size: 0.9rem;
		letter-spacing: 0.03em;
	}
	.swipe-action-right {
		position: absolute;
		inset: 0;
		background: var(--red);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 1.5rem;
		font-weight: 700;
		color: #fff;
		font-size: 0.9rem;
	}
	.swipe-card {
		position: absolute;
		inset: 0;
		background: #fff;
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0 1rem;
		cursor: grab;
		user-select: none;
		touch-action: pan-y;
		transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
		box-shadow: 0 2px 8px rgba(0,0,0,0.08);
	}
	.swipe-card:active { cursor: grabbing; transition: none; }
	.swipe-card-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.swipe-card-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.swipe-card-name {
		font-weight: 600;
		font-size: 0.95rem;
	}
	.swipe-card-price {
		font-size: 0.8rem;
		color: var(--muted);
	}
	.swipe-reset {
		border: none;
		background: #f0eee9;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		font-size: 1rem;
		cursor: pointer;
		color: var(--muted);
		flex-shrink: 0;
	}
	.swipe-hint {
		text-align: center;
		font-size: 0.8rem;
		color: var(--muted);
		margin-top: 1rem;
	}

	/* ── Footer ───────────────────────────────────────────────────────────── */
	.demo-footer {
		background: var(--ink);
		color: #c8c0b4;
		padding: 2rem 1.5rem;
		margin-top: 2rem;
	}
	.footer-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: var(--sage);
		margin-bottom: 0.75rem;
		text-align: center;
	}
	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.2rem;
		justify-content: center;
		max-width: 720px;
		margin: 0 auto;
	}
	.footer-link {
		color: #c8c0b4;
		text-decoration: none;
		font-size: 0.82rem;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		transition: color 0.15s, background 0.15s;
	}
	.footer-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
	.footer-link.footer-active {
		color: var(--sage);
		font-weight: 600;
	}
	.footer-link:not(:last-child)::after {
		content: ' ·';
		color: #555;
		margin-left: 0.2rem;
	}

	/* ── Responsive ───────────────────────────────────────────────────────── */
	@media (min-width: 640px) {
		.tap-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 840px) {
		.thumb-demo {
			flex-direction: row;
			align-items: flex-start;
			gap: 2.5rem;
		}
		.phone-wrap { flex-shrink: 0; }
		.thumb-note { text-align: left; }
		.zone-legend { justify-content: flex-start; }

		.tap-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.fab-demo { height: 300px; }
	}
</style>
