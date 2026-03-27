<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';
	import AiHelpFabs from './AiHelpFabs.svelte';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	const version: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
	const buildDate: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString().slice(0, 10);
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-grid">
			<div>
				<h3 class="footer-brand">Marianne Cottage</h3>
				<p class="footer-tagline">{t(messages, 'footer.tagline')}</p>
				<AiHelpFabs {messages} />
			</div>

			<div>
				<h4 class="footer-heading">{t(messages, 'footer.contact')}</h4>
				<div class="footer-contact">
					<p>{t(messages, 'contact.address')}</p>
					<p>{t(messages, 'contact.email')}</p>
					<p>{t(messages, 'contact.phone')}</p>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<p>{t(messages, 'footer.copyright')}</p>
			<div class="footer-meta">
				<a
					href="https://github.com/Galifrey1965/Mariannecottage/releases"
					target="_blank"
					rel="noopener"
					class="version-link"
					aria-label="{t(messages, 'footer.version')} v{version} — {buildDate}"
				>v{version} · {buildDate}</a>
				<a
					href="https://app.netlify.com/projects/mariannecottage/deploys"
					target="_blank"
					rel="noopener"
					class="netlify-badge"
					aria-label="Netlify deploy status"
				>
					<img
						src="https://api.netlify.com/api/v1/badges/6e4b6de3-6fb1-4867-840e-91b4dda71dbc/deploy-status"
						alt="Netlify Status"
						width="100"
						height="20"
					/>
				</a>
			</div>
			<a href="https://github.com/Galifrey1965/Mariannecottage/issues/new" target="_blank" rel="noopener" class="report-issue">
				{t(messages, 'footer.report_issue')}
			</a>
		</div>
	</div>
</footer>

<style>
	.footer {
		background-color: var(--color-footer-bg);
		color: var(--color-footer-text);
		margin-top: 4rem;
		position: relative;
		z-index: 10;
	}

	.footer-inner {
		max-width: 1440px;
		margin: 0 auto;
		padding: 3rem 1rem;
	}

	@media (min-width: 600px) {
		.footer-inner {
			padding: 3rem 1.5rem;
		}
	}

	@media (min-width: 840px) {
		.footer-inner {
			padding: 3rem 2rem;
		}
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	@media (min-width: 840px) {
		.footer-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.footer-brand {
		font-family: 'Lora', serif;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--color-footer-text);
	}

	@media (min-width: 600px) {
		.footer-brand {
			font-size: 1.5rem;
		}
	}

	.footer-tagline {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--color-footer-accent);
		margin: 0;
	}

	.footer-heading {
		font-weight: 600;
		margin: 0 0 1rem;
		color: var(--color-footer-text);
	}

.footer-contact {
		font-size: 0.875rem;
		color: var(--color-footer-accent);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.footer-contact p {
		margin: 0;
	}

	.footer-bottom {
		border-top: 1px solid var(--color-footer-border);
		padding-top: 2rem;
		text-align: center;
	}

	.footer-bottom p {
		font-size: 0.875rem;
		color: var(--color-footer-accent);
		margin: 0;
	}

	.footer-meta {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.netlify-badge {
		display: inline-flex;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.netlify-badge:hover {
		opacity: 1;
	}

	.version-link {
		display: inline-block;
		font-size: 0.75rem;
		font-family: monospace;
		color: var(--color-footer-accent);
		text-decoration: none;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.version-link:hover {
		opacity: 1;
		color: white;
	}

	.report-issue {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		color: var(--color-footer-accent);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}

	.report-issue:hover {
		opacity: 1;
		color: white;
	}
</style>
