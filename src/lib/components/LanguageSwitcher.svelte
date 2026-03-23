<script lang="ts">
	import { LOCALES, type Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
	}

	let { lang }: Props = $props();

	function switchLocale(newLang: Locale) {
		document.cookie = `marianne_locale=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		location.reload();
	}
</script>

<select
	value={lang}
	onchange={(e) => switchLocale(e.currentTarget.value as Locale)}
	class="lang-select"
>
	{#each LOCALES as locale}
		<option value={locale}>{locale.toUpperCase()}</option>
	{/each}
</select>

<style>
	.lang-select {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		background-color: white;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		cursor: pointer;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.lang-select:hover {
		border-color: var(--color-sage);
	}

	.lang-select:focus {
		border-color: var(--color-sage);
		box-shadow: 0 0 0 2px rgba(107, 143, 113, 0.2);
	}
</style>
