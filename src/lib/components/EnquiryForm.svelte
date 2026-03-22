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
			error = 'All fields are required';
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

<form onsubmit={e => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
	{#if submitted}
		<div class="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
			{t(messages, 'contact.form.success')}
		</div>
	{/if}

	{#if error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
			{error}
		</div>
	{/if}

	<div>
		<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
			{t(messages, 'contact.form.name')}
		</label>
		<input
			type="text"
			id="name"
			bind:value={formData.name}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
			required
		/>
	</div>

	<div>
		<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
			{t(messages, 'contact.form.email')}
		</label>
		<input
			type="email"
			id="email"
			bind:value={formData.email}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
			required
		/>
	</div>

	<div>
		<label for="message" class="block text-sm font-medium text-gray-700 mb-1">
			{t(messages, 'contact.form.message')}
		</label>
		<textarea
			id="message"
			bind:value={formData.message}
			rows="5"
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition resize-none"
			required
		/>
	</div>

	<button
		type="submit"
		disabled={isSubmitting}
		class="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
	>
		{isSubmitting ? 'Sending...' : t(messages, 'contact.form.submit')}
	</button>
</form>
