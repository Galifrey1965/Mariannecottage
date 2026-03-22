<script lang="ts">
	import { t } from '$lib/i18n';
	import EnquiryForm from '$lib/components/EnquiryForm.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { lang, messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'contact.title')}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-12">{t(messages, 'contact.title')}</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
		<!-- Contact Info -->
		<div class="space-y-6">
			<!-- Address -->
			<div>
				<h3 class="text-lg font-semibold text-amber-900 mb-2">{t(messages, 'contact.address_label')}</h3>
				<p class="text-gray-700">{t(messages, 'contact.address')}</p>
			</div>

			<!-- Email -->
			<div>
				<h3 class="text-lg font-semibold text-amber-900 mb-2">{t(messages, 'contact.email_label')}</h3>
				<a href="mailto:mariannecattage@gmail.com" class="text-amber-600 hover:text-amber-700">
					{t(messages, 'contact.email')}
				</a>
			</div>

			<!-- Phone -->
			<div>
				<h3 class="text-lg font-semibold text-amber-900 mb-2">{t(messages, 'contact.phone_label')}</h3>
				<a href="tel:+33780731704" class="text-amber-600 hover:text-amber-700">
					{t(messages, 'contact.phone')}
				</a>
			</div>

			<!-- Airport -->
			<div>
				<h3 class="text-lg font-semibold text-amber-900 mb-2">{t(messages, 'contact.airport')}</h3>
				<p class="text-gray-700">{t(messages, 'contact.airport_info')}</p>
			</div>

			<!-- Directions Warning -->
			<div class="p-4 bg-amber-50 border-l-4 border-amber-600 rounded">
				<h3 class="font-semibold text-amber-900 mb-2">{t(messages, 'contact.directions.heading')}</h3>
				<p class="text-sm text-gray-700">{t(messages, 'contact.directions.important')}</p>
			</div>

			<!-- Social Links -->
			<div>
				<h3 class="text-lg font-semibold text-amber-900 mb-3">{t(messages, 'contact.social.heading')}</h3>
				<div class="flex gap-4">
					<a
						href="https://booking.com"
						target="_blank"
						rel="noopener"
						class="text-amber-600 hover:text-amber-700 font-semibold"
					>
						{t(messages, 'contact.social.booking_com')}
					</a>
					<a
						href="https://tripadvisor.com"
						target="_blank"
						rel="noopener"
						class="text-amber-600 hover:text-amber-700 font-semibold"
					>
						{t(messages, 'contact.social.tripadvisor')}
					</a>
					<a
						href="https://facebook.com/p/Marianne-Cottage-Bed-and-Breakfast-61554481672203/"
						target="_blank"
						rel="noopener"
						class="text-amber-600 hover:text-amber-700 font-semibold"
					>
						{t(messages, 'contact.social.facebook')}
					</a>
				</div>
			</div>
		</div>

		<!-- Contact Form -->
		<div>
			<h3 class="text-xl font-serif font-semibold text-amber-900 mb-6">
				{t(messages, 'contact.form.heading')}
			</h3>
			<EnquiryForm {messages} />
		</div>
	</div>

	<!-- Static Map placeholder -->
	<div class="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300">
		<div class="text-center">
			<div class="text-4xl mb-2">🗺️</div>
			<p class="text-gray-600">Map will be displayed here - Phase 2</p>
		</div>
	</div>
</section>
