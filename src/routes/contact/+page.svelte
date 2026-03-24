<script lang="ts">
	import { t } from '$lib/i18n';
	import EnquiryForm from '$lib/components/EnquiryForm.svelte';
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'contact.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'contact.title')}</h1>

	<div class="two-col">
		<!-- Contact Info -->
		<div class="info-col">
			<div class="info-block">
				<h3 class="info-heading">{t(messages, 'contact.address_label')}</h3>
				<p class="info-text">{t(messages, 'contact.address')}</p>
			</div>

			<div class="info-block">
				<h3 class="info-heading">{t(messages, 'contact.email_label')}</h3>
				<a href="mailto:mariannecattage@gmail.com" class="info-link">
					{t(messages, 'contact.email')}
				</a>
			</div>

			<div class="info-block">
				<h3 class="info-heading">{t(messages, 'contact.phone_label')}</h3>
				<a href="tel:+33780731704" class="info-link">
					{t(messages, 'contact.phone')}
				</a>
			</div>

			<div class="info-block">
				<h3 class="info-heading">{t(messages, 'contact.airport')}</h3>
				<p class="info-text">{t(messages, 'contact.airport_info')}</p>
			</div>

			<div class="directions-box">
				<h3 class="directions-heading">{t(messages, 'contact.directions.heading')}</h3>
				<p class="directions-text">{t(messages, 'contact.directions.important')}</p>
			</div>

			<div class="info-block">
				<h3 class="info-heading">{t(messages, 'contact.social.heading')}</h3>
				<div class="social-links">
					<a href="https://www.booking.com/hotel/fr/marianne-cottage.html" target="_blank" rel="noopener" class="fab-link" aria-label="{t(messages, 'contact.social.booking_com')} ({t(messages, 'a11y.opens_new_window')})">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M2 7h10v2H4v6h8v2H2V7zm12-2h8v14h-8v-2h6V7h-6V5zM8 11h2v2H8v-2z"/>
						</svg>
						<span>{t(messages, 'contact.social.booking_com')}</span>
					</a>
					<a href="https://www.tripadvisor.com/Hotel_Review-g12080400-d27963962-Reviews-Marianne_Cottage_Bed_And_Breakfast-Couvains_Manche_Basse_Normandie_Normandy.html" target="_blank" rel="noopener" class="fab-link" aria-label="{t(messages, 'contact.social.tripadvisor')} ({t(messages, 'a11y.opens_new_window')})">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M12 2C7.64 2 3.89 4.03 2.36 7H.5l1.9 2.16A5.5 5.5 0 0 0 6.5 17a5.48 5.48 0 0 0 4.25-2l1.25 1.5 1.25-1.5A5.48 5.48 0 0 0 17.5 17a5.5 5.5 0 0 0 4.1-7.84L23.5 7h-1.86C20.11 4.03 16.36 2 12 2zm-5.5 13a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm11 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM6.5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
						</svg>
						<span>{t(messages, 'contact.social.tripadvisor')}</span>
					</a>
					<a href="https://facebook.com/p/Marianne-Cottage-Bed-and-Breakfast-61554481672203/" target="_blank" rel="noopener" class="fab-link" aria-label="{t(messages, 'contact.social.facebook')} ({t(messages, 'a11y.opens_new_window')})">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
						</svg>
						<span>{t(messages, 'contact.social.facebook')}</span>
					</a>
				</div>
			</div>
		</div>

		<!-- Contact Form -->
		<div>
			<h3 class="form-heading">{t(messages, 'contact.form.heading')}</h3>
			<EnquiryForm {messages} />
		</div>
	</div>

	<!-- Location Map -->
	<div class="map-section">
		<h2 class="map-heading">{t(messages, 'contact.location_map')}</h2>
		<div class="map-wrapper">
			<LeafletMap
				markers={[
					{ lat: 49.1728, lng: -0.9887, title: 'Marianne Cottage', description: '1 La Haye, 50680 Couvains, France', type: 'cottage' }
				]}
				center={[49.1728, -0.9887]}
				zoom={13}
				height="400px"
			/>
		</div>
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-brown); margin: 0 0 3rem; }
	.two-col { display: grid; grid-template-columns: 1fr; gap: 3rem; margin-bottom: 3rem; }
	@media (min-width: 840px) { .two-col { grid-template-columns: 1fr 1fr; } }
	.info-col { display: flex; flex-direction: column; gap: 1.5rem; }
	.info-block {}
	.info-heading { font-size: 1.125rem; font-weight: 600; color: var(--color-brown); margin: 0 0 0.5rem; }
	.info-text { color: var(--color-text-muted); margin: 0; }
	.info-link { color: var(--color-sage); text-decoration: none; }
	.info-link:hover { text-decoration: underline; }
	.directions-box { padding: 1rem; background: var(--color-cream); border-left: 4px solid var(--color-sage); border-radius: 4px; }
	.directions-heading { font-weight: 600; color: var(--color-brown); margin: 0 0 0.5rem; }
	.directions-text { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }
	.social-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
	.fab-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		height: 3rem;
		padding: 0 1.25rem;
		border-radius: var(--md-shape-corner-large);
		background: var(--color-cream);
		color: var(--color-brown);
		font-weight: 600;
		font-size: 0.875rem;
		text-decoration: none;
		box-shadow: var(--md-elevation-shadow-1);
		transition: box-shadow 0.2s, transform 0.2s;
	}
	.fab-link:hover {
		box-shadow: var(--md-elevation-shadow-2);
		transform: scale(1.05);
	}
	.fab-link:active { transform: scale(0.95); }
	.fab-link svg { flex-shrink: 0; }
	.form-heading { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1.5rem; }
	.map-section { margin-top: 3rem; }
	.map-heading { font-family: 'Lora', serif; font-size: 1.5rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1.5rem; }
	.map-wrapper { border-radius: var(--md-shape-corner-medium); overflow: hidden; box-shadow: var(--md-elevation-shadow-2); }
</style>
