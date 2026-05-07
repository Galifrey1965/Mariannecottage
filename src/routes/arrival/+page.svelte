<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const messages = $derived(data.messages);
</script>

<section class="page-section">
	<header class="page-head">
		<h1 class="page-title">{t(messages, 'arrival.title')}</h1>
		<p class="page-intro">{t(messages, 'arrival.subtitle')}</p>
	</header>

	<article class="info-block">
		<h2>{t(messages, 'arrival.check_in_heading')}</h2>
		<p>{t(messages, 'arrival.check_in_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.check_out_heading')}</h2>
		<p>{t(messages, 'arrival.check_out_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.address_heading')}</h2>
		<p>{t(messages, 'arrival.address_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.parking_heading')}</h2>
		<p>{t(messages, 'arrival.parking_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.key_heading')}</h2>
		<p>{t(messages, 'arrival.key_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.wifi_heading')}</h2>
		<p>{t(messages, 'arrival.wifi_body')}</p>
	</article>

	<article class="info-block">
		<h2>{t(messages, 'arrival.contact_heading')}</h2>
		<p>{t(messages, 'arrival.contact_body')}</p>
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
</style>
