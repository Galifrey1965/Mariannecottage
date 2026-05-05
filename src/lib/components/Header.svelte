<script lang="ts">
	import { page } from '$app/stores';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { localePath, t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface NavItem {
		label: string;
		icon: string;
		href: string;
	}

	interface Props {
		lang: Locale;
		messages: Messages;
		navItems: NavItem[];
	}

	let { lang, messages, navItems }: Props = $props();

	let menuOpen = $state(false);
	let toggleBtnEl: HTMLElement | undefined = $state();
	let drawerNavEl: HTMLElement | undefined = $state();
	let wasMenuOpen = false;

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
		<a href={localePath(lang, '/')} class="logo" aria-label="Marianne Cottage">
			<img
				src="/images/logo.png"
				srcset="/images/logo.png 1x, /images/logo@2x.png 2x"
				alt=""
				class="logo-badge"
				aria-hidden="true"
			/>
			<span class="logo-wordmark">
				<span class="logo-name">Marianne</span>
				<span class="logo-subtitle">Cottage</span>
			</span>
		</a>

		<nav class="desktop-nav" aria-label={t(messages, 'a11y.main_navigation')}>
			{#each navItems as link}
				<a
					href={link.href}
					class="nav-link"
					class:active={isActive(link.href)}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>{@html link.icon}</svg>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="header-actions">
			<LanguageSwitcher {lang} {messages} />
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
		{#each navItems as link}
			<a
				href={link.href}
				class="drawer-link"
				class:active={isActive(link.href)}
				aria-current={isActive(link.href) ? 'page' : undefined}
				onclick={closeMenu}
			>
				<svg
					class="drawer-icon"
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>{@html link.icon}</svg>
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
		background-color: var(--theme-bg);
		border-bottom: var(--theme-border-thin);
		box-shadow: none;
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
		align-items: center;
		gap: 0.625rem;
		text-decoration: none;
		flex-shrink: 0;
		color: var(--theme-warm);
	}

	.logo-badge {
		display: block;
		height: 40px;
		width: auto;
		flex-shrink: 0;
	}

	@media (min-width: 600px) {
		.logo-badge { height: 48px; }
	}

	.logo-wordmark {
		display: flex;
		align-items: baseline;
		gap: 0.375rem;
	}

	.logo-name {
		font-size: 1.35rem;
		font-family: var(--theme-font-display);
		font-weight: 500;
		letter-spacing: -0.01em;
		color: var(--theme-warm);
	}

	.logo-subtitle {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.18em;
		color: var(--theme-text-muted);
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
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.5rem 0.85rem;
		border-radius: 0;
		position: relative;
		transition: color 0.2s ease;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--theme-text-muted);
		text-decoration: none;
		white-space: nowrap;
	}

	.nav-link::after {
		content: '';
		position: absolute;
		left: 0.85rem;
		right: 0.85rem;
		bottom: 0.25rem;
		height: 1px;
		background: var(--theme-accent);
		transform: scaleX(0);
		transform-origin: center;
		transition: transform 0.25s ease;
	}

	.nav-link:hover {
		color: var(--theme-text);
	}

	.nav-link:hover::after {
		transform: scaleX(0.5);
	}

	.nav-link.active {
		color: var(--theme-accent);
		background: transparent;
	}

	.nav-link.active::after {
		transform: scaleX(1);
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

	/* Hamburger replaced by NavigationBar (mobile) and NavigationRail (medium) */
	.menu-toggle { display: none; }

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
		color: var(--theme-text);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.drawer-link:hover {
		background: var(--theme-surface);
	}

	.drawer-link.active {
		background: var(--theme-surface);
		border-left-color: var(--theme-accent);
		color: var(--theme-accent);
		font-weight: 600;
	}

	.drawer-icon {
		flex-shrink: 0;
	}
</style>
