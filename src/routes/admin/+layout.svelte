<script lang="ts">
	import '../../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<div class="admin-shell">
	<header class="admin-header">
		<div class="header-left">
			<a href="/" class="back-link">← Back to site</a>
			<span class="divider">|</span>
			<h1 class="admin-title">Marianne Cottage Admin</h1>
		</div>
		<nav class="admin-nav">
			<a href="/admin" class="nav-link">Bookings</a>
			<a href="/admin/availability" class="nav-link">Availability</a>
		</nav>
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
	}
	@media (min-width: 600px) { .admin-header { padding: 0.75rem 1.5rem; } }
	.header-left { display: flex; align-items: center; gap: 0.75rem; }
	.back-link { font-size: 0.875rem; color: var(--color-text-muted); text-decoration: none; }
	.back-link:hover { color: var(--color-sage); }
	.divider { color: var(--color-cream-dark); }
	.admin-title { font-family: 'Lora', serif; font-size: 1.125rem; margin: 0; }
	.admin-nav { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; }
	.nav-link { color: var(--color-text-muted); text-decoration: none; }
	.nav-link:hover { color: var(--color-sage); }
	.admin-main { max-width: 1280px; margin: 0 auto; padding: 1.5rem 1rem; }
	@media (min-width: 600px) { .admin-main { padding: 1.5rem; } }
</style>
