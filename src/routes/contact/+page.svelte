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
					<a href="https://www.booking.com/hotel/fr/marianne-cottage.html" target="_blank" rel="noopener" class="social-link">
						{t(messages, 'contact.social.booking_com')}
					</a>
					<a href="https://www.tripadvisor.com/Hotel_Review-g12080400-d27963962-Reviews-Marianne_Cottage_Bed_And_Breakfast-Couvains_Manche_Basse_Normandie_Normandy.html" target="_blank" rel="noopener" class="social-link">
						{t(messages, 'contact.social.tripadvisor')}
					</a>
					<a href="https://facebook.com/p/Marianne-Cottage-Bed-and-Breakfast-61554481672203/" target="_blank" rel="noopener" class="social-link">
						{t(messages, 'contact.social.facebook')}
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
					{ lat: 49.1264, lng: -1.0986, title: 'Marianne Cottage', description: '1 La Haye, 50680 Couvains, France', type: 'cottage' }
				]}
				center={[49.1264, -1.0986]}
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
	.social-links { display: flex; gap: 1rem; }
	.social-link { color: var(--color-sage); font-weight: 600; text-decoration: none; }
	.social-link:hover { text-decoration: underline; }
	.form-heading { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1.5rem; }
	.map-section { margin-top: 3rem; }
	.map-heading { font-family: 'Lora', serif; font-size: 1.5rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1.5rem; }
	.map-wrapper { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
</style>
