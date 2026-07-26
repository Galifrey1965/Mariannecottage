<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { t, formatDate } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		messages: Messages;
		lang?: Locale;
	}

	let { messages, lang = 'en' }: Props = $props();

	// `website` is the anti-bot honeypot — never filled in by a human, since it
	// is positioned off-screen and hidden from assistive tech.
	let formData = $state({ name: '', email: '', message: '', website: '' });
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	// Anti-bot timestamp token, fetched on mount and posted back with the
	// enquiry so the server can apply a fill-time floor. Null is fine — the
	// server treats a missing token as genuine rather than punishing visitors
	// for a failure on our side.
	let formToken = $state<string | null>(null);

	onMount(async () => {
		try {
			const res = await fetch('/api/contact/token');
			if (res.ok) formToken = (await res.json()).token ?? null;
		} catch {
			// Swallowed deliberately; see above.
		}
	});

	// Pre-fill the message when arriving from an orphan-day click on the
	// booking calendar. The /book page passes ?date=YYYY-MM-DD on the link
	// so the guest doesn't have to retype which night they meant.
	onMount(() => {
		const dateParam = page.url.searchParams.get('date');
		if (!dateParam) return;
		const [y, m, d] = dateParam.split('-').map(Number);
		if (!y || !m || !d) return;
		const dateObj = new Date(y, m - 1, d);
		const dateLabel = formatDate(lang, dateObj, {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
		formData.message = t(messages, 'contact.form.prefill_orphan', { date: dateLabel });
	});

	async function handleSubmit() {
		if (!formData.name || !formData.email || !formData.message) {
			error = t(messages, 'enquiry_form.all_fields_required');
			return;
		}

		isSubmitting = true;
		error = '';

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...formData, token: formToken })
			});

			if (response.ok) {
				submitted = true;
				formData = { name: '', email: '', message: '', website: '' };
				setTimeout(() => (submitted = false), 5000);
			} else {
				error = t(messages, 'contact.form.error');
			}
		} catch {
			error = t(messages, 'contact.form.error');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form onsubmit={e => { e.preventDefault(); handleSubmit(); }} class="form">
	{#if submitted}
		<div class="alert alert-success" role="status" aria-live="polite">
			{t(messages, 'contact.form.success')}
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error" role="alert">
			{error}
		</div>
	{/if}

	<div class="field">
		<label for="enq-name" class="label">{t(messages, 'contact.form.name')}</label>
		<div class="input-wrap">
			<svg class="leading-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
			<input
				id="enq-name"
				name="name"
				type="text"
				autocomplete="name"
				required
				bind:value={formData.name}
				class="input has-icon"
			/>
		</div>
	</div>

	<div class="field">
		<label for="enq-email" class="label">{t(messages, 'contact.form.email')}</label>
		<div class="input-wrap">
			<svg class="leading-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
			<input
				id="enq-email"
				name="email"
				type="email"
				autocomplete="email"
				required
				bind:value={formData.email}
				class="input has-icon"
			/>
		</div>
	</div>

	<div class="field">
		<label for="enq-message" class="label">{t(messages, 'contact.form.message')}</label>
		<textarea
			id="enq-message"
			name="message"
			rows="5"
			required
			bind:value={formData.message}
			class="input textarea"
		></textarea>
	</div>

	<!-- Anti-bot honeypot: hidden from humans, irresistible to form bots.
	     Any value submitted here flags the enquiry as spam server-side.
	     Deliberately not translated — no human ever reads this label.

	     Kept last on purpose. Placed before the real fields it shifts the DOM
	     order of the visible inputs, which breaks positional selectors and gives
	     browser autofill a URL-shaped field to aim at before it reaches Name. -->
	<div class="honeypot" aria-hidden="true">
		<label for="enq-website">Website</label>
		<input
			id="enq-website"
			name="website"
			type="text"
			tabindex="-1"
			autocomplete="off"
			bind:value={formData.website}
		/>
	</div>

	<button type="submit" class="submit-btn" disabled={isSubmitting}>
		<!-- Lucide "send" (ISC) — https://lucide.dev/icons/send -->
		<svg class="submit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
			<path d="m21.854 2.147-10.94 10.939"/>
		</svg>
		<span>{isSubmitting ? t(messages, 'enquiry_form.sending') : t(messages, 'contact.form.submit')}</span>
	</button>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.alert {
		padding: 0.875rem 1rem;
		border-radius: var(--theme-radius-md, 0.5rem);
		font-size: 0.875rem;
	}
	.alert-success {
		background-color: var(--color-success-bg, #e9f3ea);
		border: 1px solid var(--color-success-border, #b9d8bd);
		color: var(--color-success-text, #2d5a35);
	}
	.alert-error {
		background-color: var(--color-error-bg, #f6e4e4);
		border: 1px solid var(--color-error-border, #d8b9b9);
		color: var(--color-error-text, #7a2a2a);
	}

	/* Off-screen rather than display:none — some bots skip hidden inputs, which
	   would defeat the point. aria-hidden + tabindex="-1" on the markup keep it
	   away from screen readers and keyboard users: a bot filter must not become
	   an accessibility trap. */
	.honeypot {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.label {
		font-size: 0.78rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--theme-warm);
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.leading-icon {
		position: absolute;
		left: 0.85rem;
		color: var(--theme-text-muted, #6b5a48);
		pointer-events: none;
	}

	.input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.75rem 1rem;
		font-family: var(--theme-font-body, inherit);
		font-size: 0.95rem;
		color: var(--theme-text, #222);
		background: var(--theme-bg, #fff);
		border: 1px solid var(--theme-border, #d8cdb8);
		border-radius: var(--theme-radius-md, 0.5rem);
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	.input.has-icon {
		padding-left: 2.5rem;
	}
	.input:focus {
		outline: none;
		border-color: var(--theme-accent, #7a4a2a);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-accent, #7a4a2a) 18%, transparent);
	}
	.textarea {
		resize: vertical;
		min-height: 6.5rem;
		line-height: 1.45;
		font-family: var(--theme-font-body, inherit);
	}

	.submit-btn {
		width: 100%;
		padding: 0.95rem 1.5rem;
		background: var(--theme-accent);
		color: var(--theme-bg);
		font-family: var(--theme-font-body);
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		border: 1px solid var(--theme-accent);
		border-radius: var(--theme-radius-pill);
		cursor: pointer;
		transition: background 0.25s ease, border-color 0.25s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.55rem;
	}
	.submit-icon { flex-shrink: 0; }
	.submit-btn:hover {
		background: var(--theme-accent-hover);
		border-color: var(--theme-accent-hover);
	}
	.submit-btn:disabled {
		background: var(--color-disabled, #c9c1b4);
		border-color: var(--color-disabled, #c9c1b4);
		cursor: not-allowed;
	}
</style>
