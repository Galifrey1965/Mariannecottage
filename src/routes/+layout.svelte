<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { LOCALES } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages } = data;

	// All locales point to same URL for cookie-based routing
	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname;
	const alternates = LOCALES.map(l => ({ lang: l, url: `${baseUrl}${currentPath}` }));
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} alternates={alternates} />
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Header {lang} {messages} />
	<main class="flex-1">
		{@render children()}
	</main>
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
</style>
