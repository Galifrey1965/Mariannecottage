<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface GalleryImage {
		thumb: string;
		full: string;
		alt: string;
		category_slug: string;
		room_slug: string | null;
	}

	interface ChipItem {
		slug: string;
		label: string;
	}

	interface Props {
		messages: Messages;
		images: GalleryImage[];
		categories: ChipItem[];
		rooms?: ChipItem[];
	}

	let { messages, images, categories, rooms = [] }: Props = $props();

	type Filter =
		| { kind: 'all' }
		| { kind: 'category'; slug: string }
		| { kind: 'room'; slug: string };

	let filter = $state<Filter>({ kind: 'all' });
	let selectedImageIndex = $state<number | null>(null);
	let closeBtnEl: HTMLElement | undefined = $state();

	const filteredImages = $derived(
		filter.kind === 'all'
			? images
			: filter.kind === 'category'
				? images.filter((img) => img.category_slug === filter.slug)
				: images.filter((img) => img.room_slug === filter.slug)
	);

	const currentImage = $derived(
		selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null
	);

	function isActive(target: Filter): boolean {
		if (filter.kind !== target.kind) return false;
		if (filter.kind === 'all') return true;
		return filter.slug === (target as { slug: string }).slug;
	}

	function setFilter(next: Filter) {
		filter = next;
		selectedImageIndex = null;
	}

	$effect(() => {
		if (selectedImageIndex !== null && closeBtnEl) {
			closeBtnEl.focus();
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (selectedImageIndex === null) return;
		if (e.key === 'Escape') { selectedImageIndex = null; }
		else if (e.key === 'ArrowLeft') { selectedImageIndex = selectedImageIndex === 0 ? filteredImages.length - 1 : selectedImageIndex - 1; }
		else if (e.key === 'ArrowRight') { selectedImageIndex = selectedImageIndex === filteredImages.length - 1 ? 0 : selectedImageIndex + 1; }
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div>
	<div class="filters" role="group" aria-label={t(messages, 'gallery.filter_label')}>
		<button
			onclick={() => setFilter({ kind: 'all' })}
			class="filter-chip"
			class:active={isActive({ kind: 'all' })}
			aria-pressed={isActive({ kind: 'all' })}
		>
			{t(messages, 'gallery.categories.all')}
		</button>
		{#each categories as cat}
			<button
				onclick={() => setFilter({ kind: 'category', slug: cat.slug })}
				class="filter-chip"
				class:active={isActive({ kind: 'category', slug: cat.slug })}
				aria-pressed={isActive({ kind: 'category', slug: cat.slug })}
			>
				{cat.label}
			</button>
		{/each}
		{#each rooms as room}
			<button
				onclick={() => setFilter({ kind: 'room', slug: room.slug })}
				class="filter-chip room"
				class:active={isActive({ kind: 'room', slug: room.slug })}
				aria-pressed={isActive({ kind: 'room', slug: room.slug })}
			>
				{room.label}
			</button>
		{/each}
	</div>

	{#if filteredImages.length === 0}
		<p class="empty">{t(messages, 'gallery.empty')}</p>
	{:else}
		<div class="gallery-grid" role="grid" aria-label={t(messages, 'gallery.title')}>
			{#each filteredImages as image, i (image.thumb)}
				<button onclick={() => (selectedImageIndex = i)} class="gallery-item" aria-label={image.alt}>
					<img src={image.thumb} alt={image.alt} loading="lazy" decoding="async" />
					<span class="gallery-caption">{image.alt}</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if currentImage && selectedImageIndex !== null}
		<div
			class="lightbox"
			onclick={() => (selectedImageIndex = null)}
			role="dialog"
			aria-modal="true"
			aria-label={currentImage.alt}
		>
			<div class="lightbox-content" onclick={e => e.stopPropagation()}>
				<img src={currentImage.full} alt={currentImage.alt} />
				<p class="lightbox-caption">
					<span class="lightbox-counter">{selectedImageIndex + 1} / {filteredImages.length}</span>
					<span>{currentImage.alt}</span>
				</p>
				<button
					onclick={() => { selectedImageIndex = selectedImageIndex! === 0 ? filteredImages.length - 1 : selectedImageIndex! - 1; }}
					class="lightbox-nav prev"
					aria-label={t(messages, 'a11y.previous')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
				</button>
				<button
					onclick={() => { selectedImageIndex = selectedImageIndex! === filteredImages.length - 1 ? 0 : selectedImageIndex! + 1; }}
					class="lightbox-nav next"
					aria-label={t(messages, 'a11y.next')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
				</button>
				<button
					bind:this={closeBtnEl}
					onclick={() => (selectedImageIndex = null)}
					class="lightbox-close"
					aria-label={t(messages, 'a11y.close')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 2rem;
		padding: 0.85rem 1.1rem;
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-sm);
		position: sticky;
		top: 56px;
		z-index: 30;
	}
	@media (min-width: 600px) { .filters { top: 64px; } }
	.filter-chip {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.95rem;
		border-radius: var(--theme-radius-pill);
		font-family: var(--theme-font-body);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		border: 1px solid var(--theme-border);
		background: transparent;
		color: var(--theme-text-muted);
		cursor: pointer;
		transition: background 0.2s, color 0.2s, border-color 0.2s;
		white-space: nowrap;
	}
	.filter-chip:hover {
		color: var(--theme-warm);
		border-color: var(--theme-warm);
	}
	.filter-chip:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
	}
	.filter-chip.active {
		background: var(--theme-accent);
		border-color: var(--theme-accent);
		color: var(--theme-bg);
	}
	.filter-chip.active:hover {
		background: var(--theme-accent-hover);
		border-color: var(--theme-accent-hover);
		color: var(--theme-bg);
	}
	/* Subtle separator-like styling on room chips so visitors can tell at a
	   glance that they're a different axis from the scene categories.
	   Rendered with the same accent-on-active treatment; only inactive
	   colour differs. */
	.filter-chip.room {
		color: var(--theme-warm);
		border-color: var(--theme-warm);
		background: var(--theme-surface);
	}

	.empty {
		color: var(--theme-text-muted);
		font-size: 0.95rem;
		text-align: center;
		padding: 3rem 1rem;
	}

	.gallery-grid {
		column-count: 2;
		column-gap: 0.5rem;
	}
	@media (min-width: 600px) {
		.gallery-grid {
			column-count: 3;
			column-gap: 0.75rem;
		}
	}
	@media (min-width: 840px) {
		.gallery-grid {
			column-count: 4;
		}
	}
	@media (min-width: 1200px) {
		.gallery-grid {
			column-count: 5;
		}
	}

	.gallery-item {
		position: relative;
		overflow: hidden;
		border-radius: var(--theme-radius-sm);
		border: none;
		padding: 0;
		cursor: pointer;
		background: var(--theme-surface);
		display: block;
		width: 100%;
		margin: 0 0 0.5rem;
		break-inside: avoid;
	}
	@media (min-width: 600px) {
		.gallery-item { margin-bottom: 0.75rem; }
	}
	.gallery-item img {
		width: 100%;
		height: auto;
		display: block;
		transition: transform 0.5s ease;
	}
	.gallery-item:hover img,
	.gallery-item:focus-visible img {
		transform: scale(1.04);
	}

	.gallery-caption {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 1.5rem 0.85rem 0.65rem;
		font-family: var(--theme-font-body);
		font-size: 0.78rem;
		color: #fff;
		text-align: left;
		background: linear-gradient(to top, rgba(40, 25, 10, 0.75) 0%, rgba(40, 25, 10, 0) 100%);
		opacity: 0;
		transform: translateY(0.5rem);
		transition: opacity 0.25s ease, transform 0.25s ease;
		pointer-events: none;
	}
	.gallery-item:hover .gallery-caption,
	.gallery-item:focus-visible .gallery-caption {
		opacity: 1;
		transform: translateY(0);
	}

	.lightbox {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(20, 12, 5, 0.92);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		animation: fade-in 0.2s ease-out;
	}
	@keyframes fade-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}
	.lightbox-content {
		position: relative;
		max-width: 64rem;
		max-height: 90vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
	}
	.lightbox-content img {
		max-width: 100%;
		max-height: 80vh;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: var(--theme-radius-sm);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
	}
	.lightbox-caption {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.85);
		font-family: var(--theme-font-body);
	}
	.lightbox-counter {
		font-family: monospace;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.55);
	}
	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: rgba(255, 255, 255, 0.08);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
		width: 44px;
		height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		cursor: pointer;
		transition: background 0.2s ease, border-color 0.2s ease;
	}
	.lightbox-nav:hover {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.4);
	}
	.lightbox-nav.prev { left: 0.75rem; }
	.lightbox-nav.next { right: 0.75rem; }
	@media (min-width: 720px) {
		.lightbox-nav.prev { left: -3.5rem; }
		.lightbox-nav.next { right: -3.5rem; }
	}
	.lightbox-close {
		position: absolute;
		top: -2.75rem;
		right: 0;
		color: white;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.2);
		cursor: pointer;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s ease, border-color 0.2s ease;
	}
	.lightbox-close:hover {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.4);
	}
</style>
