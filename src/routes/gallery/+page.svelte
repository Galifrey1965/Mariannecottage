<script lang="ts">
	import { t } from '$lib/i18n';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;

	const images = [
		// Exterior & garden (existing photos)
		{ src: '/images/2024-08-15.jpg', category: 'exterior', alt: 'Cottage exterior' },
		{ src: '/images/2024-12-15-(3).jpg', category: 'exterior', alt: 'Exterior detail' },
		{ src: '/images/2024-12-15-(2).jpg', category: 'garden', alt: 'Garden view' },
		{ src: '/images/2023-06-07.jpg', category: 'garden', alt: 'Garden area' },
		{ src: '/images/2023-05-20.jpg', category: 'surroundings', alt: 'Surrounding countryside' },
		// Rooms (new photos)
		{ src: '/images/gallery/bedroom-double-wide.jpeg', category: 'rooms', alt: 'Double bedroom' },
		{ src: '/images/gallery/bedroom-double-bed.jpeg', category: 'rooms', alt: 'Double bedroom bed' },
		{ src: '/images/gallery/bedroom-twin-wide.jpeg', category: 'rooms', alt: 'Twin bedroom' },
		{ src: '/images/gallery/bedroom-twin-full.jpeg', category: 'rooms', alt: 'Twin bedroom full view' },
		{ src: '/images/gallery/living-dining-room.jpeg', category: 'rooms', alt: 'Living and dining room' },
		{ src: '/images/gallery/room-amenities-a.jpeg', category: 'rooms', alt: 'Room amenities' },
		{ src: '/images/gallery/room-amenities-b.jpeg', category: 'rooms', alt: 'Room dressing table' },
		// Bathroom (new photo)
		{ src: '/images/gallery/bathroom-main.jpeg', category: 'bathroom', alt: 'Bathroom' },
		// Breakfast (new photos)
		{ src: '/images/gallery/breakfast-table-set.jpeg', category: 'breakfast', alt: 'Breakfast table' },
		{ src: '/images/gallery/breakfast-station-b.jpeg', category: 'breakfast', alt: 'Breakfast station' },
		{ src: '/images/gallery/dining-table.jpeg', category: 'breakfast', alt: 'Dining table' },
		// Surroundings
		{ src: '/images/gallery/local-guides.jpeg', category: 'surroundings', alt: 'Local tourist guides' },
	];
</script>

<svelte:head>
	<title>{t(messages, 'gallery.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title center">{t(messages, 'gallery.title')}</h1>
	<PhotoGallery {messages} {images} />
</section>

<style>
	.page-section { max-width: 1440px; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-brown); margin: 0 0 3rem; }
	.center { text-align: center; }
</style>
