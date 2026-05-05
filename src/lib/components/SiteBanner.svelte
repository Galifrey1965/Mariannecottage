<script lang="ts">
	import type { SiteBanner, SiteBannerType } from '$lib/server/supabase';
	import type { Locale } from '$lib/i18n';

	interface Props {
		banner: SiteBanner;
		lang: Locale;
	}

	let { banner, lang }: Props = $props();

	// Type drives palette + glyph. Falls back to 'info' if a future migration
	// adds a type the renderer doesn't know.
	const PALETTES: Record<SiteBannerType, { bg: string; fg: string; border: string }> = {
		info:         { bg: '#e7f1fb', fg: '#1d4d80', border: '#bcd5ee' },
		construction: { bg: '#fff4d6', fg: '#6b4a00', border: '#e8c97a' },
		discount:     { bg: '#e6f5ea', fg: '#205c34', border: '#b8dec5' },
		seasonal:     { bg: '#f7e9d6', fg: '#7a3a1d', border: '#e0bf94' },
		announcement: { bg: '#efe5f5', fg: '#4a2e6b', border: '#cdb6dd' }
	};

	const palette = $derived(PALETTES[banner.type] ?? PALETTES.info);

	const message = $derived(
		(lang === 'fr' && banner.message_fr) ||
		(lang === 'de' && banner.message_de) ||
		banner.message_en
	);
</script>

<div
	class="site-banner"
	role="status"
	aria-live="polite"
	style="background:{palette.bg};color:{palette.fg};border-bottom-color:{palette.border};"
>
	<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		{#if banner.type === 'construction'}
			<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
		{:else if banner.type === 'discount'}
			<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
		{:else if banner.type === 'seasonal'}
			<polygon points="12 2 15 8.5 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 9 8.5 12 2"/>
		{:else if banner.type === 'announcement'}
			<path d="M3 11l18-8v18l-18-8z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
		{:else}
			<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
		{/if}
	</svg>
	<span>{message}</span>
</div>

<style>
	.site-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.55rem 1rem;
		border-bottom: 1px solid;
		font-size: 0.85rem;
		font-weight: 500;
		text-align: center;
		line-height: 1.35;
	}
	.site-banner svg { flex-shrink: 0; }
	@media (max-width: 600px) {
		.site-banner { font-size: 0.78rem; padding: 0.45rem 0.75rem; }
	}
</style>
