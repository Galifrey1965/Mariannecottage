<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import HighlightStrip from '$lib/components/HighlightStrip.svelte';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import AttractionCard from '$lib/components/AttractionCard.svelte';
	import Reviews from '$lib/components/Reviews.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages, rating } = data;
</script>

<!-- Hero Section (contains h1) -->
<HeroSection
	{lang}
	{messages}
	image="/images/2024-08-15.jpg"
	title={t(messages, 'home.hero.tagline')}
	cta={t(messages, 'home.hero.cta')}
	ctaLink="/book"
	savingsHint={t(messages, 'book.savings_hint')}
/>

<!-- About Section -->
<section class="section-narrow">
	<h2 class="section-heading center">{t(messages, 'home.about.heading')}</h2>
	<div class="prose">
		<p>{t(messages, 'home.about.p1')}</p>
		<p>{t(messages, 'home.about.p2')}</p>
		<p>{t(messages, 'home.about.p3')}</p>
	</div>
</section>

<!-- Highlights -->
<section class="section-wide highlights-bg">
	<HighlightStrip {messages} />
</section>

<!-- Room Preview -->
<section class="section-wide">
	<h2 class="section-heading center">{t(messages, 'home.rooms.heading')}</h2>
	<div class="rooms-grid">
		<RoomCard
			{lang}
			{messages}
			image="/images/gallery/bedroom-double-bed.jpeg"
			title={t(messages, 'home.rooms_data.bedroom1')}
			description={t(messages, 'home.rooms_data.bedroom1_desc')}
		/>
		<RoomCard
			{lang}
			{messages}
			image="/images/gallery/bedroom-twin-full.jpeg"
			title={t(messages, 'home.rooms_data.bedroom2')}
			description={t(messages, 'home.rooms_data.bedroom2_desc')}
		/>
	</div>
	<div class="cta-center">
		<a href={localePath(lang, '/rooms')} class="cta-button">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>
			</svg>
			{t(messages, 'home.rooms.cta')}
		</a>
	</div>
</section>

<!-- Attractions Teaser -->
<section class="section-wide attractions-bg">
	<h2 class="section-heading center">{t(messages, 'home.attractions.heading')}</h2>
	<div class="attractions-grid">
		<AttractionCard
			image="/images/omaha-beach.jpg"
			title={t(messages, 'home.attractions.dday')}
			distance="29 km"
			description={t(messages, 'home.attractions_data.dday_desc')}
			category={t(messages, 'explore.category.ww2')}
		/>
		<AttractionCard
			image="/images/cerisy-abbey.jpg"
			title={t(messages, 'home.attractions.cerisy')}
			distance="5 km"
			description={t(messages, 'home.attractions_data.cerisy_desc')}
			category={t(messages, 'explore.category.nature')}
		/>
		<AttractionCard
			image="/images/saint-lo.jpg"
			title={t(messages, 'home.attractions.saintlo')}
			distance="13 km"
			description={t(messages, 'home.attractions_data.saintlo_desc')}
			category={t(messages, 'explore.category.towns')}
		/>
	</div>
	<div class="cta-center">
		<a href={localePath(lang, '/explore')} class="cta-button">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
			</svg>
			{t(messages, 'home.attractions.cta')}
		</a>
	</div>
</section>

<!-- Reviews -->
{#if rating && rating.ratingCount > 0}
	<section class="section-wide reviews-bg">
		<h2 class="section-heading center">{t(messages, 'home.reviews.heading')}</h2>
		<Reviews {messages} {lang} {rating} />
	</section>
{/if}

<!-- Booking CTA -->
<section class="section-narrow cta-section">
	<h2 class="section-heading center">{t(messages, 'home.booking.heading')}</h2>
	<p class="cta-description">{t(messages, 'home.about.p1')}</p>
	<a href={localePath(lang, '/book')} class="cta-button large">
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>
		</svg>
		{t(messages, 'home.booking.cta')}
	</a>
</section>

<style>
	.section-narrow { max-width: 56rem; margin: 0 auto; padding: 5rem 1rem; }
	.section-wide { max-width: 1440px; margin: 0 auto; padding: 5rem 1rem; }
	@media (min-width: 600px) {
		.section-narrow { padding: 6rem 1.5rem; }
		.section-wide { padding: 6rem 1.5rem; }
	}
	.section-heading {
		font-family: var(--theme-font-display);
		font-size: clamp(1.85rem, 3vw, 2.5rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 2.5rem;
		position: relative;
		padding-bottom: 1rem;
	}
	.center { text-align: center; }
	.section-heading.center::after {
		content: '';
		position: absolute; left: 50%; bottom: 0;
		width: 3rem; height: 1px;
		background: var(--theme-accent);
		transform: translateX(-50%);
	}

	.prose {
		color: var(--theme-text-muted);
		line-height: 1.8; font-size: 1.05rem;
		display: flex; flex-direction: column; gap: 1.1rem;
		max-width: 42rem; margin: 0 auto;
	}
	.prose p { margin: 0; }

	.highlights-bg {
		background: var(--theme-surface);
		border-top: var(--theme-border-thin);
		border-bottom: var(--theme-border-thin);
		border-radius: 0;
	}

	.rooms-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; margin-bottom: 2.5rem; }
	@media (min-width: 840px) { .rooms-grid { grid-template-columns: 1fr 1fr; } }

	.attractions-bg {
		background: var(--theme-surface);
		border-top: var(--theme-border-thin);
		border-bottom: var(--theme-border-thin);
		border-radius: 0;
	}

	.reviews-bg {
		background: var(--theme-bg);
	}
	.attractions-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; margin-bottom: 2.5rem; }
	@media (min-width: 840px) { .attractions-grid { grid-template-columns: repeat(3, 1fr); } }

	.cta-center { text-align: center; }
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.85rem 2.25rem;
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
	.cta-button:hover {
		background: var(--theme-accent);
		color: var(--theme-bg);
	}
	.cta-button.large { padding: 1rem 2.75rem; font-size: 0.95rem; }

	.cta-section { text-align: center; }
	.cta-description {
		color: var(--theme-text-muted);
		font-size: 1.15rem; line-height: 1.7;
		margin: 0 auto 2.5rem; max-width: 38rem;
		font-style: italic;
	}
</style>
