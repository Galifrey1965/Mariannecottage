<script lang="ts">
	import { LOCALES, t, type Locale } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	const flagSvgs: Record<Locale, string> = {
		en: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="18" viewBox="0 0 60 30"><clipPath id="lsf-a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="lsf-b"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#lsf-a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#lsf-b)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>`,
		fr: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="18" viewBox="0 0 3 2"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>`,
		de: `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="18" viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>`
	};

	function tooltipFor(locale: Locale): string {
		return t(messages, `lang.switch_to_${locale}`);
	}

	function switchLocale(newLang: Locale) {
		if (newLang === lang) return;
		document.cookie = `marianne_locale=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		location.reload();
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
			{@html flagSvgs[locale]}
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

	.flag-btn :global(svg) {
		display: block;
		border-radius: 2px;
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18);
	}
</style>
