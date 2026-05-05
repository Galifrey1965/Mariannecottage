<script lang="ts">
	import { onMount } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
	}
	let { intensity = 'continuous' }: Props = $props();

	let mounted = $state(false);
	let reduced = $state(false);

	const count = intensity === 'load-only' ? 30 : 55;

	const hearts = Array.from({ length: count }, (_, i) => ({
		left: Math.random() * 100,
		size: 14 + Math.random() * 22,           // 14–36 px
		duration: 7 + Math.random() * 8,
		delay: -Math.random() * 14,
		sway: (Math.random() - 0.5) * 18,
		rotate: (Math.random() - 0.5) * 30,
		// Pick from a small palette of romantic tones — deep red to soft pink.
		startHue: 340 + Math.random() * 25,
		endHue:   330 + Math.random() * 30,
		key: i
	}));

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
		if (intensity === 'load-only') {
			setTimeout(() => (mounted = false), 10_000);
		}
	});
</script>

{#if mounted && !reduced}
	<div class="hearts-layer" aria-hidden="true">
		<!-- Shared SVG defs — gradients live here so each rendered heart can
		     reference them by id rather than redefining per-element. -->
		<svg class="hearts-defs" width="0" height="0" aria-hidden="true">
			<defs>
				{#each hearts as h (h.key)}
					<linearGradient id="heart-grad-{h.key}" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%"  stop-color="hsl({h.startHue} 95% 70%)" />
						<stop offset="60%" stop-color="hsl({h.endHue} 75% 52%)" />
						<stop offset="100%" stop-color="hsl({h.endHue} 80% 40%)" />
					</linearGradient>
				{/each}
			</defs>
		</svg>

		{#each hearts as h (h.key)}
			<svg
				class="heart"
				width={h.size}
				height={h.size}
				viewBox="0 0 24 24"
				style="left:{h.left}%;animation-duration:{h.duration}s;animation-delay:{h.delay}s;--sway:{h.sway}vw;--rotate:{h.rotate}deg;"
			>
				<path
					d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
					fill="url(#heart-grad-{h.key})"
				/>
				<!-- Highlight glint — small white blob in the upper-left lobe. -->
				<ellipse cx="8" cy="6.5" rx="1.3" ry="0.9" fill="rgba(255,255,255,0.6)" />
			</svg>
		{/each}
	</div>
{/if}

<style>
	.hearts-layer {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 997;
	}
	.hearts-defs { position: absolute; }
	.heart {
		position: absolute;
		bottom: -10vh;
		filter:
			drop-shadow(0 1px 2px rgba(120, 20, 50, 0.4))
			drop-shadow(0 4px 8px rgba(80, 10, 40, 0.18));
		animation-name: heartrise;
		animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);
		animation-iteration-count: infinite;
		will-change: transform, opacity;
		transform-origin: center center;
	}
	@keyframes heartrise {
		0%   { transform: translate3d(0, 0, 0) rotate(var(--rotate)) scale(0.4); opacity: 0; }
		8%   { transform: translate3d(calc(var(--sway) * 0.1), -8vh, 0) rotate(calc(var(--rotate) * 1.2)) scale(1.1); opacity: 1; }
		15%  { transform: translate3d(calc(var(--sway) * 0.2), -16vh, 0) rotate(var(--rotate)) scale(1); opacity: 1; }
		90%  { opacity: 1; }
		100% { transform: translate3d(var(--sway), -120vh, 0) rotate(calc(var(--rotate) + 25deg)) scale(0.85); opacity: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.hearts-layer { display: none; }
	}
</style>
