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

	// All locales point to same URL for cookie-based routing
	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname;
	const alternates = LOCALES.map(l => ({ lang: l, url: `${baseUrl}${currentPath}` }));

	// Navigation items for M3 components
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

<div class="flex min-h-screen flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]">
	<Header {lang} {messages} />
	<NavigationRail items={navItems} />

	<main class="flex-1 sm:ml-20">
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
</style>
