<script>
	import { onMount } from 'svelte';

	// ── Browser support ───────────────────────────────────────────────────────
	let supportsVT = $state(false);

	onMount(() => {
		supportsVT = 'startViewTransition' in document;
	});

	// ── Utility: wrap state update in startViewTransition ────────────────────
	async function transition(updateFn) {
		if (!document.startViewTransition) {
			updateFn();
			return;
		}
		await document.startViewTransition(updateFn).finished;
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Section 1 — Gallery Expand
	// ══════════════════════════════════════════════════════════════════════════
	const rooms = [
		{ id: 1, name: 'Garden Suite', desc: 'Wake to birdsong and the scent of lavender. French doors open directly onto the cottage garden with its winding stone paths and heritage rose bushes.', price: '€185/night', gradient: 'linear-gradient(135deg, #7a9e7e 0%, #a8c5a0 40%, #c8dfc4 100%)' },
		{ id: 2, name: 'Loft Room', desc: 'Tucked under original oak beams, this cosy retreat features a skylight window and a vintage writing desk. Perfect for creative souls seeking quiet inspiration.', price: '€145/night', gradient: 'linear-gradient(135deg, #c07850 0%, #d4956a 40%, #e8c4a0 100%)' },
		{ id: 3, name: 'Orchard View', desc: 'Panoramic windows frame the century-old apple orchard. In autumn, watch the harvest from your window seat. A cast-iron fireplace warms cool evenings.', price: '€165/night', gradient: 'linear-gradient(135deg, #8a7e6e 0%, #b0a590 40%, #d4ccc0 100%)' },
		{ id: 4, name: 'Stone Cellar', desc: 'Converted from the original 18th-century wine cellar, this room has exposed limestone walls, vaulted ceilings, and a level of cool quiet that invites deep rest.', price: '€155/night', gradient: 'linear-gradient(135deg, #5a7a8e 0%, #7a9aae 40%, #a8c0d0 100%)' },
		{ id: 5, name: 'Rose Cottage', desc: 'A standalone annexe smothered in climbing roses. Your own private entrance, a copper soaking tub, and a wood-burning stove make this our most romantic hideaway.', price: '€215/night', gradient: 'linear-gradient(135deg, #9e7a8e 0%, #c4a0b5 40%, #dcc4d0 100%)' },
		{ id: 6, name: 'Meadow Room', desc: 'Ground-floor room with direct access to the wildflower meadow. Watch deer at dusk through the wide picture window while sipping tea by the reading nook.', price: '€175/night', gradient: 'linear-gradient(135deg, #7a9e70 0%, #9cc090 40%, #c4dcc0 100%)' }
	];

	let selectedCard = $state(null);

	function openCard(card) {
		transition(() => { selectedCard = card; });
	}

	function closeCard() {
		transition(() => { selectedCard = null; });
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Section 2 — Tab Content Morph
	// ══════════════════════════════════════════════════════════════════════════
	const tabs = [
		{
			id: 'garden',
			label: 'Garden',
			heading: 'The Walled Garden',
			body: 'Three centuries of cultivation have shaped our two-acre walled garden. Espaliered fruit trees line the south-facing walls; raised beds overflow with cutting flowers from May through October. Guests are welcome to wander at any hour — morning mist here is something to witness.',
			detail: '2 acres · Heritage roses · Kitchen garden · Cutting beds'
		},
		{
			id: 'interior',
			label: 'Interior',
			heading: 'Period Details',
			body: 'The cottage dates to 1748. Original flagstone floors, exposed timber frames, and deep sash windows have been preserved throughout each restoration. Furnishings are a curated mix of Irish country antiques and contemporary textiles — nothing chosen for show alone.',
			detail: 'Grade II listed · 1748 · Flagstone floors · Open fireplaces'
		},
		{
			id: 'surroundings',
			label: 'Surroundings',
			heading: 'The Wider Landscape',
			body: "Situated at the edge of the Burren limestone plateau, the cottage sits between coastline and karst. Ancient looped walking trails pass within a minute's walk. The nearest village is four kilometres south; a farmers' market runs every Saturday morning.",
			detail: 'Burren · 4km to village · Saturday market · Coastal walks'
		}
	];

	let activeTab = $state('garden');

	function switchTab(id) {
		if (id === activeTab) return;
		transition(() => { activeTab = id; });
	}

	$derived: var activeTabData = tabs.find(t => t.id === activeTab);

	// ══════════════════════════════════════════════════════════════════════════
	// Section 3 — List ↔ Grid Toggle
	// ══════════════════════════════════════════════════════════════════════════
	const amenities = [
		{ id: 1, icon: '⚘', name: 'Garden Access', detail: 'Open from dawn to dusk' },
		{ id: 2, icon: '◫', name: 'Private Terrace', detail: 'Per-room stone terrace' },
		{ id: 3, icon: '♨', name: 'Open Fireplace', detail: 'Logs provided daily' },
		{ id: 4, icon: '✦', name: 'Breakfast Hamper', detail: 'Local produce, daily' }
	];

	let viewMode = $state('list');

	function toggleView() {
		transition(() => { viewMode = viewMode === 'list' ? 'grid' : 'list'; });
	}

	// ══════════════════════════════════════════════════════════════════════════
	// Section 4 — Booking Step Flow
	// ══════════════════════════════════════════════════════════════════════════
	let bookingStep = $state(1);
	let checkin = $state('');
	let checkout = $state('');
	let selectedRoom = $state('');
	let guestName = $state('');
	let guestEmail = $state('');
	let totalPrice = $state('€185');

	const steps = [
		{ n: 1, label: 'Choose Dates' },
		{ n: 2, label: 'Select Room' },
		{ n: 3, label: 'Confirm' }
	];

	const bookingRooms = [
		{ name: 'Garden Suite', price: '€185' },
		{ name: 'Loft Room', price: '€145' },
		{ name: 'Rose Cottage', price: '€215' }
	];

	function nextStep() {
		if (bookingStep < 3) {
			transition(() => { bookingStep = bookingStep + 1; });
		}
	}

	function prevStep() {
		if (bookingStep > 1) {
			transition(() => { bookingStep = bookingStep - 1; });
		}
	}

	function selectBookingRoom(room) {
		selectedRoom = room.name;
		totalPrice = room.price;
	}

	// ── All demo slugs for footer ─────────────────────────────────────────────
	const demos = [
		'historian','living','nature','story','brutal','calm','bento','kinetic',
		'adaptive','ambient','context','retro','expressive','spatial','micro',
		'ergonomic','liquid','scroll-anim','morph','handmade','iridescent','dday'
	];
</script>

<svelte:head>
	<title>Marianne Cottage — View Transitions Morph</title>
</svelte:head>

<!-- ════════════════════════════════════════════════════════════════════════
     SUPPORT BADGE
     ════════════════════════════════════════════════════════════════════════ -->
<div class="support-badge" class:supported={supportsVT} class:unsupported={!supportsVT}>
	{#if supportsVT}
		✓ View Transitions API · Active in this browser
	{:else}
		⚠ View Transitions API · Not supported — instant fallback active
	{/if}
	<span class="support-compat">Chrome 111+ · Safari 18+ · Firefox 131+</span>
</div>

<!-- ════════════════════════════════════════════════════════════════════════
     HERO
     ════════════════════════════════════════════════════════════════════════ -->
<header class="hero">
	<p class="hero-eyebrow">Demo — View Transitions API</p>
	<h1 class="hero-title">Elements That Morph</h1>
	<p class="hero-sub">Named elements interpolate position, size and shape between states using hardware-accelerated CSS transitions — no JavaScript animation loops required.</p>
</header>

<!-- ════════════════════════════════════════════════════════════════════════
     SECTION 1 — GALLERY EXPAND
     ════════════════════════════════════════════════════════════════════════ -->
<section class="demo-section">
	<div class="section-header">
		<span class="section-tag">01</span>
		<h2 class="section-title">Gallery Expand</h2>
		<p class="section-desc">Click a room card. The thumbnail morphs into a full-screen detail view via <code>view-transition-name: card-hero</code>.</p>
	</div>

	{#if !selectedCard}
		<div class="room-grid">
			{#each rooms as room (room.id)}
				<button
					class="room-thumb"
					style="--grad: {room.gradient}; view-transition-name: card-{room.id}"
					onclick={() => openCard(room)}
					aria-label="Expand {room.name}"
				>
					<div class="thumb-swatch"></div>
					<div class="thumb-info">
						<span class="thumb-name">{room.name}</span>
						<span class="thumb-price">{room.price}</span>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<div
			class="room-detail"
			style="--grad: {selectedCard.gradient}; view-transition-name: card-{selectedCard.id}"
		>
			<div class="detail-swatch"></div>
			<div class="detail-body">
				<button class="close-btn" onclick={closeCard} aria-label="Close">✕</button>
				<h3 class="detail-name">{selectedCard.name}</h3>
				<p class="detail-desc">{selectedCard.desc}</p>
				<div class="detail-footer">
					<span class="detail-price">{selectedCard.price}</span>
					<button class="book-btn">Book this room</button>
				</div>
			</div>
		</div>
	{/if}
</section>

<!-- ════════════════════════════════════════════════════════════════════════
     SECTION 2 — TAB CONTENT MORPH
     ════════════════════════════════════════════════════════════════════════ -->
<section class="demo-section">
	<div class="section-header">
		<span class="section-tag">02</span>
		<h2 class="section-title">Tab Content Morph</h2>
		<p class="section-desc">Tab indicator pill morphs between active positions. Content area cross-fades via <code>view-transition-name: tab-content</code>.</p>
	</div>

	<div class="tab-shell">
		<div class="tab-bar" role="tablist">
			{#each tabs as tab}
				<button
					class="tab-btn"
					class:tab-active={activeTab === tab.id}
					role="tab"
					aria-selected={activeTab === tab.id}
					onclick={() => switchTab(tab.id)}
				>
					{tab.label}
					{#if activeTab === tab.id}
						<span class="tab-indicator" style="view-transition-name: tab-indicator"></span>
					{/if}
				</button>
			{/each}
		</div>

		{#key activeTab}
			{@const tabData = tabs.find(t => t.id === activeTab)}
			<div class="tab-content" style="view-transition-name: tab-content">
				<h3 class="tab-heading">{tabData.heading}</h3>
				<p class="tab-body">{tabData.body}</p>
				<p class="tab-detail">{tabData.detail}</p>
			</div>
		{/key}
	</div>
</section>

<!-- ════════════════════════════════════════════════════════════════════════
     SECTION 3 — LIST ↔ GRID TOGGLE
     ════════════════════════════════════════════════════════════════════════ -->
<section class="demo-section">
	<div class="section-header">
		<span class="section-tag">03</span>
		<h2 class="section-title">List → Grid Toggle</h2>
		<p class="section-desc">Each item has a unique <code>view-transition-name</code>. Items reflow between layouts with smooth position interpolation.</p>
	</div>

	<div class="toggle-controls">
		<button class="toggle-btn" onclick={toggleView}>
			{viewMode === 'list' ? '⊞ Switch to Grid' : '≡ Switch to List'}
		</button>
		<span class="toggle-mode">Current: <strong>{viewMode}</strong></span>
	</div>

	<div class="amenity-wrap" class:is-grid={viewMode === 'grid'}>
		{#each amenities as a (a.id)}
			<div
				class="amenity-card"
				style="view-transition-name: amenity-{a.id}"
			>
				<span class="amenity-icon">{a.icon}</span>
				<div class="amenity-text">
					<span class="amenity-name">{a.name}</span>
					<span class="amenity-detail">{a.detail}</span>
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- ════════════════════════════════════════════════════════════════════════
     SECTION 4 — BOOKING STEP FLOW
     ════════════════════════════════════════════════════════════════════════ -->
<section class="demo-section">
	<div class="section-header">
		<span class="section-tag">04</span>
		<h2 class="section-title">Booking Step Flow</h2>
		<p class="section-desc">Step indicator morphs via <code>view-transition-name: step-dot</code>. The price element persists across steps with <code>view-transition-name: price-display</code>.</p>
	</div>

	<div class="booking-shell">
		<!-- Step indicator -->
		<div class="step-track">
			{#each steps as s}
				<div class="step-item" class:step-done={bookingStep > s.n} class:step-active={bookingStep === s.n}>
					<div
						class="step-dot"
						style={bookingStep === s.n ? 'view-transition-name: step-dot' : ''}
					>
						{#if bookingStep > s.n}✓{:else}{s.n}{/if}
					</div>
					<span class="step-label">{s.label}</span>
				</div>
				{#if s.n < 3}
					<div class="step-line" class:step-line-done={bookingStep > s.n}></div>
				{/if}
			{/each}
		</div>

		<!-- Persistent price display -->
		<div class="price-display" style="view-transition-name: price-display">
			<span class="price-label">Estimated total</span>
			<span class="price-value">{totalPrice}</span>
			<span class="price-note">per night · taxes incl.</span>
		</div>

		<!-- Step content -->
		{#if bookingStep === 1}
			<div class="booking-step" style="view-transition-name: booking-step">
				<h3 class="step-title">Choose Your Dates</h3>
				<div class="date-fields">
					<label class="field-group">
						<span class="field-label">Check-in</span>
						<input class="field-input" type="date" bind:value={checkin} />
					</label>
					<label class="field-group">
						<span class="field-label">Check-out</span>
						<input class="field-input" type="date" bind:value={checkout} />
					</label>
				</div>
			</div>
		{:else if bookingStep === 2}
			<div class="booking-step" style="view-transition-name: booking-step">
				<h3 class="step-title">Select a Room</h3>
				<div class="room-list">
					{#each bookingRooms as r}
						<button
							class="room-option"
							class:room-selected={selectedRoom === r.name}
							onclick={() => selectBookingRoom(r)}
						>
							<span class="room-option-name">{r.name}</span>
							<span class="room-option-price">{r.price}/night</span>
						</button>
					{/each}
				</div>
			</div>
		{:else}
			<div class="booking-step" style="view-transition-name: booking-step">
				<h3 class="step-title">Confirm Booking</h3>
				<div class="confirm-fields">
					<label class="field-group">
						<span class="field-label">Full name</span>
						<input class="field-input" type="text" placeholder="Your name" bind:value={guestName} />
					</label>
					<label class="field-group">
						<span class="field-label">Email</span>
						<input class="field-input" type="email" placeholder="your@email.com" bind:value={guestEmail} />
					</label>
					{#if selectedRoom}
						<p class="confirm-summary">Room: <strong>{selectedRoom}</strong></p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Navigation -->
		<div class="booking-nav">
			{#if bookingStep > 1}
				<button class="nav-btn nav-back" onclick={prevStep}>← Back</button>
			{:else}
				<span></span>
			{/if}
			{#if bookingStep < 3}
				<button class="nav-btn nav-next" onclick={nextStep}>Next →</button>
			{:else}
				<button class="nav-btn nav-confirm">Confirm Booking</button>
			{/if}
		</div>
	</div>
</section>

<!-- ════════════════════════════════════════════════════════════════════════
     FOOTER NAV
     ════════════════════════════════════════════════════════════════════════ -->
<footer class="demo-footer">
	<nav class="demo-nav-strip">
		<a href="/demo" class="demo-link">← All demos</a>
		{#each demos as slug}
			<a href="/{slug}" class="demo-link" class:demo-active={slug === 'morph'}>{slug}</a>
		{/each}
	</nav>
</footer>

<style>
	/* ── View Transition animations ──────────────────────────────────────────── */
	:global(::view-transition-old(root)) {
		animation: 0.3s ease-in vt-fade-out;
	}
	:global(::view-transition-new(root)) {
		animation: 0.3s ease-out vt-fade-in;
	}
	:global(::view-transition-group(card-1)),
	:global(::view-transition-group(card-2)),
	:global(::view-transition-group(card-3)),
	:global(::view-transition-group(card-4)),
	:global(::view-transition-group(card-5)),
	:global(::view-transition-group(card-6)) {
		animation-duration: 0.5s;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}
	:global(::view-transition-group(tab-content)) {
		animation-duration: 0.35s;
	}
	:global(::view-transition-group(tab-indicator)) {
		animation-duration: 0.3s;
		animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	:global(::view-transition-group(amenity-1)),
	:global(::view-transition-group(amenity-2)),
	:global(::view-transition-group(amenity-3)),
	:global(::view-transition-group(amenity-4)) {
		animation-duration: 0.45s;
		animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
	}
	:global(::view-transition-group(step-dot)) {
		animation-duration: 0.4s;
		animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	:global(::view-transition-group(price-display)) {
		animation-duration: 0.5s;
	}
	:global(::view-transition-group(booking-step)) {
		animation-duration: 0.35s;
	}

	@keyframes vt-fade-out {
		from { opacity: 1; }
		to   { opacity: 0; }
	}
	@keyframes vt-fade-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	/* @supports fallback — no-op, instant transitions already the default */
	@supports not (view-transition-name: none) {
		/* instant — no overrides needed, browser handles gracefully */
	}

	/* ── Global page reset ───────────────────────────────────────────────────── */
	:global(body) {
		background: #f0eee9 !important;
		color: #3a3a3a !important;
		overflow-x: hidden;
	}

	/* ── Support badge ───────────────────────────────────────────────────────── */
	.support-badge {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.55rem 1.5rem;
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(0,0,0,0.08);
	}
	.support-badge.supported {
		background: rgba(122, 158, 126, 0.15);
		color: #3d6642;
	}
	.support-badge.unsupported {
		background: rgba(192, 120, 80, 0.12);
		color: #7a4020;
	}
	.support-compat {
		margin-left: auto;
		opacity: 0.65;
		font-size: 0.72rem;
	}

	/* ── Hero ────────────────────────────────────────────────────────────────── */
	.hero {
		text-align: center;
		padding: 5rem 2rem 3.5rem;
		max-width: 680px;
		margin: 0 auto;
	}
	.hero-eyebrow {
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #7a9e7e;
		margin-bottom: 0.75rem;
	}
	.hero-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(2.2rem, 6vw, 3.6rem);
		font-weight: 700;
		line-height: 1.1;
		color: #2a2a2a;
		margin-bottom: 1.1rem;
	}
	.hero-sub {
		font-size: 1.05rem;
		line-height: 1.7;
		color: #5a5a5a;
	}

	/* ── Section wrapper ─────────────────────────────────────────────────────── */
	.demo-section {
		max-width: 860px;
		margin: 0 auto 5rem;
		padding: 0 1.5rem;
	}
	.section-header {
		margin-bottom: 2rem;
	}
	.section-tag {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #7a9e7e;
		background: rgba(122, 158, 126, 0.12);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		margin-bottom: 0.6rem;
	}
	.section-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.8rem;
		font-weight: 600;
		color: #2a2a2a;
		margin-bottom: 0.5rem;
	}
	.section-desc {
		font-size: 0.95rem;
		color: #606060;
		line-height: 1.6;
	}
	.section-desc code {
		font-family: 'Courier New', monospace;
		font-size: 0.85em;
		background: rgba(0,0,0,0.06);
		padding: 0.1em 0.4em;
		border-radius: 3px;
		color: #c07850;
	}

	/* ── Section 1 — Gallery ─────────────────────────────────────────────────── */
	.room-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	@media (max-width: 600px) {
		.room-grid { grid-template-columns: repeat(2, 1fr); }
	}

	.room-thumb {
		all: unset;
		cursor: pointer;
		border-radius: 12px;
		overflow: hidden;
		background: var(--grad);
		display: flex;
		flex-direction: column;
		box-shadow: 0 2px 12px rgba(0,0,0,0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.room-thumb:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 28px rgba(0,0,0,0.16);
	}
	.thumb-swatch {
		height: 120px;
		background: var(--grad);
	}
	.thumb-info {
		padding: 0.75rem 1rem;
		background: rgba(255,255,255,0.88);
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.thumb-name {
		font-size: 0.9rem;
		font-weight: 600;
		color: #2a2a2a;
	}
	.thumb-price {
		font-size: 0.78rem;
		color: #7a9e7e;
		font-weight: 500;
	}

	.room-detail {
		border-radius: 16px;
		overflow: hidden;
		background: #fff;
		box-shadow: 0 8px 48px rgba(0,0,0,0.14);
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
	@media (max-width: 600px) {
		.room-detail { grid-template-columns: 1fr; }
	}
	.detail-swatch {
		min-height: 280px;
		background: var(--grad);
	}
	.detail-body {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		position: relative;
	}
	.close-btn {
		all: unset;
		cursor: pointer;
		position: absolute;
		top: 1rem;
		right: 1rem;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(0,0,0,0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		color: #3a3a3a;
		transition: background 0.15s;
	}
	.close-btn:hover { background: rgba(0,0,0,0.16); }
	.detail-name {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.6rem;
		font-weight: 600;
		color: #2a2a2a;
		margin-bottom: 1rem;
		padding-right: 2.5rem;
	}
	.detail-desc {
		font-size: 0.95rem;
		line-height: 1.75;
		color: #505050;
		flex: 1;
	}
	.detail-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(0,0,0,0.08);
	}
	.detail-price {
		font-size: 1.2rem;
		font-weight: 700;
		color: #7a9e7e;
	}
	.book-btn {
		all: unset;
		cursor: pointer;
		background: #7a9e7e;
		color: #fff;
		padding: 0.6rem 1.2rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background 0.15s;
	}
	.book-btn:hover { background: #5e8462; }

	/* ── Section 2 — Tabs ────────────────────────────────────────────────────── */
	.tab-shell {
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 2px 20px rgba(0,0,0,0.08);
		overflow: hidden;
	}
	.tab-bar {
		display: flex;
		border-bottom: 1px solid rgba(0,0,0,0.08);
	}
	.tab-btn {
		all: unset;
		cursor: pointer;
		flex: 1;
		text-align: center;
		padding: 1rem 0.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		color: #888;
		position: relative;
		transition: color 0.2s;
	}
	.tab-btn.tab-active { color: #3a3a3a; font-weight: 600; }
	.tab-indicator {
		position: absolute;
		bottom: -1px;
		left: 10%;
		right: 10%;
		height: 3px;
		background: #7a9e7e;
		border-radius: 3px 3px 0 0;
	}
	.tab-content {
		padding: 2rem 2.5rem;
		min-height: 200px;
	}
	.tab-heading {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.4rem;
		font-weight: 600;
		color: #2a2a2a;
		margin-bottom: 0.75rem;
	}
	.tab-body {
		font-size: 0.95rem;
		line-height: 1.75;
		color: #505050;
		margin-bottom: 1rem;
	}
	.tab-detail {
		font-size: 0.8rem;
		letter-spacing: 0.06em;
		color: #7a9e7e;
		font-weight: 500;
	}

	/* ── Section 3 — List/Grid Toggle ───────────────────────────────────────── */
	.toggle-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.toggle-btn {
		all: unset;
		cursor: pointer;
		background: #7a9e7e;
		color: #fff;
		padding: 0.55rem 1.1rem;
		border-radius: 8px;
		font-size: 0.88rem;
		font-weight: 600;
		transition: background 0.15s;
	}
	.toggle-btn:hover { background: #5e8462; }
	.toggle-mode {
		font-size: 0.85rem;
		color: #888;
	}

	.amenity-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: none;
	}
	.amenity-wrap.is-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.amenity-card {
		background: #fff;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 1px 8px rgba(0,0,0,0.07);
	}
	.is-grid .amenity-card {
		flex-direction: column;
		align-items: flex-start;
		padding: 1.25rem;
	}
	.amenity-icon {
		font-size: 1.4rem;
		flex-shrink: 0;
		color: #7a9e7e;
	}
	.amenity-text {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.amenity-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #2a2a2a;
	}
	.amenity-detail {
		font-size: 0.82rem;
		color: #888;
	}

	/* ── Section 4 — Booking Flow ────────────────────────────────────────────── */
	.booking-shell {
		background: #fff;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 2px 20px rgba(0,0,0,0.08);
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.step-track {
		display: flex;
		align-items: center;
		gap: 0;
	}
	.step-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
	}
	.step-dot {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.82rem;
		font-weight: 700;
		border: 2px solid #ddd;
		background: #fff;
		color: #aaa;
		transition: border-color 0.2s, background 0.2s, color 0.2s;
	}
	.step-active .step-dot {
		background: #7a9e7e;
		border-color: #7a9e7e;
		color: #fff;
	}
	.step-done .step-dot {
		background: #c8dfc4;
		border-color: #7a9e7e;
		color: #3d6642;
	}
	.step-label {
		font-size: 0.72rem;
		font-weight: 500;
		color: #aaa;
		white-space: nowrap;
	}
	.step-active .step-label { color: #3a3a3a; }
	.step-done .step-label { color: #7a9e7e; }
	.step-line {
		flex: 1;
		height: 2px;
		background: #ddd;
		margin: 0 0.5rem;
		margin-bottom: 1.4rem;
	}
	.step-line.step-line-done { background: #7a9e7e; }

	.price-display {
		background: linear-gradient(135deg, #f0eee9, #e8e4de);
		border-radius: 12px;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		border: 1px solid rgba(122, 158, 126, 0.2);
	}
	.price-label {
		font-size: 0.8rem;
		color: #888;
		font-weight: 500;
	}
	.price-value {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.6rem;
		font-weight: 700;
		color: #7a9e7e;
	}
	.price-note {
		font-size: 0.78rem;
		color: #aaa;
	}

	.booking-step {
		min-height: 180px;
	}
	.step-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: #2a2a2a;
		margin-bottom: 1.25rem;
	}
	.date-fields,
	.confirm-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 480px) {
		.date-fields, .confirm-fields { grid-template-columns: 1fr; }
	}
	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.field-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.field-input {
		border: 1.5px solid #ddd;
		border-radius: 8px;
		padding: 0.6rem 0.9rem;
		font-size: 0.95rem;
		font-family: inherit;
		color: #3a3a3a;
		background: #fff;
		outline: none;
		transition: border-color 0.15s;
	}
	.field-input:focus { border-color: #7a9e7e; }

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.room-option {
		all: unset;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.9rem 1.1rem;
		border-radius: 10px;
		border: 1.5px solid #e0ddd8;
		background: #fff;
		transition: border-color 0.15s, background 0.15s;
	}
	.room-option:hover { border-color: #7a9e7e; background: #f6fbf6; }
	.room-option.room-selected { border-color: #7a9e7e; background: rgba(122, 158, 126, 0.08); }
	.room-option-name { font-size: 0.95rem; font-weight: 600; color: #2a2a2a; }
	.room-option-price { font-size: 0.88rem; color: #7a9e7e; font-weight: 500; }

	.confirm-summary {
		grid-column: 1 / -1;
		padding: 0.75rem 1rem;
		background: rgba(122, 158, 126, 0.1);
		border-radius: 8px;
		font-size: 0.9rem;
		color: #3d6642;
		border: 1px solid rgba(122, 158, 126, 0.2);
	}

	.booking-nav {
		display: flex;
		justify-content: space-between;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0,0,0,0.06);
	}
	.nav-btn {
		all: unset;
		cursor: pointer;
		padding: 0.65rem 1.4rem;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background 0.15s, color 0.15s;
	}
	.nav-back {
		background: rgba(0,0,0,0.05);
		color: #3a3a3a;
	}
	.nav-back:hover { background: rgba(0,0,0,0.1); }
	.nav-next, .nav-confirm {
		background: #7a9e7e;
		color: #fff;
	}
	.nav-next:hover, .nav-confirm:hover { background: #5e8462; }

	/* ── Footer nav ──────────────────────────────────────────────────────────── */
	.demo-footer {
		margin-top: 4rem;
		padding: 2rem 1.5rem;
		border-top: 1px solid rgba(0,0,0,0.08);
	}
	.demo-nav-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.6rem;
		justify-content: center;
		max-width: 860px;
		margin: 0 auto;
	}
	.demo-link {
		font-size: 0.78rem;
		color: #888;
		text-decoration: none;
		padding: 0.25rem 0.6rem;
		border-radius: 4px;
		transition: color 0.15s, background 0.15s;
	}
	.demo-link:hover { color: #3a3a3a; background: rgba(0,0,0,0.06); }
	.demo-active {
		color: #7a9e7e !important;
		font-weight: 600;
		background: rgba(122, 158, 126, 0.12) !important;
	}
</style>
