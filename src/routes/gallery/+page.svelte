<script lang="ts">
	import { t } from '$lib/i18n';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;

	const images = [
		{ src: '/images/2024-08-15.webp', category: 'exterior', alt: 'Cottage exterior' },
		{ src: '/images/2024-12-15.jpg', category: 'rooms', alt: 'Bedroom 1' },
		{ src: '/images/2024-12-15%20(1).jpg', category: 'rooms', alt: 'Bedroom 2' },
		{ src: '/images/2024-12-15%20(1).webp', category: 'bathroom', alt: 'Bathroom' },
		{ src: '/images/2024-12-15%20(2).jpg', category: 'garden', alt: 'Garden view' },
		{ src: '/images/2024-12-15%20(3).jpg', category: 'exterior', alt: 'Exterior detail' },
		{ src: '/images/2023-05-20.jpg', category: 'surroundings', alt: 'Surrounding countryside' },
		{ src: '/images/2023-06-07.jpg', category: 'garden', alt: 'Garden area' },
		{ src: '/images/unnamed.jpg', category: 'breakfast', alt: 'Breakfast setup' },
		{ src: '/images/unnamed.webp', category: 'surroundings', alt: 'Local scenery' },
		{ src: '/images/2024-12-15.webp', category: 'rooms', alt: 'Room detail' }
	];
</script>

<svelte:head>
	<title>{t(messages, 'gallery.title')}</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-12 text-center">
		{t(messages, 'gallery.title')}
	</h1>

	<PhotoGallery {messages} {images} />
</section>
