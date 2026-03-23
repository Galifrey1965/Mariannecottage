<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'rooms.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'rooms.title')}</h1>

	<!-- Suite Description -->
	<div class="section-block">
		<h2 class="section-heading">{t(messages, 'rooms.suite.heading')}</h2>
		<p class="description">{t(messages, 'rooms.suite.description')}</p>

		<div class="image-grid">
			<img src="/images/2024-12-15.jpg" alt="Bedroom 1" class="room-image" />
			<img src="/images/2024-12-15%20(1).jpg" alt="Bedroom 2" class="room-image" />
			<img src="/images/2024-12-15%20(3).jpg" alt="Bathroom" class="room-image" />
			<img src="/images/unnamed.jpg" alt="Common area" class="room-image" />
		</div>
	</div>

	<!-- Amenities -->
	<div class="section-block">
		<h2 class="section-heading">{t(messages, 'rooms.amenities.heading')}</h2>
		<div class="amenities-grid">
			{#each [
				'comfortable_beds',
				'shower',
				'towels',
				'kettle',
				'garden_views',
				'wifi',
				'parking',
				'nonsmoke'
			] as amenity}
				<div class="amenity-item">
					<span class="amenity-check">✓</span>
					<span class="amenity-text">{t(messages, `rooms.amenities.${amenity}`)}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Breakfast -->
	<div class="highlight-box breakfast-box">
		<h2 class="section-heading">{t(messages, 'rooms.breakfast.heading')}</h2>
		<p class="box-text">{t(messages, 'rooms.breakfast.description')}</p>
	</div>

	<!-- Evening Meal -->
	<div class="highlight-box evening-box">
		<h2 class="section-heading">{t(messages, 'rooms.evening_meal.heading')}</h2>
		<p class="box-text">{t(messages, 'rooms.evening_meal.description')}</p>
		<a href={localePath(lang, '/contact')} class="cta-button">
			{t(messages, 'contact.form.submit')}
		</a>
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-brown); margin: 0 0 2rem; }
	.section-block { margin-bottom: 3rem; }
	.section-heading { font-family: 'Lora', serif; font-size: 1.5rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1rem; }
	.description { color: var(--color-text-muted); font-size: 1.125rem; margin: 0 0 2rem; line-height: 1.6; }
	.image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	.room-image { width: 100%; height: 12rem; object-fit: cover; border-radius: var(--md-shape-corner-medium); }
	.amenities-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
	@media (min-width: 600px) { .amenities-grid { grid-template-columns: 1fr 1fr; } }
	.amenity-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: var(--color-cream); border-radius: var(--md-shape-corner-small); }
	.amenity-check { font-size: 1.25rem; color: var(--color-sage); font-weight: 700; }
	.amenity-text { color: var(--color-text-muted); }
	.highlight-box { padding: 2rem; border-radius: var(--md-shape-corner-medium); margin-bottom: 3rem; }
	.breakfast-box { background: linear-gradient(135deg, var(--color-cream), var(--color-cream-dark)); }
	.evening-box { background: var(--color-cream); }
	.box-text { color: var(--color-text-muted); margin: 0 0 1.5rem; line-height: 1.6; }
	.cta-button {
		display: inline-block; padding: 0.75rem 1.5rem;
		background: var(--color-sage); color: white; font-weight: 600;
		border-radius: var(--md-shape-corner-small); text-decoration: none; transition: opacity 0.2s;
	}
	.cta-button:hover { opacity: 0.9; }
</style>
