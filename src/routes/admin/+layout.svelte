<script lang="ts">
	import '../../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	const showShell = $derived(Boolean(data.user));
	const displayName = $derived(data.profile?.display_name ?? '');
</script>

<div class="admin-shell">
	<header class="admin-header">
		<div class="header-left">
			<a href="/" class="back-link">← Back to site</a>
			<span class="divider">|</span>
			<h1 class="admin-title">Marianne Cottage Admin</h1>
		</div>

		{#if showShell}
			<nav class="admin-nav">
				<a href="/admin" class="nav-link">Bookings</a>
				<a href="/admin/rate-plans" class="nav-link">Rate plans</a>
				<a href="/admin/cancellation-policies" class="nav-link">Policies</a>
				<a href="/admin/banners" class="nav-link">Banners</a>

				<span class="user-pill">{displayName}</span>

				<form method="POST" action="/admin/logout" class="logout-form">
					<button type="submit" class="logout-btn">Sign out</button>
				</form>
			</nav>
		{/if}
	</header>

	<main class="admin-main">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell { min-height: 100vh; background: var(--color-cream); }
	.admin-header {
		background: var(--color-bg); border-bottom: 1px solid var(--color-cream-dark);
		padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between;
		flex-wrap: wrap; gap: 0.5rem;
	}
	@media (min-width: 600px) { .admin-header { padding: 0.75rem 1.5rem; } }
	.header-left { display: flex; align-items: center; gap: 0.75rem; }
	.back-link { font-size: 0.875rem; color: var(--color-text-muted); text-decoration: none; }
	.back-link:hover { color: var(--color-sage); }
	.divider { color: var(--color-cream-dark); }
	.admin-title { font-family: 'Lora', serif; font-size: 1.125rem; margin: 0; }
	.admin-nav { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; flex-wrap: wrap; }
	.nav-link { color: var(--color-text-muted); text-decoration: none; }
	.nav-link:hover { color: var(--color-sage); }
	.user-pill {
		display: inline-flex; align-items: center; gap: 0.375rem;
		background: var(--color-cream); padding: 0.25rem 0.75rem; border-radius: 9999px;
		color: var(--color-text); font-weight: 500;
	}
	.user-pill.viewing-as {
		background: var(--color-warning-bg); color: var(--color-warning-text);
	}
	.viewing-as-badge {
		font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.05em;
		font-weight: 700; opacity: 0.8;
	}
	.view-as-form { display: flex; align-items: center; gap: 0.375rem; margin: 0; }
	.view-as-label { font-size: 0.75rem; color: var(--color-text-muted); }
	.view-as-select {
		font-size: 0.875rem; padding: 0.25rem 0.5rem; border-radius: 6px;
		border: 1px solid var(--color-cream-dark); background: var(--color-bg);
		color: var(--color-text);
	}
	.logout-form { margin: 0; }
	.logout-btn {
		font-size: 0.875rem; padding: 0.25rem 0.75rem; background: transparent;
		border: 1px solid var(--color-cream-dark); border-radius: 6px;
		color: var(--color-text-muted); cursor: pointer;
	}
	.logout-btn:hover { background: var(--color-cream); color: var(--color-text); }
	.admin-main { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1rem; }
	@media (min-width: 600px) { .admin-main { padding: 1.5rem; } }
</style>
