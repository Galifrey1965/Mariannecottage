<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';
	import { clearConsent } from '$lib/consent';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { messages }: Props = $props();

	function reopenCookieBanner() {
		clearConsent();
		// Smooth-scroll to bottom so the re-opened banner is in view; otherwise
		// the footer-clicker stays anchored at the page bottom and the banner
		// is already there, so this is a no-op in practice.
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
		}
	}

	const version: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
	const buildDate: string = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString().slice(0, 10);
</script>

<footer class="footer">
	<div class="footer-inner">
		<div class="footer-row">
			<div class="footer-brand-block">
				<h3 class="footer-brand">Marianne Cottage</h3>
				<p class="footer-tagline">{t(messages, 'footer.tagline')}</p>
			</div>

			<div class="footer-contact-block">
				<h4 class="footer-heading">{t(messages, 'footer.contact')}</h4>
				<div class="footer-contact">
					<p>{t(messages, 'contact.address')}</p>
					<p>{t(messages, 'contact.email')}</p>
					<p>{t(messages, 'contact.phone')}</p>
				</div>
			</div>

			<div class="footer-meta-block">
				<p class="footer-copy">{t(messages, 'footer.copyright')}</p>
				<div class="footer-meta">
					<button type="button" class="cookie-prefs-link" onclick={reopenCookieBanner}>
						{t(messages, 'footer.cookie_preferences')}
					</button>
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
			</div>
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
		padding: 2rem 1rem;
	}

	@media (min-width: 600px) {
		.footer-inner {
			padding: 2rem 1.5rem;
		}
	}

	@media (min-width: 840px) {
		.footer-inner {
			padding: 2.25rem 2rem;
		}
	}

	.footer-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.75rem;
		align-items: start;
	}

	@media (min-width: 720px) {
		.footer-row {
			grid-template-columns: 1.1fr 1fr auto;
			gap: 2.5rem;
		}
	}

	.footer-brand {
		font-family: var(--theme-font-display);
		font-size: 1.35rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		margin: 0 0 0.4rem;
		color: var(--color-footer-text);
	}

	.footer-tagline {
		font-size: 0.875rem;
		font-style: italic;
		color: var(--color-footer-accent);
		margin: 0;
	}

	.footer-heading {
		font-family: var(--theme-font-display);
		font-weight: 500;
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin: 0 0 0.6rem;
		color: var(--color-footer-text);
	}

	.footer-contact {
		font-size: 0.875rem;
		color: var(--color-footer-accent);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.footer-contact p {
		margin: 0;
	}

	.footer-meta-block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	@media (min-width: 720px) {
		.footer-meta-block {
			align-items: flex-end;
			text-align: right;
		}
	}

	.footer-copy {
		font-size: 0.8rem;
		color: var(--color-footer-accent);
		margin: 0;
	}

	.footer-meta {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
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

	/* Plain-button styling so guests can re-open the consent banner —
	   declining once otherwise locks Google Maps off with no UI to revisit. */
	.cookie-prefs-link {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		font-size: 0.8rem;
		color: var(--color-footer-accent);
		opacity: 0.78;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 0.2em;
		transition: opacity 0.2s ease, color 0.2s ease;
	}

	.cookie-prefs-link:hover {
		opacity: 1;
		color: white;
	}
</style>
