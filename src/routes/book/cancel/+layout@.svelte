<script lang="ts">
	// PR 4: layout reset for the guest cancel flow.
	// The `@` in the filename breaks out of the root layout chain — the cancel
	// page is a transactional surface that lands once and either confirms or
	// errors; the home-page nav, footer, and side rail would just compete for
	// attention and confuse a guest who just clicked an email link.
	import '../../../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="cancel-shell">
	<header class="cancel-header">
		<a href="/" class="brand">Marianne Cottage</a>
	</header>
	{@render children()}
</div>

<style>
	:global(body) { margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }
	.cancel-shell {
		min-height: 100vh;
		background-color: var(--color-bg, #fff);
		color: var(--color-text, #1a1a1a);
	}
	.cancel-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--color-cream-dark, #e0d9cb);
	}
	.brand {
		font-family: 'Lora', serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-sage, #6b8f71);
		text-decoration: none;
	}
	.brand:hover { text-decoration: underline; }
</style>
