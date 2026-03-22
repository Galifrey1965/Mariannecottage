<script lang="ts">
	import { t } from '$lib/i18n';
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import AttractionCard from '$lib/components/AttractionCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;

	// Map markers - cottage + all attractions
	const mapMarkers = [
		// Cottage
		{ lat: 49.1264, lng: -1.0986, title: 'Marianne Cottage', description: 'Your base in Normandy', type: 'cottage' as const },
		// WW2 History
		{ lat: 49.3697, lng: -0.8642, title: 'Omaha Beach', description: 'Historic D-Day landing site, 29 km', type: 'ww2' as const },
		{ lat: 49.3467, lng: -0.9167, title: 'La Cambe German Cemetery', description: 'WW2 memorial, 26 km', type: 'ww2' as const },
		{ lat: 49.355, lng: -0.9083, title: 'Overlord Museum', description: 'D-Day history museum, 29 km', type: 'ww2' as const },
		{ lat: 49.145, lng: -1.1267, title: '29th Division Monument', description: 'American WW2 memorial, 4.3 km', type: 'ww2' as const },
		// Nature & Heritage
		{ lat: 49.1886, lng: -1.0345, title: 'Cerisy Abbey', description: 'Medieval abbey in countryside, 5 km', type: 'nature' as const },
		{ lat: 49.1117, lng: -1.0881, title: 'Haras National de Saint-Lô', description: 'Historic stud farm, 13 km', type: 'nature' as const },
		// Towns & Culture
		{ lat: 49.1117, lng: -1.0881, title: 'Saint-Lô', description: 'Historic town, 13 km', type: 'towns' as const },
		{ lat: 49.2742, lng: -0.7034, title: 'Bayeux', description: 'Medieval town with cathedral, 30 km', type: 'towns' as const }
	];

	// Attraction cards data
	const attractions = [
		{
			category: 'ww2',
			items: [
				{ image: '/images/2023-05-20.jpg', title: 'Omaha Beach', distance: '29 km', description: 'Historic D-Day landing beaches and memorials' },
				{ image: '/images/2023-06-07.jpg', title: 'La Cambe German Cemetery', distance: '26 km', description: 'World War II German military cemetery' },
				{ image: '/images/2024-12-15.jpg', title: 'Overlord Museum', distance: '29 km', description: 'Comprehensive D-Day and WW2 history museum' }
			]
		},
		{
			category: 'nature',
			items: [
				{ image: '/images/2024-12-15-(1).jpg', title: 'Cerisy Abbey', distance: '5 km', description: 'Beautiful medieval abbey surrounded by nature' },
				{ image: '/images/2024-12-15-(2).jpg', title: 'Haras National de Saint-Lô', distance: '13 km', description: 'Historic stud farm with beautiful gardens' }
			]
		},
		{
			category: 'towns',
			items: [
				{ image: '/images/2024-12-15-(3).jpg', title: 'Saint-Lô', distance: '13 km', description: 'Historic medieval town with remarkable architecture' },
				{ image: '/images/unnamed.jpg', title: 'Bayeux', distance: '30 km', description: 'Famous medieval town with stunning cathedral' }
			]
		}
	];
</script>

<svelte:head>
	<title>{t(messages, 'explore.title')}</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-4">{t(messages, 'explore.title')}</h1>
	<p class="text-gray-700 text-lg mb-12">{t(messages, 'explore.description')}</p>

	<!-- Interactive Map -->
	<div class="mb-16 rounded-lg overflow-hidden shadow-lg">
		<LeafletMap markers={mapMarkers} zoom={10} height="500px" />
	</div>

	<!-- Attractions by Category -->
	<div class="space-y-16">
		{#each attractions as category}
			<div>
				<h2 class="text-3xl font-serif font-semibold text-amber-900 mb-8 text-center">
					{#if category.category === 'ww2'}
						{t(messages, 'explore.category.ww2')}
					{:else if category.category === 'nature'}
						{t(messages, 'explore.category.nature')}
					{:else}
						{t(messages, 'explore.category.towns')}
					{/if}
				</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each category.items as item}
						<AttractionCard
							image={item.image}
							title={item.title}
							distance={item.distance}
							description={item.description}
							category={category.category}
						/>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</section>
