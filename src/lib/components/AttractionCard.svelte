<script lang="ts">
	interface Props {
		image: string;
		title: string;
		distance: string;
		description: string;
		category: string;
	}

	let { image, title, distance, description, category }: Props = $props();
</script>

<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
	<img src={image} alt={title} class="w-full h-40 object-cover" />
	<div class="p-4">
		<div class="flex items-start justify-between mb-2">
			<h3 class="font-serif font-semibold text-amber-900">{title}</h3>
			<span class="text-xs bg-amber-100 text-amber-900 px-2 py-1 rounded whitespace-nowrap ml-2">
				{distance}
			</span>
		</div>
		<p class="text-xs text-gray-500 font-medium mb-2 uppercase">{category}</p>
		<p class="text-sm text-gray-600">{description}</p>
	</div>
</div>
