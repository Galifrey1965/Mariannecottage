<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

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
		<div class="alert alert-success">
			{t(messages, 'contact.form.success')}
		</div>
	{/if}

	{#if error}
		<div class="alert alert-error">
			{error}
		</div>
	{/if}

	<div class="field">
		<label for="name">{t(messages, 'contact.form.name')}</label>
		<input type="text" id="name" bind:value={formData.name} required />
	</div>

	<div class="field">
		<label for="email">{t(messages, 'contact.form.email')}</label>
		<input type="email" id="email" bind:value={formData.email} required />
	</div>

	<div class="field">
		<label for="message">{t(messages, 'contact.form.message')}</label>
		<textarea id="message" bind:value={formData.message} rows="5" required></textarea>
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
		background-color: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
	}

	.alert-error {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.field input,
	.field textarea {
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		font-family: inherit;
		font-size: 1rem;
		color: var(--color-text);
		background-color: white;
		outline: none;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
		box-sizing: border-box;
	}

	.field input:focus,
	.field textarea:focus {
		border-color: var(--color-sage);
		box-shadow: 0 0 0 2px rgba(107, 143, 113, 0.2);
	}

	.field textarea {
		resize: none;
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
		background-color: #9ca3af;
		cursor: not-allowed;
	}
</style>
