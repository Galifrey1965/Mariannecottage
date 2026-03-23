<script lang="ts">
	import { t } from '$lib/i18n';
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import AttractionCard from '$lib/components/AttractionCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;

	const mapMarkers = [
		{ lat: 49.1264, lng: -1.0986, title: 'Marianne Cottage', description: 'Your base in Normandy', type: 'cottage' as const },
		{ lat: 49.3697, lng: -0.8642, title: 'Omaha Beach', description: 'Historic D-Day landing site, 29 km', type: 'ww2' as const },
		{ lat: 49.3467, lng: -0.9167, title: 'La Cambe German Cemetery', description: 'WW2 memorial, 26 km', type: 'ww2' as const },
		{ lat: 49.355, lng: -0.9083, title: 'Overlord Museum', description: 'D-Day history museum, 29 km', type: 'ww2' as const },
		{ lat: 49.145, lng: -1.1267, title: '29th Division Monument', description: 'American WW2 memorial, 4.3 km', type: 'ww2' as const },
		{ lat: 49.1886, lng: -1.0345, title: 'Cerisy Abbey', description: 'Medieval abbey in countryside, 5 km', type: 'nature' as const },
		{ lat: 49.1117, lng: -1.0881, title: 'Haras National de Saint-Lô', description: 'Historic stud farm, 13 km', type: 'nature' as const },
		{ lat: 49.1117, lng: -1.0881, title: 'Saint-Lô', description: 'Historic town, 13 km', type: 'towns' as const },
		{ lat: 49.2742, lng: -0.7034, title: 'Bayeux', description: 'Medieval town with cathedral, 30 km', type: 'towns' as const }
	];

	const attractions = [
		{
			category: 'ww2',
			items: [
				{ image: '/images/omaha-beach.jpg', title: t(messages, 'explore.omaha_beach'), distance: '29 km', description: t(messages, 'explore.omaha_desc') },
				{ image: '/images/la-cambe-cemetery.jpg', title: t(messages, 'explore.la_cambe'), distance: '26 km', description: t(messages, 'explore.la_cambe_desc') },
				{ image: '/images/overlord-museum.jpg', title: t(messages, 'explore.overlord'), distance: '29 km', description: t(messages, 'explore.overlord_desc') }
			]
		},
		{
			category: 'nature',
			items: [
				{ image: '/images/cerisy-abbey.jpg', title: t(messages, 'explore.cerisy'), distance: '5 km', description: t(messages, 'explore.cerisy_desc') },
				{ image: '/images/haras-saint-lo.jpg', title: t(messages, 'explore.haras'), distance: '13 km', description: t(messages, 'explore.haras_desc') }
			]
		},
		{
			category: 'towns',
			items: [
				{ image: '/images/saint-lo.jpg', title: t(messages, 'explore.saintlo'), distance: '13 km', description: t(messages, 'explore.saintlo_desc') },
				{ image: '/images/bayeux-cathedral.jpg', title: t(messages, 'explore.bayeux'), distance: '30 km', description: t(messages, 'explore.bayeux_desc') }
			]
		}
	];
</script>

<svelte:head>
	<title>{t(messages, 'explore.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'explore.title')}</h1>
	<p class="page-description">{t(messages, 'explore.description')}</p>

	<div class="map-wrapper">
		<LeafletMap markers={mapMarkers} zoom={10} height="500px" />
	</div>

	<div class="categories">
		{#each attractions as category}
			<div class="category-section">
				<h2 class="category-heading">
					{#if category.category === 'ww2'}
						{t(messages, 'explore.category.ww2')}
					{:else if category.category === 'nature'}
						{t(messages, 'explore.category.nature')}
					{:else}
						{t(messages, 'explore.category.towns')}
					{/if}
				</h2>
				<div class="cards-grid">
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

<style>
	.page-section { max-width: 1280px; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-brown); margin: 0 0 1rem; }
	.page-description { color: var(--color-text-muted); font-size: 1.125rem; margin: 0 0 3rem; line-height: 1.6; }
	.map-wrapper { margin-bottom: 4rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
	.categories { display: flex; flex-direction: column; gap: 4rem; }
	.category-section {}
	.category-heading { font-family: 'Lora', serif; font-size: 1.75rem; font-weight: 600; color: var(--color-brown); margin: 0 0 2rem; text-align: center; }
	.cards-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
	@media (min-width: 840px) { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
	@media (min-width: 1200px) { .cards-grid { grid-template-columns: repeat(3, 1fr); } }
</style>
