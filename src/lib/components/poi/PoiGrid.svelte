<script lang="ts">
	import type { Poi } from '$lib/data/poi.js';
	import type { Messages, Locale } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';
	import PoiCard from './PoiCard.svelte';

	interface Props {
		pois: Poi[];
		messages: Messages;
		lang: Locale;
		loading?: boolean;
	}

	let { pois, messages, lang, loading = false }: Props = $props();

	// Skeleton count while loading
	const SKELETON_COUNT = 6;
</script>

{#if loading}
	<div class="poi-grid" aria-busy="true" aria-label={t(messages, 'poi.grid.loading')}>
		{#each { length: SKELETON_COUNT } as _}
			<div class="poi-grid__skeleton" aria-hidden="true">
				<div class="poi-grid__skeleton-media"></div>
				<div class="poi-grid__skeleton-content">
					<div class="poi-grid__skeleton-line poi-grid__skeleton-line--title"></div>
					<div class="poi-grid__skeleton-line poi-grid__skeleton-line--subtitle"></div>
					<div class="poi-grid__skeleton-line"></div>
					<div class="poi-grid__skeleton-line poi-grid__skeleton-line--short"></div>
				</div>
			</div>
		{/each}
	</div>
{:else if pois.length === 0}
	<div class="poi-grid__empty" role="status">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
			<line x1="8" y1="11" x2="14" y2="11" />
		</svg>
		<p>{t(messages, 'poi.grid.no_results')}</p>
	</div>
{:else}
	<div class="poi-grid" role="list" aria-label={t(messages, 'poi.grid.results', { count: pois.length })}>
		{#each pois as poi (poi.id)}
			<div class="poi-grid__item" role="listitem">
				<PoiCard {poi} {messages} {lang} />
			</div>
		{/each}
	</div>
{/if}

<style>
	.poi-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.25rem;
	}
	@media (min-width: 480px) { .poi-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); } }

	.poi-grid__item {
		display: flex;
		flex-direction: column;
	}

	/* Empty state */
	.poi-grid__empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 3rem 1rem;
		color: var(--color-text-muted, #5f5e5a);
		text-align: center;
	}

	.poi-grid__empty p {
		margin: 0;
		font-size: 1rem;
	}

	/* Skeleton cards */
	.poi-grid__skeleton {
		border-radius: var(--md-shape-corner-medium, 12px);
		overflow: hidden;
		background: var(--md-sys-color-surface-container-lowest, #fff);
		box-shadow: var(--md-elevation-shadow-1, 0 1px 3px rgba(0, 0, 0, 0.12));
	}

	.poi-grid__skeleton-media {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: var(--color-cream-dark, #ede6d8);
		animation: poi-skeleton-pulse 1.5s ease-in-out infinite;
	}

	.poi-grid__skeleton-content {
		padding: 0.875rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.poi-grid__skeleton-line {
		height: 0.8rem;
		border-radius: 0.4rem;
		background: var(--color-cream-dark, #ede6d8);
		animation: poi-skeleton-pulse 1.5s ease-in-out infinite;
		width: 100%;
	}

	.poi-grid__skeleton-line--title {
		height: 1rem;
		width: 70%;
	}

	.poi-grid__skeleton-line--subtitle {
		width: 50%;
	}

	.poi-grid__skeleton-line--short {
		width: 40%;
	}

	@keyframes poi-skeleton-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
