<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const messages = $derived(data.messages);
</script>

<section class="page-section">
	<header class="page-head">
		<h1 class="page-title">{t(messages, 'house_rules.title')}</h1>
		<p class="page-intro">{t(messages, 'house_rules.subtitle')}</p>
	</header>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.smoking_heading')}</h2>
		<p>{t(messages, 'house_rules.smoking_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.pets_heading')}</h2>
		<p>{t(messages, 'house_rules.pets_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.guests_heading')}</h2>
		<p>{t(messages, 'house_rules.guests_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.quiet_heading')}</h2>
		<p>{t(messages, 'house_rules.quiet_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.events_heading')}</h2>
		<p><span class="pending">{t(messages, 'house_rules.pending')}</span></p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.rubbish_heading')}</h2>
		<p><span class="pending">{t(messages, 'house_rules.pending')}</span></p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'house_rules.damages_heading')}</h2>
		<p>{t(messages, 'house_rules.damages_body')}</p>
	</article>
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
	.info-block {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 1.5rem;
		margin: 0 0 1.25rem;
		color: var(--theme-text-muted);
		line-height: 1.7;
	}
	.info-block h2 {
		font-family: var(--theme-font-display);
		font-size: 1.3rem;
		font-weight: 500;
		color: var(--theme-warm);
		margin: 0 0 0.6rem;
	}
	.info-block p { margin: 0; }
	.pending {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #8a5a00;
		background: #fff4d6;
		border: 1px solid #f5b942;
		border-radius: 9999px;
		padding: 0.1rem 0.55rem;
	}
</style>
