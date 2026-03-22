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
	class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-amber-200 rounded-lg hover:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
>
	{#each LOCALES as locale}
		<option value={locale}>{locale.toUpperCase()}</option>
	{/each}
</select>
