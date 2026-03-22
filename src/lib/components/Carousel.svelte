<script lang="ts">
	/**
	 * Material Design 3 Carousel Component
	 * Horizontal scrollable list with swipe/scroll support
	 * Used for attractions, testimonials, etc.
	 */

	interface Props {
		items: Array<{
			id: string;
			title: string;
			image?: string;
			distance?: string;
			description?: string;
		}>;
		onItemClick?: (id: string) => void;
	}

	let { items, onItemClick }: Props = $props();

	let scrollContainer: HTMLElement;

	const scroll = (direction: 'left' | 'right') => {
		if (scrollContainer) {
			const scrollAmount = 300;
			scrollContainer.scrollBy({
				left: direction === 'left' ? -scrollAmount : scrollAmount,
				behavior: 'smooth'
			});
		}
	};
</script>

<div class="relative w-full">
	<!-- Left scroll button -->
	<button
		on:click={() => scroll('left')}
		class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] p-2 rounded-full shadow-md hover:shadow-lg transition-shadow hidden sm:flex items-center justify-center w-10 h-10"
		aria-label="Scroll left"
	>
		‹
	</button>

	<!-- Carousel container -->
	<div
		bind:this={scrollContainer}
		class="flex gap-4 overflow-x-auto scroll-smooth px-4 py-4 sm:px-14 snap-x snap-mandatory scrollbar-hide"
	>
		{#each items as item (item.id)}
			<button
				on:click={() => onItemClick?.(item.id)}
				class="flex-shrink-0 w-64 rounded-[var(--md-shape-corner-medium)] overflow-hidden bg-[var(--md-sys-color-surface-container)] hover:shadow-lg transition-shadow duration-200 snap-center"
			>
				{#if item.image}
					<div class="relative w-full h-40 overflow-hidden bg-gray-200">
						<img
							src={item.image}
							alt={item.title}
							class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
						/>
						{#if item.distance}
							<div class="absolute top-2 right-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-2 py-1 rounded-full text-xs font-medium">
								{item.distance}
							</div>
						{/if}
					</div>
				{/if}

				<div class="p-4">
					<h3 class="font-semibold text-sm text-[var(--md-sys-color-on-surface)] mb-1">
						{item.title}
					</h3>
					{#if item.description}
						<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">
							{item.description}
						</p>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Right scroll button -->
	<button
		on:click={() => scroll('right')}
		class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] p-2 rounded-full shadow-md hover:shadow-lg transition-shadow hidden sm:flex items-center justify-center w-10 h-10"
		aria-label="Scroll right"
	>
		›
	</button>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}
</style>
