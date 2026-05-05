<script lang="ts">
	import { onMount } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
	}
	let { intensity = 'continuous' }: Props = $props();

	let mounted = $state(false);
	let reduced = $state(false);

	const count = intensity === 'load-only' ? 40 : 70;

	const sparkles = Array.from({ length: count }, (_, i) => ({
		left: Math.random() * 100,
		top: Math.random() * 100,
		size: 0.4 + Math.random() * 0.8,
		delay: Math.random() * 4,
		duration: 1.6 + Math.random() * 2.4,
		hue: 35 + Math.random() * 30,
		key: i
	}));

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
		if (intensity === 'load-only') {
			setTimeout(() => (mounted = false), 6_000);
		}
	});
</script>

{#if mounted && !reduced}
	<div class="sparkle-layer" aria-hidden="true">
		{#each sparkles as s (s.key)}
			<span
				class="sparkle"
				style="left:{s.left}%;top:{s.top}%;width:{s.size}rem;height:{s.size}rem;animation-delay:{s.delay}s;animation-duration:{s.duration}s;--hue:{s.hue};"
			></span>
		{/each}
	</div>
{/if}

<style>
	.sparkle-layer {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 997;
	}
	.sparkle {
		position: absolute;
		display: block;
		background: radial-gradient(circle, hsl(var(--hue) 95% 75%) 0%, transparent 70%);
		border-radius: 50%;
		opacity: 0;
		animation: twinkle ease-in-out infinite;
		filter: drop-shadow(0 0 6px hsl(var(--hue) 95% 70% / 0.7));
	}
	@keyframes twinkle {
		0%, 100% { opacity: 0; transform: scale(0.4); }
		50%      { opacity: 1; transform: scale(1.1); }
	}
	@media (prefers-reduced-motion: reduce) {
		.sparkle-layer { display: none; }
	}
</style>
