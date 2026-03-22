<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'booking_confirm.title')}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<div class="text-center mb-12">
		<h1 class="text-4xl font-serif font-bold text-green-600 mb-4">✓</h1>
		<h1 class="text-4xl font-serif font-bold text-amber-900 mb-2">
			{t(messages, 'booking_confirm.thank_you')}
		</h1>
		<p class="text-gray-600 text-lg">
			Booking reference will be displayed here when payments are implemented
		</p>
	</div>

	<!-- Info Box -->
	<div class="bg-amber-50 p-8 rounded-lg mb-8">
		<h2 class="font-serif font-semibold text-amber-900 mb-4 text-xl">
			{t(messages, 'booking_confirm.summary')}
		</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div>
				<p class="text-gray-600 text-sm">{t(messages, 'booking_confirm.dates')}</p>
				<p class="font-semibold text-amber-900">Check-in to Check-out</p>
			</div>
			<div>
				<p class="text-gray-600 text-sm">{t(messages, 'booking_confirm.guests')}</p>
				<p class="font-semibold text-amber-900">2 Guests</p>
			</div>
		</div>

		<div class="border-t border-amber-200 pt-4">
			<p class="text-gray-600 text-sm">{t(messages, 'booking_confirm.total_paid')}</p>
			<p class="text-2xl font-semibold text-amber-900">€xxx.xx</p>
		</div>
	</div>

	<!-- Important Info -->
	<div class="bg-blue-50 border-l-4 border-blue-600 p-6 rounded mb-8">
		<h3 class="font-semibold text-blue-900 mb-2">{t(messages, 'booking_confirm.directions')}</h3>
		<p class="text-blue-800 text-sm">{t(messages, 'booking_confirm.important')}</p>
	</div>

	<!-- Contact Info -->
	<div class="text-center p-6 bg-gray-50 rounded-lg">
		<p class="text-gray-700 text-sm">{t(messages, 'booking_confirm.contact_info')}</p>
	</div>

	<!-- CTA -->
	<div class="text-center mt-12">
		<a
			href={localePath(lang, '/')}
			class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
		>
			Back to Home
		</a>
	</div>
</section>
