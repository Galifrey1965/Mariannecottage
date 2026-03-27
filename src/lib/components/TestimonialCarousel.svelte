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
		{ text: t(messages, 'home.testimonials.simon'), author: t(messages, 'home.testimonials.simon_author') },
		{ text: t(messages, 'home.testimonials.ingrid'), author: t(messages, 'home.testimonials.ingrid_author') },
		{ text: t(messages, 'home.testimonials.guest3'), author: t(messages, 'home.testimonials.guest3_author') }
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % testimonials.length;
		}, 5000);
		return () => clearInterval(interval);
	});
</script>

<div class="carousel" aria-roledescription="carousel" aria-label={t(messages, 'home.testimonials.heading')}>
	<div class="carousel-header">
		<h3 class="carousel-title">{t(messages, 'home.testimonials.heading')}</h3>
		<div class="dots">
			{#each testimonials as _, i}
				<button onclick={() => (currentIndex = i)} class="dot" class:active={currentIndex === i} aria-label={t(messages, 'a11y.go_to_testimonial', { number: String(i + 1) })} />
			{/each}
		</div>
	</div>

	<div class="carousel-body" aria-live="polite">
		{#each testimonials as testimonial, i}
			<div class="testimonial" class:visible={currentIndex === i} role="group" aria-roledescription="slide" aria-label="{testimonial.author}">
				<blockquote>"{testimonial.text}"</blockquote>
				<p class="author">— {testimonial.author}</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.carousel { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 2rem; }
	@media (min-width: 600px) { .carousel { padding: 3rem; } }
	.carousel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
	.carousel-title { font-family: 'Lora', serif; font-size: 1.5rem; font-weight: 600; color: var(--color-brown); margin: 0; }
	.dots { display: flex; gap: 0.5rem; }
	.dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; border: none; cursor: pointer; background: var(--color-cream-dark); transition: background 0.2s ease; padding: 0.75rem; background-clip: content-box; box-sizing: content-box; }
	.dot.active { background: var(--color-sage); }
	.carousel-body { position: relative; min-height: 6rem; }
	@media (max-width: 599px) { .carousel-body { min-height: 8rem; } }
	.testimonial { position: absolute; inset: 0; opacity: 0; transition: opacity 0.5s ease; }
	.testimonial.visible { opacity: 1; }
	blockquote { font-style: italic; color: var(--color-text-muted); margin: 0 0 1rem; }
	.author { font-weight: 600; color: var(--color-brown); margin: 0; }
</style>
