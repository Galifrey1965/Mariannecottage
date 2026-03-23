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

<header class="header">
	<div class="header-inner">
		<div class="header-content">
			<a href={localePath(lang, '/')} class="logo">
				<span class="logo-name">Marianne</span>
				<span class="logo-subtitle">Cottage</span>
			</a>

			<nav class="desktop-nav">
				{#each navLinks as link}
					<a
						href={localePath(lang, link.href)}
						class="nav-link"
						class:active={isActive(link.href)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="header-actions">
				<LanguageSwitcher {lang} />
			</div>
		</div>
	</div>
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 40;
		display: none;
		background-color: var(--color-bg);
		border-bottom: 1px solid var(--color-cream-dark);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
		transition: all 0.2s ease;
	}

	@media (min-width: 600px) {
		.header {
			display: block;
		}
	}

	.header-inner {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 1.5rem;
		height: 64px;
	}

	@media (min-width: 600px) {
		.header-inner {
			padding: 0 3rem;
		}
	}

	@media (min-width: 1024px) {
		.header-inner {
			padding: 0 2rem;
		}
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		text-decoration: none;
	}

	.logo-name {
		font-size: 1.25rem;
		font-family: 'Lora', serif;
		font-weight: 600;
		color: var(--color-sage);
	}

	.logo-subtitle {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		display: none;
	}

	@media (min-width: 840px) {
		.logo-subtitle {
			display: block;
		}
	}

	.desktop-nav {
		display: none;
		align-items: center;
		gap: 0.5rem;
	}

	@media (min-width: 1024px) {
		.desktop-nav {
			display: flex;
		}
	}

	.nav-link {
		padding: 0.5rem 1rem;
		border-radius: 12px;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
	}

	.nav-link:hover {
		background-color: var(--color-cream);
		color: var(--color-text);
	}

	.nav-link.active {
		background-color: var(--color-sage);
		color: white;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
