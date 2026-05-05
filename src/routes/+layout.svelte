<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NavigationRail from '$lib/components/NavigationRail.svelte';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import SiteBanner from '$lib/components/SiteBanner.svelte';
	import CookieConsent from '$lib/components/CookieConsent.svelte';
	import { LOCALES, localePath, t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages, banners, rating } = data;

	const baseUrl = 'https://mariannecottage.fr';
	const alternates = $derived(
		LOCALES.map(l => ({
			lang: l,
			url: l === 'en'
				? `${baseUrl}${$page.url.pathname}`
				: `${baseUrl}${$page.url.pathname}?lang=${l}`
		}))
	);

	// scroll-behavior: smooth on <html> can cause SvelteKit's scroll reset to land mid-page
	afterNavigate(({ type }) => {
		if (type !== 'popstate') {
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
	});

	const navItems = [
		{ label: t(messages, 'nav.home'), icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', href: localePath(lang, '/') },
		{ label: t(messages, 'nav.rooms'), icon: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20"/><path d="M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><path d="M12 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>', href: localePath(lang, '/rooms') },
		{ label: t(messages, 'nav.gallery'), icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', href: localePath(lang, '/gallery') },
		{ label: t(messages, 'nav.explore'), icon: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', href: localePath(lang, '/explore') },
		{ label: t(messages, 'nav.contact'), icon: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', href: localePath(lang, '/contact') },
		{ label: t(messages, 'nav.book'), icon: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>', href: localePath(lang, '/book') }
	];
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} {alternates} {rating} />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="icon" type="image/png" href="/favicon.png" sizes="64x64" />
</svelte:head>

<div class="app-shell">
	<a href="#main-content" class="skip-link">{t(messages, 'a11y.skip_to_content')}</a>

	{#each banners as banner (banner.id)}
		<SiteBanner {banner} {lang} />
	{/each}

	<Header {lang} {messages} {navItems} />

	<div class="app-body">
		<NavigationRail items={navItems} label={t(messages, 'a11y.side_navigation')} />

		<main id="main-content" class="main-content" tabindex="-1">
			{@render children()}
		</main>
	</div>

	<NavigationBar items={navItems} label={t(messages, "a11y.mobile_navigation")} />
	<Footer {lang} {messages} />
</div>

<CookieConsent {lang} {messages} />

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
			margin-left: 72px;
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
