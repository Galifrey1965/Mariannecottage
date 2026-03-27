<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		messages: Messages;
		lang: Locale;
		title?: string;
		description?: string;
		image?: string;
		url?: string;
		alternates?: Array<{ lang: string; url: string }>;
		type?: 'website' | 'article';
	}

	let {
		messages,
		lang,
		title = t(messages, 'meta.title'),
		description = t(messages, 'meta.description'),
		image = 'https://mariannecottage.netlify.app/images/2024-08-15.jpg',
		url = 'https://mariannecottage.netlify.app',
		alternates = [],
		type = 'website'
	}: Props = $props();

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BedAndBreakfast',
		name: 'Marianne Cottage Chambre d\'Hôtes',
		description: t(messages, 'home.about.p1'),
		address: {
			'@type': 'PostalAddress',
			streetAddress: '1 La Haye',
			addressLocality: 'Couvains',
			postalCode: '50680',
			addressCountry: 'FR'
		},
		geo: {
			'@type': 'GeoCoordinates',
			latitude: 49.172937,
			longitude: -0.988765
		},
		telephone: '+33 7 80 73 17 04',
		email: 'mariannecattage@gmail.com',
		priceRange: '€€',
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '9.6',
			ratingCount: '8',
			bestRating: '10'
		},
		image: [image],
		amenityFeature: [
			{ '@type': 'Text', name: 'Free WiFi' },
			{ '@type': 'Text', name: 'Free Parking' },
			{ '@type': 'Text', name: 'Breakfast Included' },
			{ '@type': 'Text', name: 'Private Garden' }
		]
	};
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<!-- OpenGraph tags -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:url" content={url} />
	<meta property="og:site_name" content="Marianne Cottage" />

	<!-- Language and canonical -->
	<meta property="og:locale" content={lang === 'en' ? 'en_US' : lang === 'fr' ? 'fr_FR' : 'de_DE'} />
	<link rel="canonical" href={url} />

	<!-- Hreflang tags for language versions -->
	{#each alternates as alt}
		<link rel="alternate" hreflang={alt.lang} href={alt.url} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={alternates[0]?.url || 'https://mariannecottage.netlify.app'} />

	<!-- JSON-LD structured data -->
	<script type="application/ld+json">
		{JSON.stringify(jsonLd)}
	</script>
</svelte:head>
