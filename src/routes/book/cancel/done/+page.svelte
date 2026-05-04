<script lang="ts">
	import { page } from '$app/state';
	const ref = $derived(page.url.searchParams.get('ref'));
</script>

<svelte:head>
	<title>Booking cancelled — Marianne Cottage</title>
</svelte:head>

<main class="done-wrapper">
	<div class="done-card">
		<h1>Booking cancelled</h1>
		{#if ref}
			<p class="ref">Reference: <strong>{ref}</strong></p>
		{/if}
		<p>Your booking has been cancelled. If a refund applies under the cancellation policy, it has been issued to your original card and typically takes 5–10 working days to appear.</p>
		<p>We're sorry your stay didn't work out — we hope to welcome you another time.</p>
		<p class="muted">A confirmation email will follow once email infrastructure is live. In the meantime, if you have questions please get in touch at <a href="mailto:bookings@mariannecottage.fr">bookings@mariannecottage.fr</a>.</p>
		<a href="/" class="btn-link">← Return to home</a>
	</div>
</main>

<style>
	.done-wrapper { max-width: 34rem; margin: 5rem auto; padding: 0 1.5rem; }
	.done-card {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 2.5rem;
		text-align: center;
		color: var(--theme-text);
	}
	h1 {
		font-family: var(--theme-font-display);
		font-weight: 500;
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 1.25rem;
	}
	.ref { font-family: monospace; color: var(--theme-accent); margin-bottom: 1.5rem; }
	.muted { color: var(--theme-text-muted); font-size: 0.875rem; margin-top: 1.75rem; }
	.btn-link {
		display: inline-block;
		margin-top: 1.5rem;
		padding: 0.7rem 1.75rem;
		color: var(--theme-accent);
		border: 1px solid var(--theme-accent);
		border-radius: var(--theme-radius-pill);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.85rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		text-decoration: none;
		transition: background 0.25s ease, color 0.25s ease;
	}
	.btn-link:hover { background: var(--theme-accent); color: var(--theme-bg); text-decoration: none; }
</style>
