<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const { messages } = data;
</script>

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
	.page-section { max-width: 56rem; margin: 0 auto; padding: 2.5rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 3.5rem 1.5rem; } }
	.page-title {
		font-family: var(--theme-font-display);
		font-size: clamp(2rem, 4vw, 2.75rem);
		font-weight: 500;
		color: var(--theme-warm);
		letter-spacing: -0.01em;
		margin: 0 0 2rem;
	}
	.legal-content {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 2rem;
		color: var(--theme-text-muted);
		line-height: 1.7;
	}
	.todo-list { margin-top: 2rem; }
	.todo-list h2 {
		font-family: var(--theme-font-display);
		font-size: 1.2rem; font-weight: 500;
		color: var(--theme-warm); margin: 0 0 1rem;
	}
	.todo-list ul { list-style: disc; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; }
</style>
