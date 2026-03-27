<script>
	import { onMount } from 'svelte';

	// ── 1. Heartbeat Favourite ─────────────────────────────────────────
	let liked = $state(false);
	let heartPop = $state(false);
	let ripple = $state(false);

	function toggleLike() {
		liked = !liked;
		heartPop = true;
		ripple = true;
		setTimeout(() => { heartPop = false; }, 400);
		setTimeout(() => { ripple = false; }, 600);
	}

	// ── 2. Button Loading State ────────────────────────────────────────
	let btnLoading = $state(false);
	let btnSuccess = $state(false);

	function reserveRoom() {
		if (btnLoading || btnSuccess) return;
		btnLoading = true;
		setTimeout(() => {
			btnLoading = false;
			btnSuccess = true;
			setTimeout(() => { btnSuccess = false; }, 3000);
		}, 2000);
	}

	// ── 3. Form Field Shake ────────────────────────────────────────────
	let emailVal = $state('');
	let shaking = $state(false);
	let showError = $state(false);

	function trySubmit() {
		const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim());
		if (!valid) {
			shaking = true;
			showError = true;
			setTimeout(() => { shaking = false; }, 420);
		} else {
			showError = false;
		}
	}

	// ── 4. Skeleton Loader ─────────────────────────────────────────────
	let skelLoading = $state(false);
	let skelDone = $state(false);

	function loadContent() {
		if (skelLoading || skelDone) return;
		skelLoading = true;
		setTimeout(() => {
			skelLoading = false;
			skelDone = true;
		}, 1500);
	}

	function resetSkel() {
		skelLoading = false;
		skelDone = false;
	}

	// ── 5. Magnetic Button ─────────────────────────────────────────────
	let magX = $state(0);
	let magY = $state(0);
	let isLeaving = $state(false);

	function onMagMove(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const dx = e.clientX - cx;
		const dy = e.clientY - cy;
		const max = 12;
		magX = Math.max(-max, Math.min(max, dx * 0.4));
		magY = Math.max(-max, Math.min(max, dy * 0.4));
		isLeaving = false;
	}

	function onMagLeave() {
		magX = 0;
		magY = 0;
		isLeaving = true;
	}

	// ── 6. Accordion ──────────────────────────────────────────────────
	let openAccordion = $state(-1);

	const faqs = [
		{ q: 'Is breakfast included?', a: 'Yes — a seasonal Norman breakfast is served each morning from 8–10am, featuring local cheeses, fresh bread, and homemade preserves.' },
		{ q: 'Do you allow early check-in?', a: 'Early check-in from 11am is available subject to availability. Just let us know when booking and we\'ll do our best to accommodate you.' },
		{ q: 'Are pets welcome?', a: 'Well-behaved dogs are very welcome at Marianne Cottage. We ask that they stay off the furniture and be kept on a lead in the orchard.' }
	];

	function toggleAccordion(i) {
		openAccordion = openAccordion === i ? -1 : i;
	}

	// ── 7. Rating Stars ───────────────────────────────────────────────
	let hoverStar = $state(0);
	let lockedStar = $state(0);
	let floatIdx = $state(-1);
	let showThanks = $state(false);

	function rateStar(i) {
		if (lockedStar) return;
		lockedStar = i;
		floatIdx = i;
		showThanks = true;
		setTimeout(() => { floatIdx = -1; }, 700);
	}

	// ── 8. Progress Stepper ───────────────────────────────────────────
	let step = $state(0);
	const steps = ['Details', 'Dates', 'Confirm'];

	function nextStep() {
		if (step < steps.length - 1) step += 1;
	}
	function resetStepper() { step = 0; }
</script>

<svelte:head>
	<title>Marianne Cottage — Purposeful Micro-interactions</title>
</svelte:head>

<div class="page">

	<!-- HEADER -->
	<header class="page-header">
		<p class="page-eyebrow">Design Trend</p>
		<h1 class="page-title">Purposeful Micro-interactions</h1>
		<p class="page-subtitle">Every element has a story. Eight patterns that make interfaces feel alive.</p>
	</header>

	<!-- GRID -->
	<main class="grid">

		<!-- 1. Heartbeat Favourite -->
		<div class="card">
			<p class="card-label">01 — Heartbeat Favourite</p>
			<p class="card-desc">Tactile feedback confirms emotional investment. The ripple ring communicates action radius.</p>
			<div class="card-demo center">
				<button class="heart-btn" onclick={toggleLike} aria-label="Favourite">
					{#if ripple}
						<span class="ripple-ring"></span>
					{/if}
					<svg
						class="heart-svg"
						class:popped={heartPop}
						class:liked
						viewBox="0 0 24 24"
						width="40"
						height="40"
						fill={liked ? '#e74c3c' : 'none'}
						stroke={liked ? '#e74c3c' : '#3a3a3a'}
						stroke-width="1.8"
					>
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
					</svg>
				</button>
				<p class="heart-label">{liked ? 'Saved to favourites' : 'Save this stay'}</p>
			</div>
		</div>

		<!-- 2. Button Loading State -->
		<div class="card">
			<p class="card-label">02 — Button Loading State</p>
			<p class="card-desc">Morphing from label → spinner → checkmark keeps context. No jarring layout shift.</p>
			<div class="card-demo center">
				<button
					class="reserve-btn"
					class:loading={btnLoading}
					class:success={btnSuccess}
					onclick={reserveRoom}
				>
					{#if btnLoading}
						<span class="spinner"></span>
					{:else if btnSuccess}
						<span class="check-wrap">
							<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"/>
							</svg>
							<span class="success-text">Reserved!</span>
						</span>
					{:else}
						Reserve Room
					{/if}
				</button>
			</div>
		</div>

		<!-- 3. Form Field Shake -->
		<div class="card">
			<p class="card-label">03 — Form Field Shake</p>
			<p class="card-desc">Error state delivered through motion, not just colour. The shake is a physical "no".</p>
			<div class="card-demo">
				<div class="shake-wrap">
					<input
						class="shake-input"
						class:shaking
						class:error={showError}
						type="email"
						placeholder="your@email.com"
						bind:value={emailVal}
						oninput={() => { if (showError && emailVal) showError = false; }}
					/>
					<div class="error-msg" class:visible={showError}>
						Please enter a valid email address
					</div>
				</div>
				<button class="continue-btn" onclick={trySubmit}>Continue</button>
			</div>
		</div>

		<!-- 4. Skeleton Loader -->
		<div class="card">
			<p class="card-label">04 — Skeleton Loader</p>
			<p class="card-desc">Shimmer placeholders set structural expectations. Content arrival feels earned, not sudden.</p>
			<div class="card-demo">
				{#if !skelLoading && !skelDone}
					<button class="load-btn" onclick={loadContent}>Load Content</button>
				{/if}
				{#if skelLoading}
					<div class="skeleton-block">
						<div class="skel-line wide"></div>
						<div class="skel-line mid"></div>
						<div class="skel-line narrow"></div>
					</div>
				{/if}
				{#if skelDone}
					<div class="skel-content">
						<p class="skel-title">La Suite Jardin</p>
						<p class="skel-body">Stone walls, morning light, and the sound of the orchard. A room that asks nothing of you.</p>
						<button class="reset-skel-btn" onclick={resetSkel}>Reset</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- 5. Magnetic Button -->
		<div class="card">
			<p class="card-label">05 — Magnetic Button</p>
			<p class="card-desc">Subtle gravitational pull rewards precise cursor movement. Snaps back with an overshoot spring.</p>
			<div class="card-demo center">
				<div
					class="mag-zone"
					onmousemove={onMagMove}
					onmouseleave={onMagLeave}
					role="none"
				>
					<button
						class="mag-btn"
						class:leaving={isLeaving}
						style="transform: translate({magX}px, {magY}px)"
					>
						Book a Stay
					</button>
				</div>
			</div>
		</div>

		<!-- 6. Accordion with Physics -->
		<div class="card">
			<p class="card-label">06 — Accordion with Physics</p>
			<p class="card-desc">Height animation implies content weight. Chevron rotation mirrors the reveal direction.</p>
			<div class="card-demo">
				{#each faqs as faq, i}
					<div class="accordion-item" class:open={openAccordion === i}>
						<button class="accordion-trigger" onclick={() => toggleAccordion(i)}>
							<span>{faq.q}</span>
							<svg
								class="chevron"
								class:rotated={openAccordion === i}
								viewBox="0 0 24 24"
								width="16"
								height="16"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="6 9 12 15 18 9"/>
							</svg>
						</button>
						<div class="accordion-body" class:expanded={openAccordion === i}>
							<p>{faq.a}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 7. Rating Stars -->
		<div class="card">
			<p class="card-label">07 — Rating Stars</p>
			<p class="card-desc">Progressive hover fill previews intent. The float-up reward confirms the action completed.</p>
			<div class="card-demo center">
				<div class="stars-wrap">
					{#each [1,2,3,4,5] as star}
						<div class="star-container">
							{#if floatIdx === star}
								<span class="float-up">+1</span>
							{/if}
							<button
								class="star-btn"
								class:filled={lockedStar ? star <= lockedStar : star <= hoverStar}
								class:locked={!!lockedStar}
								onmouseenter={() => { if (!lockedStar) hoverStar = star; }}
								onmouseleave={() => { if (!lockedStar) hoverStar = 0; }}
								onclick={() => rateStar(star)}
								aria-label="Rate {star} stars"
							>
								<svg viewBox="0 0 24 24" width="32" height="32">
									<polygon
										points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
										fill={lockedStar ? (star <= lockedStar ? '#7a9e7e' : 'none') : (star <= hoverStar ? '#7a9e7e' : 'none')}
										stroke="#7a9e7e"
										stroke-width="1.5"
									/>
								</svg>
							</button>
						</div>
					{/each}
				</div>
				{#if showThanks}
					<p class="thanks-text">Thank you for rating!</p>
				{/if}
			</div>
		</div>

		<!-- 8. Progress Stepper -->
		<div class="card">
			<p class="card-label">08 — Progress Stepper</p>
			<p class="card-desc">Connector fill externalises progress. Checkmarks celebrate completion of each stage.</p>
			<div class="card-demo">
				<div class="stepper">
					{#each steps as label, i}
						<div class="step-node" class:active={i === step} class:done={i < step}>
							<div class="step-circle">
								{#if i < step}
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="2.5">
										<polyline points="20 6 9 17 4 12"/>
									</svg>
								{:else}
									<span>{i + 1}</span>
								{/if}
							</div>
							<span class="step-label">{label}</span>
						</div>
						{#if i < steps.length - 1}
							<div class="step-connector">
								<div class="connector-fill" class:filled={i < step}></div>
							</div>
						{/if}
					{/each}
				</div>
				<div class="stepper-actions">
					{#if step < steps.length - 1}
						<button class="step-btn" onclick={nextStep}>Next →</button>
					{:else}
						<button class="step-btn success" onclick={resetStepper}>Start over</button>
					{/if}
				</div>
			</div>
		</div>

	</main>

	<!-- FOOTER NAV -->
	<footer class="demo-footer">
		<p class="demo-nav">
			<a href="/demo">← All demos</a> ·
			<a href="/brutal">brutal</a> ·
			<a href="/calm">calm</a> ·
			<a href="/bento">bento</a> ·
			<a href="/kinetic">kinetic</a> ·
			<a href="/adaptive">adaptive</a> ·
			<a href="/ambient">ambient</a> ·
			<a href="/context">context</a> ·
			<a href="/retro">retro</a> ·
			<a href="/expressive">expressive</a> ·
			<a href="/spatial">spatial</a> ·
			<strong><a href="/micro">micro</a></strong> ·
			<a href="/ergonomic">ergonomic</a> ·
			<a href="/liquid">liquid</a> ·
			<a href="/scroll-anim">scroll-anim</a> ·
			<a href="/morph">morph</a> ·
			<a href="/handmade">handmade</a> ·
			<a href="/iridescent">iridescent</a> ·
			<a href="/dday">dday</a>
		</p>
	</footer>

</div>

<style>
	/* ── PAGE ─────────────────────────────────────────────────────────── */
	.page {
		min-height: 100vh;
		padding: 4rem 2rem 3rem;
		max-width: 960px;
		margin: 0 auto;
	}

	/* ── HEADER ───────────────────────────────────────────────────────── */
	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-eyebrow {
		font-size: 0.7rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #7a9e7e;
		margin-bottom: 0.75rem;
		font-weight: 500;
	}

	.page-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: clamp(1.8rem, 5vw, 3rem);
		font-weight: 700;
		color: #2a2a2a;
		margin-bottom: 0.75rem;
		letter-spacing: -0.02em;
	}

	.page-subtitle {
		font-size: 0.95rem;
		color: #888;
		max-width: 46ch;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* ── GRID ─────────────────────────────────────────────────────────── */
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	@media (max-width: 640px) {
		.grid { grid-template-columns: 1fr; }
	}

	/* ── CARD ─────────────────────────────────────────────────────────── */
	.card {
		background: #fff;
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.card-label {
		font-size: 0.65rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		font-weight: 600;
		color: #7a9e7e;
	}

	.card-desc {
		font-size: 0.78rem;
		color: #999;
		line-height: 1.55;
		margin-bottom: 0.25rem;
	}

	.card-demo {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.5rem;
	}

	.card-demo.center {
		align-items: center;
		justify-content: center;
		min-height: 100px;
	}

	/* ── 1. HEART ─────────────────────────────────────────────────────── */
	.heart-btn {
		position: relative;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.heart-svg {
		transition: transform 0.1s ease;
		display: block;
	}

	.heart-svg.popped {
		animation: heart-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	@keyframes heart-pop {
		0%   { transform: scale(1); }
		40%  { transform: scale(1.35); }
		100% { transform: scale(1); }
	}

	.ripple-ring {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 2px solid #e74c3c;
		animation: ripple-ring 0.6s ease-out forwards;
		pointer-events: none;
	}

	@keyframes ripple-ring {
		0%   { transform: scale(1); opacity: 1; }
		100% { transform: scale(2.2); opacity: 0; }
	}

	.heart-label {
		font-size: 0.78rem;
		color: #aaa;
		margin-top: 0.25rem;
	}

	/* ── 2. RESERVE BUTTON ────────────────────────────────────────────── */
	.reserve-btn {
		background: #7a9e7e;
		color: #fff;
		border: none;
		border-radius: 100px;
		font-size: 0.9rem;
		font-weight: 500;
		padding: 0.7rem 2rem;
		cursor: pointer;
		width: 160px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
		overflow: hidden;
	}

	.reserve-btn:hover:not(.loading):not(.success) {
		background: #6a8e6e;
	}

	.reserve-btn.loading {
		width: 44px;
		padding: 0;
		background: #7a9e7e;
	}

	.reserve-btn.success {
		width: 160px;
		background: #5a8a5e;
	}

	.spinner {
		width: 18px;
		height: 18px;
		border: 2px solid rgba(255,255,255,0.4);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.check-wrap {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}

	.success-text {
		animation: fade-in 0.3s ease 0.15s both;
	}

	@keyframes scale-in {
		from { transform: scale(0.5); opacity: 0; }
		to   { transform: scale(1);   opacity: 1; }
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	/* ── 3. SHAKE FORM ────────────────────────────────────────────────── */
	.shake-wrap {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.shake-input {
		border: 1.5px solid #ddd;
		border-radius: 8px;
		padding: 0.6rem 0.85rem;
		font-size: 0.9rem;
		font-family: 'Inter', sans-serif;
		outline: none;
		transition: border-color 0.2s ease;
		background: #fafafa;
		color: #3a3a3a;
	}

	.shake-input:focus {
		border-color: #7a9e7e;
		background: #fff;
	}

	.shake-input.error {
		border-color: #c0392b;
		background: #fff5f5;
	}

	.shake-input.shaking {
		animation: shake 0.42s ease forwards;
	}

	@keyframes shake {
		0%   { transform: translateX(0); }
		15%  { transform: translateX(-6px); }
		35%  { transform: translateX(6px); }
		55%  { transform: translateX(-4px); }
		75%  { transform: translateX(4px); }
		100% { transform: translateX(0); }
	}

	.error-msg {
		font-size: 0.72rem;
		color: #c0392b;
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.3s ease, opacity 0.3s ease, margin-top 0.3s ease;
		opacity: 0;
		margin-top: 0;
	}

	.error-msg.visible {
		max-height: 2rem;
		opacity: 1;
		margin-top: 0.35rem;
	}

	.continue-btn {
		background: #3a3a3a;
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 0.6rem 1.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		align-self: flex-start;
		transition: background 0.2s ease;
	}

	.continue-btn:hover { background: #555; }

	/* ── 4. SKELETON ──────────────────────────────────────────────────── */
	.load-btn {
		background: none;
		border: 1.5px solid #7a9e7e;
		color: #7a9e7e;
		border-radius: 8px;
		padding: 0.55rem 1.2rem;
		font-size: 0.85rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		align-self: flex-start;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.load-btn:hover {
		background: #7a9e7e;
		color: #fff;
	}

	.skeleton-block {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.25rem 0;
	}

	.skel-line {
		height: 12px;
		border-radius: 6px;
		background: linear-gradient(90deg, #ece9e3 25%, #f5f2ee 50%, #ece9e3 75%);
		background-size: 200% 100%;
		animation: shimmer 1.5s linear infinite;
	}

	.skel-line.wide   { width: 80%; }
	.skel-line.mid    { width: 60%; }
	.skel-line.narrow { width: 40%; }

	@keyframes shimmer {
		0%   { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}

	.skel-content {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		animation: fade-in 0.5s ease forwards;
	}

	.skel-title {
		font-family: 'Playfair Display', Georgia, serif;
		font-size: 1rem;
		font-weight: 600;
		color: #2a2a2a;
	}

	.skel-body {
		font-size: 0.78rem;
		color: #888;
		line-height: 1.55;
	}

	.reset-skel-btn {
		background: none;
		border: none;
		color: #bbb;
		font-size: 0.72rem;
		cursor: pointer;
		padding: 0;
		margin-top: 0.25rem;
		font-family: 'Inter', sans-serif;
		text-decoration: underline;
	}

	.reset-skel-btn:hover { color: #888; }

	/* ── 5. MAGNETIC ──────────────────────────────────────────────────── */
	.mag-zone {
		width: 200px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: none;
	}

	.mag-btn {
		background: #2a2a2a;
		color: #f5f0e8;
		border: none;
		border-radius: 100px;
		padding: 0.65rem 1.6rem;
		font-size: 0.88rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		transition: transform 0.15s ease-out;
		white-space: nowrap;
	}

	.mag-btn.leaving {
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.mag-btn:hover {
		background: #444;
	}

	/* ── 6. ACCORDION ─────────────────────────────────────────────────── */
	.accordion-item {
		border-bottom: 1px solid #eee;
	}

	.accordion-item:last-child {
		border-bottom: none;
	}

	.accordion-trigger {
		width: 100%;
		background: none;
		border: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		font-size: 0.84rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		color: #3a3a3a;
		cursor: pointer;
		text-align: left;
		gap: 0.5rem;
	}

	.accordion-trigger:hover {
		color: #7a9e7e;
	}

	.chevron {
		flex-shrink: 0;
		transition: transform 0.3s ease;
		color: #aaa;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.accordion-body {
		max-height: 0;
		overflow: hidden;
		transition: max-height 0.35s ease;
	}

	.accordion-body.expanded {
		max-height: 120px;
	}

	.accordion-body p {
		font-size: 0.78rem;
		color: #888;
		line-height: 1.6;
		padding-bottom: 0.75rem;
	}

	/* ── 7. STARS ─────────────────────────────────────────────────────── */
	.stars-wrap {
		display: flex;
		gap: 0.15rem;
	}

	.star-container {
		position: relative;
	}

	.star-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease;
	}

	.star-btn:hover:not(.locked) {
		transform: scale(1.15);
	}

	.star-btn svg polygon {
		transition: fill 0.15s ease;
	}

	.float-up {
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		font-size: 0.7rem;
		font-weight: 600;
		color: #7a9e7e;
		pointer-events: none;
		animation: float-up 0.7s ease forwards;
		white-space: nowrap;
	}

	@keyframes float-up {
		0%   { transform: translateX(-50%) translateY(0);     opacity: 1; }
		100% { transform: translateX(-50%) translateY(-24px); opacity: 0; }
	}

	.thanks-text {
		font-size: 0.78rem;
		color: #7a9e7e;
		margin-top: 0.5rem;
		animation: fade-in 0.4s ease forwards;
	}

	/* ── 8. STEPPER ───────────────────────────────────────────────────── */
	.stepper {
		display: flex;
		align-items: center;
		gap: 0;
		margin-bottom: 1.25rem;
	}

	.step-node {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.step-circle {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #e0ddd8;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		font-weight: 600;
		color: #aaa;
		transition: background 0.3s ease, color 0.3s ease;
	}

	.step-node.active .step-circle {
		background: #7a9e7e;
		color: #fff;
	}

	.step-node.done .step-circle {
		background: #7a9e7e;
	}

	.step-label {
		font-size: 0.68rem;
		color: #bbb;
		font-weight: 400;
		transition: color 0.3s ease, font-weight 0.3s ease;
	}

	.step-node.active .step-label {
		color: #3a3a3a;
		font-weight: 600;
	}

	.step-node.done .step-label {
		color: #7a9e7e;
	}

	.step-connector {
		flex: 1;
		height: 2px;
		background: #e0ddd8;
		margin-bottom: 1.25rem;
		position: relative;
		overflow: hidden;
	}

	.connector-fill {
		position: absolute;
		inset: 0;
		background: #7a9e7e;
		width: 0;
		transition: width 0.4s ease;
	}

	.connector-fill.filled {
		width: 100%;
	}

	.stepper-actions {
		display: flex;
		gap: 0.75rem;
	}

	.step-btn {
		background: #7a9e7e;
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 0.55rem 1.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		font-family: 'Inter', sans-serif;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.step-btn:hover { background: #6a8e6e; }

	.step-btn.success {
		background: #5a8a5e;
	}

	/* ── FOOTER ───────────────────────────────────────────────────────── */
	.demo-footer {
		margin-top: 3rem;
		padding: 1.5rem 0 2rem;
		border-top: 1px solid #e0ddd8;
		text-align: center;
	}

	.demo-nav {
		font-size: 0.75rem;
		color: #bbb;
		line-height: 2;
	}

	.demo-nav a {
		color: #bbb;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.demo-nav a:hover {
		color: #7a9e7e;
	}

	.demo-nav strong a {
		color: #3a3a3a;
		font-weight: 600;
	}
</style>
