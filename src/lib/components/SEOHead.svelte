<script lang="ts">
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface GoogleRating {
		ratingValue: number;
		ratingCount: number;
		fetchedAt?: string;
	}

	interface Props {
		messages: Messages;
		lang: Locale;
		title?: string;
		description?: string;
		image?: string;
		alternates?: Array<{ lang: string; url: string }>;
		type?: 'website' | 'article';
		rating?: GoogleRating | null;
	}

	const SITE_BASE = 'https://mariannecottage.fr';
	const DEFAULT_OG_IMAGE = `${SITE_BASE}/images/cottage-exterior-front.jpg`;

	let {
		messages,
		lang,
		title,
		description,
		image = DEFAULT_OG_IMAGE,
		alternates = [],
		type = 'website',
		rating = null
	}: Props = $props();

	// Route-id → meta key map. Falls back to site-wide meta.title/description.
	const ROUTE_META_KEYS: Record<string, string> = {
		'/': 'home',
		'/rooms': 'rooms',
		'/gallery': 'gallery',
		'/explore': 'explore',
		'/contact': 'contact',
		'/book': 'book',
		'/legal': 'legal'
	};
	const routeKey = $derived(ROUTE_META_KEYS[$page.route.id ?? '']);
	const resolvedTitle = $derived(
		title ?? (routeKey ? t(messages, `meta.${routeKey}.title`) : t(messages, 'meta.title'))
	);
	const resolvedDescription = $derived(
		description ??
			(routeKey ? t(messages, `meta.${routeKey}.description`) : t(messages, 'meta.description'))
	);

	// Canonical = current full URL (preserves ?lang= so each variant is its own canonical)
	const canonicalUrl = $derived.by(() => {
		const url = new URL($page.url.pathname + $page.url.search, SITE_BASE);
		// Strip non-language query params from canonical to avoid duplicate-content signals
		for (const key of Array.from(url.searchParams.keys())) {
			if (key !== 'lang') url.searchParams.delete(key);
		}
		return url.toString();
	});

	const ogLocale = $derived(lang === 'en' ? 'en_GB' : lang === 'fr' ? 'fr_FR' : 'de_DE');

	// JSON-LD: BedAndBreakfast structured data. aggregateRating only included
	// if rating data is present (build-time fetch from Google Places API).
	const jsonLd = $derived.by(() => {
		const base: Record<string, unknown> = {
			'@context': 'https://schema.org',
			'@type': 'BedAndBreakfast',
			name: 'Marianne Cottage Bed and Breakfast',
			description: t(messages, 'home.about.p1'),
			url: SITE_BASE,
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
			email: 'booking@mariannecottage.fr',
			priceRange: '€€',
			image: [image],
			amenityFeature: [
				{ '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
				{ '@type': 'LocationFeatureSpecification', name: 'Free Parking', value: true },
				{ '@type': 'LocationFeatureSpecification', name: 'Breakfast Included', value: true },
				{ '@type': 'LocationFeatureSpecification', name: 'Private Garden', value: true }
			],
			numberOfRooms: 2,
			petsAllowed: false
		};
		if (rating && rating.ratingValue > 0 && rating.ratingCount > 0) {
			base.aggregateRating = {
				'@type': 'AggregateRating',
				ratingValue: rating.ratingValue.toFixed(1),
				ratingCount: rating.ratingCount,
				bestRating: '5',
				worstRating: '1'
			};
		}
		return base;
	});
</script>

<svelte:head>
	<title>{resolvedTitle}</title>
	<meta name="description" content={resolvedDescription} />

	<!-- OpenGraph -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={resolvedTitle} />
	<meta property="og:description" content={resolvedDescription} />
	<meta property="og:image" content={image} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content="Marianne Cottage" />
	<meta property="og:locale" content={ogLocale} />

	<!-- Twitter card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={resolvedTitle} />
	<meta name="twitter:description" content={resolvedDescription} />
	<meta name="twitter:image" content={image} />

	<!-- Canonical -->
	<link rel="canonical" href={canonicalUrl} />

	<!-- Hreflang -->
	{#each alternates as alt}
		<link rel="alternate" hreflang={alt.lang} href={alt.url} />
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={alternates.find(a => a.lang === 'en')?.url ?? SITE_BASE}
	/>

	<!-- JSON-LD structured data -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>
