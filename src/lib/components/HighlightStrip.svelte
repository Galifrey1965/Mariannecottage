<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface Props {
		messages: Messages;
	}

	let { messages }: Props = $props();

	const highlights = [
		{ key: 'wifi', icon: '📶' },
		{ key: 'parking', icon: '🅿️' },
		{ key: 'breakfast', icon: '🥐' },
		{ key: 'garden', icon: '🌿' },
		{ key: 'wildlife', icon: '🦉' },
		{ key: 'nonsmoking', icon: '🚭' }
	];
</script>

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 py-8">
	{#each highlights as item}
		<div class="text-center p-4 bg-amber-50 rounded-lg hover:shadow-md transition-shadow">
			<div class="text-4xl mb-2">{item.icon}</div>
			<p class="text-sm font-semibold text-amber-900">{t(messages, `home.highlights.${item.key}`)}</p>
		</div>
	{/each}
</div>
