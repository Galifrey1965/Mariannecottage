<script lang="ts">
	import { localePath, t } from '$lib/i18n';
	import M3FAB from './M3FAB.svelte';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
		image: string;
		title: string;
		description?: string;
		cta?: string;
		ctaLink?: string;
		ctaIcon?: string;
	}

	let { lang, messages, image, title, description, cta, ctaLink, ctaIcon = '✨' }: Props = $props();
</script>

<div class="relative w-full h-96 sm:h-[500px] overflow-hidden rounded-[var(--md-shape-corner-large)] shadow-lg">
	<img src={image} alt={title} class="w-full h-full object-cover" />
	<!-- Tonal overlay for readability -->
	<div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50"></div>
	<div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-6">
		<!-- M3 Display Large heading -->
		<h1 class="md-display-large text-white drop-shadow-lg max-w-4xl leading-tight">
			{title}
		</h1>

		{#if description}
			<p class="md-body-large text-white/90 drop-shadow max-w-2xl">
				{description}
			</p>
		{/if}

		{#if cta && ctaLink}
			<M3FAB
				label={cta}
				icon={ctaIcon}
				href={localePath(lang, ctaLink)}
				position="relative"
				variant="primary"
			/>
		{/if}
	</div>
</div>

<style>
	:global(.md-display-large) {
		font-family: var(--md-typescale-display-large-font-family);
		font-size: var(--md-typescale-display-large-font-size);
		font-weight: var(--md-typescale-display-large-font-weight);
		line-height: var(--md-typescale-display-large-line-height);
		letter-spacing: var(--md-typescale-display-large-letter-spacing);
	}

	:global(.md-body-large) {
		font-family: var(--md-typescale-body-large-font-family);
		font-size: var(--md-typescale-body-large-font-size);
		font-weight: var(--md-typescale-body-large-font-weight);
		line-height: var(--md-typescale-body-large-line-height);
		letter-spacing: var(--md-typescale-body-large-letter-spacing);
	}
</style>
