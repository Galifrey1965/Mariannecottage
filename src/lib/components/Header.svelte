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

	let menuOpen = $state(false);
	let toggleBtnEl: HTMLElement | undefined = $state();
	let drawerNavEl: HTMLElement | undefined = $state();
	let wasMenuOpen = false;

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

	const closeMenu = () => { menuOpen = false; };

	$effect(() => {
		if (menuOpen) {
			wasMenuOpen = true;
			const firstLink = drawerNavEl?.querySelector('.drawer-link') as HTMLElement | null;
			firstLink?.focus();
		} else if (wasMenuOpen) {
			wasMenuOpen = false;
			toggleBtnEl?.focus();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && menuOpen) {
			closeMenu();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="header">
	<div class="header-inner">
		<a href={localePath(lang, '/')} class="logo">
			<span class="logo-name">Marianne</span>
			<span class="logo-subtitle">Cottage</span>
		</a>

		<nav class="desktop-nav" aria-label={t(messages, 'a11y.main_navigation')}>
			{#each navLinks as link}
				<a
					href={localePath(lang, link.href)}
					class="nav-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="header-actions">
			<LanguageSwitcher {lang} />
			<button
				bind:this={toggleBtnEl}
				class="menu-toggle"
				onclick={() => menuOpen = !menuOpen}
				aria-label={t(messages, 'a11y.toggle_menu')}
				aria-expanded={menuOpen}
			>
				{#if menuOpen}✕{:else}☰{/if}
			</button>
		</div>
	</div>
</header>

<!-- Mobile drawer -->
{#if menuOpen}
	<div class="overlay" onclick={closeMenu} aria-hidden="true"></div>
	<nav bind:this={drawerNavEl} class="mobile-drawer" aria-label={t(messages, 'a11y.mobile_navigation')}>
		{#each navLinks as link}
			<a
				href={localePath(lang, link.href)}
				class="drawer-link"
				class:active={isActive(link.href)}
				aria-current={isActive(link.href) ? 'page' : undefined}
				onclick={closeMenu}
			>
				<span class="drawer-icon" aria-hidden="true">{link.icon}</span>
				{link.label}
			</a>
		{/each}
	</nav>
{/if}

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 40;
		background-color: var(--color-bg);
		border-bottom: 1px solid var(--color-cream-dark);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
	}

	.header-inner {
		max-width: 1440px;
		margin: 0 auto;
		padding: 0 1rem;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	@media (min-width: 600px) {
		.header-inner { padding: 0 1.5rem; height: 64px; }
	}

	.logo {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
		text-decoration: none;
		flex-shrink: 0;
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
	}

	/* Desktop nav */
	.desktop-nav {
		display: none;
		align-items: center;
		gap: 0.25rem;
	}

	@media (min-width: 840px) {
		.desktop-nav { display: flex; }
	}

	.nav-link {
		padding: 0.5rem 0.75rem;
		border-radius: 12px;
		transition: all 0.2s ease;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		white-space: nowrap;
	}

	.nav-link:hover {
		background-color: var(--color-cream);
	}

	.nav-link.active {
		background-color: var(--color-sage);
		color: var(--md-sys-color-on-primary);
	}

	/* Header actions */
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	/* Hamburger toggle */
	.menu-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border: none;
		background: transparent;
		font-size: 1.25rem;
		cursor: pointer;
		border-radius: 8px;
		color: var(--color-text);
		transition: background 0.2s;
	}

	.menu-toggle:hover {
		background: var(--color-cream);
	}

	@media (min-width: 600px) {
		.menu-toggle { display: none; }
	}

	/* Overlay */
	.overlay {
		position: fixed;
		inset: 0;
		background: color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent);
		z-index: 45;
	}

	/* Mobile drawer */
	.mobile-drawer {
		position: fixed;
		top: 56px;
		right: 0;
		bottom: 0;
		width: 260px;
		background: var(--color-bg);
		z-index: 50;
		padding: 1rem 0;
		box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.drawer-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.25rem;
		font-size: 1rem;
		font-weight: 500;
		color: var(--color-text);
		text-decoration: none;
		transition: background 0.15s;
	}

	.drawer-link:hover {
		background: var(--color-cream);
	}

	.drawer-link.active {
		background: color-mix(in srgb, var(--color-sage) 15%, transparent);
		color: var(--color-sage);
		font-weight: 600;
	}

	.drawer-icon {
		font-size: 1.25rem;
		width: 1.5rem;
		text-align: center;
	}
</style>
