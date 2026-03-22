<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import HeroSection from '$lib/components/HeroSection.svelte';
	import HighlightStrip from '$lib/components/HighlightStrip.svelte';
	import RoomCard from '$lib/components/RoomCard.svelte';
	import AttractionCard from '$lib/components/AttractionCard.svelte';
	import TestimonialCarousel from '$lib/components/TestimonialCarousel.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'meta.title')}</title>
	<meta name="description" content={t(messages, 'meta.description')} />
</svelte:head>

<!-- Hero Section -->
<HeroSection
	{lang}
	{messages}
	image="/images/2024-08-15.webp"
	title={t(messages, 'home.hero.tagline')}
	cta={t(messages, 'home.hero.cta')}
	ctaLink="/book"
/>

<!-- About Section -->
<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<h2 class="text-3xl font-serif font-semibold text-amber-900 mb-8 text-center">
		{t(messages, 'home.about.heading')}
	</h2>
	<div class="prose prose-sm max-w-none text-gray-700 space-y-4">
		<p>{t(messages, 'home.about.p1')}</p>
		<p>{t(messages, 'home.about.p2')}</p>
		<p>{t(messages, 'home.about.p3')}</p>
	</div>
</section>

<!-- Highlights -->
<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
	<HighlightStrip {messages} />
</section>

<!-- Room Preview -->
<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
	<h2 class="text-3xl font-serif font-semibold text-amber-900 mb-8 text-center">
		{t(messages, 'home.rooms.heading')}
	</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
		<RoomCard
			{lang}
			image="/images/2024-12-15.jpg"
			title="Bedroom 1"
			description="Comfortable bedroom with garden views"
		/>
		<RoomCard
			{lang}
			image="/images/2024-12-15%20(1).jpg"
			title="Bedroom 2"
			description="Second bedroom with natural light"
		/>
	</div>
	<div class="text-center">
		<a
			href={localePath(lang, '/rooms')}
			class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
		>
			{t(messages, 'home.rooms.cta')}
		</a>
	</div>
</section>

<!-- Attractions Teaser -->
<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 rounded-lg">
	<h2 class="text-3xl font-serif font-semibold text-amber-900 mb-8 text-center">
		{t(messages, 'home.attractions.heading')}
	</h2>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
		<AttractionCard
			image="/images/2023-05-20.jpg"
			title={t(messages, 'home.attractions.dday')}
			distance="29 km"
			description="Historic D-Day landing beaches and memorials"
			category={t(messages, 'explore.category.ww2')}
		/>
		<AttractionCard
			image="/images/2023-06-07.jpg"
			title={t(messages, 'home.attractions.cerisy')}
			distance="5 km"
			description="Beautiful medieval abbey in the countryside"
			category={t(messages, 'explore.category.nature')}
		/>
		<AttractionCard
			image="/images/2024-12-15%20(2).jpg"
			title={t(messages, 'home.attractions.saintlo')}
			distance="13 km"
			description="Historic town with remarkable architecture"
			category={t(messages, 'explore.category.towns')}
		/>
	</div>
	<div class="text-center">
		<a
			href={localePath(lang, '/explore')}
			class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
		>
			{t(messages, 'home.attractions.cta')}
		</a>
	</div>
</section>

<!-- Testimonials -->
<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<TestimonialCarousel {messages} />
</section>

<!-- Booking CTA -->
<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 text-center">
	<h2 class="text-3xl font-serif font-semibold text-amber-900 mb-4">
		{t(messages, 'home.booking.heading')}
	</h2>
	<p class="text-gray-600 mb-8 text-lg">
		{t(messages, 'home.about.p1')}
	</p>
	<a
		href={localePath(lang, '/book')}
		class="inline-block px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors text-lg"
	>
		{t(messages, 'home.booking.cta')}
	</a>
</section>
