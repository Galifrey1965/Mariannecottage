<script lang="ts">
	import { onMount } from 'svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let activeBeach = $state<string | null>(null);
	let typedText = $state('');
	let typedIndex = $state(0);
	let phraseIndex = $state(0);
	let visibleSections = $state<Set<string>>(new Set());
	let casualtyVisible = $state(false);
	let scrollProgress = $state(0);

	// ── Data ───────────────────────────────────────────────────────────────────
	const phrases = [
		'Nous sommes libres',
		'We shall fight on the beaches',
		'Vrijheid',
		'For those who fell'
	];

	const beaches = [
		{
			id: 'utah',
			name: 'UTAH',
			flag: '🇺🇸',
			nation: 'United States',
			x: 110, y: 155, w: 80, h: 28,
			color: '#1a3a6b',
			troops: '23,000',
			casualties: '<200',
			pct: 0.9,
			troopsRaw: 23000,
			casualtiesRaw: 200,
			fact: 'Currents swept forces 2 km south into lighter defences — an accidental advantage.'
		},
		{
			id: 'omaha',
			name: 'OMAHA',
			flag: '🇺🇸',
			nation: 'United States',
			x: 215, y: 170, w: 90, h: 28,
			color: '#8b1a1a',
			troops: '34,000',
			casualties: '2,400',
			pct: 7.1,
			troopsRaw: 34000,
			casualtiesRaw: 2400,
			fact: 'The bloodiest landing of D-Day — the German 352nd Division held 100-foot cliffs above the beach.'
		},
		{
			id: 'gold',
			name: 'GOLD',
			flag: '🇬🇧',
			nation: 'United Kingdom',
			x: 370, y: 170, w: 75, h: 28,
			color: '#b8860b',
			troops: '25,000',
			casualties: '~400',
			pct: 1.6,
			troopsRaw: 25000,
			casualtiesRaw: 400,
			fact: 'The Mulberry B harbour at Arromanches supplied 2.5 million men over 10 months.'
		},
		{
			id: 'juno',
			name: 'JUNO',
			flag: '🇨🇦',
			nation: 'Canada',
			x: 465, y: 162, w: 75, h: 28,
			color: '#8b0a2a',
			troops: '21,400',
			casualties: '1,200',
			pct: 5.6,
			troopsRaw: 21400,
			casualtiesRaw: 1200,
			fact: 'By nightfall, Canadians stood deeper into France than any other Allied division.'
		},
		{
			id: 'sword',
			name: 'SWORD',
			flag: '🇬🇧',
			nation: 'United Kingdom',
			x: 560, y: 155, w: 80, h: 28,
			color: '#1a4a8b',
			troops: '29,000',
			casualties: '630',
			pct: 2.2,
			troopsRaw: 29000,
			casualtiesRaw: 630,
			fact: 'French Commandos of No.4 Commando were first ashore at 07:32 — fighting on their own soil.'
		}
	];

	const activeBeachData = $derived(beaches.find(b => b.id === activeBeach) ?? null);

	const nations = [
		{
			id: 'british',
			flag: '🇬🇧',
			name: 'United Kingdom',
			beach: 'Gold · Sword · Pegasus Bridge',
			color: '#c41e3a',
			bg: 'rgba(196,30,58,0.06)',
			pullquote: 'We, once conquered by William, have now set free the Conqueror\'s native land.',
			attribution: '— Bayeux War Cemetery inscription',
			stats: [
				{ label: 'Gold Beach Troops', value: '25,000' },
				{ label: 'Casualties', value: '~400' },
				{ label: 'Men Supplied via Mulberry B', value: '2.5M' }
			],
			body: `The 50th (Northumbrian) Division landed Gold Beach at 07:25. Their primary objective: capture Bayeux and link with the Americans at Omaha. Unlike every other major Normandy city, Bayeux would survive the liberation intact — the Resistance had guided Allied planners away from bombing it.

At Arromanches, British engineers constructed Mulberry B — Port Winston — six miles of floating steel roadways anchored in open sea. Over the following ten months, 2.5 million men, 500,000 vehicles, and 4 million tonnes of supplies would pass through it. The harbour that wasn't there until they built it.`,
			box: {
				title: 'Operation Deadstick — Pegasus Bridge',
				content: '00:16, June 6. D Company, 2nd Battalion Oxfordshire and Buckinghamshire Light Infantry, six gliders, 181 men. The first glider landed 47 metres from the Caen Canal bridge. Both bridges captured in under 10 minutes. "The most outstanding achievement of the war," — Field Marshal Montgomery.'
			}
		},
		{
			id: 'american',
			flag: '🇺🇸',
			name: 'United States',
			beach: 'Omaha · Utah · Pointe du Hoc',
			color: '#002868',
			bg: 'rgba(0,40,104,0.06)',
			pullquote: 'Two kinds of people are staying on this beach — the dead and those who are going to die.',
			attribution: '— Col. George Taylor, Omaha Beach, June 6, 1944',
			stats: [
				{ label: 'Omaha Troops', value: '34,000' },
				{ label: 'Omaha Casualties', value: '~2,400' },
				{ label: 'Utah Casualties', value: '<200' }
			],
			body: `Utah Beach — 23,000 troops, fewer than 200 casualties. Strong tidal currents swept the first wave 2 km south of their intended landing zone, directly into lighter German defences. Brigadier-General Theodore Roosevelt Jr., the oldest man in the first wave at 56, walked the beach under fire and made the decision: "We'll start the war from right here." He was awarded the Medal of Honor.

Omaha was different. The German 352nd Infantry Division held fortified positions on 100-foot bluffs overlooking a killing ground of open sand. The 1st and 29th Infantry Divisions faced the deadliest landing of D-Day. Of the first wave, many never reached the waterline. By late morning, the beach was hours from potential abandonment.`,
			box: {
				title: 'Pointe du Hoc — The Rangers',
				content: 'Lt. Col. James Rudder\'s 2nd and 5th Ranger Battalions scaled 100-foot cliffs under direct fire, hand-over-hand on rope ladders, 40 minutes late due to heavy seas. Mission accomplished by 09:00. Of the 225 Rangers who assaulted the point, only 90 remained combat-effective by D+2. 50% became casualties.'
			}
		},
		{
			id: 'canadian',
			flag: '🇨🇦',
			name: 'Canada',
			beach: 'Juno Beach',
			color: '#ff0000',
			bg: 'rgba(255,0,0,0.05)',
			pullquote: 'By nightfall, the Canadians stood deeper into France than any other Allied division.',
			attribution: '— D-Day, June 6, 1944',
			stats: [
				{ label: 'Troops', value: '21,400' },
				{ label: 'Casualties', value: '1,200' },
				{ label: 'Killed', value: '340' }
			],
			body: `The 3rd Canadian Infantry Division landed across an 8 km stretch including Courseulles-sur-Mer and Bernières-sur-Mer. They faced stronger German fortifications than at neighbouring Gold and Sword — concrete gun emplacements, steel obstacles, mined waterways. The first landing crafts were torn apart before they reached shore.

One in eighteen Canadians became a casualty — the heaviest per-capita loss rate among Commonwealth forces that day. Yet by nightfall, the Canadians had advanced 9 km inland, further than any other Allied division. The advance cost dearly. But it held.

Many of the men who landed were the sons of veterans from the Great War — the second generation of Canadians to cross the Atlantic to defend a country most of them had never seen.`,
			box: null
		},
		{
			id: 'dutch',
			flag: '🇳🇱',
			name: 'Netherlands',
			beach: 'Princess Irene Brigade',
			color: '#ff6600',
			bg: 'rgba(255,102,0,0.05)',
			pullquote: 'Vrijheid.',
			attribution: '— Freedom',
			stats: [
				{ label: 'Landing Date', value: 'Aug 6, 1944' },
				{ label: 'Landing Site', value: 'Graye-sur-Mer' },
				{ label: 'Months Fighting', value: '11' }
			],
			body: `The Princess Irene Brigade — named for the granddaughter of Queen Wilhelmina — was formed from Dutch soldiers who escaped the Netherlands after the German invasion of May 10, 1940. They had left everything: families, homes, livelihoods. They trained in England for four years waiting for the moment to return.

Landing at Graye-sur-Mer on August 6, 1944, they fought alongside the 6th British Airborne Division through the hedgerows and marshland of Normandy. On August 26, they became the first Allied unit to liberate Pont-Audemer.

They would not set foot on Dutch soil until September 20, 1944 — at Borkel en Schaft. By the time the Netherlands was fully liberated in May 1945, more than 200,000 Dutch civilians had starved during the Hunger Winter. The men who landed in Normandy had known all along what they were fighting for.`,
			box: null
		},
		{
			id: 'french',
			flag: '🇫🇷',
			name: 'France',
			beach: 'Kieffer\'s Commandos · La Résistance',
			color: '#002395',
			bg: 'rgba(0,35,149,0.05)',
			pullquote: 'La France est libre!',
			attribution: '— June 6, 1944',
			stats: [
				{ label: 'French Commandos at Sword', value: '177' },
				{ label: 'Intel from Résistance', value: '~80%' },
				{ label: 'Bayeux Liberated', value: 'June 7' }
			],
			body: `Commandant Philippe Kieffer led 177 French commandos of the 1er Bataillon de Fusiliers Marins onto Sword Beach at 07:32. They were the first Frenchmen to fight on French soil in organised Allied action since 1940. Their objective: the casino at Riva-Bella, strongpoint WN18. They took it by 09:30.

Behind the lines, the Résistance had been working for years. Coordinated by Colonel Rémy's Confrérie de Notre Dame network, they provided Allied planners with maps, photographs, tide tables, German fortification positions, and daily intelligence reports. OSS Chief William Donovan credited them with approximately 80% of useful Normandy invasion intelligence.

Bayeux fell without a fight on June 7 — the Resistance had specifically warned Allied planners that the town need not be bombed, that German forces would withdraw. They were right. On June 14, General de Gaulle stepped onto liberated French soil for the first time in four years and gave his first speech in the town square.`,
			box: {
				title: 'De Gaulle at Bayeux — June 14, 1944',
				content: '"Bayeux! Une ville française, une ville normande — une ville normande libérée sur la terre de France." 15,000 residents filled the streets. The provisional capital of liberated France, for six weeks, until Paris fell on August 25.'
			}
		}
	];

	const memorialRows = [
		{ flag: '🇺🇸', beach: 'Utah', deployed: 23000, casualties: 200, pct: 0.9 },
		{ flag: '🇺🇸', beach: 'Omaha', deployed: 34000, casualties: 2400, pct: 7.1 },
		{ flag: '🇬🇧', beach: 'Gold', deployed: 25000, casualties: 400, pct: 1.6 },
		{ flag: '🇨🇦', beach: 'Juno', deployed: 21400, casualties: 1200, pct: 5.6 },
		{ flag: '🇬🇧', beach: 'Sword', deployed: 29000, casualties: 630, pct: 2.2 }
	];

	const allDemos = [
		'historian','living','nature','story','brutal','calm','bento','kinetic',
		'adaptive','ambient','context','retro','expressive','spatial','micro',
		'ergonomic','liquid','scroll-anim','morph','handmade','iridescent','dday'
	];

	// ── Typewriter ─────────────────────────────────────────────────────────────
	let typeTimer: ReturnType<typeof setTimeout>;
	let pauseTimer: ReturnType<typeof setTimeout>;

	function typeNextChar() {
		const phrase = phrases[phraseIndex];
		if (typedIndex < phrase.length) {
			typedText = phrase.slice(0, typedIndex + 1);
			typedIndex += 1;
			typeTimer = setTimeout(typeNextChar, 68);
		} else {
			pauseTimer = setTimeout(() => {
				// erase
				eraseChar();
			}, 2800);
		}
	}

	function eraseChar() {
		if (typedIndex > 0) {
			typedIndex -= 1;
			typedText = phrases[phraseIndex].slice(0, typedIndex);
			typeTimer = setTimeout(eraseChar, 38);
		} else {
			phraseIndex = (phraseIndex + 1) % phrases.length;
			typeTimer = setTimeout(typeNextChar, 400);
		}
	}

	// ── Animated counters ──────────────────────────────────────────────────────
	let casualtyCounters = $state(memorialRows.map(() => 0));
	let barsAnimated = $state(false);

	function animateCasualties() {
		if (barsAnimated) return;
		barsAnimated = true;
		memorialRows.forEach((row, i) => {
			const target = row.casualties;
			const duration = 1800;
			const start = performance.now();
			function tick(now: number) {
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				const eased = 1 - Math.pow(1 - progress, 3);
				casualtyCounters[i] = Math.round(eased * target);
				if (progress < 1) requestAnimationFrame(tick);
			}
			setTimeout(() => requestAnimationFrame(tick), i * 120);
		});
	}

	// ── Scroll progress (JS fallback) ──────────────────────────────────────────
	function handleScroll() {
		const el = document.documentElement;
		const total = el.scrollHeight - el.clientHeight;
		scrollProgress = total > 0 ? (el.scrollTop / total) * 100 : 0;
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────
	onMount(() => {
		// Typewriter start
		typeTimer = setTimeout(typeNextChar, 800);

		// Scroll progress fallback
		const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()');
		if (!supportsScrollTimeline) {
			window.addEventListener('scroll', handleScroll, { passive: true });
		}

		// IntersectionObserver for sections
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						const id = (e.target as HTMLElement).dataset.section;
						if (id) {
							visibleSections = new Set([...visibleSections, id]);
						}
						if (id === 'memorial') {
							casualtyVisible = true;
							animateCasualties();
						}
					}
				});
			},
			{ threshold: 0.12 }
		);

		document.querySelectorAll('[data-section]').forEach((el) => io.observe(el));

		return () => {
			clearTimeout(typeTimer);
			clearTimeout(pauseTimer);
			window.removeEventListener('scroll', handleScroll);
			io.disconnect();
		};
	});

	function isVisible(id: string) {
		return visibleSections.has(id);
	}
</script>

<svelte:head>
	<title>D-Day & The Liberation of Normandy · Marianne Cottage</title>
	<meta name="description" content="Five nations. Five beaches. One dawn that changed the world. The story of D-Day, June 6 1944." />
</svelte:head>

<!-- ── Progress bar ─────────────────────────────────────────────────────────── -->
<div class="progress-bar" style="width: {scrollProgress}%"></div>

<!-- ── Fixed header ─────────────────────────────────────────────────────────── -->
<header class="fixed-header">
	<span class="header-left">June 6, 1944</span>
	<span class="header-right">Normandy, France</span>
</header>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 1 · HERO
══════════════════════════════════════════════════════════════════ -->
<section class="hero" id="hero">
	<div class="hero-inner">
		<p class="hero-pre">OPERATION OVERLORD &nbsp;·&nbsp; 06:30 HOURS</p>
		<h1 class="hero-headline">The Longest Day</h1>
		<p class="hero-sub">Five nations. Five beaches. One dawn that changed the world.</p>
		<div class="typewriter-wrap" aria-live="polite">
			<span class="typewriter-text">{typedText}</span><span class="typewriter-cursor">|</span>
		</div>
	</div>

	<!-- Animated wave SVG -->
	<div class="wave-container" aria-hidden="true">
		<svg class="wave-svg" viewBox="0 0 1440 120" preserveAspectRatio="none">
			<path class="wave-path wave1" d="M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z" />
			<path class="wave-path wave2" d="M0,75 C360,35 540,95 720,75 C900,55 1080,95 1440,75 L1440,120 L0,120 Z" />
		</svg>
	</div>

	<!-- Scroll hint -->
	<div class="scroll-hint" aria-hidden="true">
		<span class="scroll-hint-label">Scroll</span>
		<span class="chevron">&#8964;</span>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 2 · MAP
══════════════════════════════════════════════════════════════════ -->
<section class="map-section" data-section="map">
	<div class="section-inner">
		<p class="section-num">02</p>
		<h2 class="section-heading">Five Beaches. Five Nations.</h2>
		<p class="section-sub">The Norman coastline, dawn of June 6, 1944.</p>

		<div class="map-wrap" class:visible={isVisible('map')}>
			<svg
				viewBox="0 0 800 340"
				class="coastline-svg"
				role="img"
				aria-label="Map of the D-Day landing beaches along the Normandy coast"
			>
				<!-- Sea fill -->
				<rect width="800" height="340" fill="#c8ddf0" />

				<!-- Land mass (rough Normandy) -->
				<path
					d="M0,200 C40,195 80,205 120,198 C160,192 180,185 220,188 C260,192 300,185 340,182 C380,180 420,178 460,176 C500,175 540,172 580,170 C620,168 660,165 700,162 C740,160 770,158 800,155 L800,340 L0,340 Z"
					fill="#e8dfc8"
					stroke="#bfaf90"
					stroke-width="1.5"
				/>

				<!-- Bocage texture lines (subtle) -->
				<g stroke="#d4c8a8" stroke-width="0.5" opacity="0.5">
					<line x1="100" y1="230" x2="200" y2="250" />
					<line x1="200" y1="230" x2="300" y2="245" />
					<line x1="300" y1="225" x2="420" y2="240" />
					<line x1="440" y1="220" x2="560" y2="235" />
					<line x1="580" y1="215" x2="680" y2="228" />
					<line x1="150" y1="280" x2="260" y2="295" />
					<line x1="350" y1="270" x2="470" y2="285" />
					<line x1="500" y1="265" x2="640" y2="278" />
				</g>

				<!-- Beach zones -->
				{#each beaches as b}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_interactive_supports_focus -->
					<g
						role="button"
						aria-label="{b.name} beach"
						onclick={() => activeBeach = activeBeach === b.id ? null : b.id}
						onmouseenter={() => activeBeach = b.id}
						onmouseleave={() => activeBeach = null}
						style="cursor: pointer;"
					>
						<rect
							x={b.x}
							y={b.y - 14}
							width={b.w}
							height={b.h}
							rx="4"
							fill={b.color}
							opacity={activeBeach === b.id ? 1 : 0.75}
							stroke={activeBeach === b.id ? '#fff' : 'none'}
							stroke-width="2"
						/>
						<text x={b.x + b.w / 2} y={b.y + 3} text-anchor="middle" font-family="monospace" font-size="9" font-weight="bold" fill="white" letter-spacing="1">{b.name}</text>
						<text x={b.x + b.w / 2} y={b.y - 20} text-anchor="middle" font-size="12">{b.flag}</text>
					</g>
				{/each}

				<!-- Cities -->
				<!-- Bayeux (gold star) -->
				<g>
					<circle cx="430" cy="248" r="6" fill="#c9a84c" stroke="#8b6914" stroke-width="1" />
					<text x="430" y="252" text-anchor="middle" font-size="8" fill="#8b6914">★</text>
					<text x="430" y="268" text-anchor="middle" font-family="monospace" font-size="9" fill="#6b4f10" font-weight="bold">BAYEUX</text>
				</g>

				<!-- Caen -->
				<g>
					<circle cx="560" cy="255" r="3.5" fill="#7a6a50" />
					<text x="560" y="272" text-anchor="middle" font-family="monospace" font-size="8" fill="#5a4a38">CAEN</text>
				</g>

				<!-- Cherbourg -->
				<g>
					<circle cx="55" cy="180" r="3.5" fill="#7a6a50" />
					<text x="55" y="172" text-anchor="middle" font-family="monospace" font-size="8" fill="#5a4a38">CHERBOURG</text>
				</g>

				<!-- Arromanches -->
				<g>
					<circle cx="390" cy="185" r="3" fill="#c9a84c" />
					<text x="390" y="177" text-anchor="middle" font-family="monospace" font-size="7.5" fill="#8b6914">ARROMANCHES</text>
				</g>

				<!-- Pegasus Bridge -->
				<g>
					<text x="618" y="192" text-anchor="middle" font-size="11">▲</text>
					<text x="618" y="208" text-anchor="middle" font-family="monospace" font-size="7" fill="#2a2a5a">PEGASUS</text>
					<text x="618" y="218" text-anchor="middle" font-family="monospace" font-size="7" fill="#2a2a5a">BRIDGE</text>
				</g>

				<!-- Pointe du Hoc -->
				<g>
					<text x="285" y="168" text-anchor="middle" font-size="10">⬛</text>
					<text x="285" y="182" text-anchor="middle" font-family="monospace" font-size="6.5" fill="#5a2a2a">POINTE DU HOC</text>
				</g>

				<!-- Sea labels -->
				<text x="80" y="130" text-anchor="middle" font-family="'Playfair Display', serif" font-size="13" fill="#4a6a8a" font-style="italic" opacity="0.7">English Channel</text>
				<text x="400" y="50" text-anchor="middle" font-family="'Playfair Display', serif" font-size="11" fill="#4a6a8a" font-style="italic" opacity="0.5">La Manche</text>

				<!-- Compass rose (simple) -->
				<g transform="translate(750,40)">
					<text x="0" y="-14" text-anchor="middle" font-family="monospace" font-size="8" fill="#6a6a7a">N</text>
					<line x1="0" y1="-12" x2="0" y2="12" stroke="#8a8a9a" stroke-width="1" />
					<line x1="-12" y1="0" x2="12" y2="0" stroke="#8a8a9a" stroke-width="1" />
					<polygon points="0,-12 -4,0 0,-4 4,0" fill="#4a4a5a" />
				</g>
			</svg>

			<!-- Beach tooltip card -->
			{#if activeBeachData}
				<div class="beach-card" style="border-left-color: {activeBeachData.color}">
					<div class="beach-card-header">
						<span class="beach-flag">{activeBeachData.flag}</span>
						<div>
							<h3 class="beach-card-name">{activeBeachData.name} BEACH</h3>
							<p class="beach-card-nation">{activeBeachData.nation}</p>
						</div>
					</div>
					<div class="beach-card-stats">
						<div class="beach-stat">
							<span class="beach-stat-label">Troops</span>
							<span class="beach-stat-val">{activeBeachData.troops}</span>
						</div>
						<div class="beach-stat">
							<span class="beach-stat-label">Casualties</span>
							<span class="beach-stat-val">{activeBeachData.casualties}</span>
						</div>
					</div>
					<p class="beach-card-fact">{activeBeachData.fact}</p>
				</div>
			{:else}
				<p class="map-hint">Hover or tap a beach to learn more</p>
			{/if}
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 3 · NATION CHAPTERS
══════════════════════════════════════════════════════════════════ -->
{#each nations as nation, i}
	<section
		class="nation-section"
		data-section={nation.id}
		style="--nation-color: {nation.color}; background: {nation.bg};"
	>
		<div class="section-inner nation-inner" class:visible={isVisible(nation.id)}>
			<div class="nation-left">
				<span class="nation-flag-large" aria-hidden="true">{nation.flag}</span>
				<h2 class="nation-name">{nation.name}</h2>
				<p class="nation-beach">{nation.beach}</p>
				<div class="nation-stats">
					{#each nation.stats as stat}
						<div class="stat-pill">
							<span class="stat-pill-val">{stat.value}</span>
							<span class="stat-pill-label">{stat.label}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="nation-right">
				<blockquote class="pull-quote">
					<p class="pull-quote-text">"{nation.pullquote}"</p>
					<footer class="pull-quote-attr">{nation.attribution}</footer>
				</blockquote>

				<div class="nation-body">
					{#each nation.body.split('\n\n') as para}
						<p>{para}</p>
					{/each}
				</div>

				{#if nation.box}
					<div class="nation-box" style="border-color: {nation.color};">
						<h4 class="nation-box-title">{nation.box.title}</h4>
						<p class="nation-box-content">{nation.box.content}</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
{/each}

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 4 · BAYEUX
══════════════════════════════════════════════════════════════════ -->
<section class="bayeux-section" data-section="bayeux">
	<div class="section-inner" class:visible={isVisible('bayeux')}>
		<p class="section-num">04</p>
		<h2 class="section-heading dark">Bayeux — La Ville Inviolée</h2>
		<p class="section-sub dark">The only major Normandy city untouched by war. Liberation without destruction.</p>

		<div class="bayeux-columns">
			<div class="bayeux-col">
				<div class="bayeux-col-date">June 7, 1944</div>
				<h3 class="bayeux-col-title">The First Town Freed</h3>
				<p>The British 50th Division entered Bayeux at dawn. 15,000 residents lined the streets, many weeping. No bombs had fallen. The Resistance had done their work — guided Allied planners away from striking the town. Bayeux became the first French town of significance to be liberated.</p>
			</div>
			<div class="bayeux-col">
				<div class="bayeux-col-date">4,648 Graves</div>
				<h3 class="bayeux-col-title">The War Cemetery</h3>
				<p>The largest Commonwealth World War II cemetery in France, completed 1952. Its Latin inscription spans the entrance: <em>Nos a Gulielmo victi victoris patriam liberavimus</em> — "We, once conquered by William, have now set free the Conqueror's native land." 878 years lay between the two crossings.</p>
			</div>
			<div class="bayeux-col">
				<div class="bayeux-col-date">June 14, 1944</div>
				<h3 class="bayeux-col-title">De Gaulle Returns</h3>
				<p>General de Gaulle lands in Normandy and drives to Bayeux. He gives his first speech on liberated French soil to 15,000 citizens gathered in the town square. Bayeux becomes the provisional capital of liberated France — until Paris falls on August 25.</p>
			</div>
		</div>

		<!-- Timeline bar -->
		<div class="timeline-bar">
			<div class="timeline-track">
				<div class="timeline-event">
					<div class="timeline-dot t-start"></div>
					<div class="timeline-label">June 6<br><span>D-Day</span></div>
				</div>
				<div class="timeline-line"></div>
				<div class="timeline-event">
					<div class="timeline-dot t-bayeux"></div>
					<div class="timeline-label">June 7<br><span>Bayeux</span></div>
				</div>
				<div class="timeline-line"></div>
				<div class="timeline-event">
					<div class="timeline-dot t-degaulle"></div>
					<div class="timeline-label">June 14<br><span>De Gaulle</span></div>
				</div>
				<div class="timeline-line"></div>
				<div class="timeline-event">
					<div class="timeline-dot t-caen"></div>
					<div class="timeline-label">July 21<br><span>Caen</span></div>
				</div>
				<div class="timeline-line"></div>
				<div class="timeline-event">
					<div class="timeline-dot t-paris"></div>
					<div class="timeline-label">Aug 25<br><span>Paris</span></div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 5 · THE TAPESTRY'S WAR
══════════════════════════════════════════════════════════════════ -->
<section class="tapestry-section" data-section="tapestry">
	<div class="section-inner" class:visible={isVisible('tapestry')}>
		<p class="section-num muted-gold">05</p>
		<h2 class="section-heading gold">The Tapestry That Almost Didn't Survive</h2>
		<p class="section-sub aged">878 years after it was made, the Bayeux Tapestry faced its greatest threat.</p>

		<div class="tapestry-timeline">
			{#each [
				{ year: '1940', text: 'Germany occupies Normandy. Himmler\'s SS Ahnenerbe division begins studying the tapestry as "evidence of Norman supremacy" — a medieval propaganda tool.' },
				{ year: 'June 27, 1944', text: 'Gestapo removes the tapestry from Bayeux and transports it to the Louvre in Paris — ostensibly for "safekeeping." The real intention is unclear. So is the destination.' },
				{ year: 'August 18, 1944', text: 'Himmler orders the tapestry taken to Berlin. An 11th-century artefact, 70 metres of embroidered linen, to become a trophy in the Reich.' },
				{ year: 'August 22, 1944', text: 'SS officers arrive at the Louvre to seize it. They find the Louvre already under French control — the liberation of Paris has begun. The tapestry cannot be moved.' },
				{ year: 'August 25, 1944', text: 'Paris is liberated. The tapestry is safe. It will never leave France again under duress.' },
				{ year: '1945', text: 'The tapestry returns to Bayeux, to the city it has called home since the 11th century. It is still there.' }
			] as item, idx}
				<div class="tap-entry" class:visible={isVisible('tapestry')} style="transition-delay: {idx * 100}ms">
					<div class="tap-year">{item.year}</div>
					<div class="tap-dot"></div>
					<div class="tap-text">{item.text}</div>
				</div>
			{/each}
		</div>

		<blockquote class="tapestry-closing">
			<p>"The same thread that wove the Norman Conquest survived the attempt to rewrite its meaning. It returned home, like the men who freed it."</p>
		</blockquote>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 6 · MEMORIAL
══════════════════════════════════════════════════════════════════ -->
<section class="memorial-section" data-section="memorial">
	<div class="section-inner" class:visible={isVisible('memorial')}>
		<p class="section-num muted-gold">06</p>
		<h2 class="section-heading gold">Those Who Came. Those Who Fell.</h2>

		<div class="casualty-chart">
			{#each memorialRows as row, i}
				<div class="chart-row" class:visible={casualtyVisible} style="transition-delay: {i * 100}ms">
					<div class="chart-meta">
						<span class="chart-flag">{row.flag}</span>
						<span class="chart-beach">{row.beach}</span>
					</div>
					<div class="chart-bars">
						<div class="bar-wrap">
							<div class="bar-label">Deployed</div>
							<div class="bar-track">
								<div
									class="bar-fill bar-deployed"
									class:animated={casualtyVisible}
									style="--target-width: {(row.deployed / 34000) * 100}%;"
								></div>
							</div>
							<span class="bar-num">{row.deployed.toLocaleString()}</span>
						</div>
						<div class="bar-wrap">
							<div class="bar-label">Casualties</div>
							<div class="bar-track">
								<div
									class="bar-fill bar-casualties"
									class:animated={casualtyVisible}
									style="--target-width: {(row.casualties / 34000) * 100}%;"
								></div>
							</div>
							<span class="bar-num casualties-num">{casualtyCounters[i].toLocaleString()}</span>
							<span class="bar-pct">({row.pct}%)</span>
						</div>
					</div>
				</div>
			{/each}

			<div class="chart-total">
				<div class="total-label">Total — All Beaches</div>
				<div class="total-values">
					<span>132,400 deployed</span>
					<span class="total-sep">·</span>
					<span class="total-cas">4,830+ casualties</span>
				</div>
			</div>
		</div>

		<blockquote class="memorial-quote">
			<p>"They gave tomorrow so we could have today."</p>
		</blockquote>

		<div class="cta-block">
			<p class="cta-text">Bayeux awaits. The beaches, the cemetery, the cathedral — all within reach of Marianne Cottage.</p>
			<a href="/" class="cta-btn">Plan your visit</a>
			<p class="cta-small">Open all year &nbsp;·&nbsp; 5 minutes from Bayeux War Cemetery</p>
		</div>
	</div>
</section>

<!-- ══════════════════════════════════════════════════════════════════
     SECTION 7 · FOOTER NAV
══════════════════════════════════════════════════════════════════ -->
<a href="/demo" class="demo-home-btn" title="Back to demo home">
	<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
	<span>Demo home</span>
</a>

<style>
	/* ── Reset & base ──────────────────────────────────────────────────────── */
	:global(html) { scroll-behavior: smooth; }

	/* ── Progress bar ─────────────────────────────────────────────────────── */
	.progress-bar {
		position: fixed;
		top: 0; left: 0;
		height: 3px;
		background: linear-gradient(90deg, #c9a84c, #e8c96c, #c9a84c);
		z-index: 1000;
		transition: width 0.1s linear;
		pointer-events: none;
	}

	@supports (animation-timeline: scroll()) {
		.progress-bar {
			width: 100% !important;
			transform-origin: left;
			transform: scaleX(0);
			animation: progress-grow linear;
			animation-timeline: scroll(root);
			transition: none;
		}
		@keyframes progress-grow {
			from { transform: scaleX(0); }
			to   { transform: scaleX(1); }
		}
	}

	/* ── Fixed header ──────────────────────────────────────────────────────── */
	.fixed-header {
		position: fixed;
		top: 0; left: 0; right: 0;
		height: 40px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 1.5rem;
		z-index: 900;
		background: rgba(13,17,23,0.75);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-bottom: 1px solid rgba(201,168,76,0.15);
	}
	.header-left,
	.header-right {
		font-family: 'Courier New', monospace;
		font-size: 0.65rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #c9a84c;
	}

	/* ── Shared section utilities ──────────────────────────────────────────── */
	.section-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 5rem 2rem;
	}
	.section-num {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #8a7a5a;
		margin-bottom: 0.5rem;
	}
	.section-num.muted-gold { color: #a08040; }
	.section-heading {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 700;
		color: #1a1a1a;
		line-height: 1.15;
		margin-bottom: 0.75rem;
	}
	.section-heading.dark { color: #2a1a08; }
	.section-heading.gold { color: #c9a84c; }
	.section-sub {
		font-size: 1.05rem;
		color: #6a6a6a;
		margin-bottom: 2.5rem;
		line-height: 1.5;
	}
	.section-sub.dark  { color: #5a4a30; }
	.section-sub.aged  { color: #a08050; }

	/* ── HERO ─────────────────────────────────────────────────────────────── */
	.hero {
		min-height: 100vh;
		background: #0d1117;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: relative;
		overflow: hidden;
		padding-top: 40px;
	}
	.hero-inner {
		text-align: center;
		z-index: 2;
		padding: 2rem;
		max-width: 820px;
	}
	.hero-pre {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.25em;
		color: #c9a84c;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
	}
	.hero-headline {
		font-family: 'Playfair Display', serif;
		font-size: clamp(3rem, 9vw, 7rem);
		font-weight: 700;
		color: #f0e6d0;
		line-height: 1.0;
		margin-bottom: 1.2rem;
		text-shadow: 0 2px 40px rgba(201,168,76,0.2);
	}
	.hero-sub {
		font-family: 'Inter', sans-serif;
		font-size: clamp(1rem, 2.2vw, 1.3rem);
		color: #b0a090;
		margin-bottom: 2.5rem;
		letter-spacing: 0.02em;
		line-height: 1.5;
	}
	.typewriter-wrap {
		min-height: 2.4rem;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2px;
	}
	.typewriter-text {
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: clamp(1.1rem, 2.5vw, 1.5rem);
		color: #c9a84c;
		letter-spacing: 0.03em;
	}
	.typewriter-cursor {
		font-size: 1.4rem;
		color: #c9a84c;
		animation: blink 0.9s step-end infinite;
	}
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	/* Wave */
	.wave-container {
		position: absolute;
		bottom: 0; left: 0; right: 0;
		height: 120px;
		z-index: 1;
	}
	.wave-svg {
		width: 100%;
		height: 100%;
	}
	.wave-path {
		opacity: 0.18;
	}
	.wave1 {
		fill: #4a7a9b;
		animation: wave-move 8s ease-in-out infinite;
	}
	.wave2 {
		fill: #2a5a7b;
		animation: wave-move 6s ease-in-out infinite reverse;
	}
	@keyframes wave-move {
		0%   { d: path("M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z"); }
		50%  { d: path("M0,40 C240,80 480,20 720,55 C960,90 1200,30 1440,50 L1440,120 L0,120 Z"); }
		100% { d: path("M0,60 C240,20 480,100 720,60 C960,20 1200,100 1440,60 L1440,120 L0,120 Z"); }
	}

	/* Scroll hint */
	.scroll-hint {
		position: absolute;
		bottom: 130px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		z-index: 3;
	}
	.scroll-hint-label {
		font-family: 'Courier New', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.2em;
		color: #6a6050;
		text-transform: uppercase;
	}
	.chevron {
		font-size: 1.6rem;
		color: #c9a84c;
		animation: bounce-down 1.8s ease-in-out infinite;
	}
	@keyframes bounce-down {
		0%, 100% { transform: translateY(0); opacity: 0.7; }
		50% { transform: translateY(8px); opacity: 1; }
	}

	/* ── MAP SECTION ─────────────────────────────────────────────────────── */
	.map-section {
		background: #f5ede0;
		padding: 0;
	}
	.map-wrap {
		opacity: 0;
		transform: scale(0.97);
		transition: opacity 0.7s ease, transform 0.7s ease;
	}
	.map-wrap.visible {
		opacity: 1;
		transform: scale(1);
	}
	.coastline-svg {
		width: 100%;
		height: auto;
		border-radius: 8px;
		box-shadow: 0 4px 32px rgba(0,0,0,0.12);
		border: 1px solid #c8b890;
		display: block;
	}
	.beach-card {
		margin-top: 1.5rem;
		padding: 1.25rem 1.5rem;
		background: white;
		border-left: 4px solid #c9a84c;
		border-radius: 6px;
		box-shadow: 0 2px 16px rgba(0,0,0,0.08);
		animation: card-in 0.25s ease;
	}
	@keyframes card-in {
		from { opacity: 0; transform: translateY(6px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.beach-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.beach-flag { font-size: 1.8rem; }
	.beach-card-name {
		font-family: 'Courier New', monospace;
		font-size: 1rem;
		font-weight: bold;
		letter-spacing: 0.1em;
		color: #1a1a1a;
	}
	.beach-card-nation {
		font-size: 0.8rem;
		color: #8a7a6a;
		margin-top: 1px;
	}
	.beach-card-stats {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 0.75rem;
	}
	.beach-stat { display: flex; flex-direction: column; }
	.beach-stat-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #9a8a7a;
		font-family: 'Courier New', monospace;
	}
	.beach-stat-val {
		font-size: 1.05rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: #1a1a1a;
	}
	.beach-card-fact {
		font-size: 0.9rem;
		color: #5a5a5a;
		line-height: 1.55;
		font-style: italic;
	}
	.map-hint {
		margin-top: 1rem;
		text-align: center;
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: #9a8a6a;
	}

	/* ── NATION SECTIONS ─────────────────────────────────────────────────── */
	.nation-section {
		min-height: 100vh;
		display: flex;
		align-items: center;
		border-top: 1px solid rgba(0,0,0,0.06);
	}
	.nation-inner {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 4rem;
		align-items: start;
		opacity: 0;
		transform: translateY(40px);
		transition: opacity 0.7s ease, transform 0.7s ease;
	}
	.nation-inner.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.nation-left { position: sticky; top: 5rem; }
	.nation-flag-large {
		display: block;
		font-size: 6rem;
		line-height: 1;
		margin-bottom: 0.75rem;
	}
	.nation-name {
		font-family: 'Playfair Display', serif;
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 700;
		color: var(--nation-color);
		line-height: 1.1;
		margin-bottom: 0.4rem;
	}
	.nation-beach {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		color: #7a6a5a;
		text-transform: uppercase;
		margin-bottom: 1.5rem;
	}
	.nation-stats {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.stat-pill {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 0.75rem;
		background: white;
		border-radius: 6px;
		border-left: 3px solid var(--nation-color);
		box-shadow: 0 1px 6px rgba(0,0,0,0.06);
	}
	.stat-pill-val {
		font-size: 1.1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--nation-color);
		line-height: 1.1;
	}
	.stat-pill-label {
		font-size: 0.68rem;
		color: #8a7a6a;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		margin-top: 1px;
	}
	.pull-quote {
		border: none;
		padding: 1.5rem 0 1.5rem 1.5rem;
		border-left: 3px solid var(--nation-color);
		margin-bottom: 2rem;
	}
	.pull-quote-text {
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: clamp(1.1rem, 2.2vw, 1.45rem);
		color: #2a2a2a;
		line-height: 1.55;
		margin-bottom: 0.5rem;
	}
	.pull-quote-attr {
		font-size: 0.8rem;
		color: #8a7a6a;
		font-style: normal;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
	}
	.nation-body {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		margin-bottom: 2rem;
	}
	.nation-body p {
		font-size: 1rem;
		line-height: 1.75;
		color: #3a3a3a;
	}
	.nation-box {
		padding: 1.25rem 1.5rem;
		background: rgba(255,255,255,0.7);
		border: 1px solid;
		border-radius: 6px;
		backdrop-filter: blur(4px);
	}
	.nation-box-title {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #5a4a3a;
		margin-bottom: 0.6rem;
	}
	.nation-box-content {
		font-size: 0.92rem;
		line-height: 1.65;
		color: #4a4a4a;
	}

	/* ── BAYEUX SECTION ──────────────────────────────────────────────────── */
	.bayeux-section {
		background: #f5efe0;
		padding: 0;
	}
	.bayeux-section .section-inner {
		opacity: 0;
		transform: translateY(30px);
		transition: opacity 0.7s ease, transform 0.7s ease;
	}
	.bayeux-section .section-inner.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.bayeux-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		margin-bottom: 3rem;
	}
	.bayeux-col {
		padding: 1.5rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 16px rgba(0,0,0,0.07);
		border-top: 3px solid #c9a84c;
	}
	.bayeux-col-date {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		color: #c9a84c;
		margin-bottom: 0.5rem;
	}
	.bayeux-col-title {
		font-family: 'Playfair Display', serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #2a1a08;
		margin-bottom: 0.75rem;
		line-height: 1.25;
	}
	.bayeux-col p {
		font-size: 0.9rem;
		line-height: 1.7;
		color: #4a3a28;
	}
	.bayeux-col em {
		font-style: italic;
		color: #6a4a20;
	}

	/* Timeline bar */
	.timeline-bar {
		padding: 2rem 0 0.5rem;
	}
	.timeline-track {
		display: flex;
		align-items: center;
		gap: 0;
		overflow-x: auto;
		padding: 0.5rem 0 1rem;
	}
	.timeline-event {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}
	.timeline-dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid #c9a84c;
	}
	.t-start   { background: #2a4a8a; }
	.t-bayeux  { background: #c9a84c; }
	.t-degaulle { background: #3a8a3a; }
	.t-caen    { background: #8a3a3a; }
	.t-paris   { background: #1a1a8a; }
	.timeline-label {
		font-family: 'Courier New', monospace;
		font-size: 0.68rem;
		text-align: center;
		color: #6a5a3a;
		letter-spacing: 0.05em;
		line-height: 1.3;
	}
	.timeline-label span {
		font-weight: bold;
		color: #3a2a10;
	}
	.timeline-line {
		flex: 1;
		min-width: 2rem;
		height: 2px;
		background: linear-gradient(90deg, #c9a84c, #e8d090);
		flex-shrink: 0;
	}

	/* ── TAPESTRY SECTION ────────────────────────────────────────────────── */
	.tapestry-section {
		background: #1a1208;
		padding: 0;
	}
	.tapestry-section .section-inner {
		opacity: 0;
		transform: translateY(30px);
		transition: opacity 0.8s ease, transform 0.8s ease;
	}
	.tapestry-section .section-inner.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.tapestry-timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 2.5rem 0;
		border-left: 2px solid #5a4010;
		padding-left: 2rem;
	}
	.tap-entry {
		display: grid;
		grid-template-columns: 130px 16px 1fr;
		gap: 1rem;
		align-items: start;
		padding: 1rem 0;
		opacity: 0;
		transform: translateX(-20px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	.tap-entry.visible {
		opacity: 1;
		transform: translateX(0);
	}
	.tap-year {
		font-family: 'Courier New', monospace;
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: #c9a84c;
		padding-top: 2px;
		text-align: right;
	}
	.tap-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #c9a84c;
		border: 2px solid #3a2808;
		margin-top: 4px;
		flex-shrink: 0;
	}
	.tap-text {
		font-size: 0.95rem;
		line-height: 1.65;
		color: #c8b898;
	}
	.tapestry-closing {
		border: none;
		padding: 2rem;
		background: rgba(201,168,76,0.07);
		border-left: 3px solid #c9a84c;
		border-radius: 4px;
		margin-top: 1rem;
	}
	.tapestry-closing p {
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: clamp(1rem, 2vw, 1.3rem);
		color: #e8d4a0;
		line-height: 1.65;
	}

	/* ── MEMORIAL SECTION ────────────────────────────────────────────────── */
	.memorial-section {
		background: #0d1117;
		padding: 0;
	}
	.memorial-section .section-inner {
		opacity: 0;
		transform: translateY(30px);
		transition: opacity 0.8s ease, transform 0.8s ease;
	}
	.memorial-section .section-inner.visible {
		opacity: 1;
		transform: translateY(0);
	}
	.casualty-chart {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 2rem 0;
	}
	.chart-row {
		display: grid;
		grid-template-columns: 160px 1fr;
		gap: 1.5rem;
		align-items: center;
		padding: 1rem 0;
		border-bottom: 1px solid rgba(255,255,255,0.05);
		opacity: 0;
		transform: translateX(-10px);
		transition: opacity 0.5s ease, transform 0.5s ease;
	}
	.chart-row.visible {
		opacity: 1;
		transform: translateX(0);
	}
	.chart-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.chart-flag { font-size: 1.2rem; }
	.chart-beach {
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		color: #c8b898;
		text-transform: uppercase;
	}
	.chart-bars {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.bar-wrap {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.bar-label {
		font-family: 'Courier New', monospace;
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		color: #6a6a7a;
		text-transform: uppercase;
		width: 70px;
		flex-shrink: 0;
	}
	.bar-track {
		flex: 1;
		height: 8px;
		background: rgba(255,255,255,0.07);
		border-radius: 4px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		width: 0;
		border-radius: 4px;
		transition: none;
	}
	.bar-fill.animated {
		animation: bar-grow 1.6s cubic-bezier(0.16,1,0.3,1) forwards;
		animation-delay: 0.3s;
	}
	.bar-deployed {
		background: linear-gradient(90deg, #4a6a9a, #6a8aba);
		--target-width: 0%;
	}
	.bar-casualties {
		background: linear-gradient(90deg, #8a2a2a, #c04040);
		--target-width: 0%;
	}
	.bar-deployed.animated  { animation-name: bar-grow-deployed; }
	.bar-casualties.animated { animation-name: bar-grow-casualties; }

	@keyframes bar-grow-deployed {
		to { width: var(--target-width); }
	}
	@keyframes bar-grow-casualties {
		to { width: var(--target-width); }
	}

	.bar-num {
		font-family: 'Courier New', monospace;
		font-size: 0.72rem;
		font-variant-numeric: tabular-nums;
		color: #c8b898;
		min-width: 50px;
	}
	.bar-num.casualties-num { color: #e08080; }
	.bar-pct {
		font-family: 'Courier New', monospace;
		font-size: 0.62rem;
		color: #7a5a5a;
	}
	.chart-total {
		padding: 1.25rem 0 0;
		border-top: 1px solid rgba(201,168,76,0.3);
	}
	.total-label {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		color: #c9a84c;
		text-transform: uppercase;
		margin-bottom: 0.35rem;
	}
	.total-values {
		display: flex;
		gap: 0.75rem;
		font-size: 0.95rem;
		color: #c8b898;
		font-variant-numeric: tabular-nums;
	}
	.total-sep { color: #5a4a3a; }
	.total-cas { color: #e08080; font-weight: 600; }
	.memorial-quote {
		margin: 3rem 0 2.5rem;
		text-align: center;
		border: none;
		padding: 0;
	}
	.memorial-quote p {
		font-family: 'Playfair Display', serif;
		font-style: italic;
		font-size: clamp(1.3rem, 3vw, 2rem);
		color: #f0e6d0;
		line-height: 1.45;
	}
	.cta-block {
		text-align: center;
		padding: 2.5rem;
		background: rgba(201,168,76,0.07);
		border: 1px solid rgba(201,168,76,0.2);
		border-radius: 10px;
	}
	.cta-text {
		font-size: 1.05rem;
		color: #c8b898;
		margin-bottom: 1.25rem;
		line-height: 1.55;
	}
	.cta-btn {
		display: inline-block;
		padding: 0.75rem 2rem;
		background: #c9a84c;
		color: #1a1208;
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
		letter-spacing: 0.05em;
		border-radius: 4px;
		transition: background 0.2s ease, transform 0.15s ease;
	}
	.cta-btn:hover {
		background: #e8c96c;
		transform: translateY(-1px);
	}
	.cta-small {
		margin-top: 0.75rem;
		font-size: 0.78rem;
		color: #7a6a5a;
		font-family: 'Courier New', monospace;
		letter-spacing: 0.05em;
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

	/* ── RESPONSIVE ──────────────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.nation-inner {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		.nation-left {
			position: static;
			display: flex;
			flex-wrap: wrap;
			align-items: flex-start;
			gap: 1rem;
		}
		.nation-flag-large {
			font-size: 3.5rem;
			margin-bottom: 0;
		}
		.nation-stats {
			flex-direction: row;
			flex-wrap: wrap;
		}
		.stat-pill { min-width: 120px; }
		.bayeux-columns {
			grid-template-columns: 1fr;
		}
		.tap-entry {
			grid-template-columns: 90px 12px 1fr;
			gap: 0.75rem;
		}
		.chart-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		.bar-label { width: 60px; }
	}

	@media (max-width: 480px) {
		.section-inner { padding: 3rem 1.25rem; }
		.hero-inner { padding: 1.25rem; }
	}
</style>
