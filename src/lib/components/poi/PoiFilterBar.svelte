<script lang="ts">
	import type { PoiCategory } from '$lib/data/poi.js';
	import type { Messages, Locale } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';
	import { favorites } from '$lib/stores/favorites.svelte';

	interface Props {
		messages: Messages;
		lang: Locale;
		selectedCategory: PoiCategory | 'all';
		sortBy: 'distance' | 'popularity';
		showFavoritesOnly?: boolean;
	}

	let {
		messages,
		lang,
		selectedCategory = $bindable('all'),
		sortBy = $bindable('distance'),
		showFavoritesOnly = $bindable(false)
	}: Props = $props();

	const CATEGORIES: Array<PoiCategory | 'all'> = ['all', 'ww2', 'heritage', 'towns', 'museums'];
</script>

<div class="poi-filter-bar" role="group" aria-label={t(messages, 'poi.filter.category')}>
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

		<button
			type="button"
			class="poi-filter-bar__chip poi-filter-bar__chip--fav"
			class:poi-filter-bar__chip--active={showFavoritesOnly}
			aria-pressed={showFavoritesOnly}
			onclick={() => (showFavoritesOnly = !showFavoritesOnly)}
			title={t(messages, 'poi.filter.favorites')}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill={showFavoritesOnly ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
			</svg>
			{t(messages, 'poi.filter.favorites')}
			{#if favorites.count > 0}
				<span class="poi-filter-bar__count">{favorites.count}</span>
			{/if}
		</button>
	</div>

	<span class="poi-filter-bar__sort-label">{t(messages, 'poi.filter.sort')}</span>
	<div class="poi-filter-bar__sort" role="radiogroup" aria-label={t(messages, 'poi.filter.sort')}>
		<button
			type="button"
			role="radio"
			aria-checked={sortBy === 'distance'}
			class="poi-filter-bar__sort-btn"
			class:poi-filter-bar__sort-btn--active={sortBy === 'distance'}
			onclick={() => (sortBy = 'distance')}
		>
			{t(messages, 'poi.filter.sort_distance')}
		</button>
		<button
			type="button"
			role="radio"
			aria-checked={sortBy === 'popularity'}
			class="poi-filter-bar__sort-btn"
			class:poi-filter-bar__sort-btn--active={sortBy === 'popularity'}
			onclick={() => (sortBy = 'popularity')}
		>
			{t(messages, 'poi.filter.sort_popularity')}
		</button>
	</div>
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
		gap: 0.35rem;
		padding: 0.4rem 0.95rem;
		border: 1px solid var(--theme-border);
		border-radius: var(--theme-radius-pill);
		background: transparent;
		color: var(--theme-text-muted);
		font-family: var(--theme-font-body);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		cursor: pointer;
		transition: background 0.2s, color 0.2s, border-color 0.2s;
		white-space: nowrap;
	}

	.poi-filter-bar__chip:hover {
		color: var(--theme-warm);
		border-color: var(--theme-warm);
	}

	.poi-filter-bar__chip--active {
		background: var(--theme-accent);
		border-color: var(--theme-accent);
		color: var(--theme-bg);
	}

	.poi-filter-bar__chip--active:hover {
		background: var(--theme-accent-hover);
		border-color: var(--theme-accent-hover);
		color: var(--theme-bg);
	}

	.poi-filter-bar__chip:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}

	.poi-filter-bar__chip--fav {
		margin-left: auto;
	}
	@media (max-width: 599px) {
		.poi-filter-bar__chip--fav { margin-left: 0; }
	}

	.poi-filter-bar__count {
		display: inline-block;
		min-width: 1.2rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.25);
		color: inherit;
		font-size: 0.7rem;
		text-align: center;
		line-height: 1.4;
	}
	.poi-filter-bar__chip:not(.poi-filter-bar__chip--active) .poi-filter-bar__count {
		background: var(--theme-surface-2);
		color: var(--theme-text-muted);
	}

	.poi-filter-bar__sort-label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--theme-text-muted);
		white-space: nowrap;
	}

	.poi-filter-bar__sort {
		display: inline-flex;
		border: 1px solid var(--theme-border);
		border-radius: var(--theme-radius-pill);
		overflow: hidden;
		padding: 2px;
		gap: 2px;
		background: var(--theme-bg);
	}

	.poi-filter-bar__sort-btn {
		appearance: none;
		border: none;
		background: transparent;
		color: var(--theme-text-muted);
		font-family: var(--theme-font-body);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.35rem 0.95rem;
		border-radius: var(--theme-radius-pill);
		cursor: pointer;
		transition: background 0.2s, color 0.2s;
		white-space: nowrap;
	}

	.poi-filter-bar__sort-btn:hover {
		color: var(--theme-warm);
	}

	.poi-filter-bar__sort-btn--active {
		background: var(--theme-accent);
		color: var(--theme-bg);
	}
	.poi-filter-bar__sort-btn--active:hover {
		background: var(--theme-accent-hover);
		color: var(--theme-bg);
	}

	.poi-filter-bar__sort-btn:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}
</style>
