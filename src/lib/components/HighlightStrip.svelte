<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface Props {
		messages: Messages;
	}

	let { messages }: Props = $props();

	const highlights: Array<{ key: string; icon: string }> = [
		{ key: 'wifi',        icon: 'wifi' },
		{ key: 'parking',     icon: 'parking' },
		{ key: 'breakfast',   icon: 'coffee' },
		{ key: 'garden',      icon: 'leaf' },
		{ key: 'wildlife',    icon: 'feather' },
		{ key: 'nonsmoking',  icon: 'no-smoking' }
	];
</script>

<div class="strip">
	{#each highlights as item}
		<div class="highlight-item">
			<div class="highlight-icon" aria-hidden="true">
				{#if item.icon === 'wifi'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12.55a11 11 0 0 1 14.08 0"/>
						<path d="M1.42 9a16 16 0 0 1 21.16 0"/>
						<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
						<circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
					</svg>
				{:else if item.icon === 'parking'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
					</svg>
				{:else if item.icon === 'coffee'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
						<path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
						<line x1="6" y1="2" x2="6" y2="5"/>
						<line x1="10" y1="2" x2="10" y2="5"/>
						<line x1="14" y1="2" x2="14" y2="5"/>
					</svg>
				{:else if item.icon === 'leaf'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
						<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
					</svg>
				{:else if item.icon === 'feather'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
						<line x1="16" y1="8" x2="2" y2="22"/>
						<line x1="17.5" y1="15" x2="9" y2="15"/>
					</svg>
				{:else if item.icon === 'no-smoking'}
					<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
						<path d="M8 12h2"/>
						<path d="M16 12h.5"/>
					</svg>
				{/if}
			</div>
			<p class="highlight-label">{t(messages, `home.highlights.${item.key}`)}</p>
		</div>
	{/each}
</div>

<style>
	.strip { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 2rem 0; }
	@media (min-width: 600px) { .strip { grid-template-columns: repeat(3, 1fr); } }
	@media (min-width: 840px) { .strip { grid-template-columns: repeat(6, 1fr); } }
	.highlight-item { text-align: center; padding: 1rem; background: var(--color-cream); border-radius: var(--md-shape-corner-medium); transition: box-shadow 0.2s ease; }
	.highlight-item:hover { box-shadow: var(--md-elevation-shadow-1); }
	.highlight-icon { display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; color: var(--color-sage); }
	.highlight-label { font-size: 0.875rem; font-weight: 600; color: var(--color-brown); margin: 0; }
</style>
