<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NavigationRail from '$lib/components/NavigationRail.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { LOCALES, localePath, t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages } = data;

	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname;
	const alternates = LOCALES.map(l => ({ lang: l, url: `${baseUrl}${currentPath}` }));

	const railItems = [
		{ label: t(messages, 'nav.home'), icon: '🏠', href: localePath(lang, '/') },
		{ label: t(messages, 'nav.rooms'), icon: '🛏️', href: localePath(lang, '/rooms') },
		{ label: t(messages, 'nav.gallery'), icon: '🖼️', href: localePath(lang, '/gallery') },
		{ label: t(messages, 'nav.explore'), icon: '🗺️', href: localePath(lang, '/explore') },
		{ label: t(messages, 'nav.contact'), icon: '📧', href: localePath(lang, '/contact') },
		{ label: t(messages, 'nav.book'), icon: '✨', href: localePath(lang, '/book') }
	];
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} alternates={alternates} />
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="app-shell">
	<a href="#main-content" class="skip-link">{t(messages, 'a11y.skip_to_content')}</a>
	<Header {lang} {messages} />

	<div class="app-body">
		<NavigationRail items={railItems} />

		<main id="main-content" class="main-content" tabindex="-1">
			{@render children()}
		</main>
	</div>

	<Footer {lang} {messages} />
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		padding: 0;
	}

	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--color-bg);
		color: var(--color-text);
	}

	.app-body {
		display: flex;
		flex: 1;
	}

	.main-content {
		flex: 1;
		min-width: 0;
	}

	@media (min-width: 600px) {
		.main-content {
			margin-left: 80px;
		}
	}

	@media (min-width: 840px) {
		.main-content {
			margin-left: 0;
		}
	}

	.skip-link {
		position: absolute;
		top: -100%;
		left: 1rem;
		z-index: 100;
		padding: 0.75rem 1.5rem;
		background: var(--color-sage);
		color: var(--md-sys-color-on-primary);
		border-radius: var(--md-shape-corner-small);
		text-decoration: none;
		font-weight: 600;
	}

	.skip-link:focus {
		top: 0.5rem;
	}
</style>
