<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'legal.title')}</title>
</svelte:head>

<section class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
	<h1 class="text-4xl font-serif font-bold text-amber-900 mb-8">{t(messages, 'legal.title')}</h1>

	<div class="prose prose-sm max-w-none text-gray-700 p-8 bg-gray-50 rounded-lg">
		<p>{t(messages, 'legal.placeholder')}</p>

		<div class="mt-8 space-y-4">
			<h2 class="text-xl font-semibold text-amber-900">Information to be completed:</h2>
			<ul class="list-disc list-inside space-y-2 text-sm">
				<li>SIRET number</li>
				<li>Company registration details</li>
				<li>Hosting provider information</li>
				<li>Data protection policy (RGPD/GDPR)</li>
				<li>Cookie policy</li>
				<li>Terms of service</li>
				<li>Cancellation policy details</li>
			</ul>
		</div>
	</div>
</section>
