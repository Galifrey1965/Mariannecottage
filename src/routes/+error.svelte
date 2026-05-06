<script lang="ts">
	import { page } from '$app/stores';

	// Mouse-driven parallax — each layer's transform multiplies these.
	// mx / my range roughly -1..1 (centred at 0 when the cursor is in the
	// middle of the viewport). prefers-reduced-motion users get a static
	// scene; we also short-circuit early on the move handler in that case.
	let mx = $state(0);
	let my = $state(0);
	let reduced = $state(false);

	function onMove(e: MouseEvent) {
		if (reduced) return;
		mx = (e.clientX / window.innerWidth - 0.5) * 2;
		my = (e.clientY / window.innerHeight - 0.5) * 2;
	}

	function onLeave() {
		if (reduced) return;
		mx = 0;
		my = 0;
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduced = mq.matches;
		const onChange = () => (reduced = mq.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const status = $derived($page.status ?? 500);
	const is404 = $derived(status === 404);
	const errorMessage = $derived($page.error?.message ?? '');
</script>

<svelte:head>
	<title>{is404 ? '404 — wandered off the lane' : `${status} — something went wrong`} · Marianne Cottage</title>
</svelte:head>

<svelte:window onmousemove={onMove} onmouseleave={onLeave} />

{#if is404}
	<main class="lost" style="--mx:{mx}; --my:{my}">
		<div class="scene" aria-hidden="true">
			<!-- Sky: gradient + clouds + skywritten 404 + plane. Lightest parallax. -->
			<svg class="layer sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
				<defs>
					<linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stop-color="#f6ecd6" />
						<stop offset="0.6" stop-color="#ebe4d6" />
						<stop offset="1" stop-color="#e3dac4" />
					</linearGradient>
				</defs>
				<rect width="1600" height="900" fill="url(#sky-grad)" />

				<!-- Sun, very subtle -->
				<circle cx="1200" cy="220" r="90" fill="#f5d99a" opacity="0.45" />
				<circle cx="1200" cy="220" r="60" fill="#f5d99a" opacity="0.35" />

				<!-- Clouds: layered ellipses -->
				<g fill="#ffffff" opacity="0.7">
					<ellipse cx="180" cy="170" rx="90" ry="20" />
					<ellipse cx="220" cy="160" rx="60" ry="16" />
					<ellipse cx="140" cy="180" rx="50" ry="14" />
				</g>
				<g fill="#ffffff" opacity="0.55">
					<ellipse cx="540" cy="120" rx="100" ry="18" />
					<ellipse cx="600" cy="110" rx="70" ry="14" />
				</g>
				<g fill="#ffffff" opacity="0.5">
					<ellipse cx="1380" cy="320" rx="80" ry="14" />
					<ellipse cx="1420" cy="310" rx="50" ry="12" />
				</g>

				<!-- Skywritten 404, faint white outline -->
				<text x="800" y="430" text-anchor="middle"
					font-family="'Lora', Georgia, serif" font-style="italic" font-weight="600"
					font-size="280" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8">404</text>

				<!-- Plane drifting near the 404 -->
				<g transform="translate(1075, 360) rotate(-8)">
					<path d="M-50 0 L-3 -1 L-2 0 L-3 1 Z" fill="#ffffff" opacity="0.5" />
					<path d="M0 0 L22 -3 L26 0 L22 3 Z" fill="#8b6f47" />
					<path d="M8 -1 L4 -10 L13 -1 Z" fill="#8b6f47" />
					<path d="M8 1 L4 10 L13 1 Z" fill="#8b6f47" />
				</g>
			</svg>

			<!-- Far hills: very pale sage silhouette -->
			<svg class="layer far" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
				<path
					d="M0 600 C 200 540, 380 600, 580 570 S 980 540, 1180 580 S 1480 600, 1600 575 L 1600 900 L 0 900 Z"
					fill="#c8d0bc" opacity="0.85" />
				<!-- Tiny distant village -->
				<g transform="translate(880, 555)" fill="#a8b59c">
					<rect x="0" y="-12" width="10" height="12" />
					<polygon points="0,-12 5,-18 10,-12" />
					<rect x="14" y="-14" width="8" height="14" />
					<polygon points="14,-14 18,-20 22,-14" />
					<rect x="26" y="-16" width="3" height="16" />
				</g>
			</svg>

			<!-- Middle hills with cottage + cypress trees -->
			<svg class="layer mid" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
				<path
					d="M0 700 C 180 640, 360 690, 560 660 S 1000 630, 1200 670 S 1500 690, 1600 660 L 1600 900 L 0 900 Z"
					fill="#a8b59c" />

				<!-- Cypress trees -->
				<g fill="#5a6b51">
					<path d="M260 700 Q 268 640 264 600 Q 260 640 252 700 Z" />
					<path d="M310 705 Q 316 660 312 630 Q 308 660 304 705 Z" />
					<path d="M1280 690 Q 1290 620 1284 580 Q 1278 620 1272 690 Z" />
				</g>

				<!-- The cottage -->
				<g transform="translate(720, 615)">
					<!-- Walls -->
					<rect x="0" y="0" width="80" height="50" fill="#ebe4d6" />
					<rect x="80" y="10" width="40" height="40" fill="#ddd3c0" />
					<!-- Roof -->
					<polygon points="-6,0 40,-28 86,0" fill="#8b6f47" />
					<polygon points="76,10 100,-12 126,10" fill="#8b6f47" />
					<!-- Chimney -->
					<rect x="22" y="-28" width="8" height="14" fill="#a87850" />
					<!-- Door -->
					<rect x="32" y="22" width="14" height="28" fill="#5a6b51" />
					<!-- Windows -->
					<rect x="8" y="14" width="14" height="14" fill="#7a8b6f" />
					<rect x="58" y="14" width="14" height="14" fill="#7a8b6f" />
					<rect x="92" y="22" width="12" height="12" fill="#7a8b6f" />
					<!-- Window crosses -->
					<line x1="15" y1="14" x2="15" y2="28" stroke="#ebe4d6" stroke-width="1" />
					<line x1="8" y1="21" x2="22" y2="21" stroke="#ebe4d6" stroke-width="1" />
					<line x1="65" y1="14" x2="65" y2="28" stroke="#ebe4d6" stroke-width="1" />
					<line x1="58" y1="21" x2="72" y2="21" stroke="#ebe4d6" stroke-width="1" />
				</g>

				<!-- Vineyard rows -->
				<g stroke="#7a8b6f" stroke-width="2" opacity="0.55">
					<path d="M0 750 Q 400 730 800 745 T 1600 740" fill="none" />
					<path d="M0 770 Q 400 750 800 765 T 1600 760" fill="none" />
					<path d="M0 790 Q 400 770 800 785 T 1600 780" fill="none" />
				</g>
			</svg>

			<!-- Foreground: grass tufts + wildflowers + path -->
			<svg class="layer fore" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
				<!-- Foreground grass mound -->
				<path d="M0 800 Q 400 760 800 790 T 1600 770 L 1600 900 L 0 900 Z" fill="#5a6b51" />

				<!-- Stone path winding off -->
				<path d="M700 900 Q 760 850 820 820 Q 880 800 920 790"
					fill="none" stroke="#b59874" stroke-width="22" stroke-linecap="round" opacity="0.9" />
				<path d="M700 900 Q 760 850 820 820 Q 880 800 920 790"
					fill="none" stroke="#ebe4d6" stroke-width="14" stroke-linecap="round" stroke-dasharray="2 16" opacity="0.7" />

				<!-- Grass tufts (curved strokes) -->
				<g stroke="#7a8b6f" stroke-width="3" stroke-linecap="round" fill="none">
					<path d="M120 870 Q 124 850 128 838" />
					<path d="M132 870 Q 136 852 140 842" />
					<path d="M144 870 Q 148 852 152 840" />
					<path d="M340 880 Q 344 858 348 846" />
					<path d="M354 880 Q 358 860 362 848" />
					<path d="M1280 875 Q 1284 855 1288 842" />
					<path d="M1296 875 Q 1300 858 1304 846" />
					<path d="M1480 870 Q 1484 850 1488 838" />
				</g>

				<!-- Poppies (red wildflowers) -->
				<g>
					<g transform="translate(280, 845)">
						<line x1="0" y1="0" x2="0" y2="20" stroke="#5a6b51" stroke-width="2" />
						<circle cx="0" cy="0" r="6" fill="#c0432e" />
						<circle cx="0" cy="0" r="2" fill="#3a2d1a" />
					</g>
					<g transform="translate(295, 855)">
						<line x1="0" y1="0" x2="0" y2="16" stroke="#5a6b51" stroke-width="2" />
						<circle cx="0" cy="0" r="5" fill="#d9543a" />
						<circle cx="0" cy="0" r="1.5" fill="#3a2d1a" />
					</g>
					<g transform="translate(1100, 850)">
						<line x1="0" y1="0" x2="0" y2="20" stroke="#5a6b51" stroke-width="2" />
						<circle cx="0" cy="0" r="6" fill="#c0432e" />
						<circle cx="0" cy="0" r="2" fill="#3a2d1a" />
					</g>
					<g transform="translate(1115, 858)">
						<line x1="0" y1="0" x2="0" y2="16" stroke="#5a6b51" stroke-width="2" />
						<circle cx="0" cy="0" r="5" fill="#d9543a" />
						<circle cx="0" cy="0" r="1.5" fill="#3a2d1a" />
					</g>
				</g>

				<!-- Lavender clumps -->
				<g fill="#9c84b8">
					<g transform="translate(450, 855)">
						<ellipse cx="0" cy="0" rx="3" ry="6" />
						<ellipse cx="6" cy="-2" rx="3" ry="5" />
						<ellipse cx="-5" cy="-1" rx="3" ry="5" />
					</g>
					<g transform="translate(950, 858)">
						<ellipse cx="0" cy="0" rx="3" ry="6" />
						<ellipse cx="6" cy="-2" rx="3" ry="5" />
						<ellipse cx="-5" cy="-1" rx="3" ry="5" />
					</g>
					<g transform="translate(1380, 855)">
						<ellipse cx="0" cy="0" rx="3" ry="6" />
						<ellipse cx="6" cy="-2" rx="3" ry="5" />
					</g>
				</g>
			</svg>

			<!-- Bee, separate so we can apply an idle bobbing animation. The
			     outer .layer.bee gets the parallax transform; the inner .bee-pos
			     drifts in a small loop, and the SVG itself sits inside that. -->
			<div class="layer bee">
				<div class="bee-pos">
					<svg class="bee-svg" viewBox="0 0 32 22">
						<g transform="rotate(-8 16 11)">
							<ellipse cx="16" cy="11" rx="10" ry="6" fill="#f5b942" />
							<rect x="9" y="6" width="3" height="10" fill="#3a2d1a" />
							<rect x="15" y="6" width="3" height="10" fill="#3a2d1a" />
							<ellipse cx="13" cy="2" rx="7" ry="3.5" fill="#ffffff" opacity="0.8" />
							<ellipse cx="19" cy="2" rx="7" ry="3.5" fill="#ffffff" opacity="0.8" />
							<circle cx="25" cy="9" r="1.5" fill="#3a2d1a" />
						</g>
					</svg>
				</div>
			</div>
		</div>

		<div class="content">
			<p class="kicker">404</p>
			<h1 class="title">It seems you've wandered off the lane.</h1>
			<p class="lede">
				The page you're looking for isn't on the property — perhaps it's gone for a walk in the vines.
			</p>
			<a href="/" class="cta">Find your way home →</a>
		</div>
	</main>
{:else}
	<main class="generic">
		<p class="kicker">{status}</p>
		<h1 class="title">Something went wrong</h1>
		<p class="lede">{errorMessage || 'Try again in a moment, or head back home.'}</p>
		<a href="/" class="cta">Back to home →</a>
	</main>
{/if}

<style>
	/* Full-bleed scene that fills the viewport area below the sticky header
	   (~56px). The footer sits below the page as usual. */
	.lost {
		position: relative;
		width: 100%;
		min-height: calc(100vh - 56px);
		overflow: hidden;
		isolation: isolate;
	}

	.scene {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.layer {
		position: absolute;
		/* Each layer is oversized so its parallax shift never reveals the
		   page background through the edges. Buffer covers the largest shift
		   the foreground layer can produce on small screens. */
		left: -10%;
		top: -10%;
		width: 120%;
		height: 120%;
		will-change: transform;
		transition: transform 0.18s ease-out;
	}

	/* Parallax depth — back layers move least, foreground most. Magnitudes
	   in vw units so the effect scales sensibly across viewports. */
	.layer.sky  { transform: translate(calc(var(--mx, 0) * -0.25vw), calc(var(--my, 0) * -0.25vw)); }
	.layer.far  { transform: translate(calc(var(--mx, 0) * -0.6vw),  calc(var(--my, 0) * -0.6vw));  }
	.layer.mid  { transform: translate(calc(var(--mx, 0) * -1.1vw),  calc(var(--my, 0) * -1.1vw));  }
	.layer.fore { transform: translate(calc(var(--mx, 0) * -1.8vw),  calc(var(--my, 0) * -1.8vw));  }
	.layer.bee  { transform: translate(calc(var(--mx, 0) * -3vw),    calc(var(--my, 0) * -3vw));    }

	/* Bee idle animation — small drifting loop, independent of mouse. */
	.bee-pos {
		position: absolute;
		left: 62%;
		top: 66%;
		width: 36px;
		height: 24px;
		animation: bee-bob 7s ease-in-out infinite;
	}
	.bee-svg { width: 100%; height: 100%; }
	@keyframes bee-bob {
		0%, 100% { transform: translate(0, 0) rotate(0deg); }
		25%      { transform: translate(38px, -14px) rotate(6deg); }
		50%      { transform: translate(70px, 4px) rotate(-3deg); }
		75%      { transform: translate(34px, 22px) rotate(5deg); }
	}

	/* The text content stays put while the scene shifts behind it. Pinned
	   to a comfortable reading position with a softly-blurred backdrop card
	   so the message stays legible against the busy scene. */
	.content {
		position: relative;
		z-index: 1;
		max-width: 640px;
		margin: 0 auto;
		padding: 8vh 1.5rem 6vh;
		text-align: center;
		color: var(--color-text);
	}

	.kicker {
		font-family: 'Lora', Georgia, serif;
		font-style: italic;
		font-size: clamp(4rem, 12vw, 8rem);
		font-weight: 600;
		line-height: 1;
		margin: 0 0 0.5rem;
		color: var(--color-sage);
		text-shadow: 0 2px 0 rgba(255, 255, 255, 0.6);
	}

	.title {
		font-family: 'Lora', Georgia, serif;
		font-size: clamp(1.5rem, 3.4vw, 2.25rem);
		font-weight: 600;
		line-height: 1.2;
		margin: 0 0 0.75rem;
		color: var(--color-text);
	}

	.lede {
		font-size: 1rem;
		color: var(--color-text-muted);
		margin: 0 0 2rem;
		line-height: 1.5;
	}

	.cta {
		display: inline-block;
		padding: 0.75rem 1.75rem;
		background: var(--color-sage);
		color: white;
		font-weight: 600;
		text-decoration: none;
		border-radius: 999px;
		box-shadow: 0 4px 12px rgba(122, 139, 111, 0.35);
		transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
	}
	.cta:hover {
		background: var(--color-sage-hover);
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(90, 107, 81, 0.45);
	}
	.cta:active { transform: translateY(0); }

	/* Generic (non-404) error page — same theme, no scene. */
	.generic {
		max-width: 480px;
		margin: 0 auto;
		padding: 12vh 1.5rem;
		text-align: center;
	}
	.generic .kicker {
		font-size: clamp(3rem, 8vw, 5rem);
		color: var(--color-warning-text, #b8860b);
	}

	@media (prefers-reduced-motion: reduce) {
		.layer { transform: none !important; transition: none; }
		.bee-anim { animation: none; }
	}
</style>
