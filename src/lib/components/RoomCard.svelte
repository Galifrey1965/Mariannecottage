<script lang="ts">
	import { localePath } from '$lib/i18n';
	import type { Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		image: string;
		title: string;
		description: string;
	}

	let { lang, image, title, description }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
	<img src={image} alt={title} class="w-full h-48 object-cover" />
	<div class="p-6">
		<h3 class="font-serif text-xl font-semibold text-amber-900 mb-2">{title}</h3>
		<p class="text-gray-600 text-sm mb-4">{description}</p>
		<a
			href={localePath(lang, '/rooms')}
			class="inline-block text-amber-600 hover:text-amber-700 font-semibold text-sm"
		>
			→ View Details
		</a>
	</div>
</div>
