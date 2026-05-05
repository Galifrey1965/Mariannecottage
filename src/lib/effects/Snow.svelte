<script lang="ts">
	import { onMount } from 'svelte';
	import type { SiteBannerEffectIntensity } from '$lib/server/supabase';

	interface Props {
		intensity?: SiteBannerEffectIntensity;
	}
	let { intensity = 'continuous' }: Props = $props();

	let mounted = $state(false);
	let reduced = $state(false);

	const flakeCount = intensity === 'load-only' ? 60 : 110;

	const flakes = Array.from({ length: flakeCount }, (_, i) => ({
		left: Math.random() * 100,
		size: 0.4 + Math.random() * 0.9,
		duration: 8 + Math.random() * 14,
		delay: -Math.random() * 20,
		drift: (Math.random() - 0.5) * 30,
		opacity: 0.5 + Math.random() * 0.5,
		key: i
	}));

	onMount(() => {
		reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		mounted = true;
		if (intensity === 'load-only') {
			setTimeout(() => (mounted = false), 12_000);
		}
	});
</script>

{#if mounted && !reduced}
	<div class="snow-layer" aria-hidden="true">
		{#each flakes as f (f.key)}
			<span
				class="flake"
				style="left:{f.left}%;font-size:{f.size}rem;animation-duration:{f.duration}s;animation-delay:{f.delay}s;--drift:{f.drift}vw;opacity:{f.opacity};"
			>❄</span>
		{/each}
	</div>
{/if}

<style>
	.snow-layer {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
		z-index: 997;
	}
	.flake {
		position: absolute;
		top: -10vh;
		color: #fff;
		text-shadow: 0 0 4px rgba(180, 220, 255, 0.6);
		animation-name: snowfall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		will-change: transform;
	}
	@keyframes snowfall {
		0%   { transform: translate3d(0, -10vh, 0) rotate(0deg); }
		100% { transform: translate3d(var(--drift), 110vh, 0) rotate(360deg); }
	}
	@media (prefers-reduced-motion: reduce) {
		.snow-layer { display: none; }
	}
</style>
