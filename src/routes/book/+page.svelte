<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import BookingSummary from '$lib/components/BookingSummary.svelte';
	import M3Button from '$lib/components/M3Button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	let checkInDate: Date | undefined = $state();
	let checkOutDate: Date | undefined = $state();
	let guests = $state(1);

	// Mock availability data (TODO: fetch from Supabase)
	const mockAvailability: Record<string, boolean> = {};
	const today = new Date();
	for (let i = 0; i < 90; i++) {
		const date = new Date(today);
		date.setDate(date.getDate() + i);
		const key = date.toISOString().split('T')[0];
		// Mock: block 5-12 June (D-Day week at premium), random other dates
		const dayOfMonth = date.getDate();
		const month = date.getMonth() + 1;
		mockAvailability[key] = !(month === 6 && dayOfMonth >= 5 && dayOfMonth <= 12) && Math.random() > 0.1;
	}

	const handleDateRangeSelect = (start: Date, end: Date) => {
		checkInDate = start;
		checkOutDate = end;
	};

	const nightly_rate = 120; // EUR
	const cancellationPolicy = 'Free cancellation up to 7 days before arrival';
</script>

<svelte:head>
	<title>{t(messages, 'book.title')}</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="md-display-large text-[var(--md-sys-color-on-surface)] mb-2">
		{t(messages, 'book.title')}
	</h1>
	<p class="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8">
		Select your dates and complete your booking
	</p>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
		<!-- Booking Form -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Calendar -->
			<div>
				<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-4">Select Dates</h2>
				<BookingCalendar
					availability={mockAvailability}
					onDateRangeSelect={handleDateRangeSelect}
					minDate={new Date()}
				/>
			</div>

			<!-- Guests -->
			{#if checkInDate && checkOutDate}
				<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6">
					<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-4">Guest Information</h2>

					<div class="space-y-4">
						<div>
							<label for="guests" class="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-2">
								Number of Guests
							</label>
							<select
								id="guests"
								bind:value={guests}
								class="w-full px-4 py-2 border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
							>
								<option value={1}>1 Guest</option>
								<option value={2}>2 Guests</option>
								<option value={3}>3 Guests</option>
								<option value={4}>4 Guests</option>
							</select>
						</div>

						<div class="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
							<a
								href="https://booking.com"
								target="_blank"
								rel="noopener"
								class="inline-block w-full text-center px-8 py-3 bg-[var(--md-sys-color-primary)] hover:bg-opacity-90 text-[var(--md-sys-color-on-primary)] font-semibold rounded-[var(--md-shape-corner-large)] transition-colors"
							>
								{t(messages, 'book.booking_com_link')}
							</a>
							<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center mt-2">
								Complete booking via Booking.com (Phase 4: Stripe integration coming)
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Sidebar Summary -->
		<div>
			<BookingSummary
				checkInDate={checkInDate}
				checkOutDate={checkOutDate}
				nightly_rate={nightly_rate}
				guests={guests}
				cancellationPolicy={cancellationPolicy}
			/>
		</div>
	</div>

	<!-- Rate Plans Info -->
	<div class="bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-shape-corner-large)] p-8">
		<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-6">Rate Plans</h2>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-4">
				<h3 class="md-headline-small text-[var(--md-sys-color-on-surface)] mb-2">Low Season</h3>
				<p class="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">Nov - Feb</p>
				<p class="text-xl font-bold text-[var(--md-sys-color-primary)]">€85/night</p>
			</div>

			<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-4">
				<h3 class="md-headline-small text-[var(--md-sys-color-on-surface)] mb-2">High Season</h3>
				<p class="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-2">Mar - May, Sep - Oct</p>
				<p class="text-xl font-bold text-[var(--md-sys-color-primary)]">€120/night</p>
			</div>

			<div class="bg-[var(--md-sys-color-primary-container)] rounded-[var(--md-shape-corner-large)] p-4 border-2 border-[var(--md-sys-color-primary)]">
				<h3 class="md-headline-small text-[var(--md-sys-color-on-primary-container)] mb-2">Peak Season</h3>
				<p class="text-sm text-[var(--md-sys-color-on-primary-container)] opacity-90 mb-2">Jun 1-8 (D-Day week)</p>
				<p class="text-xl font-bold text-[var(--md-sys-color-primary)]">€140/night</p>
			</div>
		</div>
	</div>

	<!-- Support -->
	<div class="mt-12 text-center">
		<p class="text-[var(--md-sys-color-on-surface-variant)] mb-4">
			Need help with your booking?
		</p>
		<a
			href={localePath(lang, '/contact')}
			class="inline-block px-8 py-3 bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)] font-semibold rounded-[var(--md-shape-corner-large)] transition-colors hover:shadow-md"
		>
			{t(messages, 'book.contact_us')}
		</a>
	</div>
</section>
