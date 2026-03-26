<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import HighlightStrip from '$lib/components/HighlightStrip.svelte';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import AttractionCard from '$lib/components/AttractionCard.svelte';
	import TestimonialCarousel from '$lib/components/TestimonialCarousel.svelte';
	import AiHelpFabs from '$lib/components/AiHelpFabs.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'meta.title')}</title>
	<meta name="description" content={t(messages, 'meta.description')} />
</svelte:head>

<!-- Hero Section (contains h1) -->
<HeroSection
	{lang}
	{messages}
	image="/images/2024-08-15.jpg"
	title={t(messages, 'home.hero.tagline')}
	cta={t(messages, 'home.hero.cta')}
	ctaLink="/book"
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
		<a href={localePath(lang, '/rooms')} class="cta-button">{t(messages, 'home.rooms.cta')}</a>
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
		<a href={localePath(lang, '/explore')} class="cta-button">{t(messages, 'home.attractions.cta')}</a>
	</div>
</section>

<!-- Testimonials -->
<section class="section-narrow">
	<TestimonialCarousel {messages} />
</section>

<!-- Booking CTA -->
<section class="section-narrow cta-section">
	<h2 class="section-heading center">{t(messages, 'home.booking.heading')}</h2>
	<p class="cta-description">{t(messages, 'home.about.p1')}</p>
	<a href={localePath(lang, '/book')} class="cta-button large">{t(messages, 'home.booking.cta')}</a>
	<AiHelpFabs {messages} />
</section>

<style>
	.section-narrow { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem; }
	.section-wide { max-width: 1440px; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) {
		.section-narrow { padding: 4rem 1.5rem; }
		.section-wide { padding: 4rem 1.5rem; }
	}
	.section-heading { font-family: 'Lora', serif; font-size: 1.75rem; font-weight: 600; color: var(--color-brown); margin: 0 0 2rem; }
	.center { text-align: center; }

	.prose { color: var(--color-text-muted); line-height: 1.8; display: flex; flex-direction: column; gap: 1rem; }
	.prose p { margin: 0; }

	.highlights-bg { background: linear-gradient(135deg, var(--color-cream), var(--color-cream-dark)); border-radius: var(--md-shape-corner-medium); }

	.rooms-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 2rem; }
	@media (min-width: 840px) { .rooms-grid { grid-template-columns: 1fr 1fr; } }

	.attractions-bg { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); }
	.attractions-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; margin-bottom: 2rem; }
	@media (min-width: 840px) { .attractions-grid { grid-template-columns: repeat(3, 1fr); } }

	.cta-center { text-align: center; }
	.cta-button {
		display: inline-block; padding: 0.75rem 2rem;
		background: var(--color-sage); color: white; font-weight: 600;
		border-radius: var(--md-shape-corner-small); text-decoration: none; transition: opacity 0.2s;
	}
	.cta-button:hover { opacity: 0.9; }
	.cta-button.large { padding: 1rem 2.5rem; font-size: 1.125rem; }

	.cta-section { text-align: center; }
	.cta-description { color: var(--color-text-muted); font-size: 1.125rem; margin: 0 0 2rem; line-height: 1.6; }
</style>
