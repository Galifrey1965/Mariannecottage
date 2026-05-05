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

<div class="flag-switcher" role="group" aria-label="Language">
	{#each LOCALES as locale}
		<button
			type="button"
			class="flag-btn"
			class:active={locale === lang}
			title={tooltipFor(locale)}
			aria-label={tooltipFor(locale)}
			aria-current={locale === lang ? 'true' : undefined}
			onclick={() => switchLocale(locale)}
		>
			<Flag code={flagFor[locale]} height="1.15rem" />
		</button>
	{/each}
</div>

<style>
	.flag-switcher {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
	}

	.flag-btn {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 2px 8px;
		border: none;
		background: transparent;
		cursor: pointer;
		line-height: 0;
		transition: transform 0.15s ease;
	}

	.flag-btn:hover {
		transform: translateY(-1px);
	}

	.flag-btn:focus-visible {
		outline: 2px solid var(--theme-warm, #2a1f15);
		outline-offset: 3px;
		border-radius: 3px;
	}

	.flag-btn.active::after {
		content: '';
		position: absolute;
		left: 25%;
		right: 25%;
		bottom: 1px;
		height: 2px;
		background: var(--theme-warm, #2a1f15);
		border-radius: 1px;
	}

</style>
