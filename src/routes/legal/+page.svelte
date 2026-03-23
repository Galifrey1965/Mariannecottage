<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;
</script>

<svelte:head>
	<title>{t(messages, 'legal.title')}</title>
</svelte:head>

<section class="page-section">
	<h1 class="page-title">{t(messages, 'legal.title')}</h1>

	<div class="legal-content">
		<p>{t(messages, 'legal.placeholder')}</p>

		<div class="todo-list">
			<h2>{t(messages, 'legal.todo_heading')}</h2>
			<ul>
				<li>{t(messages, 'legal.siret')}</li>
				<li>{t(messages, 'legal.company')}</li>
				<li>{t(messages, 'legal.hosting')}</li>
				<li>{t(messages, 'legal.gdpr')}</li>
				<li>{t(messages, 'legal.cookies')}</li>
				<li>{t(messages, 'legal.terms')}</li>
				<li>{t(messages, 'legal.cancellation')}</li>
			</ul>
		</div>
	</div>
</section>

<style>
	.page-section { max-width: 56rem; margin: 0 auto; padding: 4rem 1rem; }
	.page-title { font-family: 'Lora', serif; font-size: 2.5rem; font-weight: 700; color: var(--color-brown); margin: 0 0 2rem; }
	.legal-content { background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 2rem; color: var(--color-text-muted); }
	.todo-list { margin-top: 2rem; }
	.todo-list h2 { font-size: 1.25rem; font-weight: 600; color: var(--color-brown); margin: 0 0 1rem; }
	.todo-list ul { list-style: disc; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; }
</style>
