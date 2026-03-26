<script lang="ts">
	import type { PoiImage } from '$lib/data/poi.js';
	import { cdnSrc } from '$lib/utils/imgcdn.js';

	interface Props {
		images: PoiImage[];
		label?: string;
	}

	let { images, label = 'Image carousel' }: Props = $props();

	let currentIndex = $state(0);
	let paused = $state(false);
	let previewVisible = $state(false);
	let previewX = $state(0);
	let previewY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		previewX = e.clientX;
		previewY = e.clientY;
	}

	// Auto-rotate: random interval 3–5s per slide.
	// currentIndex is read inside the setTimeout callback (async) so it is NOT
	// tracked as a reactive dependency — only `images.length` and `paused` are.
	$effect(() => {
		if (images.length <= 1 || paused) return;

		let timeoutId: ReturnType<typeof setTimeout>;

		function schedule() {
			timeoutId = setTimeout(() => {
				currentIndex = (currentIndex + 1) % images.length;
				schedule();
			}, 3000 + Math.random() * 2000);
		}

		schedule();
		return () => clearTimeout(timeoutId);
	});

	function goTo(index: number) {
		currentIndex = index;
	}

	function prev() {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	}

	function next() {
		currentIndex = (currentIndex + 1) % images.length;
	}
</script>

{#if images.length === 0}
	<div class="carousel carousel--empty" role="img" aria-label={label}>
		<div class="carousel__placeholder" aria-hidden="true">
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
			>
				<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
				<circle cx="12" cy="13" r="4" />
			</svg>
			<span>No images available</span>
		</div>
	</div>
{:else}
	<div
		class="carousel"
		role="region"
		aria-label={label}
		aria-roledescription="carousel"
		onmouseenter={() => { paused = true; previewVisible = true; }}
		onmouseleave={() => { paused = false; previewVisible = false; }}
		onmousemove={handleMouseMove}
	>
		<!-- Slides -->
		<div class="carousel__track" aria-live="polite" aria-atomic="false">
			{#each images as image, i}
				<div
					class="carousel__slide"
					class:carousel__slide--active={i === currentIndex}
					aria-hidden={i !== currentIndex}
				>
					<img
						src={cdnSrc(image.src, 800)}
						alt={image.alt}
						loading={i === 0 ? 'eager' : 'lazy'}
						class="carousel__img"
						onerror={(e) => {
							// CDN unavailable — fall back to raw src
							const img = e.currentTarget as HTMLImageElement;
							if (img.src !== image.src) img.src = image.src;
						}}
					/>
				</div>
			{/each}
		</div>

		{#if images.length > 1}
			<!-- Prev button -->
			<button
				class="carousel__btn carousel__btn--prev"
				onclick={prev}
				aria-label="Previous image"
				type="button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</button>

			<!-- Next button -->
			<button
				class="carousel__btn carousel__btn--next"
				onclick={next}
				aria-label="Next image"
				type="button"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>

			<!-- Dot navigation -->
			<div class="carousel__dots" role="tablist" aria-label="Image navigation">
				{#each images as _, i}
					<button
						role="tab"
						type="button"
						aria-selected={i === currentIndex}
						aria-label="Image {i + 1} of {images.length}"
						class="carousel__dot"
						class:carousel__dot--active={i === currentIndex}
						onclick={() => goTo(i)}
					></button>
				{/each}
			</div>

			<!-- Attribution -->
			{#if images[currentIndex]?.attribution}
				<p class="carousel__attribution" aria-live="polite">
					{images[currentIndex].attribution}
				</p>
			{/if}
		{/if}
	</div>
{/if}

<!-- Hover image preview — fixed position, desktop only -->
{#if previewVisible && images.length > 0}
	<div
		class="carousel__preview"
		style="left: {Math.min(previewX + 20, typeof window !== 'undefined' ? window.innerWidth - 340 : previewX + 20)}px; top: {Math.max(previewY - 160, 8)}px;"
		aria-hidden="true"
	>
		<img src={cdnSrc(images[currentIndex].src, 600)} alt="" />
	</div>
{/if}

<style>
	.carousel {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background-color: var(--color-cream-dark, #ede6d8);
		border-radius: var(--md-shape-corner-medium, 12px) var(--md-shape-corner-medium, 12px) 0 0;
	}

	/* Empty state */
	.carousel--empty {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.carousel__placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted, #5f5e5a);
		opacity: 0.5;
		font-size: 0.8rem;
	}

	/* Track & slides */
	.carousel__track {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.carousel__slide {
		position: absolute;
		inset: 0;
		opacity: 0;
		transition: opacity 0.6s ease-in-out;
		pointer-events: none;
	}

	.carousel__slide--active {
		opacity: 1;
		pointer-events: auto;
	}

	.carousel__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Prev / Next buttons */
	.carousel__btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.45);
		color: #fff;
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.2s,
			background 0.2s;
	}

	.carousel:hover .carousel__btn,
	.carousel:focus-within .carousel__btn {
		opacity: 1;
	}

	.carousel__btn:hover {
		background: rgba(0, 0, 0, 0.7);
	}

	.carousel__btn:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
		opacity: 1;
	}

	.carousel__btn--prev {
		left: 0.5rem;
	}

	.carousel__btn--next {
		right: 0.5rem;
	}

	/* Dots */
	.carousel__dots {
		position: absolute;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		display: flex;
		gap: 0.375rem;
	}

	.carousel__dot {
		width: 0.5rem;
		height: 0.5rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: background 0.2s, transform 0.2s;
	}

	.carousel__dot--active {
		background: #fff;
		transform: scale(1.3);
	}

	.carousel__dot:focus-visible {
		outline: 2px solid var(--md-sys-color-primary, #6b8f71);
		outline-offset: 2px;
	}

	/* Hover image preview — desktop only */
	@media (hover: hover) {
		.carousel__preview {
			position: fixed;
			z-index: 200;
			width: 320px;
			border-radius: var(--md-shape-corner-medium, 12px);
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
			overflow: hidden;
			pointer-events: none;
			animation: preview-fade-in 0.15s ease;
		}

		.carousel__preview img {
			display: block;
			width: 100%;
			height: auto;
		}

		@keyframes preview-fade-in {
			from { opacity: 0; transform: scale(0.96); }
			to   { opacity: 1; transform: scale(1); }
		}
	}

	/* Attribution */
	.carousel__attribution {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 2;
		margin: 0;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.65rem;
		text-align: right;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
