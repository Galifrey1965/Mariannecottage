<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-grid">
			<div>
				<h3 class="footer-brand">Marianne Cottage</h3>
				<p class="footer-tagline">{t(messages, 'footer.tagline')}</p>
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
		</div>
	</div>
</footer>

<style>
	.footer {
		background-color: var(--color-footer-bg);
		color: var(--color-footer-text);
		margin-top: 4rem;
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
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--color-footer-text);
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
</style>
