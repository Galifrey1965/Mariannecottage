<script lang="ts">
	import { localePath, LOCALES, type Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		currentPath: string;
	}

	let { lang, currentPath }: Props = $props();

	const getPathForLang = (newLang: Locale): string => {
		// Remove the current language prefix from the path
		const pathWithoutLang = currentPath.replace(`/${lang}`, '') || '/';
		return localePath(newLang, pathWithoutLang);
	};
</script>

<div class="flex items-center gap-1 bg-amber-50 rounded-full p-1">
	{#each LOCALES as locale}
		<a
			href={getPathForLang(locale)}
			class="px-3 py-1 text-xs font-semibold uppercase rounded-full transition-all"
			class:bg-white={locale === lang}
			class:text-amber-900={locale === lang}
			class:shadow-sm={locale === lang}
			class:text-gray-600={locale !== lang}
			class:hover:text-gray-900={locale !== lang}
		>
			{locale.toUpperCase()}
		</a>
	{/each}
</div>
