<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface Props {
		messages: Messages;
	}

	let { messages }: Props = $props();

	let currentIndex = $state(0);

	const testimonials = [
		{
			text: t(messages, 'home.testimonials.simon'),
			author: t(messages, 'home.testimonials.simon_author')
		},
		{
			text: t(messages, 'home.testimonials.ingrid'),
			author: t(messages, 'home.testimonials.ingrid_author')
		},
		{
			text: t(messages, 'home.testimonials.guest3'),
			author: t(messages, 'home.testimonials.guest3_author')
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % testimonials.length;
		}, 5000);

		return () => clearInterval(interval);
	});
</script>

<div class="bg-amber-50 rounded-lg p-8 sm:p-12">
	<div class="flex items-center justify-between mb-6">
		<h3 class="font-serif text-2xl font-semibold text-amber-900">
			{t(messages, 'home.testimonials.heading')}
		</h3>
		<div class="flex gap-2">
			{#each testimonials as _, i}
				<button
					onclick={() => (currentIndex = i)}
					class="w-3 h-3 rounded-full transition-all"
					class:bg-amber-600={currentIndex === i}
					class:bg-amber-300={currentIndex !== i}
					aria-label="Go to testimonial {i + 1}"
				/>
			{/each}
		</div>
	</div>

	<div class="relative h-32 sm:h-24">
		{#each testimonials as testimonial, i}
			<div
				class="absolute inset-0 transition-opacity duration-500"
				class:opacity-0={currentIndex !== i}
				class:opacity-100={currentIndex === i}
			>
				<blockquote class="italic text-gray-700 mb-4">"{testimonial.text}"</blockquote>
				<p class="font-semibold text-amber-900">— {testimonial.author}</p>
			</div>
		{/each}
	</div>
</div>
