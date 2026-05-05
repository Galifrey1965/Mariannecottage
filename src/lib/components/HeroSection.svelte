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
		savingsHint?: string;
	}

	let { lang, messages, image, title, description, cta, ctaLink, savingsHint }: Props = $props();
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
			<a href={localePath(lang, ctaLink)} class="hero-cta" class:has-hint={Boolean(savingsHint)}>
				<span class="hero-cta__main">
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M8 2v4"/>
						<path d="M16 2v4"/>
						<rect width="18" height="18" x="3" y="4" rx="2"/>
						<path d="M3 10h18"/>
						<path d="m9 16 2 2 4-4"/>
					</svg>
					{cta}
				</span>
				{#if savingsHint}
					<span class="hero-cta__hint" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
							<path d="M12 2v20M5 9l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 12 12)" />
						</svg>
						<span>{savingsHint}</span>
					</span>
					<span class="visually-hidden"> — {savingsHint}</span>
				{/if}
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
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.75rem 1.5rem;
		background-color: var(--color-sage);
		color: white;
		border-radius: 9999px;
		font-size: 1rem;
		font-weight: 600;
		text-decoration: none;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}
	.hero-cta.has-hint { padding: 0.625rem 1.5rem; }

	.hero-cta__main {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
	}

	.hero-cta__hint {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.72rem;
		font-weight: 500;
		opacity: 0.95;
		letter-spacing: 0.02em;
	}

	.hero-cta:hover {
		background-color: var(--color-sage-hover);
		transform: scale(1.05);
		color: white;
	}

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
