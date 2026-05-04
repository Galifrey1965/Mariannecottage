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
			<img src="/images/gallery/bedroom-double-bed.jpeg" alt="Bedroom 1" class="room-image" />
			<img src="/images/gallery/bedroom-twin-full.jpeg" alt="Bedroom 2" class="room-image" />
			<img src="/images/gallery/bathroom-main.jpeg" alt="Bathroom" class="room-image" />
			<img src="/images/gallery/living-dining-room.jpeg" alt="Common area" class="room-image" />
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
	.page-section { max-width: 56rem; margin: 0 auto; padding: 5rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 6rem 1.5rem; } }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 2.5rem;
	}
	.section-block { margin-bottom: 3.5rem; }
	.section-heading {
		font-family: var(--theme-font-display);
		font-size: 1.5rem; font-weight: 500;
		color: var(--theme-warm); margin: 0 0 1rem;
	}
	.description { color: var(--theme-text-muted); font-size: 1.05rem; margin: 0 0 2rem; line-height: 1.7; }
	.image-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
	@media (min-width: 480px) { .image-grid { grid-template-columns: 1fr 1fr; } }
	.room-image { width: 100%; height: 10rem; object-fit: cover; border-radius: var(--theme-radius-md); }
	@media (min-width: 480px) { .room-image { height: 12rem; } }
	.amenities-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
	@media (min-width: 600px) { .amenities-grid { grid-template-columns: 1fr 1fr; } }
	.amenity-item {
		display: flex; align-items: flex-start; gap: 0.75rem;
		padding: 0.85rem 1rem;
		background: transparent;
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-sm);
	}
	.amenity-check { font-size: 1.1rem; color: var(--theme-accent); font-weight: 700; line-height: 1.3; }
	.amenity-text { color: var(--theme-text-muted); }
	.highlight-box {
		padding: 2.25rem;
		border-radius: var(--theme-radius-md);
		margin-bottom: 3rem;
		border: var(--theme-border-thin);
	}
	.breakfast-box { background: var(--theme-surface); }
	.evening-box { background: var(--theme-surface-2); }
	.box-text { color: var(--theme-text-muted); margin: 0 0 1.5rem; line-height: 1.7; }
	.cta-button {
		display: inline-block;
		padding: 0.85rem 2rem;
		background: transparent;
		color: var(--theme-accent);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid var(--theme-accent);
		border-radius: var(--theme-radius-pill);
		text-decoration: none;
		transition: background 0.25s ease, color 0.25s ease;
	}
	.cta-button:hover { background: var(--theme-accent); color: var(--theme-bg); }
</style>
