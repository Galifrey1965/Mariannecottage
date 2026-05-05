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
		<div class="box-content">
			<h2 class="section-heading">{t(messages, 'rooms.breakfast.heading')}</h2>
			<p class="box-text">{t(messages, 'rooms.breakfast.description')}</p>
		</div>
		<svg
			class="box-art"
			viewBox="0 0 220 140"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<!-- Croissant -->
			<g transform="translate(10,40)">
				<path d="M 10 55 C 0 32, 18 6, 52 4 C 86 2, 110 16, 113 36 C 114 47, 106 55, 92 55 C 80 55, 73 56, 66 62 C 55 73, 33 73, 22 62 C 14 56, 8 53, 10 55 Z" />
				<line x1="28" y1="48" x2="38" y2="32" />
				<line x1="44" y1="52" x2="54" y2="34" />
				<line x1="60" y1="56" x2="70" y2="38" />
				<line x1="78" y1="56" x2="88" y2="40" />
			</g>
			<!-- Coffee cup -->
			<g transform="translate(140,40)">
				<path d="M 8 32 L 50 32 L 45 78 L 13 78 Z" />
				<path d="M 50 40 C 66 40, 66 64, 50 64" />
				<ellipse cx="29" cy="80" rx="26" ry="3" />
				<path d="M 19 24 C 16 20, 22 16, 19 12 C 16 8, 22 4, 19 0" />
				<path d="M 30 24 C 27 20, 33 16, 30 12 C 27 8, 33 4, 30 0" />
				<path d="M 41 24 C 38 20, 44 16, 41 12 C 38 8, 44 4, 41 0" />
			</g>
		</svg>
	</div>

	<!-- Evening Meal -->
	<div class="highlight-box evening-box">
		<div class="box-content">
			<h2 class="section-heading">{t(messages, 'rooms.evening_meal.heading')}</h2>
			<p class="box-text">{t(messages, 'rooms.evening_meal.description')}</p>
			<p class="box-text-note">{t(messages, 'rooms.evening_meal.book_note')}</p>
		</div>
		<svg
			class="box-art"
			viewBox="0 0 220 140"
			fill="none"
			stroke="currentColor"
			stroke-width="1.6"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<!-- Wine glass -->
			<g transform="translate(20,15)">
				<path d="M 8 4 L 50 4 Q 54 32, 42 50 Q 33 60, 29 60 Q 25 60, 16 50 Q 4 32, 8 4 Z" />
				<path d="M 12 18 Q 29 25, 46 18" />
				<line x1="29" y1="60" x2="29" y2="100" />
				<line x1="14" y1="100" x2="44" y2="100" />
			</g>
			<!-- Plate with fork and knife -->
			<g transform="translate(95,55)">
				<ellipse cx="58" cy="40" rx="55" ry="14" />
				<ellipse cx="58" cy="38" rx="42" ry="9" />
				<line x1="18" y1="-2" x2="18" y2="50" />
				<line x1="13" y1="-2" x2="13" y2="14" />
				<line x1="23" y1="-2" x2="23" y2="14" />
				<line x1="98" y1="-2" x2="98" y2="50" />
				<path d="M 94 -2 L 98 4 L 102 -2" />
			</g>
		</svg>
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
		position: relative;
		overflow: hidden;
		padding: 2.25rem;
		border-radius: var(--theme-radius-md);
		margin-bottom: 3rem;
		border: var(--theme-border-thin);
	}
	.breakfast-box { background: var(--theme-surface); }
	.evening-box { background: var(--theme-surface-2); }
	/* Decorative line art tucked into the bottom-right third of each panel.
	   Reserves text width via max-width on .box-content so copy doesn't run
	   under the artwork on wider viewports. */
	.box-content { position: relative; z-index: 1; }
	@media (min-width: 600px) {
		.box-content { max-width: 70%; }
	}
	.box-art {
		position: absolute;
		right: -0.5rem;
		bottom: -0.75rem;
		width: 11rem;
		height: auto;
		color: var(--theme-warm);
		opacity: 0.18;
		pointer-events: none;
	}
	@media (min-width: 600px) {
		.box-art { width: 14rem; right: 1rem; bottom: 1rem; }
	}
	.evening-box .box-art { color: var(--theme-text); opacity: 0.16; }
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
