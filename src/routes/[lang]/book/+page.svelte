<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'book.title')}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-8">{t(messages, 'book.title')}</h1>

	<div class="bg-amber-50 p-8 rounded-lg text-center mb-8">
		<h2 class="text-2xl font-serif font-semibold text-amber-900 mb-4">
			{t(messages, 'book.coming_soon')}
		</h2>
		<p class="text-gray-700 mb-8">{t(messages, 'book.description')}</p>

		<div class="space-y-4">
			<a
				href="https://booking.com"
				target="_blank"
				rel="noopener"
				class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
			>
				{t(messages, 'book.booking_com_link')}
			</a>

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a
					href={localePath(lang, '/contact')}
					class="inline-block px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
				>
					{t(messages, 'book.contact_us')}
				</a>
			</div>
		</div>
	</div>

	<!-- Info Box -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="p-6 bg-gray-50 rounded-lg">
			<h3 class="font-serif font-semibold text-amber-900 mb-2 text-lg">Low Season</h3>
			<p class="text-gray-700 text-sm">Nov - Feb</p>
			<p class="text-amber-900 font-semibold">€85/night</p>
		</div>

		<div class="p-6 bg-gray-50 rounded-lg">
			<h3 class="font-serif font-semibold text-amber-900 mb-2 text-lg">High Season</h3>
			<p class="text-gray-700 text-sm">Jun - Aug</p>
			<p class="text-amber-900 font-semibold">€120/night</p>
		</div>

		<div class="p-6 bg-gray-50 rounded-lg">
			<h3 class="font-serif font-semibold text-amber-900 mb-2 text-lg">Peak Season</h3>
			<p class="text-gray-700 text-sm">D-Day week (Jun 1-8)</p>
			<p class="text-amber-900 font-semibold">€140/night</p>
		</div>
	</div>
</section>
