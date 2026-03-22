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
</script>

<div>
	<!-- Category Filters -->
	<div class="flex flex-wrap gap-2 mb-8">
		{#each categories as cat}
			<button
				onclick={() => {
					selectedCategory = cat;
					selectedImageIndex = null;
				}}
				class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
				class:bg-amber-600={selectedCategory === cat}
				class:text-white={selectedCategory === cat}
				class:bg-amber-100={selectedCategory !== cat}
				class:text-amber-900={selectedCategory !== cat}
			>
				{t(messages, `gallery.categories.${cat}`)}
			</button>
		{/each}
	</div>

	<!-- Gallery Grid -->
	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
		{#each filteredImages as image, i}
			<button
				onclick={() => (selectedImageIndex = i)}
				class="relative group overflow-hidden rounded-lg aspect-square"
			>
				<img src={image.src} alt={image.alt} class="w-full h-full object-cover" />
				<div
					class="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center"
				>
					<span class="text-white text-2xl">🔍</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Lightbox -->
	{#if currentImage && selectedImageIndex !== null}
		<div
			class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
			onclick={() => (selectedImageIndex = null)}
		>
			<div class="relative max-w-4xl w-full" onclick={e => e.stopPropagation()}>
				<img
					src={currentImage.src}
					alt={currentImage.alt}
					class="w-full h-auto rounded-lg"
				/>

				<!-- Navigation -->
				<button
					onclick={() => {
						selectedImageIndex = selectedImageIndex === 0 ? filteredImages.length - 1 : selectedImageIndex - 1;
					}}
					class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
					aria-label="Previous image"
				>
					←
				</button>

				<button
					onclick={() => {
						selectedImageIndex = selectedImageIndex === filteredImages.length - 1 ? 0 : selectedImageIndex + 1;
					}}
					class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full transition-colors"
					aria-label="Next image"
				>
					→
				</button>

				<!-- Close button -->
				<button
					onclick={() => (selectedImageIndex = null)}
					class="absolute top-4 right-4 text-white text-2xl"
					aria-label="Close lightbox"
				>
					✕
				</button>
			</div>
		</div>
	{/if}
</div>
