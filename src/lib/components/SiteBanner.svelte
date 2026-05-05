<script lang="ts">
	import { onMount } from 'svelte';
	import type { SiteBanner } from '$lib/server/supabase';
	import type { Locale } from '$lib/i18n';
	import BannerEffect from '$lib/effects/BannerEffect.svelte';
	import { isDismissed, dismiss } from '$lib/effects/dismissal';
	import { PALETTES, ICON_PATHS } from '$lib/banners/presets';

	interface Props {
		banner: SiteBanner;
		lang: Locale;
		/** When true, the banner renders without mounting its effect — caller
		 *  is responsible for the effect (used by BannerPreview to bypass the
		 *  dismissal localStorage check). */
		suppressEffect?: boolean;
	}

	let { banner, lang, suppressEffect = false }: Props = $props();

	const palette = $derived(PALETTES[banner.palette] ?? PALETTES.sage);

	const message = $derived(
		(lang === 'fr' && banner.message_fr) ||
		(lang === 'de' && banner.message_de) ||
		banner.message_en
	);

	const iconPath = $derived(banner.icon ? ICON_PATHS[banner.icon] : null);

	const effect = $derived(banner.effect ?? 'none');
	const intensity = $derived(banner.effect_intensity ?? 'burst-idle');

	// Effect mount is gated by an onMount localStorage check — without that
	// gate, server-rendered HTML would briefly show the effect before
	// dismissal state was checked, causing a flash.
	let effectAllowed = $state(false);

	onMount(() => {
		effectAllowed = !isDismissed(banner.id, effect);
	});

	function stopEffect() {
		dismiss(banner.id, effect);
		effectAllowed = false;
	}
</script>

<div
	class="site-banner"
	role="status"
	aria-live="polite"
	style="background:{palette.bg};color:{palette.fg};border-bottom-color:{palette.border};"
>
	{#if iconPath}
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			{@html iconPath}
		</svg>
	{/if}
	<span>{message}</span>

	{#if effectAllowed && effect !== 'none' && !suppressEffect}
		<button
			type="button"
			class="stop-fx"
			onclick={stopEffect}
			title="Stop the visual effect"
			aria-label="Stop the visual effect on this banner"
		>
			✕ Stop effects
		</button>
	{/if}
</div>

{#if effectAllowed && effect !== 'none' && !suppressEffect}
	<BannerEffect {effect} {intensity} paletteName={banner.palette} />
{/if}

<style>
	.site-banner {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.55rem 3.5rem 0.55rem 1rem;
		border-bottom: 1px solid;
		font-size: 0.85rem;
		font-weight: 500;
		text-align: center;
		line-height: 1.35;
		z-index: 1000;
	}
	.site-banner svg { flex-shrink: 0; }

	.stop-fx {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.55);
		color: inherit;
		border: 1px solid currentColor;
		border-radius: 9999px;
		padding: 0.2rem 0.65rem;
		font-size: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		opacity: 0.75;
	}
	.stop-fx:hover { opacity: 1; background: rgba(255, 255, 255, 0.85); }

	@media (max-width: 600px) {
		.site-banner { font-size: 0.78rem; padding: 0.45rem 3rem 0.45rem 0.75rem; }
		.stop-fx { font-size: 0.65rem; padding: 0.15rem 0.5rem; }
	}
</style>
