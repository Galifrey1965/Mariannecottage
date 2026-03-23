<script lang="ts">
	import { goto } from '$app/navigation';
	import { localePath, t } from '$lib/i18n';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import BookingSummary from '$lib/components/BookingSummary.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	// Step tracking
	let step = $state<1 | 2 | 3>(1); // 1=dates, 2=guest info, 3=review

	// Dates & pricing
	let checkInDate: Date | undefined = $state();
	let checkOutDate: Date | undefined = $state();
	const nightly_rate = 120;
	const cancellationPolicy = 'Free cancellation up to 7 days before arrival';

	// Guest form fields
	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestCountry = $state('');
	let guests = $state(1);
	let specialRequests = $state('');

	// Form state
	let submitting = $state(false);
	let formError = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	// Real availability from Supabase (loaded server-side)
	const realAvailability: Record<string, boolean> = data.availability || {};

	const handleDateRangeSelect = (start: Date, end: Date) => {
		checkInDate = start;
		checkOutDate = end;
		step = 2;
	};

	const nights = $derived(
		checkInDate && checkOutDate
			? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);

	const formatDateISO = (d: Date) => d.toISOString().split('T')[0];

	function validate(): boolean {
		const errors: Record<string, string> = {};

		if (!guestName.trim()) errors.guestName = 'Name is required';
		if (!guestEmail.trim()) errors.guestEmail = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.guestEmail = 'Invalid email';
		if (guestPhone && !/^[+\d\s()-]{7,20}$/.test(guestPhone)) errors.guestPhone = 'Invalid phone number';

		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function goToReview() {
		if (validate()) step = 3;
	}

	async function submitBooking() {
		if (!validate() || !checkInDate || !checkOutDate) return;

		submitting = true;
		formError = '';

		try {
			const res = await fetch('/api/book', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					guest_name: guestName.trim(),
					guest_email: guestEmail.trim(),
					guest_phone: guestPhone.trim() || undefined,
					guest_country: guestCountry.trim() || undefined,
					num_guests: guests,
					check_in_date: formatDateISO(checkInDate),
					check_out_date: formatDateISO(checkOutDate),
					special_requests: specialRequests.trim() || undefined,
					nightly_rate
				})
			});

			const result = await res.json();

			if (!result.success) {
				formError = result.error || 'Booking failed. Please try again.';
				return;
			}

			// Redirect to confirmation with booking ref
			const params = new URLSearchParams({
				ref: result.booking.booking_reference,
				name: result.booking.guest_name,
				email: result.booking.guest_email,
				checkin: result.booking.check_in_date,
				checkout: result.booking.check_out_date,
				nights: String(result.booking.num_nights),
				guests: String(result.booking.num_guests),
				total: String(result.booking.total_cost)
			});
			goto(`/book/confirm?${params.toString()}`);
		} catch {
			formError = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
	}

	const inputClass = 'w-full px-4 py-3 border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-colors';
	const labelClass = 'block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-1.5';
	const errorClass = 'text-xs text-[var(--md-sys-color-error)] mt-1';
</script>

<svelte:head>
	<title>{t(messages, 'book.title')}</title>
</svelte:head>

<section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="md-display-large text-[var(--md-sys-color-on-surface)] mb-2">
		{t(messages, 'book.title')}
	</h1>

	<!-- Step indicator -->
	<div class="flex items-center gap-2 mb-8">
		{#each [{ n: 1, label: 'Dates' }, { n: 2, label: 'Details' }, { n: 3, label: 'Review' }] as s}
			<button
				onclick={() => { if (s.n === 1 || (s.n === 2 && checkInDate && checkOutDate) || (s.n === 3 && checkInDate && checkOutDate && guestName && guestEmail)) step = s.n as 1 | 2 | 3; }}
				class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
					{step === s.n
						? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
						: step > s.n
							? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
							: 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}"
			>
				<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
					{step === s.n
						? 'bg-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-primary)]'
						: step > s.n
							? 'bg-[var(--md-sys-color-on-primary-container)] text-[var(--md-sys-color-primary-container)]'
							: 'bg-[var(--md-sys-color-outline)] text-[var(--md-sys-color-surface)]'}"
				>
					{#if step > s.n}✓{:else}{s.n}{/if}
				</span>
				<span class="hidden sm:inline">{s.label}</span>
			</button>
			{#if s.n < 3}
				<div class="flex-1 h-0.5 {step > s.n ? 'bg-[var(--md-sys-color-primary)]' : 'bg-[var(--md-sys-color-outline-variant)]'}"></div>
			{/if}
		{/each}
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
		<!-- Main content -->
		<div class="lg:col-span-2 space-y-6">

			<!-- Step 1: Calendar -->
			{#if step === 1}
				<div>
					<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-4">{t(messages, 'book.heading')}</h2>
					<BookingCalendar
						availability={realAvailability}
						onDateRangeSelect={handleDateRangeSelect}
						minDate={new Date()}
					/>
				</div>
			{/if}

			<!-- Step 2: Guest Details -->
			{#if step === 2}
				<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6">
					<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-6">Guest Details</h2>

					<div class="space-y-5">
						<!-- Name -->
						<div>
							<label for="guestName" class={labelClass}>Full Name *</label>
							<input
								id="guestName"
								type="text"
								bind:value={guestName}
								class={inputClass}
								class:border-[var(--md-sys-color-error)]={fieldErrors.guestName}
								placeholder="John Smith"
								autocomplete="name"
							/>
							{#if fieldErrors.guestName}<p class={errorClass}>{fieldErrors.guestName}</p>{/if}
						</div>

						<!-- Email -->
						<div>
							<label for="guestEmail" class={labelClass}>Email Address *</label>
							<input
								id="guestEmail"
								type="email"
								bind:value={guestEmail}
								class={inputClass}
								class:border-[var(--md-sys-color-error)]={fieldErrors.guestEmail}
								placeholder="john@example.com"
								autocomplete="email"
							/>
							{#if fieldErrors.guestEmail}<p class={errorClass}>{fieldErrors.guestEmail}</p>{/if}
						</div>

						<!-- Phone & Country row -->
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<label for="guestPhone" class={labelClass}>Phone</label>
								<input
									id="guestPhone"
									type="tel"
									bind:value={guestPhone}
									class={inputClass}
									class:border-[var(--md-sys-color-error)]={fieldErrors.guestPhone}
									placeholder="+33 7 80 73 17 04"
									autocomplete="tel"
								/>
								{#if fieldErrors.guestPhone}<p class={errorClass}>{fieldErrors.guestPhone}</p>{/if}
							</div>
							<div>
								<label for="guestCountry" class={labelClass}>Country</label>
								<select
									id="guestCountry"
									bind:value={guestCountry}
									class={inputClass}
								>
									<option value="">Select country</option>
									<option value="FR">France</option>
									<option value="GB">United Kingdom</option>
									<option value="DE">Germany</option>
									<option value="NL">Netherlands</option>
									<option value="BE">Belgium</option>
									<option value="US">United States</option>
									<option value="CA">Canada</option>
									<option value="AU">Australia</option>
									<option value="OTHER">Other</option>
								</select>
							</div>
						</div>

						<!-- Guests -->
						<div>
							<label for="guests" class={labelClass}>{t(messages, 'book.guests')} *</label>
							<select id="guests" bind:value={guests} class={inputClass}>
								<option value={1}>1 Guest</option>
								<option value={2}>2 Guests</option>
								<option value={3}>3 Guests</option>
								<option value={4}>4 Guests</option>
							</select>
						</div>

						<!-- Special Requests -->
						<div>
							<label for="specialRequests" class={labelClass}>Special Requests</label>
							<textarea
								id="specialRequests"
								bind:value={specialRequests}
								class="{inputClass} resize-none"
								rows="3"
								placeholder="Dietary requirements, arrival time, etc."
							></textarea>
						</div>

						<!-- Actions -->
						<div class="flex gap-3 pt-2">
							<button
								onclick={() => step = 1}
								class="px-6 py-3 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-[var(--md-shape-corner-large)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
							>
								Back
							</button>
							<button
								onclick={goToReview}
								class="flex-1 px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold rounded-[var(--md-shape-corner-large)] hover:shadow-md transition-all"
							>
								Review Booking
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Step 3: Review & Submit -->
			{#if step === 3}
				<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6">
					<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-6">Review Your Booking</h2>

					<!-- Guest info summary -->
					<div class="space-y-3 mb-6">
						<div class="flex justify-between text-sm">
							<span class="text-[var(--md-sys-color-on-surface-variant)]">Name</span>
							<span class="font-medium text-[var(--md-sys-color-on-surface)]">{guestName}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-[var(--md-sys-color-on-surface-variant)]">Email</span>
							<span class="font-medium text-[var(--md-sys-color-on-surface)]">{guestEmail}</span>
						</div>
						{#if guestPhone}
							<div class="flex justify-between text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Phone</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">{guestPhone}</span>
							</div>
						{/if}
						{#if guestCountry}
							<div class="flex justify-between text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Country</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">{guestCountry}</span>
							</div>
						{/if}
						{#if specialRequests}
							<div class="text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Special Requests</span>
								<p class="font-medium text-[var(--md-sys-color-on-surface)] mt-1">{specialRequests}</p>
							</div>
						{/if}
					</div>

					<hr class="border-[var(--md-sys-color-outline-variant)] mb-6" />

					<!-- Dates summary -->
					{#if checkInDate && checkOutDate}
						<div class="space-y-3 mb-6">
							<div class="flex justify-between text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Check-in</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">
									{checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
								</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Check-out</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">
									{checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
								</span>
							</div>
							<div class="flex justify-between text-sm">
								<span class="text-[var(--md-sys-color-on-surface-variant)]">Duration</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">{nights} night{nights > 1 ? 's' : ''}</span>
							</div>
						</div>
					{/if}

					<!-- Error -->
					{#if formError}
						<div class="p-4 mb-4 bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] rounded-[var(--md-shape-corner-small)] text-sm">
							{formError}
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex gap-3">
						<button
							onclick={() => step = 2}
							class="px-6 py-3 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-[var(--md-shape-corner-large)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
						>
							Back
						</button>
						<button
							onclick={submitBooking}
							disabled={submitting}
							class="flex-1 px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold rounded-[var(--md-shape-corner-large)] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if submitting}
								Submitting...
							{:else}
								Confirm Booking
							{/if}
						</button>
					</div>

					<!-- Cancellation note -->
					<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-4 text-center">
						{cancellationPolicy}
					</p>
				</div>
			{/if}
		</div>

		<!-- Sidebar Summary -->
		<div class="lg:sticky lg:top-24 lg:self-start">
			<BookingSummary
				checkInDate={checkInDate}
				checkOutDate={checkOutDate}
				nightly_rate={nightly_rate}
				guests={guests}
				cancellationPolicy={cancellationPolicy}
			/>

			<!-- Rate Plans -->
			<div class="mt-6 bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-shape-corner-large)] p-4">
				<h3 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-3">Seasonal Rates</h3>
				<div class="space-y-2 text-xs">
					<div class="flex justify-between text-[var(--md-sys-color-on-surface-variant)]">
						<span>Low (Nov-Feb)</span>
						<span class="font-medium">€85/night</span>
					</div>
					<div class="flex justify-between text-[var(--md-sys-color-on-surface-variant)]">
						<span>High (Mar-Oct)</span>
						<span class="font-medium">€120/night</span>
					</div>
					<div class="flex justify-between text-[var(--md-sys-color-primary)]">
						<span>Peak (D-Day week)</span>
						<span class="font-bold">€140/night</span>
					</div>
				</div>
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
