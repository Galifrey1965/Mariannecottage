<script lang="ts">
	import type { PoiCategory } from '$lib/data/poi.js';
	import type { Messages, Locale } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';

	interface Props {
		messages: Messages;
		lang: Locale;
		selectedCategory: PoiCategory | 'all';
		sortBy: 'distance' | 'popularity';
	}

	let {
		messages,
		lang,
		selectedCategory = $bindable('all'),
		sortBy = $bindable('distance')
	}: Props = $props();

	const CATEGORIES: Array<PoiCategory | 'all'> = ['all', 'ww2', 'heritage', 'towns', 'museums'];
</script>

<div class="poi-filter-bar" role="group" aria-label={t(messages, 'poi.filter.category')}>
	<!-- Category chips -->
	<div class="poi-filter-bar__chips" role="radiogroup" aria-label={t(messages, 'poi.filter.category')}>
		{#each CATEGORIES as cat}
			<button
				type="button"
				role="radio"
				aria-checked={selectedCategory === cat}
				class="poi-filter-bar__chip"
				class:poi-filter-bar__chip--active={selectedCategory === cat}
				onclick={() => (selectedCategory = cat)}
			>
				{cat === 'all' ? t(messages, 'poi.filter.all') : t(messages, `poi.category.${cat}`)}
			</button>
		{/each}
	</div>

	<!-- Sort dropdown -->
	<label class="poi-filter-bar__sort-label" for="poi-sort-{lang}">
		{t(messages, 'poi.filter.sort')}
	</label>
	<select
		id="poi-sort-{lang}"
		class="poi-filter-bar__sort"
		bind:value={sortBy}
		aria-label={t(messages, 'poi.filter.sort')}
	>
		<option value="distance">{t(messages, 'poi.filter.sort_distance')}</option>
		<option value="popularity">{t(messages, 'poi.filter.sort_popularity')}</option>
	</select>
</div>

<style>
	.poi-filter-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.poi-filter-bar__chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		flex: 1;
	}

	.poi-filter-bar__chip {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.85rem;
		border: 1.5px solid var(--color-cream-dark, #ede6d8);
		border-radius: 1rem;
		background: transparent;
		color: var(--color-text-muted, #5f5e5a);
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s,
			border-color 0.15s;
		white-space: nowrap;
	}

	.poi-filter-bar__chip:hover {
		background: var(--color-cream, #f5f0e8);
		border-color: var(--color-brown-light, #a8915f);
		color: var(--color-brown, #8b6f47);
	}

	.poi-filter-bar__chip--active {
		background: var(--color-sage, #6b8f71);
		border-color: var(--color-sage, #6b8f71);
		color: #fff;
		font-weight: 600;
	}

	.poi-filter-bar__chip--active:hover {
		background: var(--color-sage-hover, #4a6e50);
		border-color: var(--color-sage-hover, #4a6e50);
	}

	.poi-filter-bar__chip:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}

	.poi-filter-bar__sort-label {
		font-size: 0.8rem;
		color: var(--color-text-muted, #5f5e5a);
		white-space: nowrap;
	}

	.poi-filter-bar__sort {
		padding: 0.35rem 0.6rem;
		border: 1.5px solid var(--color-cream-dark, #ede6d8);
		border-radius: 0.5rem;
		background: transparent;
		color: var(--color-text, #2c2c2a);
		font-size: 0.8rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.poi-filter-bar__sort:hover,
	.poi-filter-bar__sort:focus-visible {
		border-color: var(--color-brown-light, #a8915f);
		outline: none;
	}

	.poi-filter-bar__sort:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}
</style>
