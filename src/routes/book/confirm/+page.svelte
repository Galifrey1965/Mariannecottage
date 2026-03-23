<script lang="ts">
	import { page } from '$app/stores';
	import { localePath, t, formatDate as fmtDate, formatCurrency as fmtCur, plural } from '$lib/i18n';
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
		return fmtDate(lang, new Date(iso), {
			weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
		});
	};

	const formatCurrency = (amount: string) => {
		const n = parseFloat(amount);
		if (isNaN(n)) return '—';
		return fmtCur(lang, n);
	};
</script>

<svelte:head>
	<title>{t(messages, 'booking_confirm.title')}</title>
</svelte:head>

<section class="page-section">
	<!-- Success header -->
	<div class="success-header">
		<div class="success-icon">
			<span>✓</span>
		</div>
		<h1 class="success-title">{t(messages, 'booking_confirm.thank_you')}</h1>
		<p class="success-subtitle">
			{t(messages, 'booking_confirm.confirmation_email')} <strong>{email}</strong>
		</p>
	</div>

	<!-- Booking Reference -->
	<div class="ref-box">
		<p class="ref-label">{t(messages, 'booking_confirm.reference')}</p>
		<p class="ref-value">{ref}</p>
	</div>

	<!-- Booking Summary Card -->
	<div class="summary-card">
		<h2 class="summary-heading">{t(messages, 'booking_confirm.summary')}</h2>

		<div class="summary-grid">
			<div class="summary-item">
				<p class="item-label">{t(messages, 'booking_confirm.guest')}</p>
				<p class="item-value">{name}</p>
			</div>
			<div class="summary-item">
				<p class="item-label">{t(messages, 'booking_confirm.guests')}</p>
				<p class="item-value">{plural(messages, 'booking_confirm.guest', 'booking_confirm.guests', Number(guestCount))}</p>
			</div>
			<div class="summary-item">
				<p class="item-label">{t(messages, 'booking_confirm.label_checkin')}</p>
				<p class="item-value">{formatDate(checkin)}</p>
			</div>
			<div class="summary-item">
				<p class="item-label">{t(messages, 'booking_confirm.label_checkout')}</p>
				<p class="item-value">{formatDate(checkout)}</p>
			</div>
			<div class="summary-item">
				<p class="item-label">{t(messages, 'booking_confirm.label_duration')}</p>
				<p class="item-value">{plural(messages, 'book.night', 'book.nights', Number(nights))}</p>
			</div>
		</div>

		<hr class="divider" />

		<div class="total-row">
			<span class="total-label">{t(messages, 'booking_confirm.total_paid')}</span>
			<span class="total-value">{formatCurrency(total)}</span>
		</div>

		<p class="status-note">
			{t(messages, 'booking_confirm.status')}: <span class="status-pending">{t(messages, 'booking_confirm.status_pending')}</span> — {t(messages, 'booking_confirm.status_note')}
		</p>
	</div>

	<!-- Directions -->
	<div class="directions-box">
		<h3 class="directions-heading">{t(messages, 'booking_confirm.directions')}</h3>
		<p class="directions-text">{t(messages, 'booking_confirm.important')}</p>
		<p class="directions-text address">
			<strong>{t(messages, 'booking_confirm.address')}:</strong> {t(messages, 'contact.address')}
		</p>
	</div>

	<!-- Contact -->
	<div class="contact-box">
		<p class="contact-text">{t(messages, 'booking_confirm.contact_info')}</p>
	</div>

	<!-- CTA -->
	<div class="cta-center">
		<a href={localePath(lang, '/')} class="cta-button">{t(messages, 'booking_confirm.back_home')}</a>
	</div>
</section>

<style>
	.page-section { max-width: 48rem; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }

	.success-header { text-align: center; margin-bottom: 2.5rem; }
	.success-icon {
		display: inline-flex; align-items: center; justify-content: center;
		width: 4rem; height: 4rem; border-radius: 50%;
		background: color-mix(in srgb, var(--color-sage) 20%, transparent); margin-bottom: 1rem;
	}
	.success-icon span { font-size: 1.75rem; color: var(--color-sage); }
	.success-title { font-family: 'Lora', serif; font-size: 2rem; font-weight: 700; color: var(--color-text); margin: 0 0 0.5rem; }
	.success-subtitle { color: var(--color-text-muted); font-size: 1.125rem; margin: 0; }

	.ref-box { text-align: center; margin-bottom: 2rem; padding: 1rem; background: color-mix(in srgb, var(--color-sage) 15%, transparent); border-radius: var(--md-shape-corner-medium); }
	.ref-label { font-size: 0.875rem; color: var(--color-text-muted); margin: 0 0 0.25rem; }
	.ref-value { font-size: 1.5rem; font-weight: 700; letter-spacing: 0.1em; color: var(--color-text); margin: 0; }

	.summary-card { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; box-shadow: var(--md-elevation-shadow-1); margin-bottom: 2rem; }
	.summary-heading { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; margin: 0 0 1rem; }
	.summary-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.5rem; }
	@media (min-width: 600px) { .summary-grid { grid-template-columns: 1fr 1fr; } }
	.summary-item {}
	.item-label { font-size: 0.75rem; color: var(--color-text-muted); margin: 0 0 0.125rem; }
	.item-value { font-weight: 500; color: var(--color-text); margin: 0; }
	.divider { border: none; border-top: 1px solid var(--color-cream-dark); margin: 0 0 1rem; }
	.total-row { display: flex; justify-content: space-between; align-items: center; }
	.total-label { font-family: 'Lora', serif; font-size: 1.125rem; font-weight: 600; }
	.total-value { font-size: 1.5rem; font-weight: 700; color: var(--color-sage); }
	.status-note { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.5rem 0 0; }
	.status-pending { color: var(--color-sage); font-weight: 600; }

	.directions-box { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; margin-bottom: 2rem; }
	.directions-heading { font-weight: 600; color: var(--color-brown); margin: 0 0 0.5rem; }
	.directions-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
	.directions-text.address { margin-top: 0.5rem; }

	.contact-box { text-align: center; padding: 1.5rem; background: var(--color-cream); border-radius: var(--md-shape-corner-medium); margin-bottom: 2rem; }
	.contact-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

	.cta-center { text-align: center; }
	.cta-button {
		display: inline-block; padding: 0.75rem 2rem;
		background: var(--color-sage); color: var(--md-sys-color-on-primary); font-weight: 600;
		border-radius: var(--md-shape-corner-small); text-decoration: none; transition: opacity 0.2s;
	}
	.cta-button:hover { opacity: 0.9; }
</style>
