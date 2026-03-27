<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import NavigationRail from '$lib/components/NavigationRail.svelte';
	import NavigationBar from '$lib/components/NavigationBar.svelte';
	import SEOHead from '$lib/components/SEOHead.svelte';
	import { LOCALES, localePath, t } from '$lib/i18n';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const { lang, messages } = data;

	const baseUrl = 'https://mariannecottage.netlify.app';
	const currentPath = $page.url.pathname;
	const alternates = LOCALES.map(l => ({ lang: l, url: `${baseUrl}${currentPath}` }));

	// scroll-behavior: smooth on <html> can cause SvelteKit's scroll reset to land mid-page
	afterNavigate(({ type }) => {
		if (type !== 'popstate') {
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
	});

	const navItems = [
		{ label: t(messages, 'nav.home'), icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', href: localePath(lang, '/') },
		{ label: t(messages, 'nav.rooms'), icon: '<path d="M3 22V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v18"/><path d="M22 22H2"/><path d="M10 22v-4h4v4"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="13" width="3" height="3"/><rect x="14" y="13" width="3" height="3"/>', href: localePath(lang, '/rooms') },
		{ label: t(messages, 'nav.gallery'), icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>', href: localePath(lang, '/gallery') },
		{ label: t(messages, 'nav.explore'), icon: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>', href: localePath(lang, '/explore') },
		{ label: t(messages, 'nav.contact'), icon: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>', href: localePath(lang, '/contact') },
		{ label: t(messages, 'nav.book'), icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', href: localePath(lang, '/book') }
	];
</script>

<svelte:head>
	<html {lang} />
	<SEOHead {messages} {lang} alternates={alternates} />
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="app-shell">
	<a href="#main-content" class="skip-link">{t(messages, 'a11y.skip_to_content')}</a>
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
