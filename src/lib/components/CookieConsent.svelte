<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import type { Locale, Messages } from '$lib/i18n';
	import { getConsent, setConsent, onConsentChange, type ConsentChoice } from '$lib/consent';

	interface Props {
		lang: Locale;
		messages: Messages;
	}

	let { lang, messages }: Props = $props();

	let choice = $state<ConsentChoice | null>(null);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
		choice = getConsent();
		// Subscribe so the banner re-opens when the footer "Cookie preferences"
		// link calls clearConsent(): choice flips back to null and the banner
		// becomes visible again without a page reload.
		return onConsentChange((next) => {
			choice = next;
		});
	});

	function set(value: ConsentChoice) {
		choice = value;
		setConsent(value);
	}

	const visible = $derived(mounted && choice === null);
</script>

{#if visible}
	<div
		class="cookie-banner"
		role="dialog"
		aria-live="polite"
		aria-label={t(messages, 'cookies.title')}
	>
		<div class="cookie-text">
			<strong>{t(messages, 'cookies.title')}</strong>
			<p>
				{t(messages, 'cookies.body')}
				<a href="/legal" hreflang={lang}>{t(messages, 'cookies.learn_more')}</a>
			</p>
		</div>
		<div class="cookie-actions">
			<button type="button" class="btn btn-secondary" onclick={() => set('rejected')}>
				{t(messages, 'cookies.reject')}
			</button>
			<button type="button" class="btn btn-primary" onclick={() => set('accepted')}>
				{t(messages, 'cookies.accept')}
			</button>
		</div>
	</div>
{/if}

<style>
	.cookie-banner {
		position: fixed;
		left: 1rem;
		right: 1rem;
		bottom: 1rem;
		z-index: 1100;
		max-width: 64rem;
		margin: 0 auto;
		padding: 1rem 1.25rem;
		background: var(--color-bg, #ffffff);
		border: 1px solid var(--color-cream-dark, #e6dec7);
		border-radius: 12px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
		font-size: 0.875rem;
		color: var(--color-text, #2b2b2b);
	}

	.cookie-text strong {
		display: block;
		font-weight: 600;
		margin-bottom: 0.2rem;
	}
	.cookie-text p {
		margin: 0;
		line-height: 1.45;
		color: var(--color-text-muted, #5a4a36);
	}
	.cookie-text a {
		color: var(--color-sage, #7a4a2a);
		text-decoration: underline;
		margin-left: 0.25rem;
	}

	.cookie-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.btn {
		padding: 0.55rem 1.1rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		cursor: pointer;
		border: 1px solid transparent;
		font-family: inherit;
	}
	.btn-primary {
		background: var(--color-sage, #7a4a2a);
		color: #ffffff;
		border-color: var(--color-sage, #7a4a2a);
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-secondary {
		background: transparent;
		color: var(--color-text, #2b2b2b);
		border-color: var(--color-cream-dark, #d8cdb8);
	}
	.btn-secondary:hover { background: var(--color-cream, #f6f1e7); }

	@media (max-width: 600px) {
		.cookie-banner {
			grid-template-columns: 1fr;
			padding: 0.85rem 1rem;
		}
		.cookie-actions { justify-content: flex-end; }
	}
</style>
