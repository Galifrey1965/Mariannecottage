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

<div class="relative h-96 sm:h-[500px] w-full overflow-hidden rounded-lg shadow-lg">
	<img src={image} alt={title} class="w-full h-full object-cover" />
	<div class="absolute inset-0 bg-black/30"></div>
	<div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
		<h1 class="text-4xl sm:text-5xl font-serif font-bold text-white mb-4 drop-shadow-lg">{title}</h1>
		{#if description}
			<p class="text-lg sm:text-xl text-amber-50 mb-8 max-w-2xl drop-shadow">{description}</p>
		{/if}
		{#if cta && ctaLink}
			<a
				href={localePath(lang, ctaLink)}
				class="inline-block px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
			>
				{cta}
			</a>
		{/if}
	</div>
</div>
