<script lang="ts">
	import { t } from '$lib/i18n';
	import { POIS } from '$lib/data/poi';
	import type { PoiCategory } from '$lib/data/poi';
	import type { PageData } from './$types';
	import PoiFilterBar from '$lib/components/poi/PoiFilterBar.svelte';
	import PoiGrid from '$lib/components/poi/PoiGrid.svelte';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	let selectedCategory = $state<PoiCategory | 'all'>('all');
	let sortBy = $state<'distance' | 'popularity'>('distance');

	const filteredAndSorted = $derived(
		POIS.filter((poi) => selectedCategory === 'all' || poi.category === selectedCategory).sort(
			(a, b) =>
				sortBy === 'distance'
					? a.distanceKm - b.distanceKm
					: b.popularityScore - a.popularityScore
		)
	);
</script>

<svelte:head>
	<title>{t(messages, 'explore.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'explore.title')}</h1>
	<p class="page-description">{t(messages, 'explore.description')}</p>

	<div class="filter-bar-wrapper">
		<PoiFilterBar {messages} {lang} bind:selectedCategory bind:sortBy />
	</div>

	<PoiGrid pois={filteredAndSorted} {messages} {lang} />
</section>

<style>
	.page-section {
		max-width: 1440px;
		margin: 0 auto;
		padding: 4rem 1rem;
	}

	@media (min-width: 600px) {
		.page-section {
			padding: 4rem 1.5rem;
		}
	}

	.page-title {
		font-family: 'Lora', serif;
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-brown);
		margin: 0 0 1rem;
	}

	.page-description {
		color: var(--color-text-muted);
		font-size: 1.125rem;
		margin: 0 0 2rem;
		line-height: 1.6;
	}

	.filter-bar-wrapper {
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		background: var(--color-cream, #f5f0e8);
		border-radius: var(--md-shape-corner-medium, 12px);
		border: 1px solid var(--color-cream-dark, #ede6d8);
	}
</style>
