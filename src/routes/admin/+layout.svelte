<script lang="ts">
	import '../../app.css';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const showShell = $derived(Boolean(data.user));
	const displayName = $derived(data.profile?.display_name ?? '');

	interface NavItem { href: string; label: string; exact?: boolean }
	const navItems: NavItem[] = [
		{ href: '/admin',                       label: 'Bookings', exact: true },
		{ href: '/admin/availability',          label: 'Availability' },
		{ href: '/admin/rate-plans',            label: 'Rate plans' },
		{ href: '/admin/cancellation-policies', label: 'Policies' },
		{ href: '/admin/banners',               label: 'Banners' },
		{ href: '/admin/audit-log',             label: 'Audit log' }
	];

	function isActive(item: NavItem, pathname: string): boolean {
		return item.exact ? pathname === item.href : pathname.startsWith(item.href);
	}
</script>

<div class="admin-shell">
	<header class="admin-header">
		{#if showShell}
			<nav class="admin-nav" aria-label="Admin sections">
				{#each navItems as item}
					<a
						href={item.href}
						class="nav-tab"
						class:active={isActive(item, $page.url.pathname)}
						aria-current={isActive(item, $page.url.pathname) ? 'page' : undefined}
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div class="admin-meta">
				<span class="user-pill">{displayName}</span>
				<form method="POST" action="/admin/logout" class="logout-form">
					<button type="submit" class="logout-btn">Sign out</button>
				</form>
			</div>
		{/if}
	</header>

	<main class="admin-main">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell { min-height: 100vh; background: var(--color-cream); }

	.admin-header {
		position: sticky;
		top: 56px; /* main site Header is 56px tall + sticky at 0 */
		z-index: 39;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-cream-dark);
		padding: 0.55rem 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}
	@media (min-width: 600px) { .admin-header { padding: 0.55rem 1.5rem; } }

	.admin-nav {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.nav-tab {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		color: var(--color-text);
		font-weight: 500;
		text-decoration: none;
		border: 1px solid transparent;
		transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
	}
	.nav-tab:hover {
		background: var(--color-cream);
		border-color: var(--color-cream-dark);
		color: var(--color-sage);
	}
	.nav-tab.active {
		background: var(--color-sage);
		color: white;
		border-color: var(--color-sage);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.nav-tab.active:hover {
		background: var(--color-sage);
		color: white;
	}

	.admin-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}

	.user-pill {
		display: inline-flex; align-items: center; gap: 0.375rem;
		background: var(--color-cream); padding: 0.25rem 0.75rem; border-radius: 9999px;
		color: var(--color-text); font-weight: 500; font-size: 0.8125rem;
	}

	.logout-form { margin: 0; }
	.logout-btn {
		font-size: 0.8125rem; padding: 0.3rem 0.75rem; background: transparent;
		border: 1px solid var(--color-cream-dark); border-radius: 6px;
		color: var(--color-text-muted); cursor: pointer;
	}
	.logout-btn:hover { background: var(--color-cream); color: var(--color-text); }

	.admin-main { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1rem; }
	@media (min-width: 600px) { .admin-main { padding: 1.5rem; } }
</style>
