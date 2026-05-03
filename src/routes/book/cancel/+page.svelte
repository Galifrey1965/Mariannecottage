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
					{submitting ? 'Cancelling…' : data.refund_amount > 0 ? `Cancel and refund ${formatCurrency(data.refund_amount)}` : 'Cancel booking'}
				</button>
				<a href="/" class="btn-link">Keep my booking</a>
			</form>
		{/if}
	</div>
</main>

<style>
	.cancel-wrapper {
		max-width: 36rem;
		margin: 3rem auto;
		padding: 0 1.5rem;
	}
	.cancel-card {
		background: var(--color-bg, #fff);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
	}
	h1 { font-family: 'Lora', serif; margin: 0 0 1rem; font-size: 1.75rem; }
	h2 { font-family: 'Lora', serif; margin: 0 0 0.75rem; font-size: 1.25rem; }
	.ref { font-family: monospace; color: var(--color-sage, #6b8f71); margin-bottom: 1.5rem; }
	.refund-summary {
		background: var(--color-cream, #f7f3ec);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		margin: 1.5rem 0;
	}
	.row {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem 0;
		font-size: 0.9375rem;
	}
	.row.total {
		font-weight: 600;
		font-size: 1rem;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		margin-top: 0.25rem;
	}
	.muted { color: #6b6b6b; font-size: 0.875rem; }
	.error {
		color: #b3261e;
		background: #fdedec;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin: 1rem 0;
	}
	.form-label { display: block; font-size: 0.875rem; font-weight: 500; margin: 1rem 0 0.5rem; }
	.form-input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.625rem 1rem;
		border: 1px solid var(--color-cream-dark, #e0d9cb);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.9375rem;
		background: var(--color-bg, #fff);
		outline: none;
	}
	.btn-primary {
		display: inline-block;
		margin-top: 1.25rem;
		padding: 0.75rem 1.5rem;
		background: var(--color-sage, #6b8f71);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.9375rem;
	}
	.btn-primary:hover { background: var(--color-sage-hover, #5a7a60); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link {
		display: inline-block;
		margin-top: 1.25rem;
		margin-left: 1rem;
		color: var(--color-text-muted, #6b6b6b);
		text-decoration: none;
	}
	.btn-link:hover { text-decoration: underline; }
</style>
