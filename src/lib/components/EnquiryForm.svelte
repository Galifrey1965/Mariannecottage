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
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
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
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>
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
		border-radius: 8px;
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
		padding: 0.75rem 1.5rem;
		background-color: var(--color-sage);
		color: white;
		font-weight: 600;
		font-size: 1rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.submit-btn:hover {
		background-color: var(--color-sage-hover);
	}

	.submit-btn:disabled {
		background-color: var(--color-disabled);
		cursor: not-allowed;
	}
</style>
