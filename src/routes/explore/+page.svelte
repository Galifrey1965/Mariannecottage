<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'explore.title')}</title>
</svelte:head>

<section class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-8">{t(messages, 'explore.title')}</h1>
	<p class="text-gray-700 text-lg mb-12">{t(messages, 'explore.description')}</p>

	<!-- Map Placeholder -->
	<div class="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300 mb-12">
		<div class="text-center">
			<div class="text-6xl mb-4">🗺️</div>
			<p class="text-gray-600 text-lg">Interactive Leaflet map coming in Phase 2</p>
			<p class="text-gray-500 text-sm mt-2">Shows attractions around Normandy with markers and filters</p>
		</div>
	</div>

	<!-- Attractions by Category -->
	<div class="space-y-12">
		<div>
			<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-6">
				{t(messages, 'explore.category.ww2')}
			</h2>
			<p class="text-gray-600 mb-4">
				Omaha Beach (29 km), Omaha Beach Memorial Museum (29 km), La Cambe German War Cemetery (26 km),
				Overlord Museum (29 km), 29th Division Monument (4.3 km), Women of Valour WW2 Museum (4.3 km)
			</p>
		</div>

		<div>
			<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-6">
				{t(messages, 'explore.category.nature')}
			</h2>
			<p class="text-gray-600 mb-4">
				Abbaye de Cerisy-la-Forêt (5 km), Haras National de Saint-Lô (13 km)
			</p>
		</div>

		<div>
			<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-6">
				{t(messages, 'explore.category.towns')}
			</h2>
			<p class="text-gray-600 mb-4">
				Saint-Lô (13 km), Bayeux & Baron Gerard Museum (30 km)
			</p>
		</div>
	</div>
</section>
