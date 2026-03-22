<script lang="ts">
	import { page } from '$app/stores';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { localePath, t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	const navLinks = [
		{ label: t(messages, 'nav.home'), href: '/', icon: '🏠' },
		{ label: t(messages, 'nav.rooms'), href: '/rooms', icon: '🛏️' },
		{ label: t(messages, 'nav.gallery'), href: '/gallery', icon: '🖼️' },
		{ label: t(messages, 'nav.explore'), href: '/explore', icon: '🗺️' },
		{ label: t(messages, 'nav.contact'), href: '/contact', icon: '📧' },
		{ label: t(messages, 'nav.book'), href: '/book', icon: '✨' }
	];

	const isActive = (href: string) => {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	};
</script>

<!-- M3 Header - Desktop only, hides on mobile (navigation bar takes over) -->
<header
	class="sticky top-0 z-40 hidden sm:block bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] backdrop-blur-sm shadow-sm transition-all duration-200"
>
	<div class="mx-auto max-w-7xl px-6 sm:px-12 lg:px-8 h-16">
		<div class="flex items-center justify-between h-full">
			<!-- Logo -->
			<a href={localePath(lang, '/')} class="flex items-center gap-2 flex-shrink-0">
				<div class="text-xl font-[var(--md-typescale-headline-medium-font-family)] font-[var(--md-typescale-headline-medium-font-weight)] text-[var(--md-sys-color-primary)]">
					Marianne
				</div>
				<div class="text-xs font-bold uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] hidden md:block">
					Cottage
				</div>
			</a>

			<!-- Desktop Navigation -->
			<nav class="hidden lg:flex items-center gap-2">
				{#each navLinks as link}
					<a
						href={localePath(lang, link.href)}
						class="relative px-4 py-2 rounded-[var(--md-shape-corner-medium)] transition-all duration-200 ease-standard text-[var(--md-typescale-label-large-font-size)] font-[var(--md-typescale-label-large-font-weight)] {isActive(
							link.href
						)
							? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
							: 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-low)]'}"
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Language Switcher -->
			<div class="flex items-center gap-2">
				<LanguageSwitcher {lang} />
			</div>
		</div>
	</div>
</header>

<style>
	:global(body) {
		padding-top: 0;
	}
</style>
