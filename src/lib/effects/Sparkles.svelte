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
		size: 0.7 + Math.random() * 1.1,
		delay: Math.random() * 4,
		duration: 1.6 + Math.random() * 2.4,
		hue: 35 + Math.random() * 25,
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
		background: radial-gradient(
			circle,
			#fffae8 0%,
			hsl(var(--hue) 95% 60%) 35%,
			hsl(var(--hue) 80% 45%) 65%,
			transparent 80%
		);
		/* 4-point sparkle shape — diamond with concave sides reads as a glint. */
		clip-path: polygon(
			50% 0%,
			58% 42%,
			100% 50%,
			58% 58%,
			50% 100%,
			42% 58%,
			0% 50%,
			42% 42%
		);
		opacity: 0;
		animation: twinkle ease-in-out infinite;
		filter:
			drop-shadow(0 0 4px hsl(var(--hue) 90% 50% / 0.85))
			drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
	}
	@keyframes twinkle {
		0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
		50%      { opacity: 1; transform: scale(1.1) rotate(45deg); }
	}
	@media (prefers-reduced-motion: reduce) {
		.sparkle-layer { display: none; }
	}
</style>
