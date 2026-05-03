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
	.done-wrapper { max-width: 32rem; margin: 4rem auto; padding: 0 1.5rem; }
	.done-card {
		background: var(--color-bg, #fff);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
		text-align: center;
	}
	h1 { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0 0 1rem; }
	.ref { font-family: monospace; color: var(--color-sage, #6b8f71); margin-bottom: 1.5rem; }
	.muted { color: #6b6b6b; font-size: 0.875rem; margin-top: 1.5rem; }
	.btn-link {
		display: inline-block;
		margin-top: 1.25rem;
		color: var(--color-sage, #6b8f71);
		text-decoration: none;
	}
	.btn-link:hover { text-decoration: underline; }
</style>
