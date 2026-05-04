<script lang="ts">
	import type { Poi } from '$lib/data/poi.js';
	import { COTTAGE_ORIGIN } from '$lib/data/poi.js';
	import type { Messages } from '$lib/i18n.js';
	import { t } from '$lib/i18n.js';
	import GoogleMap from '../GoogleMap.svelte';

	interface Props {
		poi: Poi;
		open: boolean;
		onclose: () => void;
		messages: Messages;
	}

	let { poi, open, onclose, messages }: Props = $props();

	const distanceLabel = $derived(
		poi.distanceKm > 60
			? t(messages, 'poi.distance.exception')
			: `${poi.distanceKm.toFixed(1)} km ${t(messages, 'poi.distance.from_cottage')}`
	);

	const title = $derived(t(messages, poi.titleKey));

	const markers = $derived([
		{
			lat: COTTAGE_ORIGIN.lat,
			lng: COTTAGE_ORIGIN.lng,
			title: 'Marianne Cottage',
			description: t(messages, 'poi.distance.from_cottage'),
			type: 'cottage' as const
		},
		{
			lat: poi.lat,
			lng: poi.lng,
			title,
			description: distanceLabel,
			type: poi.category
		}
	]);

	$effect(() => {
		if (!open) return;

		function handleDocClick(e: MouseEvent) {
			const panel = (e.target as Element)?.closest?.('.poi-map-panel');
			if (!panel) onclose();
		}

		const id = setTimeout(() => document.addEventListener('click', handleDocClick), 0);

		return () => {
			clearTimeout(id);
			document.removeEventListener('click', handleDocClick);
		};
	});
</script>

{#if open}
	<div class="poi-map-panel" role="region" aria-label={t(messages, 'poi.actions.view_map')}>
		<div class="poi-map-panel__header">
			<span class="poi-map-panel__title">{title}</span>
			<span class="poi-map-panel__distance">{distanceLabel}</span>
			<button
				class="poi-map-panel__close"
				type="button"
				onclick={onclose}
				aria-label={t(messages, 'poi.actions.close_map')}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18" />
					<line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>
		</div>

		<div class="poi-map-panel__map">
			<GoogleMap {markers} fitBounds routeLine height="220px" />
		</div>

		<p class="poi-map-panel__attribution" aria-hidden="true">
			Straight-line distance · Map data © Google
		</p>
	</div>
{/if}

<style>
	.poi-map-panel {
		border-top: var(--theme-border-thin);
		background: var(--theme-surface);
		overflow: hidden;
		animation: poi-map-expand 0.25s ease-out;
	}

	@keyframes poi-map-expand {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.poi-map-panel__header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
	}

	.poi-map-panel__title {
		font-weight: 600;
		font-size: 0.85rem;
		color: var(--theme-text);
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.poi-map-panel__distance {
		font-size: 0.75rem;
		color: var(--theme-text-muted);
		white-space: nowrap;
	}

	.poi-map-panel__close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--theme-text-muted);
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.poi-map-panel__close:hover {
		background: var(--theme-surface-2);
	}

	.poi-map-panel__close:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}

	.poi-map-panel__map {
		padding: 0 0.5rem;
	}

	.poi-map-panel__attribution {
		margin: 0;
		padding: 0.2rem 0.75rem 0.4rem;
		font-size: 0.65rem;
		color: var(--theme-text-muted);
		text-align: right;
	}
</style>
