<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages } = data;

	// Alternate language links for hreflang
	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname.replace(`/${lang}`, '');
	const alternates = [
		{ lang: 'en', url: `${baseUrl}/en${currentPath}` },
		{ lang: 'fr', url: `${baseUrl}/fr${currentPath}` },
		{ lang: 'de', url: `${baseUrl}/de${currentPath}` }
	];
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} alternates={alternates} />
	<!-- Favicon, if needed -->
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
