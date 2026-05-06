<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { LOCALES, t, type Locale } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';
	import Flag from '$lib/components/Flag.svelte';
	import type { FlagCode } from '$lib/flags/flags';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	// Map locale → flag code. EN → Union Jack (the cottage is in France with
	// English-speaking owners; the audience is UK/IE/AU/NZ tourists rather
	// than US, so GB rather than US).
	const flagFor: Record<Locale, FlagCode> = {
		en: 'gb',
		fr: 'fr',
		de: 'de'
	};

	function tooltipFor(locale: Locale): string {
		return t(messages, `lang.switch_to_${locale}`);
	}

	function switchLocale(newLang: Locale) {
		if (newLang === lang) return;
		const url = new URL($page.url);
		// Always set the lang param — including for EN. Deleting it makes the
		// hook fall back to the cookie, so a user who clicked FR earlier could
		// never get back to English without clearing cookies / hard reload.
		url.searchParams.set('lang', newLang);
		goto(url.pathname + url.search, { invalidateAll: true });
	}
</script>

<div class="flag-switcher" role="radiogroup" aria-label="Language">
	{#each LOCALES as locale}
		<button
			type="button"
			role="radio"
			class="flag-btn"
			class:active={locale === lang}
			aria-checked={locale === lang}
			title={tooltipFor(locale)}
			aria-label={tooltipFor(locale)}
			onclick={() => switchLocale(locale)}
		>
			<Flag code={flagFor[locale]} height="1.15rem" />
		</button>
	{/each}
</div>

<style>
	/* Grouped pill toggle — matches the distance|popularity sort toggle on
	   /explore so the chrome reads as a coherent design language across the
	   site. Bordered pill, light surface inside, transparent buttons that
	   light up with the warm accent when their flag is active.

	   IMPORTANT: behaviour is unchanged from the previous styling — same
	   click handler, same goto with invalidateAll, same query-param flow.
	   This is purely a styling pass. */
	.flag-switcher {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--theme-border);
		border-radius: var(--theme-radius-pill);
		padding: 2px;
		gap: 2px;
		background: #fff;
	}

	.flag-btn {
		appearance: none;
		border: none;
		background: transparent;
		cursor: pointer;
		padding: 0.3rem 0.55rem;
		border-radius: var(--theme-radius-pill);
		line-height: 0;
		transition: background 0.2s ease;
	}

	.flag-btn:hover {
		background: rgba(0, 0, 0, 0.04);
	}

	.flag-btn:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}

	.flag-btn.active {
		background: var(--color-sage);
	}
	.flag-btn.active:hover {
		background: var(--color-sage-hover, var(--color-sage));
	}
</style>
