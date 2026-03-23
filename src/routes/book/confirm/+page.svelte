<script lang="ts">
	import { page } from '$app/stores';
	import { localePath, t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	const params = $derived($page.url.searchParams);
	const ref = $derived(params.get('ref') || '—');
	const name = $derived(params.get('name') || '');
	const email = $derived(params.get('email') || '');
	const checkin = $derived(params.get('checkin') || '');
	const checkout = $derived(params.get('checkout') || '');
	const nights = $derived(params.get('nights') || '');
	const guestCount = $derived(params.get('guests') || '');
	const total = $derived(params.get('total') || '');

	const formatDate = (iso: string) => {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('en-US', {
			weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
		});
	};

	const formatCurrency = (amount: string) => {
		const n = parseFloat(amount);
		if (isNaN(n)) return '—';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n);
	};
</script>

<svelte:head>
	<title>{t(messages, 'booking_confirm.title')}</title>
</svelte:head>

<section class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
	<!-- Success header -->
	<div class="text-center mb-10">
		<div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--md-sys-color-primary-container)] mb-4">
			<span class="text-3xl text-[var(--md-sys-color-primary)]">✓</span>
		</div>
		<h1 class="md-display-small text-[var(--md-sys-color-on-surface)] mb-2">
			{t(messages, 'booking_confirm.thank_you')}
		</h1>
		<p class="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
			A confirmation email will be sent to <strong>{email}</strong>
		</p>
	</div>

	<!-- Booking Reference -->
	<div class="text-center mb-8 p-4 bg-[var(--md-sys-color-primary-container)] rounded-[var(--md-shape-corner-large)]">
		<p class="text-sm text-[var(--md-sys-color-on-primary-container)] mb-1">{t(messages, 'booking_confirm.reference')}</p>
		<p class="text-2xl font-bold tracking-wider text-[var(--md-sys-color-on-primary-container)]">{ref}</p>
	</div>

	<!-- Booking Summary Card -->
	<div class="bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6 shadow-md mb-8">
		<h2 class="md-headline-small text-[var(--md-sys-color-on-surface)] mb-4">
			{t(messages, 'booking_confirm.summary')}
		</h2>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
			<div>
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">Guest</p>
				<p class="font-medium text-[var(--md-sys-color-on-surface)]">{name}</p>
			</div>
			<div>
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">{t(messages, 'booking_confirm.guests')}</p>
				<p class="font-medium text-[var(--md-sys-color-on-surface)]">{guestCount} guest{Number(guestCount) > 1 ? 's' : ''}</p>
			</div>
			<div>
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">Check-in</p>
				<p class="font-medium text-[var(--md-sys-color-on-surface)]">{formatDate(checkin)}</p>
			</div>
			<div>
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">Check-out</p>
				<p class="font-medium text-[var(--md-sys-color-on-surface)]">{formatDate(checkout)}</p>
			</div>
			<div>
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-0.5">Duration</p>
				<p class="font-medium text-[var(--md-sys-color-on-surface)]">{nights} night{Number(nights) > 1 ? 's' : ''}</p>
			</div>
		</div>

		<hr class="border-[var(--md-sys-color-outline-variant)] mb-4" />

		<div class="flex justify-between items-center">
			<span class="md-headline-small text-[var(--md-sys-color-on-surface)]">{t(messages, 'booking_confirm.total_paid')}</span>
			<span class="text-2xl font-bold text-[var(--md-sys-color-primary)]">{formatCurrency(total)}</span>
		</div>

		<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2">
			Status: <span class="text-[var(--md-sys-color-tertiary)] font-semibold">Pending</span> — payment integration coming soon
		</p>
	</div>

	<!-- Directions -->
	<div class="bg-[var(--md-sys-color-tertiary-container)] rounded-[var(--md-shape-corner-large)] p-6 mb-8">
		<h3 class="font-semibold text-[var(--md-sys-color-on-tertiary-container)] mb-2">
			{t(messages, 'booking_confirm.directions')}
		</h3>
		<p class="text-sm text-[var(--md-sys-color-on-tertiary-container)]">
			{t(messages, 'booking_confirm.important')}
		</p>
		<p class="text-sm text-[var(--md-sys-color-on-tertiary-container)] mt-2">
			<strong>Address:</strong> 1 La Haye, 50680 Couvains, Normandy, France
		</p>
	</div>

	<!-- Contact -->
	<div class="text-center p-6 bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-shape-corner-large)] mb-8">
		<p class="text-sm text-[var(--md-sys-color-on-surface-variant)]">
			{t(messages, 'booking_confirm.contact_info')}
		</p>
	</div>

	<!-- CTA -->
	<div class="text-center">
		<a
			href={localePath(lang, '/')}
			class="inline-block px-8 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold rounded-[var(--md-shape-corner-large)] transition-colors hover:shadow-md"
		>
			Back to Home
		</a>
	</div>
</section>
