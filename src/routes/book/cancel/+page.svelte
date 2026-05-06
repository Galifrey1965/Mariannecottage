<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
	let reason = $state('');

	const formatCurrency = (n: number) =>
		new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(n);
	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<svelte:head>
	<title>Cancel booking — Marianne Cottage</title>
</svelte:head>

<main class="cancel-wrapper">
	<div class="cancel-card">
		<h1>Cancel your booking</h1>

		{#if data.state === 'error'}
			<p class="error">{data.message}</p>
			<p class="muted">If you think this is wrong, contact us at <a href="mailto:bookings@mariannecottage.fr">bookings@mariannecottage.fr</a>.</p>
		{:else}
			<p class="ref">Booking reference: <strong>{data.booking_reference}</strong></p>
			<p>Hello {data.guest_name},</p>
			<p>You're about to cancel your stay <strong>{formatDate(data.check_in_date)} → {formatDate(data.check_out_date)}</strong>.</p>

			<section class="refund-summary">
				<h2>Refund</h2>
				<div class="row">
					<span>Booking total</span>
					<span>{formatCurrency(data.total_cost)}</span>
				</div>
				<div class="row">
					<span>{data.days_before_check_in} day{data.days_before_check_in === 1 ? '' : 's'} before check-in · {data.policy_name} policy</span>
					<span>{data.refund_pct}%</span>
				</div>
				<div class="row total">
					<span>You will be refunded</span>
					<span>{formatCurrency(data.refund_amount)}</span>
				</div>
				{#if data.refund_amount === 0}
					<p class="muted">The {data.policy_name.toLowerCase()} policy doesn't allow a refund this close to check-in. You can still cancel below — it just won't refund anything.</p>
				{:else}
					<p class="muted">Refunds typically take 5–10 working days to appear on your card.</p>
				{/if}
			</section>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<form method="POST" onsubmit={() => (submitting = true)}>
				<input type="hidden" name="token" value={data.token} />
				<label for="reason" class="form-label">Reason (optional)</label>
				<textarea
					id="reason"
					name="reason"
					bind:value={reason}
					rows="3"
					placeholder="If anything went wrong or there's something you'd like us to know, tell us here. Optional."
					class="form-input"
				></textarea>
				<button type="submit" disabled={submitting} class="btn-primary">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
					{submitting ? 'Cancelling…' : data.refund_amount > 0 ? `Cancel and refund ${formatCurrency(data.refund_amount)}` : 'Cancel booking'}
				</button>
				<a href="/" class="btn-link">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
					Keep my booking
				</a>
			</form>
		{/if}
	</div>
</main>

<style>
	.cancel-wrapper {
		max-width: 38rem;
		margin: 5rem auto;
		padding: 0 1.5rem;
	}
	.cancel-card {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 2.5rem;
	}
	h1 {
		font-family: var(--theme-font-display);
		font-weight: 500;
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 1.25rem;
	}
	h2 {
		font-family: var(--theme-font-display);
		font-weight: 500;
		font-size: 1.25rem;
		color: var(--theme-warm);
		margin: 0 0 0.75rem;
	}
	.ref { font-family: monospace; color: var(--theme-accent); margin-bottom: 1.5rem; }
	.refund-summary {
		background: var(--theme-bg);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-sm);
		padding: 1.25rem 1.5rem;
		margin: 1.75rem 0;
	}
	.row {
		display: flex;
		justify-content: space-between;
		padding: 0.3rem 0;
		font-size: 0.95rem;
		color: var(--theme-text);
	}
	.row.total {
		font-weight: 600;
		font-size: 1rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--theme-border);
		margin-top: 0.3rem;
		color: var(--theme-warm);
	}
	.muted { color: var(--theme-text-muted); font-size: 0.875rem; }
	.error {
		color: var(--color-error-text);
		background: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		padding: 0.75rem 1rem;
		border-radius: var(--theme-radius-sm);
		margin: 1rem 0;
	}
	.form-label { display: block; font-size: 0.875rem; font-weight: 500; margin: 1.25rem 0 0.5rem; color: var(--theme-text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
	.form-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.7rem 1rem;
		border: 1px solid var(--theme-border);
		border-radius: var(--theme-radius-sm);
		font-family: var(--theme-font-body);
		font-size: 0.95rem;
		background: var(--theme-bg);
		color: var(--theme-text);
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	.form-input:focus {
		border-color: var(--theme-accent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-accent) 25%, transparent);
	}
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		padding: 0.85rem 2rem;
		background: var(--theme-accent);
		color: var(--theme-bg);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border: 1px solid var(--theme-accent);
		border-radius: var(--theme-radius-pill);
		cursor: pointer;
		transition: background 0.25s ease, color 0.25s ease;
	}
	.btn-primary:hover { background: var(--theme-accent-hover); border-color: var(--theme-accent-hover); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1.5rem;
		margin-left: 1rem;
		color: var(--theme-text-muted);
		text-decoration: none;
		font-size: 0.9rem;
	}
	.btn-link:hover { text-decoration: underline; color: var(--theme-accent); }
</style>
