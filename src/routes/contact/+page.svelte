<script lang="ts">
	import { t } from '$lib/i18n';
	import EnquiryForm from '$lib/components/EnquiryForm.svelte';
	import GoogleMap from '$lib/components/GoogleMap.svelte';
	import { COTTAGE } from '$lib/data/cottage';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const lang = $derived(data.lang);
	const messages = $derived(data.messages);
</script>

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
				<a href="mailto:{t(messages, 'contact.email')}" class="info-link">
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
			<EnquiryForm {messages} {lang} />
		</div>
	</div>

	<!-- Location Map -->
	<div class="map-section">
		<h2 class="map-heading">{t(messages, 'contact.location_map')}</h2>
		<div class="map-wrapper">
			<GoogleMap
				markers={[
					{ lat: COTTAGE.location.lat, lng: COTTAGE.location.lng, title: COTTAGE.shortName, description: COTTAGE.address.formattedSingleLine, type: 'cottage' }
				]}
				center={[COTTAGE.location.lat, COTTAGE.location.lng]}
				zoom={13}
				height="400px"
				{messages}
				staticMapSrc="/images/cottage-static-map.png"
				staticMapSrcset="/images/cottage-static-map.png 1x, /images/cottage-static-map@2x.png 2x"
				staticMapAlt={t(messages, 'contact.static_map_alt')}
			/>
		</div>
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 3.5rem 1.5rem; } }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 3rem;
	}
	.two-col { display: grid; grid-template-columns: 1fr; gap: 3rem; margin-bottom: 3rem; }
	@media (min-width: 840px) { .two-col { grid-template-columns: 1fr 1fr; } }
	.info-col { display: flex; flex-direction: column; gap: 1.75rem; }
	.info-block {}
	.info-heading {
		font-family: var(--theme-font-display);
		font-size: 1rem; font-weight: 500;
		color: var(--theme-warm); margin: 0 0 0.4rem;
		letter-spacing: 0.04em; text-transform: uppercase;
	}
	.info-text { color: var(--theme-text); margin: 0; font-size: 1rem; line-height: 1.5; }
	.info-link { color: var(--theme-accent); text-decoration: none; font-size: 1rem; }
	.info-link:hover { text-decoration: underline; }
	.directions-box {
		padding: 1.25rem;
		background: var(--theme-surface);
		border-left: 2px solid var(--theme-accent);
		border-radius: 0;
	}
	.directions-heading { font-weight: 600; color: var(--theme-warm); margin: 0 0 0.5rem; }
	.directions-text { font-size: 0.875rem; color: var(--theme-text-muted); margin: 0; }
	.social-links { display: flex; flex-wrap: nowrap; gap: 0.5rem; align-items: center; }
	.fab-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		height: 2.25rem;
		padding: 0 0.7rem;
		border-radius: var(--theme-radius-pill);
		background: transparent;
		color: var(--theme-warm);
		border: 1px solid var(--theme-border);
		font-weight: 500;
		font-size: 0.8rem;
		text-decoration: none;
		white-space: nowrap;
		flex: 0 1 auto;
		min-width: 0;
		transition: background 0.2s, border-color 0.2s, color 0.2s;
	}
	.fab-link svg { width: 16px; height: 16px; }
	@media (max-width: 480px) {
		.social-links { flex-wrap: wrap; }
	}
	.fab-link:hover {
		background: var(--theme-surface);
		border-color: var(--theme-accent);
		color: var(--theme-accent);
	}
	.fab-link svg { flex-shrink: 0; }
	.form-heading {
		font-family: var(--theme-font-display);
		font-size: 1.25rem; font-weight: 500;
		color: var(--theme-warm); margin: 0 0 1.5rem;
	}
	.map-section { margin-top: 4rem; }
	.map-heading {
		font-family: var(--theme-font-display);
		font-size: 1.5rem; font-weight: 500;
		color: var(--theme-warm); margin: 0 0 1.5rem;
	}
	.map-wrapper { border-radius: var(--theme-radius-md); overflow: hidden; border: var(--theme-border-thin); }
</style>
