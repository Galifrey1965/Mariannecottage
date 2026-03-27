<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
		image: string;
		title: string;
		description?: string;
		cta?: string;
		ctaLink?: string;
	}

	let { lang, messages, image, title, description, cta, ctaLink }: Props = $props();
</script>

<div class="hero">
	<img src={image} alt={title} class="hero-image" />
	<div class="hero-gradient"></div>
	<div class="hero-content">
		<h1 class="hero-title">{title}</h1>

		{#if description}
			<p class="hero-description">{description}</p>
		{/if}

		{#if cta && ctaLink}
			<a href={localePath(lang, ctaLink)} class="hero-cta">
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
					<line x1="16" y1="2" x2="16" y2="6"/>
					<line x1="8" y1="2" x2="8" y2="6"/>
					<line x1="3" y1="10" x2="21" y2="10"/>
				</svg>
				{cta}
			</a>
		{/if}
	</div>
</div>

<style>
	.hero {
		position: relative;
		width: 100%;
		height: 16rem;
		overflow: hidden;
		border-radius: var(--md-shape-corner-medium);
		box-shadow: var(--md-elevation-shadow-2);
	}

	@media (min-width: 480px) { .hero { height: 20rem; } }
	@media (min-width: 600px) { .hero { height: 28rem; } }
	@media (min-width: 840px) { .hero { height: 500px; } }

	.hero-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, transparent, transparent 40%, rgba(0, 0, 0, 0.5));
	}

	.hero-content {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 1rem;
		gap: 1.5rem;
	}

	.hero-title {
		font-family: 'Lora', serif;
		font-size: 1.75rem;
		font-weight: 400;
		line-height: 1.1;
		color: white;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
		max-width: 56rem;
		margin: 0;
	}

	@media (min-width: 480px) { .hero-title { font-size: 2.25rem; } }
	@media (min-width: 600px) { .hero-title { font-size: 2.75rem; } }
	@media (min-width: 840px) { .hero-title { font-size: 3.5rem; } }

	.hero-description {
		font-size: 1.125rem;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
		max-width: 42rem;
		margin: 0;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		background-color: var(--color-sage);
		color: white;
		border-radius: 9999px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}

	.hero-cta:hover {
		background-color: var(--color-sage-hover);
		transform: scale(1.05);
		color: white;
	}
</style>
