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
		padding: 5rem 1rem;
	}

	@media (min-width: 600px) {
		.page-section {
			padding: 6rem 1.5rem;
		}
	}

	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 1rem;
	}

	.page-description {
		color: var(--theme-text-muted);
		font-size: 1.1rem;
		margin: 0 0 2.5rem;
		line-height: 1.7;
		max-width: 50rem;
	}

	.filter-bar-wrapper {
		margin-bottom: 2rem;
		padding: 0.85rem 1.1rem;
		background: var(--theme-surface);
		border-radius: var(--theme-radius-sm);
		border: var(--theme-border-thin);
	}
</style>
