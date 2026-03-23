<script lang="ts">
	import { goto } from '$app/navigation';
	import { localePath, t } from '$lib/i18n';
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import BookingSummary from '$lib/components/BookingSummary.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	let step = $state<1 | 2 | 3>(1);

	let checkInDate: Date | undefined = $state();
	let checkOutDate: Date | undefined = $state();
	const nightly_rate = 120;
	const cancellationPolicy = $derived(t(messages, 'book.cancellation_policy'));

	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestCountry = $state('');
	let guests = $state(1);
	let specialRequests = $state('');

	let submitting = $state(false);
	let formError = $state('');
	let fieldErrors = $state<Record<string, string>>({});

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
		if (!guestName.trim()) errors.guestName = t(messages, 'book.error_name_required');
		if (!guestEmail.trim()) errors.guestEmail = t(messages, 'book.error_email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.guestEmail = t(messages, 'book.error_email_invalid');
		if (guestPhone && !/^[+\d\s()-]{7,20}$/.test(guestPhone)) errors.guestPhone = t(messages, 'book.error_phone_invalid');
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
				formError = result.error || t(messages, 'book.error_booking_failed');
				return;
			}
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
			formError = t(messages, 'book.error_network');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>{t(messages, 'book.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'book.title')}</h1>

	<!-- Step indicator -->
	<div class="steps">
		{#each [{ n: 1, label: t(messages, 'book.step_dates') }, { n: 2, label: t(messages, 'book.step_details') }, { n: 3, label: t(messages, 'book.step_review') }] as s}
			<button
				onclick={() => { if (s.n === 1 || (s.n === 2 && checkInDate && checkOutDate) || (s.n === 3 && checkInDate && checkOutDate && guestName && guestEmail)) step = s.n as 1 | 2 | 3; }}
				class="step-btn"
				class:active={step === s.n}
				class:done={step > s.n}
			>
				<span class="step-number" class:active={step === s.n} class:done={step > s.n}>
					{#if step > s.n}✓{:else}{s.n}{/if}
				</span>
				<span class="step-label">{s.label}</span>
			</button>
			{#if s.n < 3}
				<div class="step-connector" class:active={step > s.n}></div>
			{/if}
		{/each}
	</div>

	<div class="layout">
		<!-- Main content -->
		<div class="main-col">

			{#if step === 1}
				<div>
					<h2 class="section-heading">{t(messages, 'book.heading')}</h2>
					<BookingCalendar
						{messages}
						availability={realAvailability}
						onDateRangeSelect={handleDateRangeSelect}
						minDate={new Date()}
					/>
				</div>
			{/if}

			{#if step === 2}
				<div class="form-card">
					<h2 class="section-heading">{t(messages, 'book.guest_details')}</h2>

					<div class="form-fields">
						<div class="field">
							<label for="guestName" class="field-label">{t(messages, 'book.full_name')} *</label>
							<input id="guestName" type="text" bind:value={guestName} class="field-input" class:error={fieldErrors.guestName} placeholder={t(messages, 'book.placeholder_name')} autocomplete="name" />
							{#if fieldErrors.guestName}<p class="field-error">{fieldErrors.guestName}</p>{/if}
						</div>

						<div class="field">
							<label for="guestEmail" class="field-label">{t(messages, 'book.email_address')} *</label>
							<input id="guestEmail" type="email" bind:value={guestEmail} class="field-input" class:error={fieldErrors.guestEmail} placeholder={t(messages, 'book.placeholder_email')} autocomplete="email" />
							{#if fieldErrors.guestEmail}<p class="field-error">{fieldErrors.guestEmail}</p>{/if}
						</div>

						<div class="field-row">
							<div class="field">
								<label for="guestPhone" class="field-label">{t(messages, 'book.phone')}</label>
								<input id="guestPhone" type="tel" bind:value={guestPhone} class="field-input" class:error={fieldErrors.guestPhone} placeholder={t(messages, 'book.placeholder_phone')} autocomplete="tel" />
								{#if fieldErrors.guestPhone}<p class="field-error">{fieldErrors.guestPhone}</p>{/if}
							</div>
							<div class="field">
								<label for="guestCountry" class="field-label">{t(messages, 'book.country')}</label>
								<select id="guestCountry" bind:value={guestCountry} class="field-input">
									<option value="">{t(messages, 'book.select_country')}</option>
									<option value="FR">{t(messages, 'book.country_fr')}</option>
									<option value="GB">{t(messages, 'book.country_gb')}</option>
									<option value="DE">{t(messages, 'book.country_de')}</option>
									<option value="NL">{t(messages, 'book.country_nl')}</option>
									<option value="BE">{t(messages, 'book.country_be')}</option>
									<option value="US">{t(messages, 'book.country_us')}</option>
									<option value="CA">{t(messages, 'book.country_ca')}</option>
									<option value="AU">{t(messages, 'book.country_au')}</option>
									<option value="OTHER">{t(messages, 'book.country_other')}</option>
								</select>
							</div>
						</div>

						<div class="field">
							<label for="guests" class="field-label">{t(messages, 'book.guests')} *</label>
							<select id="guests" bind:value={guests} class="field-input">
								<option value={1}>1 {t(messages, 'booking_confirm.guest')}</option>
								<option value={2}>2 {t(messages, 'booking_confirm.guests')}</option>
								<option value={3}>3 {t(messages, 'booking_confirm.guests')}</option>
								<option value={4}>4 {t(messages, 'booking_confirm.guests')}</option>
							</select>
						</div>

						<div class="field">
							<label for="specialRequests" class="field-label">{t(messages, 'book.special_requests')}</label>
							<textarea id="specialRequests" bind:value={specialRequests} class="field-input textarea" rows="3" placeholder={t(messages, 'book.placeholder_requests')}></textarea>
						</div>

						<div class="actions">
							<button onclick={() => step = 1} class="btn-outline">{t(messages, 'book.back')}</button>
							<button onclick={goToReview} class="btn-primary flex-1">{t(messages, 'book.review_booking')}</button>
						</div>
					</div>
				</div>
			{/if}

			{#if step === 3}
				<div class="form-card">
					<h2 class="section-heading">{t(messages, 'book.review_heading')}</h2>

					<div class="review-rows">
						<div class="review-row"><span class="review-label">{t(messages, 'book.label_name')}</span><span class="review-value">{guestName}</span></div>
						<div class="review-row"><span class="review-label">{t(messages, 'book.label_email')}</span><span class="review-value">{guestEmail}</span></div>
						{#if guestPhone}
							<div class="review-row"><span class="review-label">{t(messages, 'book.label_phone')}</span><span class="review-value">{guestPhone}</span></div>
						{/if}
						{#if guestCountry}
							<div class="review-row"><span class="review-label">{t(messages, 'book.label_country')}</span><span class="review-value">{guestCountry}</span></div>
						{/if}
						{#if specialRequests}
							<div class="review-block"><span class="review-label">{t(messages, 'book.label_special_requests')}</span><p class="review-value">{specialRequests}</p></div>
						{/if}
					</div>

					<hr class="divider" />

					{#if checkInDate && checkOutDate}
						<div class="review-rows">
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_checkin')}</span>
								<span class="review-value">{checkInDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
							</div>
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_checkout')}</span>
								<span class="review-value">{checkOutDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
							</div>
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_duration')}</span>
								<span class="review-value">{nights} {nights > 1 ? t(messages, 'book.nights') : t(messages, 'book.night')}</span>
							</div>
						</div>
					{/if}

					{#if formError}
						<div class="error-box">{formError}</div>
					{/if}

					<div class="actions">
						<button onclick={() => step = 2} class="btn-outline">{t(messages, 'book.back')}</button>
						<button onclick={submitBooking} disabled={submitting} class="btn-primary flex-1">
							{#if submitting}{t(messages, 'book.submitting')}{:else}{t(messages, 'book.confirm_booking')}{/if}
						</button>
					</div>

					<p class="cancel-note">{cancellationPolicy}</p>
				</div>
			{/if}
		</div>

		<!-- Sidebar Summary -->
		<div class="sidebar">
			<BookingSummary
				{messages}
				checkInDate={checkInDate}
				checkOutDate={checkOutDate}
				nightly_rate={nightly_rate}
				guests={guests}
				cancellationPolicy={cancellationPolicy}
			/>

			<div class="rates-box">
				<h3 class="rates-title">{t(messages, 'book.seasonal_rates')}</h3>
				<div class="rates-list">
					<div class="rate-row"><span>{t(messages, 'book.rate_low')}</span><span class="rate-value">{t(messages, 'book.rate_low_price')}</span></div>
					<div class="rate-row"><span>{t(messages, 'book.rate_high')}</span><span class="rate-value">{t(messages, 'book.rate_high_price')}</span></div>
					<div class="rate-row peak"><span>{t(messages, 'book.rate_peak')}</span><span class="rate-value">{t(messages, 'book.rate_peak_price')}</span></div>
				</div>
			</div>
		</div>
	</div>

	<!-- Support -->
	<div class="support-section">
		<p class="support-text">{t(messages, 'book.need_help')}</p>
		<a href={localePath(lang, '/contact')} class="btn-secondary">
			{t(messages, 'book.contact_us')}
		</a>
	</div>
</section>

<style>
	.page-section { max-width: 1200px; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.5rem; }

	/* Steps */
	.steps { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; }
	.step-btn {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.375rem 0.75rem; border-radius: 999px;
		font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer;
		background: var(--color-cream); color: var(--color-text-muted); transition: all 0.2s;
	}
	.step-btn.active { background: var(--color-sage); color: white; }
	.step-btn.done { background: rgba(107,143,113,0.2); color: var(--color-sage); }
	.step-number {
		display: inline-flex; align-items: center; justify-content: center;
		width: 1.5rem; height: 1.5rem; border-radius: 50%;
		font-size: 0.75rem; font-weight: 700;
		background: var(--color-cream-dark); color: var(--color-text-muted);
	}
	.step-number.active { background: white; color: var(--color-sage); }
	.step-number.done { background: var(--color-sage); color: white; }
	.step-label { display: none; }
	@media (min-width: 600px) { .step-label { display: inline; } }
	.step-connector { flex: 1; height: 2px; background: var(--color-cream-dark); }
	.step-connector.active { background: var(--color-sage); }

	/* Layout */
	.layout { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 3rem; }
	@media (min-width: 1200px) { .layout { grid-template-columns: 2fr 1fr; } }
	.main-col { display: flex; flex-direction: column; gap: 1.5rem; }
	.sidebar { position: sticky; top: 6rem; align-self: start; display: flex; flex-direction: column; gap: 1.5rem; }

	/* Form card */
	.form-card { background: var(--color-cream); border-radius: 16px; padding: 1.5rem; }
	.section-heading { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-text); margin: 0 0 1.5rem; }
	.form-fields { display: flex; flex-direction: column; gap: 1.25rem; }
	.field {}
	.field-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--color-text); margin-bottom: 0.375rem; }
	.field-input {
		width: 100%; padding: 0.75rem 1rem;
		border: 1px solid var(--color-cream-dark); border-radius: 8px;
		background: var(--color-bg); color: var(--color-text);
		font-size: 0.875rem; transition: border-color 0.2s;
		box-sizing: border-box;
	}
	.field-input:focus { outline: none; border-color: var(--color-sage); box-shadow: 0 0 0 2px rgba(107,143,113,0.2); }
	.field-input.error { border-color: #c4554e; }
	.field-input.textarea { resize: none; }
	.field-error { font-size: 0.75rem; color: #c4554e; margin: 0.25rem 0 0; }
	.field-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
	@media (min-width: 600px) { .field-row { grid-template-columns: 1fr 1fr; } }

	/* Review */
	.review-rows { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
	.review-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
	.review-block { font-size: 0.875rem; }
	.review-label { color: var(--color-text-muted); }
	.review-value { font-weight: 500; color: var(--color-text); margin: 0; }
	.divider { border: none; border-top: 1px solid var(--color-cream-dark); margin: 0 0 1.5rem; }
	.error-box { padding: 1rem; margin-bottom: 1rem; background: rgba(196,85,78,0.1); color: #c4554e; border-radius: 8px; font-size: 0.875rem; }
	.cancel-note { font-size: 0.75rem; color: var(--color-text-muted); margin: 1rem 0 0; text-align: center; }

	/* Buttons */
	.actions { display: flex; gap: 0.75rem; padding-top: 0.5rem; }
	.btn-outline {
		padding: 0.75rem 1.5rem; border: 1px solid var(--color-cream-dark);
		color: var(--color-text); border-radius: 8px; background: transparent;
		cursor: pointer; transition: background 0.2s; font-size: 0.875rem;
	}
	.btn-outline:hover { background: var(--color-cream-dark); }
	.btn-primary {
		padding: 0.75rem 1.5rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 8px; border: none; cursor: pointer;
		transition: opacity 0.2s; font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.flex-1 { flex: 1; }

	/* Rates */
	.rates-box { background: var(--color-cream); border-radius: 16px; padding: 1rem; }
	.rates-title { font-size: 0.875rem; font-weight: 600; color: var(--color-text); margin: 0 0 0.75rem; }
	.rates-list { display: flex; flex-direction: column; gap: 0.5rem; }
	.rate-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); }
	.rate-value { font-weight: 500; }
	.rate-row.peak { color: var(--color-sage); }
	.rate-row.peak .rate-value { font-weight: 700; }

	/* Support */
	.support-section { text-align: center; margin-top: 3rem; }
	.support-text { color: var(--color-text-muted); margin: 0 0 1rem; }
	.btn-secondary {
		display: inline-block; padding: 0.75rem 2rem;
		background: var(--color-brown); color: white; font-weight: 600;
		border-radius: 8px; text-decoration: none; transition: opacity 0.2s;
	}
	.btn-secondary:hover { opacity: 0.9; }
</style>
