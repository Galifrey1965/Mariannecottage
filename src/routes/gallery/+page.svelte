<script lang="ts">
	import { t } from '$lib/i18n';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const messages = $derived(data.messages);
	const images = $derived(data.images);
	const categories = $derived(data.categories);
</script>

<section class="page-section">
	<h1 class="page-title center">{t(messages, 'gallery.title')}</h1>
	<PhotoGallery {messages} {images} {categories} />
</section>

<style>
	.page-section { max-width: 1440px; margin: 0 auto; padding: 2.5rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 3.5rem 1.5rem; } }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 3rem;
	}
	.center { text-align: center; }
</style>
