<script lang="ts">
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Set your password — Marianne Cottage Admin</title>
</svelte:head>

<div class="wrapper">
	<div class="card">
		<h2 class="title">Set your password</h2>
		<p class="lede">
			{#if data.email}
				Welcome — finish setting up <strong>{data.email}</strong> by choosing a password.
			{:else}
				Welcome — choose a password to finish setting up your admin account.
			{/if}
		</p>

		<form method="POST" onsubmit={() => (submitting = true)}>
			<label for="password" class="label">New password</label>
			<input
				id="password"
				name="password"
				type="password"
				class="input"
				autocomplete="new-password"
				minlength="10"
				required
			/>

			<label for="confirm" class="label">Confirm password</label>
			<input
				id="confirm"
				name="confirm"
				type="password"
				class="input"
				autocomplete="new-password"
				minlength="10"
				required
			/>

			<p class="hint">At least 10 characters.</p>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<button type="submit" disabled={submitting} class="btn-primary">
				{submitting ? 'Saving…' : 'Save password'}
			</button>
		</form>
	</div>
</div>

<style>
	.wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: 1.5rem;
	}
	.card {
		width: 100%;
		max-width: 26rem;
		background: var(--color-bg);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
	}
	.title {
		font-family: 'Lora', serif;
		text-align: center;
		margin: 0 0 0.75rem;
	}
	.lede {
		font-size: 0.9rem;
		color: var(--color-text-muted);
		text-align: center;
		margin: 0 0 1.5rem;
		line-height: 1.5;
	}
	.label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}
	.input {
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.875rem;
		color: var(--color-text);
		background: var(--color-bg);
		outline: none;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
		margin-bottom: 1rem;
	}
	.input:focus {
		border-color: var(--color-sage);
		box-shadow: 0 0 0 2px rgba(107, 143, 113, 0.2);
	}
	.hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}
	.error {
		font-size: 0.875rem;
		color: var(--color-error-text);
		margin: 0 0 1rem;
	}
	.btn-primary {
		width: 100%;
		padding: 0.75rem 1.5rem;
		background: var(--color-sage);
		color: white;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}
	.btn-primary:hover {
		background: var(--color-sage-hover);
	}
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
