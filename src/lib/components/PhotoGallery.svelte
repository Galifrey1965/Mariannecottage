<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface GalleryImage {
		src: string;
		category: string;
		alt: string;
	}

	interface Props {
		messages: Messages;
		images: GalleryImage[];
	}

	let { messages, images }: Props = $props();

	let selectedCategory = $state('all');
	let selectedImageIndex = $state<number | null>(null);

	const categories = ['all', 'exterior', 'rooms', 'bathroom', 'garden', 'breakfast', 'surroundings'];

	const filteredImages = $derived(
		selectedCategory === 'all' ? images : images.filter(img => img.category === selectedCategory)
	);

	const currentImage = $derived(
		selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null
	);

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
		{#each categories as cat}
			<button
				onclick={() => { selectedCategory = cat; selectedImageIndex = null; }}
				class="filter-chip"
				class:active={selectedCategory === cat}
				aria-pressed={selectedCategory === cat}
			>
				{t(messages, `gallery.categories.${cat}`)}
			</button>
		{/each}
	</div>

	<div class="gallery-grid" role="grid" aria-label={t(messages, 'gallery.title')}>
		{#each filteredImages as image, i}
			<button onclick={() => (selectedImageIndex = i)} class="gallery-item" aria-label={image.alt}>
				<img src={image.src} alt={image.alt} />
				<div class="gallery-overlay" aria-hidden="true"><span>🔍</span></div>
			</button>
		{/each}
	</div>

	{#if currentImage && selectedImageIndex !== null}
		<div
			class="lightbox"
			onclick={() => (selectedImageIndex = null)}
			role="dialog"
			aria-modal="true"
			aria-label={currentImage.alt}
		>
			<div class="lightbox-content" onclick={e => e.stopPropagation()}>
				<img src={currentImage.src} alt={currentImage.alt} />
				<button onclick={() => { selectedImageIndex = selectedImageIndex === 0 ? filteredImages.length - 1 : selectedImageIndex - 1; }} class="lightbox-nav prev" aria-label={t(messages, 'a11y.previous')}>&larr;</button>
				<button onclick={() => { selectedImageIndex = selectedImageIndex === filteredImages.length - 1 ? 0 : selectedImageIndex + 1; }} class="lightbox-nav next" aria-label={t(messages, 'a11y.next')}>&rarr;</button>
				<button onclick={() => (selectedImageIndex = null)} class="lightbox-close" aria-label={t(messages, 'a11y.close')}>&times;</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; }
	.filter-chip {
		padding: 0.5rem 1rem; border-radius: var(--md-shape-corner-full); font-size: 0.875rem; font-weight: 500;
		border: none; cursor: pointer; transition: all 0.2s ease;
		background: var(--color-cream); color: var(--color-brown);
	}
	.filter-chip.active { background: var(--color-sage); color: var(--md-sys-color-on-primary); }

	.gallery-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (min-width: 600px) { .gallery-grid { grid-template-columns: repeat(3, 1fr); } }
	@media (min-width: 840px) { .gallery-grid { grid-template-columns: repeat(4, 1fr); } }

	.gallery-item { position: relative; overflow: hidden; border-radius: var(--md-shape-corner-medium); aspect-ratio: 1; border: none; padding: 0; cursor: pointer; }
	.gallery-item img { width: 100%; height: 100%; object-fit: cover; }
	.gallery-overlay {
		position: absolute; inset: 0; background: color-mix(in srgb, var(--md-sys-color-scrim) 40%, transparent);
		display: flex; align-items: center; justify-content: center;
		transition: background 0.2s ease;
	}
	.gallery-overlay span { font-size: 1.5rem; color: white; }
	.gallery-item:hover .gallery-overlay { background: color-mix(in srgb, var(--md-sys-color-scrim) 60%, transparent); }

	.lightbox { position: fixed; inset: 0; z-index: 50; background: color-mix(in srgb, var(--md-sys-color-scrim) 90%, transparent); display: flex; align-items: center; justify-content: center; padding: 1rem; }
	.lightbox-content { position: relative; max-width: 56rem; width: 100%; }
	.lightbox-content img { width: 100%; height: auto; border-radius: var(--md-shape-corner-medium); }
	.lightbox-nav {
		position: absolute; top: 50%; transform: translateY(-50%);
		background: rgba(255,255,255,0.2); color: white; border: none;
		padding: 0.75rem; border-radius: 50%; cursor: pointer; font-size: 1.25rem;
		transition: background 0.2s ease;
	}
	.lightbox-nav:hover { background: rgba(255,255,255,0.4); }
	.lightbox-nav.prev { left: 1rem; }
	.lightbox-nav.next { right: 1rem; }
	.lightbox-close { position: absolute; top: 1rem; right: 1rem; color: white; font-size: 1.5rem; background: none; border: none; cursor: pointer; }
</style>
