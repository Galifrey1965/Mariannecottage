<script lang="ts">
	import { onMount } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
	}
	let { intensity = 'continuous' }: Props = $props();

	let mounted = $state(false);
	let reduced = $state(false);

	const count = intensity === 'load-only' ? 25 : 45;

	const hearts = Array.from({ length: count }, (_, i) => ({
		left: Math.random() * 100,
		size: 0.7 + Math.random() * 1.1,
		duration: 7 + Math.random() * 8,
		delay: -Math.random() * 14,
		sway: (Math.random() - 0.5) * 15,
		hue: 340 + Math.random() * 20,
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
		{#each hearts as h (h.key)}
			<span
				class="heart"
				style="left:{h.left}%;font-size:{h.size}rem;animation-duration:{h.duration}s;animation-delay:{h.delay}s;--sway:{h.sway}vw;color:hsl({h.hue} 75% 65%);"
			>♥</span>
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
	.heart {
		position: absolute;
		bottom: -10vh;
		text-shadow: 0 0 6px rgba(255, 100, 140, 0.4);
		animation-name: heartrise;
		animation-timing-function: ease-in;
		animation-iteration-count: infinite;
		will-change: transform, opacity;
	}
	@keyframes heartrise {
		0%   { transform: translate3d(0, 0, 0) rotate(-12deg); opacity: 0; }
		15%  { opacity: 1; }
		90%  { opacity: 1; }
		100% { transform: translate3d(var(--sway), -120vh, 0) rotate(20deg); opacity: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.hearts-layer { display: none; }
	}
</style>
