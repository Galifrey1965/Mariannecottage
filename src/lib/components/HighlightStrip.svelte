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

<div class="strip">
	{#each highlights as item}
		<div class="highlight-item">
			<div class="highlight-icon">{item.icon}</div>
			<p class="highlight-label">{t(messages, `home.highlights.${item.key}`)}</p>
		</div>
	{/each}
</div>

<style>
	.strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 2rem 0; }
	@media (min-width: 600px) { .strip { grid-template-columns: repeat(3, 1fr); } }
	@media (min-width: 1024px) { .strip { grid-template-columns: repeat(6, 1fr); } }
	.highlight-item { text-align: center; padding: 1rem; background: var(--color-cream); border-radius: 12px; transition: box-shadow 0.2s ease; }
	.highlight-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
	.highlight-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
	.highlight-label { font-size: 0.875rem; font-weight: 600; color: var(--color-brown); margin: 0; }
</style>
