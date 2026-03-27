<script>
	import { onMount } from 'svelte';

	// ── Travel style definitions ──────────────────────────────────────────────
	const STYLES = {
		romantic: {
			id: 'romantic',
			label: 'Romantic Getaway',
			icon: '🌹',
			accent: '#c0748a',
			accentLight: '#f5e8ed',
			accentDark: '#8a4a60',
			headline: 'Your private hideaway awaits',
			subline: 'Two hearts, one timeless Normandy retreat — where every detail whispers romance.',
			room: 'Chambre Bleue',
			roomDesc: 'Our most intimate room, draped in soft blue linen with a private garden view.',
			pois: [
				{ name: 'Le Pressoir', type: 'Candlelit Restaurant', note: '8 min drive' },
				{ name: 'Château de Bénouville', type: 'Romantic Gardens', note: '12 min drive' },
				{ name: 'Domaine du Boisney', type: 'Vineyard Tour & Tasting', note: '20 min drive' },
				{ name: 'Côte de Nacre', type: 'Sunset Beach Walk', note: '15 min drive' }
			]
		},
		family: {
			id: 'family',
			label: 'Family Adventure',
			icon: '🌻',
			accent: '#e09b3d',
			accentLight: '#fdf3e0',
			accentDark: '#a06a1a',
			headline: 'Make memories together',
			subline: 'Wide open spaces, farmyard mornings, and coast-side adventures — built for families.',
			room: 'Garden Room',
			roomDesc: 'Ground-floor access to the garden, with extra beds and games for little explorers.',
			pois: [
				{ name: 'La Ferme de la Ranconnière', type: 'Working Farm Visit', note: '10 min drive' },
				{ name: 'Parc Zoologique de Lisieux', type: 'Nature Park', note: '25 min drive' },
				{ name: 'Plage de Ver-sur-Mer', type: 'Family Beach', note: '18 min drive' },
				{ name: 'Musée du Débarquement', type: 'Interactive History', note: '22 min drive' }
			]
		},
		historian: {
			id: 'historian',
			label: 'History Explorer',
			icon: '🏛️',
			accent: '#5a7a8a',
			accentLight: '#e5edf0',
			accentDark: '#3a5560',
			headline: 'Walk through centuries',
			subline: 'From tapestries to tank landings — Normandy's past is layered beneath every cobblestone.',
			room: 'Historian Suite',
			roomDesc: 'A curated library of local history, antique maps, and a writing desk facing the orchard.',
			pois: [
				{ name: 'Bayeux Tapestry', type: 'World Heritage Site', note: '5 min walk' },
				{ name: 'Mémorial de Caen', type: 'D-Day Museum', note: '30 min drive' },
				{ name: 'Château de Caen', type: 'Norman Château', note: '28 min drive' },
				{ name: 'American Cemetery, Colleville', type: 'D-Day Memorial', note: '35 min drive' }
			]
		},
		nature: {
			id: 'nature',
			label: 'Nature Escape',
			icon: '🌿',
			accent: '#7a9e7e',
			accentLight: '#e8f2e8',
			accentDark: '#4a6e4e',
			headline: 'Breathe. Explore. Restore.',
			subline: 'Apple orchards, sea-blown cliffs, and forest silence — let Normandy reset your rhythm.',
			room: 'The Loft',
			roomDesc: 'Vaulted beams and skylights frame a room where birdsong replaces alarm clocks.',
			pois: [
				{ name: 'GR223 Coastal Path', type: 'Cliff Walk', note: '20 min drive' },
				{ name: 'Vergers de la Côte Fleurie', type: 'Apple Orchards', note: '8 min drive' },
				{ name: 'Forêt de Cerisy', type: 'Ancient Forest Trails', note: '40 min drive' },
				{ name: 'Marais du Cotentin', type: 'Wetland Nature Reserve', note: '50 min drive' }
			]
		}
	};

	const STYLE_KEYS = Object.keys(STYLES);
	const LS_KEY = 'mc_travel_style';

	// ── State ─────────────────────────────────────────────────────────────────
	let selectedStyle = $state(null); // null = show onboarding
	let showBadge = $state(false);
	let contentVisible = $state(false);
	let badgeTimer = null;

	// Derived current style object
	const current = $derived(selectedStyle ? STYLES[selectedStyle] : null);

	// ── Actions ───────────────────────────────────────────────────────────────
	function selectStyle(key) {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(LS_KEY, key);
		}
		selectedStyle = key;
		contentVisible = false;
		showBadge = false;
		// Allow transition out, then show content
		setTimeout(() => {
			contentVisible = true;
			showBadge = true;
			if (badgeTimer) clearTimeout(badgeTimer);
			badgeTimer = setTimeout(() => {
				showBadge = false;
			}, 3000);
		}, 80);
	}

	function resetPrefs() {
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem(LS_KEY);
		}
		contentVisible = false;
		showBadge = false;
		setTimeout(() => {
			selectedStyle = null;
		}, 300);
	}

	// ── IntersectionObserver for POI cards ───────────────────────────────────
	let poiSection = $state(null);
	let poiVisible = $state(false);

	$effect(() => {
		if (!poiSection) return;
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					poiVisible = true;
					obs.disconnect();
				}
			},
			{ threshold: 0.15 }
		);
		obs.observe(poiSection);
		return () => obs.disconnect();
	});

	// Reset poiVisible when style changes so cards re-animate
	$effect(() => {
		if (selectedStyle) {
			poiVisible = false;
			// Re-trigger if already in view after a tick
			setTimeout(() => {
				if (poiSection) {
					const rect = poiSection.getBoundingClientRect();
					if (rect.top < window.innerHeight) poiVisible = true;
				}
			}, 200);
		}
	});

	// ── Mount: restore from localStorage ─────────────────────────────────────
	onMount(() => {
		const saved = localStorage.getItem(LS_KEY);
		if (saved && STYLES[saved]) {
			selectedStyle = saved;
			setTimeout(() => {
				contentVisible = true;
			}, 80);
		}
	});
</script>

<svelte:head>
	<title>Adaptive & Responsive — Marianne Cottage Demo</title>
</svelte:head>

<!-- ── Page shell ──────────────────────────────────────────────────────────── -->
<div class="page">

	<!-- ── Top bar ─────────────────────────────────────────────────────────── -->
	<header class="topbar" style={current ? `--accent: ${current.accent}; --accent-light: ${current.accentLight}; --accent-dark: ${current.accentDark};` : ''}>
		<span class="topbar__logo">Marianne Cottage</span>
		<span class="topbar__label">Adaptive Demo</span>

		{#if selectedStyle}
			<button class="reset-chip" onclick={resetPrefs}>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
					<path d="M2 6a4 4 0 1 0 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					<path d="M6 1L4 3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				Reset preferences
			</button>
		{/if}

		<!-- Saved badge -->
		<div class="badge" class:badge--visible={showBadge}>
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
				<path d="M4.5 7l1.8 1.8 3-3.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Preferences saved
		</div>
	</header>

	<!-- ── Onboarding ──────────────────────────────────────────────────────── -->
	{#if !selectedStyle}
		<section class="onboarding">
			<div class="onboarding__inner">
				<p class="onboarding__eyebrow">Hyper-Personalisation</p>
				<h1 class="onboarding__heading">What kind of escape<br>are you dreaming of?</h1>
				<p class="onboarding__sub">Tell us your travel style — we'll tailor the experience just for you.</p>

				<div class="style-grid">
					{#each STYLE_KEYS as key}
						{@const s = STYLES[key]}
						<button
							class="style-card"
							style="--accent: {s.accent}; --accent-light: {s.accentLight};"
							onclick={() => selectStyle(key)}
						>
							<span class="style-card__icon">{s.icon}</span>
							<span class="style-card__label">{s.label}</span>
							<span class="style-card__arrow">→</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Decorative blobs -->
			<div class="blob blob--a"></div>
			<div class="blob blob--b"></div>
		</section>

	{:else}
		<!-- ── Personalised content ─────────────────────────────────────────── -->
		<div
			class="personalised"
			class:personalised--visible={contentVisible}
			style="--accent: {current.accent}; --accent-light: {current.accentLight}; --accent-dark: {current.accentDark};"
		>

			<!-- ── Hero ──────────────────────────────────────────────────────── -->
			<section class="hero">
				<div class="hero__bg" style="background: {current.accentLight};"></div>
				<div class="hero__inner">
					<p class="hero__eyebrow">
						<span class="hero__icon">{current.icon}</span>
						{current.label}
					</p>
					<h1 class="hero__headline">{current.headline}</h1>
					<p class="hero__sub">{current.subline}</p>

					<div class="style-switcher">
						<span class="style-switcher__label">Switch style:</span>
						{#each STYLE_KEYS as key}
							<button
								class="style-pill"
								class:style-pill--active={key === selectedStyle}
								style="--pill-accent: {STYLES[key].accent};"
								onclick={() => selectStyle(key)}
							>
								{STYLES[key].icon} {STYLES[key].label}
							</button>
						{/each}
					</div>
				</div>

				<!-- Animated accent bar -->
				<div class="hero__bar"></div>
			</section>

			<!-- ── Featured Room ─────────────────────────────────────────────── -->
			<section class="feature">
				<div class="feature__inner">
					<div class="feature__text">
						<p class="feature__eyebrow">Featured Room</p>
						<h2 class="feature__title">{current.room}</h2>
						<p class="feature__desc">{current.roomDesc}</p>
						<a class="feature__cta" href="#rooms">
							View room details
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</a>
					</div>
					<div class="feature__room-card">
						<div class="room-card__img" style="background: {current.accentLight};"></div>
						<div class="room-card__badge" style="background: {current.accent};">{current.room}</div>
					</div>
				</div>
			</section>

			<!-- ── POI Recommendations ───────────────────────────────────────── -->
			<section class="pois" bind:this={poiSection}>
				<div class="pois__inner">
					<p class="pois__eyebrow">Curated for {current.label}</p>
					<h2 class="pois__heading">Places we think you'll love</h2>

					<div class="poi-grid">
						{#each current.pois as poi, i}
							<div
								class="poi-card"
								class:poi-card--visible={poiVisible}
								style="--delay: {i * 0.1}s;"
							>
								<div class="poi-card__accent" style="background: {current.accent};"></div>
								<div class="poi-card__body">
									<p class="poi-card__type">{poi.type}</p>
									<h3 class="poi-card__name">{poi.name}</h3>
									<p class="poi-card__note">{poi.note}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- ── Preference summary ────────────────────────────────────────── -->
			<section class="summary">
				<div class="summary__inner">
					<div class="summary__icon">{current.icon}</div>
					<div class="summary__text">
						<p class="summary__label">Your saved preference</p>
						<p class="summary__value">{current.label}</p>
						<p class="summary__hint">Stored in your browser — we'll remember next time.</p>
					</div>
					<button class="summary__reset" onclick={resetPrefs}>Change style</button>
				</div>
			</section>

		</div>
	{/if}

	<!-- ── Concept note ────────────────────────────────────────────────────── -->
	<aside class="concept-note">
		<strong>Design Trend:</strong> Adaptive & Responsive Systems — Hyper-Personalisation.
		Preferences persist via <code>localStorage</code>. Layout, color, content, and POIs
		all morph to match the declared travel style. Cards animate in staggered via
		IntersectionObserver.
	</aside>

	<!-- ── Demo footer nav ─────────────────────────────────────────────────── -->
	<nav class="demo-nav">
		<a href="/brutal">brutal</a>
		<span>·</span>
		<a href="/calm">calm</a>
		<span>·</span>
		<a href="/bento">bento</a>
		<span>·</span>
		<a href="/kinetic">kinetic</a>
		<span>·</span>
		<a href="/adaptive" aria-current="page">adaptive</a>
		<span>·</span>
		<a href="/ambient">ambient</a>
		<span>·</span>
		<a href="/context">context</a>
		<span>·</span>
		<a href="/retro">retro</a>
		<span>·</span>
		<a href="/expressive">expressive</a>
		<span>·</span>
		<a href="/spatial">spatial</a>
		<span>·</span>
		<a href="/micro">micro</a>
		<span>·</span>
		<a href="/ergonomic">ergonomic</a>
		<span>·</span>
		<a href="/liquid">liquid</a>
		<span>·</span>
		<a href="/scroll-anim">scroll-anim</a>
		<span>·</span>
		<a href="/morph">morph</a>
		<span>·</span>
		<a href="/handmade">handmade</a>
		<span>·</span>
		<a href="/iridescent">iridescent</a>
		<span>·</span>
		<a href="/dday">dday</a>
	</nav>
</div>

<style>
	/* ── CSS custom properties (defaults, overridden inline) ─────────────── */
	:root {
		--accent: #c0748a;
		--accent-light: #f5e8ed;
		--accent-dark: #8a4a60;
		--radius: 12px;
		--transition: 0.4s ease;
	}

	/* ── Page shell ───────────────────────────────────────────────────────── */
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ── Top bar ──────────────────────────────────────────────────────────── */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 24px;
		background: rgba(240, 238, 233, 0.88);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(0,0,0,0.07);
	}

	.topbar__logo {
		font-family: 'Playfair Display', serif;
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		color: #2a2a2a;
	}

	.topbar__label {
		font-size: 0.75rem;
		color: #888;
		background: #e8e5e0;
		padding: 2px 8px;
		border-radius: 20px;
	}

	.reset-chip {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		font-family: 'Inter', sans-serif;
		color: var(--accent-dark, #8a4a60);
		background: var(--accent-light, #f5e8ed);
		border: 1px solid var(--accent, #c0748a);
		border-radius: 20px;
		padding: 5px 12px;
		cursor: pointer;
		transition: background var(--transition), color var(--transition);
	}
	.reset-chip:hover {
		background: var(--accent, #c0748a);
		color: #fff;
	}

	/* ── Saved badge ──────────────────────────────────────────────────────── */
	.badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		color: var(--accent-dark, #8a4a60);
		background: var(--accent-light, #f5e8ed);
		border: 1px solid var(--accent, #c0748a);
		border-radius: 20px;
		padding: 5px 12px;
		opacity: 0;
		transform: translateY(-4px);
		transition: opacity 0.35s ease, transform 0.35s ease;
		pointer-events: none;
	}
	.badge--visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Onboarding ───────────────────────────────────────────────────────── */
	.onboarding {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		padding: 60px 24px;
	}

	.onboarding__inner {
		position: relative;
		z-index: 2;
		max-width: 640px;
		width: 100%;
		text-align: center;
	}

	.onboarding__eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #999;
		margin-bottom: 16px;
	}

	.onboarding__heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2rem, 5vw, 3.2rem);
		font-weight: 700;
		line-height: 1.15;
		color: #1a1a1a;
		margin-bottom: 16px;
	}

	.onboarding__sub {
		font-size: 1rem;
		color: #666;
		line-height: 1.6;
		margin-bottom: 48px;
	}

	/* ── Style selection grid ─────────────────────────────────────────────── */
	.style-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	@media (max-width: 480px) {
		.style-grid {
			grid-template-columns: 1fr;
		}
	}

	.style-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 20px 22px;
		background: #fff;
		border: 2px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		text-align: left;
		font-family: 'Inter', sans-serif;
		transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease, background 0.25s ease;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	.style-card:hover {
		border-color: var(--accent);
		background: var(--accent-light);
		box-shadow: 0 6px 24px rgba(0,0,0,0.1);
		transform: translateY(-2px);
	}
	.style-card:active {
		transform: translateY(0);
	}

	.style-card__icon {
		font-size: 1.75rem;
		flex-shrink: 0;
	}

	.style-card__label {
		font-size: 0.95rem;
		font-weight: 500;
		color: #2a2a2a;
		flex: 1;
	}

	.style-card__arrow {
		font-size: 1rem;
		color: var(--accent);
		opacity: 0;
		transform: translateX(-6px);
		transition: opacity 0.2s ease, transform 0.2s ease;
	}
	.style-card:hover .style-card__arrow {
		opacity: 1;
		transform: translateX(0);
	}

	/* ── Decorative blobs ─────────────────────────────────────────────────── */
	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		pointer-events: none;
		z-index: 1;
	}
	.blob--a {
		width: 400px;
		height: 400px;
		top: -100px;
		right: -80px;
		background: rgba(192, 116, 138, 0.12);
		animation: blobDrift 8s ease-in-out infinite alternate;
	}
	.blob--b {
		width: 320px;
		height: 320px;
		bottom: -60px;
		left: -40px;
		background: rgba(122, 158, 126, 0.12);
		animation: blobDrift 10s ease-in-out infinite alternate-reverse;
	}
	@keyframes blobDrift {
		from { transform: translate(0, 0) scale(1); }
		to   { transform: translate(20px, 15px) scale(1.06); }
	}

	/* ── Personalised content ─────────────────────────────────────────────── */
	.personalised {
		flex: 1;
		opacity: 0;
		transform: translateY(12px);
		transition: opacity var(--transition), transform var(--transition);
	}
	.personalised--visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* ── Hero section ─────────────────────────────────────────────────────── */
	.hero {
		position: relative;
		overflow: hidden;
		padding: 0;
	}

	.hero__bg {
		position: absolute;
		inset: 0;
		transition: background 0.5s ease;
		z-index: 0;
	}

	.hero__inner {
		position: relative;
		z-index: 2;
		max-width: 900px;
		margin: 0 auto;
		padding: 64px 32px 72px;
	}

	.hero__eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--accent-dark);
		background: rgba(255,255,255,0.7);
		padding: 5px 14px;
		border-radius: 20px;
		margin-bottom: 24px;
	}

	.hero__icon {
		font-size: 1rem;
	}

	.hero__headline {
		font-family: 'Playfair Display', serif;
		font-size: clamp(2.4rem, 6vw, 4rem);
		font-weight: 700;
		line-height: 1.1;
		color: #1a1a1a;
		margin-bottom: 20px;
		transition: opacity var(--transition), transform var(--transition);
	}

	.hero__sub {
		font-size: 1.05rem;
		line-height: 1.65;
		color: #444;
		max-width: 520px;
		margin-bottom: 40px;
	}

	/* Style switcher pills */
	.style-switcher {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.style-switcher__label {
		font-size: 0.75rem;
		color: #888;
		font-weight: 500;
		margin-right: 4px;
	}

	.style-pill {
		font-size: 0.75rem;
		font-family: 'Inter', sans-serif;
		padding: 5px 12px;
		border-radius: 20px;
		border: 1.5px solid rgba(0,0,0,0.12);
		background: rgba(255,255,255,0.7);
		cursor: pointer;
		color: #555;
		transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, transform 0.15s ease;
	}
	.style-pill:hover {
		border-color: var(--pill-accent);
		color: var(--pill-accent);
		transform: translateY(-1px);
	}
	.style-pill--active {
		background: var(--pill-accent);
		border-color: var(--pill-accent);
		color: #fff;
	}

	/* Accent bar at bottom of hero */
	.hero__bar {
		height: 4px;
		background: var(--accent);
		transition: background 0.5s ease;
		position: relative;
		z-index: 2;
	}

	/* ── Feature section ──────────────────────────────────────────────────── */
	.feature {
		padding: 72px 32px;
		background: #fff;
	}

	.feature__inner {
		max-width: 900px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 48px;
		align-items: center;
	}

	@media (max-width: 640px) {
		.feature__inner {
			grid-template-columns: 1fr;
		}
	}

	.feature__eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 12px;
		transition: color var(--transition);
	}

	.feature__title {
		font-family: 'Playfair Display', serif;
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 16px;
		line-height: 1.2;
	}

	.feature__desc {
		font-size: 0.95rem;
		line-height: 1.65;
		color: #555;
		margin-bottom: 28px;
	}

	.feature__cta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.88rem;
		font-weight: 500;
		color: var(--accent-dark);
		text-decoration: none;
		border-bottom: 1.5px solid var(--accent);
		padding-bottom: 2px;
		transition: color var(--transition), border-color var(--transition), gap 0.2s ease;
	}
	.feature__cta:hover {
		gap: 12px;
	}

	.feature__room-card {
		position: relative;
	}

	.room-card__img {
		height: 260px;
		border-radius: var(--radius);
		transition: background 0.5s ease;
		position: relative;
		overflow: hidden;
	}
	.room-card__img::after {
		content: '🛏';
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 4rem;
		opacity: 0.25;
	}

	.room-card__badge {
		position: absolute;
		bottom: -12px;
		left: 20px;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 600;
		padding: 6px 16px;
		border-radius: 20px;
		letter-spacing: 0.03em;
		box-shadow: 0 4px 12px rgba(0,0,0,0.18);
		transition: background var(--transition);
	}

	/* ── POI section ──────────────────────────────────────────────────────── */
	.pois {
		padding: 80px 32px;
		background: #f0eee9;
	}

	.pois__inner {
		max-width: 900px;
		margin: 0 auto;
	}

	.pois__eyebrow {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 12px;
		transition: color var(--transition);
	}

	.pois__heading {
		font-family: 'Playfair Display', serif;
		font-size: 1.8rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 40px;
	}

	.poi-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 20px;
	}

	@media (max-width: 560px) {
		.poi-grid {
			grid-template-columns: 1fr;
		}
	}

	.poi-card {
		display: flex;
		gap: 0;
		background: #fff;
		border-radius: var(--radius);
		overflow: hidden;
		box-shadow: 0 2px 10px rgba(0,0,0,0.06);
		opacity: 0;
		transform: translateY(20px);
		transition: opacity 0.45s ease var(--delay), transform 0.45s ease var(--delay), box-shadow 0.2s ease;
	}
	.poi-card--visible {
		opacity: 1;
		transform: translateY(0);
	}
	.poi-card:hover {
		box-shadow: 0 8px 28px rgba(0,0,0,0.12);
		transform: translateY(-2px);
	}

	.poi-card__accent {
		width: 4px;
		flex-shrink: 0;
		transition: background var(--transition);
	}

	.poi-card__body {
		padding: 20px 22px;
	}

	.poi-card__type {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent);
		margin-bottom: 6px;
		transition: color var(--transition);
	}

	.poi-card__name {
		font-family: 'Playfair Display', serif;
		font-size: 1.05rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 6px;
	}

	.poi-card__note {
		font-size: 0.78rem;
		color: #888;
	}

	/* ── Preference summary ───────────────────────────────────────────────── */
	.summary {
		padding: 48px 32px;
		background: #fff;
		border-top: 1px solid rgba(0,0,0,0.06);
	}

	.summary__inner {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 24px 28px;
		background: var(--accent-light);
		border-radius: var(--radius);
		border: 1px solid rgba(0,0,0,0.06);
		transition: background var(--transition);
	}

	@media (max-width: 560px) {
		.summary__inner {
			flex-direction: column;
			text-align: center;
		}
	}

	.summary__icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.summary__text {
		flex: 1;
	}

	.summary__label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--accent-dark);
		margin-bottom: 4px;
	}

	.summary__value {
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #1a1a1a;
		margin-bottom: 4px;
	}

	.summary__hint {
		font-size: 0.78rem;
		color: #777;
	}

	.summary__reset {
		font-family: 'Inter', sans-serif;
		font-size: 0.82rem;
		font-weight: 500;
		color: var(--accent-dark);
		background: transparent;
		border: 1.5px solid var(--accent);
		border-radius: 20px;
		padding: 8px 18px;
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
		flex-shrink: 0;
	}
	.summary__reset:hover {
		background: var(--accent);
		color: #fff;
	}

	/* ── Concept note ─────────────────────────────────────────────────────── */
	.concept-note {
		margin: 32px auto;
		max-width: 900px;
		padding: 16px 20px;
		background: rgba(0,0,0,0.03);
		border-left: 3px solid #ccc;
		border-radius: 0 6px 6px 0;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #666;
		width: calc(100% - 64px);
	}
	.concept-note code {
		background: rgba(0,0,0,0.06);
		padding: 1px 5px;
		border-radius: 3px;
		font-size: 0.76rem;
	}

	/* ── Demo nav ─────────────────────────────────────────────────────────── */
	.demo-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 6px 4px;
		padding: 20px 24px 28px;
		border-top: 1px solid rgba(0,0,0,0.07);
		font-size: 0.72rem;
	}

	.demo-nav a {
		color: #888;
		text-decoration: none;
		padding: 2px 5px;
		border-radius: 4px;
		transition: color 0.2s, background 0.2s;
	}
	.demo-nav a:hover {
		color: #2a2a2a;
		background: rgba(0,0,0,0.05);
	}
	.demo-nav a[aria-current='page'] {
		color: #2a2a2a;
		font-weight: 600;
	}

	.demo-nav span {
		color: #ccc;
		user-select: none;
	}
</style>
