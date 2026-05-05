<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { SiteBanner } from '$lib/server/supabase';
	import type { Locale } from '$lib/i18n';
	import SiteBannerView from './SiteBanner.svelte';
	import BannerEffect from '$lib/effects/BannerEffect.svelte';

	interface Props {
		banner: Partial<SiteBanner>;
		lang?: Locale;
		onclose: () => void;
		autoCloseMs?: number;
	}

	let { banner, lang = 'en', onclose, autoCloseMs = 12_000 }: Props = $props();

	let timer: ReturnType<typeof setTimeout> | null = null;

	const previewBanner = $derived({
		id: banner.id ?? 'preview',
		icon: banner.icon ?? null,
		palette: banner.palette ?? 'sage',
		message_en: banner.message_en ?? '(empty banner)',
		message_fr: banner.message_fr ?? null,
		message_de: banner.message_de ?? null,
		enabled: true,
		display_order: 0,
		starts_at: null,
		ends_at: null,
		effect: banner.effect ?? 'none',
		effect_intensity: banner.effect_intensity ?? 'burst-idle',
		locales: banner.locales ?? ['en', 'fr', 'de'],
		is_recurring: banner.is_recurring ?? false,
		created_at: '',
		updated_at: ''
	} as SiteBanner);

	onMount(() => {
		if (autoCloseMs > 0) {
			timer = setTimeout(onclose, autoCloseMs);
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onclose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

<div class="preview-root" role="dialog" aria-modal="true" aria-label="Banner preview">
	<button
		type="button"
		class="preview-dismiss-layer"
		onclick={onclose}
		aria-label="Click to close preview"
	></button>

	<div class="preview-banner-slot">
		<SiteBannerView banner={previewBanner} {lang} suppressEffect />
	</div>

	<button type="button" class="preview-close" onclick={onclose} aria-label="Close preview">
		Close preview ✕
	</button>

	<p class="preview-hint">Auto-closes in {Math.round(autoCloseMs / 1000)}s · click anywhere or Esc</p>

	<BannerEffect
		effect={previewBanner.effect}
		intensity={previewBanner.effect_intensity}
		paletteName={previewBanner.palette}
	/>
</div>

<style>
	.preview-root {
		position: fixed;
		inset: 0;
		/* Transparent — admin page shows through. Click anywhere to dismiss. */
		background: transparent;
		z-index: 2000;
		display: flex;
		flex-direction: column;
	}
	.preview-dismiss-layer {
		position: absolute;
		inset: 0;
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		z-index: 2000;
	}
	.preview-banner-slot {
		position: relative;
		z-index: 2001;
	}
	.preview-close {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 2002;
		background: var(--color-bg, #fff);
		color: var(--color-text, #222);
		border: 1px solid var(--color-cream-dark, #d8c9a4);
		padding: 0.6rem 1rem;
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
	}
	.preview-close:hover { background: var(--color-cream, #f6f1e6); }
	.preview-hint {
		position: fixed;
		bottom: 1.25rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2002;
		color: var(--color-text-muted, #666);
		font-size: 0.8rem;
		margin: 0;
		padding: 0.4rem 0.9rem;
		background: var(--color-bg, #fff);
		border: 1px solid var(--color-cream-dark, #d8c9a4);
		border-radius: 9999px;
	}
</style>
