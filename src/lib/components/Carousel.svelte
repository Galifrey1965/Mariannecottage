<script lang="ts">
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
			scrollContainer.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
		}
	};
</script>

<div class="carousel-wrapper">
	<button onclick={() => scroll('left')} class="scroll-btn left" aria-label="Scroll left">‹</button>

	<div bind:this={scrollContainer} class="carousel-track">
		{#each items as item (item.id)}
			<button onclick={() => onItemClick?.(item.id)} class="carousel-card">
				{#if item.image}
					<div class="card-media">
						<img src={item.image} alt={item.title} />
						{#if item.distance}
							<span class="distance-badge">{item.distance}</span>
						{/if}
					</div>
				{/if}
				<div class="card-content">
					<h3>{item.title}</h3>
					{#if item.description}
						<p>{item.description}</p>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<button onclick={() => scroll('right')} class="scroll-btn right" aria-label="Scroll right">›</button>
</div>

<style>
	.carousel-wrapper { position: relative; width: 100%; }

	.scroll-btn {
		position: absolute; top: 50%; transform: translateY(-50%); z-index: 10;
		background: var(--color-sage); color: white; border: none; width: 2.5rem; height: 2.5rem;
		border-radius: 50%; cursor: pointer; font-size: 1.25rem;
		display: none; align-items: center; justify-content: center;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15); transition: box-shadow 0.2s ease;
	}
	.scroll-btn:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
	@media (min-width: 600px) { .scroll-btn { display: flex; } }
	.scroll-btn.left { left: 0; }
	.scroll-btn.right { right: 0; }

	.carousel-track {
		display: flex; gap: 1rem; overflow-x: auto; scroll-behavior: smooth;
		padding: 1rem; scroll-snap-type: x mandatory;
		-ms-overflow-style: none; scrollbar-width: none;
	}
	@media (min-width: 600px) { .carousel-track { padding: 1rem 3.5rem; } }
	.carousel-track::-webkit-scrollbar { display: none; }

	.carousel-card {
		flex-shrink: 0; width: 16rem; border-radius: 12px; overflow: hidden;
		background: var(--color-cream); border: none; cursor: pointer; text-align: left;
		transition: box-shadow 0.2s ease; scroll-snap-align: center;
	}
	.carousel-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }

	.card-media { position: relative; width: 100%; height: 10rem; overflow: hidden; }
	.card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
	.carousel-card:hover .card-media img { transform: scale(1.05); }
	.distance-badge {
		position: absolute; top: 0.5rem; right: 0.5rem;
		background: var(--color-sage); color: white;
		padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500;
	}

	.card-content { padding: 1rem; }
	.card-content h3 { font-size: 0.875rem; font-weight: 600; margin: 0 0 0.25rem; color: var(--color-text); }
	.card-content p { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
