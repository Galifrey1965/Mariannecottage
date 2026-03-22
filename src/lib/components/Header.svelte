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

	let mobileMenuOpen = $state(false);

	const navLinks = [
		{ label: t(messages, 'nav.home'), href: '/' },
		{ label: t(messages, 'nav.rooms'), href: '/rooms' },
		{ label: t(messages, 'nav.gallery'), href: '/gallery' },
		{ label: t(messages, 'nav.explore'), href: '/explore' },
		{ label: t(messages, 'nav.contact'), href: '/contact' },
		{ label: t(messages, 'nav.book'), href: '/book' }
	];
</script>

<header class="sticky top-0 z-50 border-b border-amber-200 bg-white/95 backdrop-blur-sm shadow-sm">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href={localePath(lang, '/')} class="flex items-center gap-2 flex-shrink-0">
				<div class="text-2xl font-serif font-semibold text-amber-900">Marianne</div>
				<div class="text-xs text-amber-700 uppercase tracking-widest hidden sm:block">Cottage</div>
			</a>

			<!-- Desktop Navigation -->
			<nav class="hidden lg:flex items-center gap-8">
				{#each navLinks as link}
					<a
						href={localePath(lang, link.href)}
						class="text-sm font-medium text-gray-700 hover:text-amber-900 transition-colors"
						class:text-amber-900={$page.url.pathname.endsWith(link.href)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<!-- Language Switcher + Mobile Menu -->
			<div class="flex items-center gap-4">
				<LanguageSwitcher {lang} currentPath={$page.url.pathname} />

				<!-- Mobile menu button -->
				<button
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-amber-100"
					aria-label="Toggle menu"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if !mobileMenuOpen}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						{:else}
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						{/if}
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<nav class="lg:hidden pb-4 border-t border-amber-200">
				{#each navLinks as link}
					<a
						href={localePath(lang, link.href)}
						class="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</header>

<style>
	header {
		--color-bg: #fdfbf7;
	}
</style>
