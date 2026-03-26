<script lang="ts">
	import type { Poi } from '$lib/data/poi.js';
	import type { Messages, Locale } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';
	import PoiCarousel from './PoiCarousel.svelte';
	import PoiMap from './PoiMap.svelte';

	interface Props {
		poi: Poi;
		messages: Messages;
		lang: Locale;
	}

	let { poi, messages, lang }: Props = $props();

	// Map panel toggle
	let mapOpen = $state(false);

	// Favourite state — initialised from localStorage on mount
	const FAVORITES_KEY = 'poi:favorites';
	let isFavourite = $state(false);

	$effect(() => {
		if (typeof window === 'undefined') return;
		try {
			const favs: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
			isFavourite = favs.includes(poi.id);
		} catch {
			isFavourite = false;
		}
	});

	function toggleFavourite() {
		if (typeof window === 'undefined') return;
		try {
			const favs: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
			const updated = isFavourite
				? favs.filter((id) => id !== poi.id)
				: [...favs, poi.id];
			localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
			isFavourite = !isFavourite;
		} catch {
			// localStorage unavailable — toggle in memory only
			isFavourite = !isFavourite;
		}
	}

	// Derived values
	const title = $derived(t(messages, poi.titleKey));
	const subtitle = $derived(t(messages, poi.subtitleKey));
	const summary = $derived(t(messages, poi.summaryKey));
	const categoryLabel = $derived(t(messages, `poi.category.${poi.category}`));
	const accessibilityLabel = $derived(t(messages, `poi.accessibility.${poi.accessibilityLevel}`));
	const learnMoreHref = $derived(poi.website ?? poi.wikipedia);
	const distanceLabel = $derived(
		poi.distanceKm > 60
			? t(messages, 'poi.distance.exception')
			: lang === 'en'
				? `${(poi.distanceKm * 0.621371).toFixed(1)} mi`
				: `${poi.distanceKm.toFixed(1)} km`
	);

	// Accessibility level indicator colour
	const A11Y_COLORS: Record<string, string> = {
		Good: 'var(--color-avail, #7ba96b)',
		Moderate: 'var(--color-gold, #c4a265)',
		Limited: 'var(--color-unavail, #d32f2f)'
	};
	const a11yColor = $derived(A11Y_COLORS[poi.accessibilityLevel] ?? 'var(--color-text-muted)');
</script>

<article class="poi-card" aria-label={title}>
	<!-- Media — carousel fills full card width at top -->
	<div class="poi-card__media">
		<PoiCarousel images={poi.images} label="{title} photos" />

		<!-- Category chip overlaid on top-left of carousel -->
		<span class="poi-card__category-chip" aria-label="{t(messages, 'poi.filter.category')}: {categoryLabel}">
			{categoryLabel}
		</span>
	</div>

	<!-- Content -->
	<div class="poi-card__content">
		<div class="poi-card__header">
			<h3 class="poi-card__title">{title}</h3>
			<!-- Accessibility badge -->
			<span
				class="poi-card__a11y-badge"
				style="color: {a11yColor};"
				aria-label="{t(messages, 'poi.accessibility.label')}: {accessibilityLabel}"
				title="{t(messages, 'poi.accessibility.label')}: {accessibilityLabel}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<circle cx="12" cy="4" r="2" />
					<path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-9 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
				</svg>
				<span class="poi-card__a11y-text">{accessibilityLabel}</span>
			</span>
		</div>

		<p class="poi-card__subtitle">{subtitle}</p>
		<p class="poi-card__summary">{summary}</p>
	</div>

	<!-- Actions -->
	<div class="poi-card__actions">
		<!-- Learn More (hidden if no link available) -->
		{#if learnMoreHref}
			<a
				href={learnMoreHref}
				target="_blank"
				rel="noopener noreferrer"
				class="poi-card__btn poi-card__btn--primary"
				aria-label="{t(messages, 'poi.actions.learn_more')} — {title} ({t(messages, 'a11y.opens_new_window')})"
			>
				{t(messages, 'poi.actions.learn_more')}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</svg>
			</a>
		{/if}

		<div class="poi-card__icon-actions">
			<!-- Distance chip — toggles inline map -->
			<button
				type="button"
				class="poi-card__distance-chip"
				class:poi-card__distance-chip--active={mapOpen}
				onclick={() => (mapOpen = !mapOpen)}
				aria-expanded={mapOpen}
				aria-label="{mapOpen
					? t(messages, 'poi.actions.close_map')
					: t(messages, 'poi.actions.view_map')} — {distanceLabel}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
					<circle cx="12" cy="10" r="3" />
				</svg>
				{distanceLabel}
			</button>

			<!-- Favourite toggle -->
			<button
				type="button"
				class="poi-card__fav-btn"
				class:poi-card__fav-btn--active={isFavourite}
				onclick={toggleFavourite}
				aria-pressed={isFavourite}
				aria-label={isFavourite
					? t(messages, 'poi.actions.unfavourite')
					: t(messages, 'poi.actions.favourite')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill={isFavourite ? 'currentColor' : 'none'}
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
					/>
				</svg>
			</button>
		</div>
	</div>

	<!-- Inline map panel -->
	<PoiMap {poi} open={mapOpen} onclose={() => (mapOpen = false)} {messages} />
</article>

<style>
	.poi-card {
		display: flex;
		flex-direction: column;
		background: var(--md-sys-color-surface-container-lowest, #fff);
		border-radius: var(--md-shape-corner-medium, 12px);
		box-shadow: var(--md-elevation-shadow-1, 0 1px 3px rgba(0, 0, 0, 0.12));
		overflow: hidden;
		transition: box-shadow 0.2s ease, transform 0.2s ease;
	}

	.poi-card:hover {
		box-shadow: var(--md-elevation-shadow-3, 0 4px 12px rgba(0, 0, 0, 0.18));
		transform: translateY(-2px);
	}

	/* Media */
	.poi-card__media {
		position: relative;
	}

	.poi-card__category-chip {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 3;
		padding: 0.2rem 0.6rem;
		border-radius: 1rem;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		pointer-events: none;
		backdrop-filter: blur(4px);
	}

	/* Content */
	.poi-card__content {
		padding: 0.875rem 1rem 0.5rem;
		flex: 1;
	}

	.poi-card__header {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.poi-card__title {
		flex: 1;
		margin: 0;
		font-family: 'Lora', serif;
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-brown, #8b6f47);
		line-height: 1.3;
	}

	.poi-card__a11y-badge {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		flex-shrink: 0;
		font-size: 0.7rem;
		font-weight: 500;
	}

	.poi-card__a11y-text {
		white-space: nowrap;
	}

	.poi-card__subtitle {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-sage, #6b8f71);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.poi-card__summary {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted, #5f5e5a);
		line-height: 1.55;
		/* Clamp to 4 lines for grid consistency */
		display: -webkit-box;
		-webkit-line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Actions */
	.poi-card__actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem 0.75rem;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.poi-card__btn {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.45rem 1rem;
		border-radius: 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s, color 0.15s;
	}

	.poi-card__btn--primary {
		background: var(--color-sage, #6b8f71);
		color: #fff;
	}

	.poi-card__btn--primary:hover {
		background: var(--color-sage-hover, #4a6e50);
	}

	.poi-card__btn--primary:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}

	.poi-card__icon-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-left: auto;
	}

	/* Distance chip */
	.poi-card__distance-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--color-cream-dark, #ede6d8);
		border-radius: 1rem;
		background: transparent;
		color: var(--color-text-muted, #5f5e5a);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.15s, color 0.15s, border-color 0.15s;
	}

	.poi-card__distance-chip:hover,
	.poi-card__distance-chip--active {
		background: var(--color-cream, #f5f0e8);
		color: var(--color-brown, #8b6f47);
		border-color: var(--color-brown-light, #a8915f);
	}

	.poi-card__distance-chip:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}

	/* Favourite button */
	.poi-card__fav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--color-text-muted, #5f5e5a);
		cursor: pointer;
		transition: color 0.15s, background 0.15s;
	}

	.poi-card__fav-btn:hover {
		background: var(--color-cream, #f5f0e8);
		color: #e53e3e;
	}

	.poi-card__fav-btn--active {
		color: #e53e3e;
	}

	.poi-card__fav-btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}
</style>
