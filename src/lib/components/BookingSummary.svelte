<script lang="ts">
	interface Props {
		checkInDate?: Date;
		checkOutDate?: Date;
		nightly_rate?: number;
		guests?: number;
		cancellationPolicy?: string;
	}

	let { checkInDate, checkOutDate, nightly_rate = 120, guests = 1, cancellationPolicy }: Props = $props();

	const nights = $derived(
		checkInDate && checkOutDate
			? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);

	const subtotal = $derived(nights * nightly_rate);
	const tax = $derived(Math.round(subtotal * 0.1 * 100) / 100);
	const total = $derived(subtotal + tax);

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
</script>

<div class="summary">
	<h2 class="summary-title">Booking Summary</h2>

	{#if checkInDate && checkOutDate}
		<div class="summary-rows">
			<div class="row"><span class="label">Check-in:</span><span class="value">{checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
			<div class="row"><span class="label">Check-out:</span><span class="value">{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
			<div class="row"><span class="label">Nights:</span><span class="value">{nights}</span></div>
			<div class="row"><span class="label">Guests:</span><span class="value">{guests}</span></div>
		</div>

		<hr />

		<div class="summary-rows">
			<div class="row"><span class="label">{nightly_rate}€ × {nights} nights</span><span class="value">{formatCurrency(subtotal)}</span></div>
			<div class="row"><span class="label">Tax (10%)</span><span class="value">{formatCurrency(tax)}</span></div>
		</div>

		<hr />

		<div class="total-row">
			<span>Total</span>
			<span class="total-value">{formatCurrency(total)}</span>
		</div>

		{#if cancellationPolicy}
			<div class="policy-box">
				<strong>Cancellation:</strong> {cancellationPolicy}
			</div>
		{/if}
	{:else}
		<div class="empty">Select check-in and check-out dates to see pricing</div>
	{/if}
</div>

<style>
	.summary { background: var(--color-cream); border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; gap: 1.5rem; }
	.summary-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; margin: 0; }
	.summary-rows { display: flex; flex-direction: column; gap: 0.5rem; }
	.row { display: flex; justify-content: space-between; font-size: 0.875rem; }
	.label { color: var(--color-text-muted); }
	.value { font-weight: 500; }
	hr { border: none; border-top: 1px solid var(--color-cream-dark); margin: 0; }
	.total-row { display: flex; justify-content: space-between; align-items: center; }
	.total-row span:first-child { font-family: 'Lora', serif; font-size: 1.125rem; font-weight: 600; }
	.total-value { font-size: 1.5rem; font-weight: 700; color: var(--color-sage); }
	.policy-box { padding: 0.75rem; background: white; border-radius: 8px; font-size: 0.75rem; color: var(--color-text-muted); }
	.empty { text-align: center; padding: 2rem 0; color: var(--color-text-muted); }
</style>
