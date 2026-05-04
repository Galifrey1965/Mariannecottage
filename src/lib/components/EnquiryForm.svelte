<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';
	import Textfield from '@smui/textfield';
	import TextfieldIcon from '@smui/textfield/icon';

	interface Props {
		messages: Messages;
	}

	let { messages }: Props = $props();

	let formData = $state({ name: '', email: '', message: '' });
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

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
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				submitted = true;
				formData = { name: '', email: '', message: '' };
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
		<Textfield
			variant="outlined"
			bind:value={formData.name}
			label={t(messages, 'contact.form.name')}
			required
			style="width: 100%;"
			input$id="name"
			input$autocomplete="name"
		>
			<TextfieldIcon slot="leadingIcon">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
			</TextfieldIcon>
		</Textfield>
	</div>

	<div class="field">
		<Textfield
			variant="outlined"
			bind:value={formData.email}
			label={t(messages, 'contact.form.email')}
			type="email"
			required
			style="width: 100%;"
			input$id="email"
			input$autocomplete="email"
		>
			<TextfieldIcon slot="leadingIcon">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
			</TextfieldIcon>
		</Textfield>
	</div>

	<div class="field">
		<Textfield
			variant="outlined"
			textarea
			bind:value={formData.message}
			label={t(messages, 'contact.form.message')}
			required
			style="width: 100%;"
			input$id="message"
			input$rows={5}
		/>
	</div>

	<button type="submit" class="submit-btn" disabled={isSubmitting}>
		{isSubmitting ? t(messages, 'enquiry_form.sending') : t(messages, 'contact.form.submit')}
	</button>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.alert {
		padding: 1rem;
		border-radius: var(--md-shape-corner-small);
		font-size: 0.875rem;
	}

	.alert-success {
		background-color: var(--color-success-bg);
		border: 1px solid var(--color-success-border);
		color: var(--color-success-text);
	}

	.alert-error {
		background-color: var(--color-error-bg);
		border: 1px solid var(--color-error-border);
		color: var(--color-error-text);
	}

	.field {
		display: flex;
		flex-direction: column;
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
	}

	.submit-btn:hover {
		background: var(--theme-accent-hover);
		border-color: var(--theme-accent-hover);
	}

	.submit-btn:disabled {
		background: var(--color-disabled);
		border-color: var(--color-disabled);
		cursor: not-allowed;
	}
</style>
