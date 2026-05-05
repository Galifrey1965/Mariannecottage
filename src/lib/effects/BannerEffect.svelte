<script lang="ts">
	import type {
		SiteBannerEffect,
		SiteBannerEffectIntensity,
		SiteBannerPalette
	} from '$lib/server/supabase';
	import Fireworks from './Fireworks.svelte';
	import Snow from './Snow.svelte';
	import Sparkles from './Sparkles.svelte';
	import Hearts from './Hearts.svelte';
	import Confetti from './Confetti.svelte';

	interface Props {
		effect: SiteBannerEffect;
		intensity?: SiteBannerEffectIntensity;
		paletteName?: SiteBannerPalette;
	}

	let { effect, intensity = 'burst-idle', paletteName }: Props = $props();

	// Pick a fireworks palette that complements the banner's colour scheme.
	// Christmas-coloured banners get red+green sparks; Ukraine gets blue+gold.
	const fireworksPalette = $derived.by(() => {
		switch (paletteName) {
			case 'crimson':
			case 'mint':       return 'christmas';
			case 'amber':
			case 'cream':      return 'gold';
			case 'coral':      return 'pastel';
			case 'ocean':
			case 'sky':        return 'rwb';
			case 'ukraine':    return 'gold';
			default:           return 'mixed';
		}
	});
</script>

{#if effect === 'fireworks'}
	<Fireworks {intensity} palette={fireworksPalette} />
{:else if effect === 'snow'}
	<Snow {intensity} />
{:else if effect === 'sparkles'}
	<Sparkles {intensity} />
{:else if effect === 'hearts'}
	<Hearts {intensity} />
{:else if effect === 'confetti'}
	<Confetti {intensity} />
{/if}
