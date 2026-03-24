<script lang="ts">
	import { LOCALES, type Locale } from '$lib/i18n';
	import Select, { Option } from '@smui/select';
	import SelectIcon from '@smui/select/icon';

	interface Props {
		lang: Locale;
	}

	let { lang }: Props = $props();
	let value = $state(lang);

	const flagSvgs: Record<Locale, string> = {
		en: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 60 30"><clipPath id="a"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="b"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#a)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#b)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>`,
		fr: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 3 2"><rect width="1" height="2" fill="#002395"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#ED2939"/></svg>`,
		de: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect y="1" width="5" height="1" fill="#D00"/><rect y="2" width="5" height="1" fill="#FFCE00"/></svg>`
	};

	const labels: Record<Locale, string> = {
		en: 'English',
		fr: 'Français',
		de: 'Deutsch'
	};

	function switchLocale(newLang: Locale) {
		document.cookie = `marianne_locale=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
		location.reload();
	}

	$effect(() => {
		if (value && value !== lang) {
			switchLocale(value as Locale);
		}
	});
</script>

<div class="lang-select-wrapper">
	<Select
		variant="outlined"
		bind:value
		label="Language"
		noLabel
		class="lang-smui-select"
	>
		<SelectIcon slot="leadingIcon">
			{@html flagSvgs[value as Locale] || flagSvgs.en}
		</SelectIcon>
		{#each LOCALES as locale}
			<Option value={locale}>{labels[locale]}</Option>
		{/each}
	</Select>
</div>

<style>
	.lang-select-wrapper {
		display: inline-flex;
		align-items: center;
	}

	.lang-select-wrapper :global(.lang-smui-select) {
		min-width: 140px;
	}

	.lang-select-wrapper :global(.mdc-select__anchor) {
		height: 40px;
	}

	.lang-select-wrapper :global(.mdc-deprecated-list-item) {
		font-size: 0.875rem;
	}
</style>
