<script lang="ts">
	import { t } from '$lib/i18n';
	import { POIS } from '$lib/data/poi';
	import type { PoiCategory } from '$lib/data/poi';
	import type { PageData } from './$types';
	import PoiFilterBar from '$lib/components/poi/PoiFilterBar.svelte';
	import PoiGrid from '$lib/components/poi/PoiGrid.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;

	let selectedCategory = $state<PoiCategory | 'all'>('all');
	let sortBy = $state<'distance' | 'popularity'>('distance');
	let showFavoritesOnly = $state(false);

	const filteredAndSorted = $derived(
		POIS.filter(
			(poi) =>
				(selectedCategory === 'all' || poi.category === selectedCategory) &&
				(!showFavoritesOnly || favorites.has(poi.id))
		).sort((a, b) =>
			sortBy === 'distance'
				? a.distanceKm - b.distanceKm
				: b.popularityScore - a.popularityScore
		)
	);
</script>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'explore.title')}</h1>
	<p class="page-description">{t(messages, 'explore.description')}</p>

	<div class="filter-bar-wrapper">
		<PoiFilterBar {messages} {lang} bind:selectedCategory bind:sortBy bind:showFavoritesOnly />
	</div>

	<!-- aria-live region announces filter result count to screen-reader users
	     when chips toggle. Visually muted but kept in flow so sighted users
	     also see the running total. -->
	<p class="results-count" aria-live="polite" aria-atomic="true">
		{t(
			messages,
			filteredAndSorted.length === 1 ? 'poi.filter.results_count_one' : 'poi.filter.results_count',
			{ count: String(filteredAndSorted.length), total: String(POIS.length) }
		)}
	</p>

	{#if showFavoritesOnly && filteredAndSorted.length === 0}
		<p class="empty-state">{t(messages, 'poi.filter.favorites_empty')}</p>
	{:else}
		<PoiGrid pois={filteredAndSorted} {messages} {lang} />
	{/if}
</section>

<style>
	.page-section {
		max-width: 1440px;
		margin: 0 auto;
		padding: 2.5rem 1rem;
	}

	@media (min-width: 600px) {
		.page-section {
			padding: 3.5rem 1.5rem;
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
		max-width: 78rem;
		text-wrap: pretty;
	}

	/* Sticky under main header (56px mobile / 64px ≥600px), z-index below
	   header (40) and above page content. Surface background already opaque. */
	.filter-bar-wrapper {
		margin-bottom: 2rem;
		padding: 0.85rem 1.1rem;
		background: var(--theme-surface);
		border-radius: var(--theme-radius-sm);
		border: var(--theme-border-thin);
		position: sticky;
		top: 56px;
		z-index: 30;
	}
	@media (min-width: 600px) { .filter-bar-wrapper { top: 64px; } }

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--theme-text-muted);
		font-size: 1rem;
		font-style: italic;
		border: 1px dashed var(--theme-border);
		border-radius: var(--theme-radius-sm);
	}

	.results-count {
		margin: 0 0 1rem;
		font-size: 0.85rem;
		color: var(--theme-text-muted);
	}
</style>
