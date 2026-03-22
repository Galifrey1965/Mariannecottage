<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'rooms.title')}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-8">{t(messages, 'rooms.title')}</h1>

	<!-- Suite Description -->
	<div class="mb-12">
		<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-4">
			{t(messages, 'rooms.suite.heading')}
		</h2>
		<p class="text-gray-700 text-lg mb-8">{t(messages, 'rooms.suite.description')}</p>

		<!-- Room Images -->
		<div class="grid grid-cols-2 gap-4 mb-12">
			<img src="/images/2024-12-15.jpg" alt="Bedroom 1" class="w-full h-48 object-cover rounded-lg" />
			<img src="/images/2024-12-15%20(1).jpg" alt="Bedroom 2" class="w-full h-48 object-cover rounded-lg" />
			<img
				src="/images/2024-12-15%20(3).jpg"
				alt="Bathroom"
				class="w-full h-48 object-cover rounded-lg"
			/>
			<img src="/images/unnamed.jpg" alt="Common area" class="w-full h-48 object-cover rounded-lg" />
		</div>
	</div>

	<!-- Amenities -->
	<div class="mb-12">
		<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-6">
			{t(messages, 'rooms.amenities.heading')}
		</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
				<div class="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
					<span class="text-xl">✓</span>
					<span class="text-gray-700">{t(messages, `rooms.amenities.${amenity}`)}</span>
				</div>
			{/each}
		</div>
	</div>

	<!-- Breakfast -->
	<div class="mb-12 p-8 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg">
		<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-4">
			{t(messages, 'rooms.breakfast.heading')}
		</h2>
		<p class="text-gray-700">{t(messages, 'rooms.breakfast.description')}</p>
	</div>

	<!-- Evening Meal -->
	<div class="p-8 bg-gray-50 rounded-lg">
		<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-4">
			{t(messages, 'rooms.evening_meal.heading')}
		</h2>
		<p class="text-gray-700 mb-6">{t(messages, 'rooms.evening_meal.description')}</p>
		<a
			href={localePath(lang, '/contact')}
			class="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
		>
			{t(messages, 'contact.form.submit')}
		</a>
	</div>
</section>
