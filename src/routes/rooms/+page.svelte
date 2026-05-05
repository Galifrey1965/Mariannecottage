<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;

	const amenityIcons: Record<string, string> = {
		comfortable_beds: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 17h20"/><path d="M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/><path d="M12 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
		shower: '<path d="M4 4 2.5 2.5"/><path d="M13.5 6.5a4.95 4.95 0 0 0-7 7"/><path d="M15 5 5 15"/><path d="M14 17v.01"/><path d="M10 16v.01"/><path d="M13 13v.01"/><path d="M16 10v.01"/><path d="M11 20v.01"/><path d="M17 14v.01"/><path d="M20 11v.01"/>',
		towels: '<path d="M21 11V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M7 11V7"/><path d="M17 11V7"/>',
		kettle: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>',
		garden_views: '<path d="M8 19h8a4 4 0 0 0 3.8-2.8 4 4 0 0 0-1.6-4.5c1-1.1 1-2.7.4-4-.7-1.2-2.2-2-3.6-1.7a3 3 0 0 0-3-3 3 3 0 0 0-3 3c-1.5-.2-2.9.5-3.6 1.7-.7 1.3-.5 2.9.4 4a4 4 0 0 0-1.6 4.5A4 4 0 0 0 8 19Z"/><path d="M12 19v3"/>',
		wifi: '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
		parking: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
		nonsmoke: '<circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/>'
	};
</script>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'rooms.title')}</h1>

	<!-- Suite Description -->
	<div class="section-block">
		<h2 class="section-heading">{t(messages, 'rooms.suite.heading')}</h2>
		<p class="description">{t(messages, 'rooms.suite.description')}</p>

		<div class="image-grid">
			<img src="/images/gallery/bedroom-double-bed.jpeg" alt={t(messages, 'rooms.images.double_bedroom')} class="room-image" loading="lazy" decoding="async" />
			<img src="/images/gallery/bedroom-twin-full.jpeg" alt={t(messages, 'rooms.images.twin_bedroom')} class="room-image" loading="lazy" decoding="async" />
			<img src="/images/gallery/bathroom-main.jpeg" alt={t(messages, 'rooms.images.bathroom')} class="room-image" loading="lazy" decoding="async" />
			<img src="/images/gallery/living-dining-room.jpeg" alt={t(messages, 'rooms.images.living_dining')} class="room-image" loading="lazy" decoding="async" />
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
					<svg
						class="amenity-icon"
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>{@html amenityIcons[amenity]}</svg>
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
		<p class="box-text-note">{t(messages, 'rooms.evening_meal.book_note')}</p>
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 3.5rem 1.5rem; } }
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
	.amenity-icon { color: var(--theme-accent); flex-shrink: 0; margin-top: 0.1rem; }
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
	.box-text-note { color: var(--theme-text-muted); font-size: 0.9rem; font-style: italic; margin: 0; line-height: 1.6; }
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
