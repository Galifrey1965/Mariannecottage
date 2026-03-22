<script lang="ts">
	/**
	 * Booking Summary Panel
	 * Shows selected dates, rate plan, total cost, cancellation policy
	 */

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
	const tax = $derived(Math.round(subtotal * 0.1 * 100) / 100); // 10% tax
	const total = $derived(subtotal + tax);

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
</script>

<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6 shadow-md space-y-6">
	<h2 class="text-[var(--md-typescale-headline-medium-font-size)] font-[var(--md-typescale-headline-medium-font-weight)] text-[var(--md-sys-color-on-surface)]">
		Booking Summary
	</h2>

	{#if checkInDate && checkOutDate}
		<!-- Dates -->
		<div class="space-y-2">
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">Check-in:</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">
					{checkInDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
				</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">Check-out:</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">
					{checkOutDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
				</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">Nights:</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">{nights}</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">Guests:</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">{guests}</span>
			</div>
		</div>

		<hr class="border-[var(--md-sys-color-outline-variant)]" />

		<!-- Pricing -->
		<div class="space-y-2">
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">{nightly_rate}€ × {nights} nights</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">{formatCurrency(subtotal)}</span>
			</div>
			<div class="flex justify-between text-sm">
				<span class="text-[var(--md-sys-color-on-surface-variant)]">Tax (10%)</span>
				<span class="font-medium text-[var(--md-sys-color-on-surface)]">{formatCurrency(tax)}</span>
			</div>
		</div>

		<hr class="border-[var(--md-sys-color-outline-variant)]" />

		<!-- Total -->
		<div class="flex justify-between items-center">
			<span class="text-[var(--md-typescale-headline-small-font-size)] font-[var(--md-typescale-headline-small-font-weight)] text-[var(--md-sys-color-on-surface)]">
				Total
			</span>
			<span class="text-2xl font-bold text-[var(--md-sys-color-primary)]">{formatCurrency(total)}</span>
		</div>

		{#if cancellationPolicy}
			<div class="p-3 bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-shape-corner-small)]">
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">
					<strong>Cancellation:</strong> {cancellationPolicy}
				</p>
			</div>
		{/if}

		<slot />
	{:else}
		<div class="text-center py-8">
			<p class="text-[var(--md-sys-color-on-surface-variant)]">Select check-in and check-out dates to see pricing</p>
		</div>
	{/if}
</div>
