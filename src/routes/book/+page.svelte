<script lang="ts">
	import { onDestroy } from 'svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import { localePath, t, formatDate, formatCurrency, plural } from '$lib/i18n';
	import AvailableWindowsPicker from '$lib/components/AvailableWindowsPicker.svelte';
	import BookingSummary from '$lib/components/BookingSummary.svelte';
	import BookingConfirmed from '$lib/components/BookingConfirmed.svelte';
	import { MIN_NIGHTS, MIN_LEAD_HOURS } from '$lib/booking-policy';
	import type { BookingWindow } from '$lib/booking-windows';
	import type { PageData } from './$types';
	import type { RatePlan } from '$lib/server/supabase';
	import type { Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

	let { data }: { data: PageData } = $props();
	const lang = $derived(data.lang);
	const messages = $derived(data.messages);

	type Step = 1 | 2 | 3 | 4;
	let step = $state<Step>(1);

	let checkInDate: Date | undefined = $state();
	let checkOutDate: Date | undefined = $state();
	const cancellationPolicy = $derived(t(messages, 'book.cancellation_policy'));

	const ratePlans: RatePlan[] = data.ratePlans ?? [];

	function formatDateISO(d: Date): string {
		// Local-time, not toISOString — toISOString shifts to UTC, which in
		// timezones east of UTC (e.g. BST) drops the calendar date by one and
		// silently sends "13 May" when the user picked "14 May", colliding
		// with adjacent bookings on the prior day.
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function findRatePlan(plans: RatePlan[], dateISO: string): RatePlan | null {
		const matches = plans.filter(
			(p) => p.is_active && p.valid_from <= dateISO && p.valid_until >= dateISO
		);
		if (matches.length === 0) return null;
		matches.sort((a, b) => Number(b.rate_per_night) - Number(a.rate_per_night));
		return matches[0];
	}

	function rateFor(plan: RatePlan, n: number): number {
		switch (n) {
			case 1: return Number(plan.rate_per_night);
			case 2: return Number(plan.rate_2_guests);
			case 3: return Number(plan.rate_3_guests);
			case 4: return Number(plan.rate_4_guests);
			default: return Number(plan.rate_per_night);
		}
	}

	let guestName = $state('');
	let guestEmail = $state('');
	let guestPhone = $state('');
	let guestCountry = $state('');
	let guests = $state(1);
	let specialRequests = $state('');
	let eveningMeal = $state(false);

	let formError = $state('');
	let fieldErrors = $state<Record<string, string>>({});

	const windows: BookingWindow[] = data.windows ?? [];

	function discardPendingBooking() {
		// Called when the user changes dates after a booking row was already
		// created, or steps back from Pay. The pending row stays in the DB
		// until the next /api/book POST sweeps it; we just stop pointing at it.
		bookingRef = null;
		bookingTotal = null;
		paymentElement?.unmount();
		paymentElement = null;
		elements = null;
		stripe = null;
		paymentReady = false;
		formError = '';
	}

	const handleDateRangeSelect = (start: Date, end: Date) => {
		const datesChanged =
			!checkInDate ||
			!checkOutDate ||
			formatDateISO(start) !== formatDateISO(checkInDate) ||
			formatDateISO(end) !== formatDateISO(checkOutDate);
		if (bookingRef && datesChanged) discardPendingBooking();
		checkInDate = start;
		checkOutDate = end;
		// Picking new dates clears any prior validation error — without this,
		// a stale "no rate plan covers those dates" message lingers after the
		// guest picks valid dates.
		formError = '';
		step = 2;
	};

	const nights = $derived(
		checkInDate && checkOutDate
			? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
			: 0
	);

	const matchingPlan = $derived(
		checkInDate ? findRatePlan(ratePlans, formatDateISO(checkInDate)) : null
	);
	const nightly_rate = $derived(matchingPlan ? rateFor(matchingPlan, guests) : 0);
	const noRatePlan = $derived(Boolean(checkInDate) && !matchingPlan);
	const totalCost = $derived(nights * nightly_rate);
	const totalCostLabel = $derived(formatCurrency(lang, totalCost));

	function validate(): boolean {
		const errors: Record<string, string> = {};
		if (!guestName.trim()) errors.guestName = t(messages, 'book.error_name_required');
		if (!guestEmail.trim()) errors.guestEmail = t(messages, 'book.error_email_required');
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) errors.guestEmail = t(messages, 'book.error_email_invalid');
		if (guestPhone && !/^[+\d\s()-]{7,20}$/.test(guestPhone)) errors.guestPhone = t(messages, 'book.error_phone_invalid');
		fieldErrors = errors;
		return Object.keys(errors).length === 0;
	}

	// Booking + payment state for the wizard
	let bookingRef = $state<string | null>(null);
	let bookingTotal = $state<number | null>(null);
	let preparingPayment = $state(false);
	let submitting = $state(false);
	let stripe = $state<Stripe | null>(null);
	let elements = $state<StripeElements | null>(null);
	let paymentElement = $state<StripePaymentElement | null>(null);
	let paymentMountNode: HTMLDivElement | undefined = $state();
	let paymentReady = $state(false);
	// T&Cs acceptance — must be ticked on step 3 before the Pay button is
	// enabled. The timestamp captured client-side is forwarded to the
	// PaymentIntent endpoint so it lands on bookings.terms_accepted_at.
	let termsAccepted = $state(false);
	let termsAcceptedAt = $state<string | null>(null);

	let confirmedBooking = $state<{
		booking_reference: string;
		guest_name: string;
		guest_email: string;
		num_guests: number | string;
		num_nights: number | string;
		check_in_date: string;
		check_out_date: string;
		total_cost: number | string;
		status: string;
		paid_at?: string | null;
	} | null>(null);

	async function goToPayment() {
		if (!validate()) return;
		if (!checkInDate || !checkOutDate) return;
		if (noRatePlan) {
			formError = t(messages, 'book.error_no_rate_plan');
			return;
		}
		preparingPayment = true;
		formError = '';
		try {
			// Create the pending booking row (or reuse if user is just re-entering
			// step 3 — we keep bookingRef sticky so we don't double-insert).
			if (!bookingRef) {
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
						special_requests:
							(eveningMeal
								? t(messages, 'rooms.evening_meal.request_line') +
									(specialRequests.trim() ? '\n\n' + specialRequests.trim() : '')
								: specialRequests.trim()) || undefined
					})
				});
				const result = await res.json();
				if (!result.success) {
					switch (result.error_code) {
						case 'min_nights':
							formError = t(messages, 'book.error_min_nights', {
								n: String(result.min_nights ?? MIN_NIGHTS)
							});
							break;
						case 'lead_time':
							formError = t(messages, 'book.error_lead_time', {
								h: String(result.min_lead_hours ?? MIN_LEAD_HOURS)
							});
							break;
						case 'dates_taken':
							formError = t(messages, 'book.error_dates_taken');
							break;
						case 'no_rate_plan':
							formError = t(messages, 'book.error_no_rate_plan');
							break;
						default:
							formError = result.error || t(messages, 'book.error_booking_failed');
					}
					return;
				}
				bookingRef = result.booking.booking_reference;
				bookingTotal = Number(result.booking.total_cost);
			}

			// Spin up (or fetch the existing) PaymentIntent.
			const intentRes = await fetch('/api/stripe/payment-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ booking_reference: bookingRef })
			});
			const intent = await intentRes.json();
			if (!intent.success || !intent.client_secret) {
				formError = intent.error || t(messages, 'book.error_booking_failed');
				return;
			}

			step = 3;
			await mountPaymentElement(intent.client_secret);
		} catch {
			formError = t(messages, 'book.error_network');
		} finally {
			preparingPayment = false;
		}
	}

	async function mountPaymentElement(clientSecret: string) {
		const publishable = publicEnv.PUBLIC_STRIPE_PUBLISHABLE_KEY;
		if (!publishable) {
			formError = t(messages, 'book.error_booking_failed');
			console.error('[book] PUBLIC_STRIPE_PUBLISHABLE_KEY missing');
			return;
		}
		// Lazy-load stripe.js so step 1/2 don't pay the cost.
		const { loadStripe } = await import('@stripe/stripe-js');
		const s = await loadStripe(publishable);
		if (!s) {
			formError = t(messages, 'book.error_booking_failed');
			return;
		}
		stripe = s;
		const e = s.elements({
			clientSecret,
			// Match the cottage palette so the element doesn't look bolted on.
			// .Input padding gives the card-brand icons inside the card number
			// field room to render at full size instead of being squished.
			appearance: {
				theme: 'flat',
				variables: {
					colorPrimary: '#7a8a6f',
					colorBackground: '#ffffff',
					colorText: '#2b2b2b',
					colorDanger: '#b43c3c',
					fontFamily: 'system-ui, -apple-system, sans-serif',
					borderRadius: '8px'
				},
				rules: {
					'.Input': { padding: '12px 14px' },
					'.Tab': { padding: '14px 16px' }
				}
			}
		});
		elements = e;
		const pe = e.create('payment', {
			layout: 'tabs'
		});
		paymentElement = pe;
		// Wait a microtask for the {#if step === 3} branch to render the mount node.
		await waitForMountNode();
		if (paymentMountNode) {
			pe.mount(paymentMountNode);
			pe.on('ready', () => { paymentReady = true; });
		}
	}

	function waitForMountNode(): Promise<void> {
		return new Promise((resolve) => {
			let attempts = 0;
			const check = () => {
				if (paymentMountNode || attempts >= 20) {
					resolve();
				} else {
					attempts += 1;
					setTimeout(check, 25);
				}
			};
			check();
		});
	}

	async function submitPayment() {
		if (!stripe || !elements || !bookingRef) return;
		if (!termsAccepted) {
			formError = t(messages, 'book.terms_required');
			return;
		}
		submitting = true;
		formError = '';
		try {
			// Persist the T&Cs acceptance timestamp on the booking row before
			// confirming the payment. The endpoint reuses the existing
			// PaymentIntent so this is an idempotent stamp call.
			const stampedAt = termsAcceptedAt ?? new Date().toISOString();
			termsAcceptedAt = stampedAt;
			await fetch('/api/stripe/payment-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					booking_reference: bookingRef,
					terms_accepted_at: stampedAt
				})
			}).catch(() => {
				// Non-fatal: if this fails, the booking still has the timestamp
				// captured client-side; we just won't have it server-side.
				// The Stripe confirmPayment call below is what matters.
			});

			const returnUrl = new URL(
				localePath(lang, '/book/confirm'),
				window.location.origin
			);
			returnUrl.searchParams.set('ref', bookingRef);

			const { error: stripeErr, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: returnUrl.toString()
				},
				redirect: 'if_required'
			});

			if (stripeErr) {
				formError = stripeErr.message ?? t(messages, 'book.pay_error_generic');
				return;
			}

			if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
				// No redirect required — load the booking and advance to step 4
				// where BookingConfirmed will keep polling until the webhook fires.
				// If the lookup fails (network blip, transient 5xx), fall back to
				// a synthesized row from local wizard state so step 4 still has
				// something to render — the polling in BookingConfirmed will
				// reconcile against the canonical row as soon as it can.
				let loaded: typeof confirmedBooking = null;
				try {
					const res = await fetch(`/api/book/${encodeURIComponent(bookingRef)}`);
					if (res.ok) {
						const body = await res.json();
						loaded = body.booking ?? null;
					}
				} catch {
					// fall through to fallback synthesis
				}
				if (!loaded && checkInDate && checkOutDate) {
					loaded = {
						booking_reference: bookingRef,
						guest_name: guestName,
						guest_email: guestEmail,
						num_guests: guests,
						num_nights: nights,
						check_in_date: formatDateISO(checkInDate),
						check_out_date: formatDateISO(checkOutDate),
						total_cost: bookingTotal ?? totalCost,
						status: 'pending_payment',
						paid_at: null
					};
				}
				confirmedBooking = loaded;
				step = 4;
			}
		} catch (err) {
			formError =
				err instanceof Error && err.message
					? err.message
					: t(messages, 'book.pay_error_generic');
		} finally {
			submitting = false;
		}
	}

	function handleConfirmedUpdate(b: typeof confirmedBooking) {
		if (b) confirmedBooking = b;
	}

	onDestroy(() => {
		paymentElement?.unmount();
		paymentElement = null;
		elements = null;
	});
</script>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'book.title')}</h1>

	<div class="layout">
		<div class="main-col">
			<!-- Step indicator — sized to the calendar column, sticky on every step. -->
			<div class="steps" role="group" aria-label={t(messages, 'a11y.booking_steps')}>
				{#each [
					{ n: 1, label: t(messages, 'book.step_dates') },
					{ n: 2, label: t(messages, 'book.step_details') },
					{ n: 3, label: t(messages, 'book.step_pay') },
					{ n: 4, label: t(messages, 'book.step_confirmation') }
				] as s}
					<button
						onclick={() => {
							if (step === 4) return;
							// Stepping back from Pay invalidates the in-flight Stripe
							// intent — the next "Continue to Pay" must POST /api/book
							// again so any edits to dates or guest details flow through.
							if (s.n < step && step === 3) discardPendingBooking();
							// Step back to Dates without snapping the calendar to today —
							// the guest keeps the month they were viewing so they can
							// adjust their picks in context. Calendar's selectedStart /
							// selectedEnd state survives the back-step too.
							if (s.n === 1) step = 1;
							else if (s.n === 2 && checkInDate && checkOutDate) step = 2;
							else if (s.n === 3 && checkInDate && checkOutDate && guestName && guestEmail && bookingRef) step = 3;
						}}
						class="step-btn"
						class:active={step === s.n}
						class:done={step > s.n}
						disabled={step === 4}
						aria-current={step === s.n ? 'step' : undefined}
						aria-label="{s.label} - {step > s.n ? t(messages, 'a11y.completed') : step === s.n ? t(messages, 'a11y.current') : t(messages, 'a11y.pending')}"
					>
						<span class="step-number" class:active={step === s.n} class:done={step > s.n} aria-hidden="true">
							{#if step > s.n}✓{:else}{s.n}{/if}
						</span>
						<span class="step-label">{s.label}</span>
					</button>
					{#if s.n < 4}
						<div class="step-connector" class:active={step > s.n}></div>
					{/if}
				{/each}
			</div>

			{#if step === 1}
				<div>
					<h2 class="section-heading">{t(messages, 'book.heading')}</h2>
					<p class="stay-rules">
						{MIN_NIGHTS} nights minimum · {MIN_LEAD_HOURS} hours notice
					</p>
					<AvailableWindowsPicker
						{messages}
						{lang}
						{windows}
						minNights={MIN_NIGHTS}
						onPick={handleDateRangeSelect}
					/>
					<div class="view-switch">
						<p class="view-switch-label">{t(messages, 'book.classic_fallback')}</p>
						<a href={localePath(lang, '/book/classic')} class="btn-outline view-switch-btn">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
							{t(messages, 'book.classic_link')}
						</a>
					</div>
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
							<label class="evening-meal-option">
								<input type="checkbox" bind:checked={eveningMeal} class="evening-meal-checkbox" />
								<span class="evening-meal-text">
									<span class="evening-meal-label">{t(messages, 'rooms.evening_meal.book_option_label')}</span>
									<span class="evening-meal-hint">{t(messages, 'rooms.evening_meal.book_option_hint')}</span>
								</span>
							</label>
						</div>

						<div class="field">
							<label for="specialRequests" class="field-label">{t(messages, 'book.special_requests')}</label>
							<textarea id="specialRequests" bind:value={specialRequests} class="field-input textarea" rows="3" placeholder={t(messages, 'book.placeholder_requests')}></textarea>
						</div>

						{#if formError}
							<div class="error-box" role="alert">{formError}</div>
						{/if}

						<div class="actions">
							<button onclick={() => { step = 1; discardPendingBooking(); }} class="btn-outline">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
								{t(messages, 'book.back')}
							</button>
							<button onclick={goToPayment} disabled={preparingPayment} class="btn-primary flex-1">
								{#if preparingPayment}
									{t(messages, 'book.pay_loading')}
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
									{t(messages, 'book.checkout')}
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			{#if step === 3}
				<div class="form-card">
					<h2 class="section-heading">{t(messages, 'book.pay_heading')}</h2>

					<div class="review-rows">
						<div class="review-row"><span class="review-label">{t(messages, 'book.label_name')}</span><span class="review-value">{guestName}</span></div>
						<div class="review-row"><span class="review-label">{t(messages, 'book.label_email')}</span><span class="review-value">{guestEmail}</span></div>
						{#if guestPhone}
							<div class="review-row"><span class="review-label">{t(messages, 'book.label_phone')}</span><span class="review-value">{guestPhone}</span></div>
						{/if}
						{#if eveningMeal}
							<div class="review-row"><span class="review-label">{t(messages, 'rooms.evening_meal.heading')}</span><span class="review-value">✓</span></div>
						{/if}
					</div>

					{#if checkInDate && checkOutDate}
						<hr class="divider" />
						<div class="review-rows">
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_checkin')}</span>
								<span class="review-value">{formatDate(lang, checkInDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
							</div>
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_checkout')}</span>
								<span class="review-value">{formatDate(lang, checkOutDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
							</div>
							<div class="review-row">
								<span class="review-label">{t(messages, 'book.label_duration')}</span>
								<span class="review-value">{plural(messages, 'book.night', 'book.nights', nights)}</span>
							</div>
							<div class="review-row total">
								<span class="review-label">{t(messages, 'booking_summary.total')}</span>
								<span class="review-value">{totalCostLabel}</span>
							</div>
						</div>
					{/if}

					<hr class="divider" />

					<p class="pay-subhead">{t(messages, 'book.pay_subheading')}</p>

					<div class="payment-mount" bind:this={paymentMountNode}>
						{#if !paymentReady}
							<p class="payment-loading">{t(messages, 'book.pay_loading')}</p>
						{/if}
					</div>

					{#if formError}
						<div class="error-box" role="alert">{formError}</div>
					{/if}

					<label class="terms-row">
						<input
							type="checkbox"
							bind:checked={termsAccepted}
							onchange={() => {
								if (termsAccepted && !termsAcceptedAt) termsAcceptedAt = new Date().toISOString();
							}}
							class="terms-check"
							required
						/>
						<span class="terms-label">{@html t(messages, 'book.terms_label_html')}</span>
					</label>

					<div class="actions">
						<button onclick={() => { step = 2; discardPendingBooking(); }} disabled={submitting} class="btn-outline">
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
							{t(messages, 'book.back')}
						</button>
						<button onclick={submitPayment} disabled={submitting || !paymentReady || !termsAccepted} class="btn-primary flex-1">
							{#if submitting}
								{t(messages, 'book.pay_processing')}
							{:else}
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
								{t(messages, 'book.pay_now', { amount: totalCostLabel })}
							{/if}
						</button>
					</div>

					<p class="cancel-note">{cancellationPolicy}</p>
				</div>
			{/if}

			{#if step === 4 && confirmedBooking}
				<div class="confirmed-wrap">
					<BookingConfirmed
						{messages}
						{lang}
						booking={confirmedBooking}
						pollClientSide={true}
						onBookingUpdate={handleConfirmedUpdate}
					/>
				</div>
			{/if}
		</div>

		<div class="sidebar">
			{#if noRatePlan}
				<div class="warning-banner" role="alert">
					{t(messages, 'book.error_no_rate_plan')}
				</div>
			{/if}
			<BookingSummary
				{messages}
				{lang}
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

		<div class="support-section">
			<p class="support-text">{t(messages, 'book.need_help')}</p>
			<a href={localePath(lang, '/contact')} class="btn-secondary">
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
				{t(messages, 'book.contact_us')}
			</a>
		</div>
	</div>
</section>

<style>
	.page-section { max-width: 1440px; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(1.85rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 0.5rem;
	}

	/* Layout — at desktop, support-section sits inside the grid as a
	   second row, with the sidebar spanning both rows. The sticky
	   sidebar therefore stays pinned for the entire booking-content
	   area. */
	.layout { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 3rem; }
	@media (min-width: 960px) {
		.layout {
			grid-template-columns: 2fr 1fr;
			grid-template-areas:
				"main    sidebar"
				"support sidebar";
		}
		.main-col { grid-area: main; min-height: calc(100vh - 8rem); }
		.sidebar { grid-area: sidebar; }
		.support-section { grid-area: support; margin-top: 0; }
	}
	.main-col { display: flex; flex-direction: column; gap: 1.5rem; position: relative; z-index: 1; min-width: 0; }
	.sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
	@media (min-width: 960px) { .sidebar { position: sticky; top: 7.5rem; align-self: start; max-height: calc(100vh - 8rem); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; } }

	/* Steps — sticky inside .main-col so the bar lines up with the calendar
	   column (not the full page width). z-index sits below the main header. */
	.steps {
		display: flex; align-items: center; gap: 0.5rem;
		position: sticky; top: 56px; z-index: 30;
		background: var(--color-bg);
		padding: 0.75rem 0; margin: 0;
		border-bottom: 1px solid var(--color-cream-dark);
	}
	@media (min-width: 600px) { .steps { top: 64px; } }
	.step-btn {
		display: flex; align-items: center; gap: 0.5rem;
		padding: 0.375rem 0.75rem; border-radius: 999px;
		font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer;
		background: var(--color-cream); color: var(--color-text-muted); transition: all 0.2s;
	}
	.step-btn:disabled { cursor: default; }
	.step-btn.active { background: var(--color-sage); color: white; }
	.step-btn.done { background: color-mix(in srgb, var(--color-sage) 20%, transparent); color: var(--color-sage); }
	.step-number {
		display: inline-flex; align-items: center; justify-content: center;
		width: 1.5rem; height: 1.5rem; border-radius: 50%;
		font-size: 0.75rem; font-weight: 700;
		background: var(--color-cream-dark); color: var(--color-text-muted);
	}
	.step-number.active { background: var(--md-sys-color-surface); color: var(--color-sage); }
	.step-number.done { background: var(--color-sage); color: white; }
	.step-label { display: none; }
	@media (min-width: 600px) { .step-label { display: inline; } }
	.step-connector { flex: 1; height: 2px; background: var(--color-cream-dark); }
	.step-connector.active { background: var(--color-sage); }

	/* Form card */
	.form-card { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; }
	.section-heading { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-text); margin: 0 0 1.5rem; }
	.stay-rules { margin: -1rem 0 1rem; font-size: 0.85rem; color: var(--color-text-muted); }

	.view-switch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin: 1.5rem 0 0;
	}
	.view-switch-label { margin: 0; font-size: 0.8rem; color: var(--color-text-muted); }
	.view-switch-btn { text-decoration: none; }

	.form-fields { display: flex; flex-direction: column; gap: 1.25rem; }
	.field-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--color-text); margin-bottom: 0.375rem; }
	@media (max-width: 599px) { .field-label { font-size: 1rem; } }
	.field-input {
		width: 100%; padding: 0.75rem 1rem;
		border: 1px solid var(--color-cream-dark); border-radius: var(--md-shape-corner-small);
		background: var(--color-bg); color: var(--color-text);
		font-size: 0.875rem; transition: border-color 0.2s;
		box-sizing: border-box; min-height: 44px;
	}
	.field-input:focus { outline: none; border-color: var(--color-sage); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-sage) 20%, transparent); }
	.field-input.error { border-color: var(--md-sys-color-error); }
	.field-input.textarea { resize: none; }
	.field-error { font-size: 0.75rem; color: var(--md-sys-color-error); margin: 0.25rem 0 0; }

	.evening-meal-option {
		display: flex; align-items: flex-start; gap: 0.75rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		cursor: pointer;
		background: var(--color-cream);
		transition: border-color 0.15s ease, background 0.15s ease;
	}
	.evening-meal-option:hover { border-color: var(--color-sage); }
	.evening-meal-checkbox {
		flex-shrink: 0; width: 1.1rem; height: 1.1rem; margin-top: 0.15rem;
		accent-color: var(--color-sage); cursor: pointer;
	}
	.evening-meal-text { display: flex; flex-direction: column; gap: 0.2rem; }
	.evening-meal-label { font-size: 0.95rem; font-weight: 500; color: var(--color-text); }
	.evening-meal-hint { font-size: 0.82rem; color: var(--color-text-muted); line-height: 1.45; }

	.field-row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
	@media (min-width: 600px) { .field-row { grid-template-columns: 1fr 1fr; } }

	/* Review */
	.review-rows { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; }
	.review-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
	.review-row.total { font-size: 1rem; font-weight: 600; padding-top: 0.5rem; border-top: 1px solid var(--color-cream-dark); }
	.review-row.total .review-value { color: var(--color-sage); }
	.review-label { color: var(--color-text-muted); }
	.review-value { font-weight: 500; color: var(--color-text); margin: 0; }
	.divider { border: none; border-top: 1px solid var(--color-cream-dark); margin: 0 0 1.5rem; }
	.error-box { padding: 1rem; margin-bottom: 1rem; background: var(--color-error-bg); color: var(--color-error-text); border-radius: var(--md-shape-corner-small); font-size: 0.875rem; }
	.warning-banner { padding: 0.875rem 1rem; background: var(--color-warning-bg); color: var(--color-warning-text); border-radius: var(--md-shape-corner-small); font-size: 0.8125rem; }
	.cancel-note { font-size: 0.75rem; color: var(--color-text-muted); margin: 1rem 0 0; text-align: center; }
	.terms-row {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		margin: 1rem 0 0.75rem;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text);
		cursor: pointer;
	}
	.terms-check {
		flex-shrink: 0;
		margin-top: 0.2rem;
		width: 1.05rem;
		height: 1.05rem;
		accent-color: var(--color-sage);
		cursor: pointer;
	}
	.terms-label :global(a) { color: var(--color-sage); text-decoration: underline; }
	.terms-label :global(a:hover) { text-decoration: none; }

	/* Payment Element */
	.pay-subhead { margin: 0 0 1rem; font-size: 0.85rem; color: var(--color-text-muted); }
	.payment-mount { min-height: 220px; margin-bottom: 1.25rem; }
	.payment-loading { padding: 2rem 0; text-align: center; color: var(--color-text-muted); font-size: 0.875rem; }

	/* Confirmed step — keeps the wizard chrome visible above. */
	.confirmed-wrap { padding-top: 0.5rem; }

	/* Buttons */
	.actions { display: flex; gap: 0.75rem; padding-top: 0.5rem; }
	.btn-outline {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.75rem 1.25rem; border: 1px solid var(--color-sage);
		color: var(--color-sage); border-radius: 9999px; background: #fff;
		cursor: pointer; font-weight: 600;
		transition: background 0.2s, color 0.2s, border-color 0.2s;
		font-size: 0.875rem;
	}
	.btn-outline:hover {
		background: var(--color-sage);
		color: white;
		border-color: var(--color-sage);
	}
	.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-primary {
		display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
		padding: 0.75rem 1.5rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		transition: opacity 0.2s; font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.flex-1 { flex: 1; }

	/* Rates */
	.rates-box { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1rem; }
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
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.85rem 2.25rem;
		background: transparent;
		color: var(--theme-accent);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid var(--theme-accent);
		border-radius: 9999px;
		text-decoration: none;
		transition: background 0.25s ease, color 0.25s ease;
	}
	.btn-secondary:hover { background: var(--theme-accent); color: var(--theme-bg); }
</style>
