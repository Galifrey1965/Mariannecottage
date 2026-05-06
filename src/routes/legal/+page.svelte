<script lang="ts">
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const messages = $derived(data.messages);

	// Pending values are awaiting Mark's confirmation per
	// documentation/specs/legal-page-inputs.md. They render as a visible
	// pending pill so we don't ship blank legal text by accident.
	const pending = (key: string) => `${t(messages, key)}`;

	const sections = [
		{ id: 'mentions', key: 'mentions_heading' },
		{ id: 'hosting', key: 'hosting_heading' },
		{ id: 'gdpr', key: 'gdpr_heading' },
		{ id: 'cookies', key: 'cookies_heading' },
		{ id: 'terms', key: 'terms_heading' },
		{ id: 'cancellation', key: 'cancellation_heading' },
		{ id: 'odr', key: 'odr_heading' }
	];
</script>

<section class="page-section">
	<header class="page-head">
		<h1 class="page-title">{t(messages, 'legal.title')}</h1>
		<p class="page-intro">{t(messages, 'legal.intro')}</p>
		<p class="page-meta">
			<span class="meta-label">{t(messages, 'legal.last_updated')}:</span>
			<time datetime="2026-05-06">2026-05-06</time>
		</p>
	</header>

	<nav class="toc" aria-label={t(messages, 'legal.toc_heading')}>
		<p class="toc-heading">{t(messages, 'legal.toc_heading')}</p>
		<ol class="toc-list">
			{#each sections as s}
				<li><a href="#{s.id}">{t(messages, `legal.${s.key}`)}</a></li>
			{/each}
		</ol>
	</nav>

	<!-- 1. Mentions légales -->
	<article id="mentions" class="legal-block">
		<h2>{t(messages, 'legal.mentions_heading')}</h2>
		<p class="block-intro">{t(messages, 'legal.mentions_intro')}</p>
		<dl class="kv">
			<dt>{t(messages, 'legal.mentions_legal_form')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_business_name')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_siret')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_ape')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_vat')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_address')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_director')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>

			<dt>{t(messages, 'legal.mentions_email')}</dt>
			<dd>booking@mariannecottage.fr</dd>

			<dt>{t(messages, 'legal.mentions_phone')}</dt>
			<dd><span class="pending">{pending('legal.pending')}</span></dd>
		</dl>
	</article>

	<!-- 2. Hébergeur -->
	<article id="hosting" class="legal-block">
		<h2>{t(messages, 'legal.hosting_heading')}</h2>
		<p>{t(messages, 'legal.hosting_body')}</p>
	</article>

	<!-- 3. GDPR -->
	<article id="gdpr" class="legal-block">
		<h2>{t(messages, 'legal.gdpr_heading')}</h2>

		<h3>{t(messages, 'legal.gdpr_controller_heading')}</h3>
		<p><span class="pending">{pending('legal.pending')}</span></p>

		<h3>{t(messages, 'legal.gdpr_processing_heading')}</h3>
		<ul class="prose-list">
			<li>{t(messages, 'legal.gdpr_processing_booking')}</li>
			<li>{t(messages, 'legal.gdpr_processing_payment')}</li>
			<li>{t(messages, 'legal.gdpr_processing_email')}</li>
			<li>{t(messages, 'legal.gdpr_processing_maps')}</li>
		</ul>

		<h3>{t(messages, 'legal.gdpr_retention_heading')}</h3>
		<p>{t(messages, 'legal.gdpr_retention_body')}</p>

		<h3>{t(messages, 'legal.gdpr_rights_heading')}</h3>
		<p>{t(messages, 'legal.gdpr_rights_body')}</p>
	</article>

	<!-- 4. Cookies -->
	<article id="cookies" class="legal-block">
		<h2>{t(messages, 'legal.cookies_heading')}</h2>

		<h3>{t(messages, 'legal.cookies_essential_heading')}</h3>
		<p>{t(messages, 'legal.cookies_essential_body')}</p>

		<h3>{t(messages, 'legal.cookies_optional_heading')}</h3>
		<p>{t(messages, 'legal.cookies_optional_body')}</p>

		<p class="muted">{t(messages, 'legal.cookies_change_body')}</p>
	</article>

	<!-- 5. Terms of stay -->
	<article id="terms" class="legal-block">
		<h2>{t(messages, 'legal.terms_heading')}</h2>
		<p>{t(messages, 'legal.terms_intro')}</p>
		<ul class="prose-list">
			<li>{t(messages, 'legal.terms_check_in_out')}</li>
			<li>{t(messages, 'legal.terms_smoking')}</li>
			<li>{t(messages, 'legal.terms_max_guests')}</li>
			<li>{t(messages, 'legal.terms_quiet_hours')}</li>
			<li>
				<strong>{t(messages, 'legal.terms_pets_label')}:</strong>
				<span class="pending">{pending('legal.pending')}</span>
			</li>
			<li>
				<strong>{t(messages, 'legal.terms_damages_label')}:</strong>
				<span class="pending">{pending('legal.pending')}</span>
			</li>
		</ul>

		<h3>{t(messages, 'legal.terms_acceptance_label')}</h3>
		<p>{t(messages, 'legal.terms_acceptance_body')}</p>
	</article>

	<!-- 6. Cancellation policy -->
	<article id="cancellation" class="legal-block">
		<h2>{t(messages, 'legal.cancellation_heading')}</h2>
		<p>{t(messages, 'legal.cancellation_intro')}</p>
		<ul class="prose-list">
			<li>{t(messages, 'legal.cancellation_schedule_14')}</li>
			<li>{t(messages, 'legal.cancellation_schedule_7')}</li>
			<li>{t(messages, 'legal.cancellation_schedule_0')}</li>
		</ul>
		<p class="muted">{t(messages, 'legal.cancellation_note')}</p>
	</article>

	<!-- 7. ODR -->
	<article id="odr" class="legal-block">
		<h2>{t(messages, 'legal.odr_heading')}</h2>
		<p>
			{t(messages, 'legal.odr_body')}
			<a href="https://ec.europa.eu/consumers/odr" rel="noopener" target="_blank">
				https://ec.europa.eu/consumers/odr
			</a>
		</p>
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
		margin: 0 0 0.85rem;
		max-width: 44rem;
	}
	.page-meta { font-size: 0.825rem; color: var(--theme-text-muted); margin: 0; }
	.page-meta .meta-label { font-weight: 600; margin-right: 0.25rem; }

	.toc {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 1rem 1.25rem;
		margin-bottom: 2.5rem;
	}
	.toc-heading {
		font-family: var(--theme-font-display);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--theme-warm);
		margin: 0 0 0.5rem;
	}
	.toc-list {
		list-style: decimal inside;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.3rem;
	}
	@media (min-width: 700px) { .toc-list { grid-template-columns: 1fr 1fr; } }
	.toc-list a { color: var(--theme-accent); text-decoration: none; }
	.toc-list a:hover { text-decoration: underline; }

	.legal-block {
		background: var(--theme-surface);
		border: var(--theme-border-thin);
		border-radius: var(--theme-radius-md);
		padding: 1.5rem;
		margin: 0 0 1.5rem;
		color: var(--theme-text-muted);
		line-height: 1.7;
		scroll-margin-top: 5rem;
	}
	.legal-block h2 {
		font-family: var(--theme-font-display);
		font-size: 1.4rem;
		font-weight: 500;
		color: var(--theme-warm);
		margin: 0 0 0.75rem;
	}
	.legal-block h3 {
		font-family: var(--theme-font-display);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--theme-warm);
		margin: 1.5rem 0 0.4rem;
	}
	.legal-block p { margin: 0 0 0.75rem; }
	.legal-block p:last-child { margin-bottom: 0; }
	.legal-block .block-intro { font-style: italic; }
	.legal-block .muted { font-size: 0.875rem; opacity: 0.85; }

	.prose-list {
		list-style: disc;
		padding-left: 1.4rem;
		margin: 0 0 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.kv {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.45rem 1rem;
		margin: 0.85rem 0 0;
	}
	.kv dt {
		font-weight: 600;
		color: var(--theme-warm);
	}
	.kv dd {
		margin: 0;
	}

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
		vertical-align: middle;
	}
</style>
