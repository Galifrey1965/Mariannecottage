<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import NavigationRail from '$lib/components/NavigationRail.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { LOCALES, t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages } = data;

	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname;
	const alternates = LOCALES.map(l => ({ lang: l, url: `${baseUrl}${currentPath}` }));

	const navItems = [
		{ label: t(messages, 'nav.home'), href: '/', icon: '🏠' },
		{ label: t(messages, 'nav.rooms'), href: '/rooms', icon: '🛏️' },
		{ label: t(messages, 'nav.gallery'), href: '/gallery', icon: '🖼️' },
		{ label: t(messages, 'nav.explore'), href: '/explore', icon: '🗺️' },
		{ label: t(messages, 'nav.contact'), href: '/contact', icon: '📧' },
		{ label: t(messages, 'nav.book'), href: '/book', icon: '✨' }
	];
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} alternates={alternates} />
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="app-shell">
	<Header {lang} {messages} />
	<NavigationRail items={navItems} />

	<main class="main-content">
		{@render children()}
	</main>

	<Footer {lang} {messages} />
	<NavigationBar items={navItems} />
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

	.main-content {
		flex: 1;
	}

	@media (min-width: 600px) {
		.main-content {
			margin-left: 80px;
		}
	}
</style>
