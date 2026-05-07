<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const messages = $derived(data.messages);

	type Faq = { qKey: string; aKey: string };
	const items: Faq[] = [
		{ qKey: 'faq.q1', aKey: 'faq.a1' },
		{ qKey: 'faq.q3', aKey: 'faq.a3' },
		{ qKey: 'faq.q4', aKey: 'faq.a4' },
		{ qKey: 'faq.q5', aKey: 'faq.a5' },
		{ qKey: 'faq.q6', aKey: 'faq.a6' },
		{ qKey: 'faq.q7', aKey: 'faq.a7' },
		{ qKey: 'faq.q8', aKey: 'faq.a8' }
	];
</script>

<section class="page-section">
	<header class="page-head">
		<h1 class="page-title">{t(messages, 'faq.title')}</h1>
		<p class="page-intro">{t(messages, 'faq.subtitle')}</p>
	</header>

	<div class="faq-list">
		{#each items as item}
			<details class="faq-item">
				<summary>{t(messages, item.qKey)}</summary>
				<div class="faq-answer">
					<p>{t(messages, item.aKey)}</p>
				</div>
			</details>
		{/each}
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem 5rem; }
	@media (min-width: 600px) { .page-section { padding: 3.5rem 1.5rem 6rem; } }
	.page-head { margin-bottom: 2.25rem; }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 0.85rem;
	}
	.page-intro {
		color: var(--theme-text-muted);
		font-size: 1rem;
		line-height: 1.65;
		margin: 0;
		max-width: 44rem;
	}
	.faq-list { display: flex; flex-direction: column; gap: 0.75rem; }
	.faq-item {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		overflow: hidden;
	}
	.faq-item summary {
		padding: 1rem 1.25rem;
		font-family: var(--theme-font-display);
		font-weight: 500;
		font-size: 1.05rem;
		color: var(--theme-warm);
		cursor: pointer;
		list-style: none;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.faq-item summary::after {
		content: '+';
		font-size: 1.4rem;
		color: var(--theme-text-muted);
		transition: transform 0.15s ease;
	}
	.faq-item[open] summary::after { transform: rotate(45deg); }
	.faq-item summary::-webkit-details-marker { display: none; }
	.faq-answer {
		padding: 0 1.25rem 1.1rem;
		color: var(--theme-text-muted);
		line-height: 1.7;
	}
	.faq-answer p { margin: 0; }
</style>
