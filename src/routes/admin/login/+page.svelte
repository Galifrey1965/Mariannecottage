<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Sign in — Marianne Cottage Admin</title>
</svelte:head>

<div class="login-wrapper">
	<div class="login-card">
		<h2 class="login-title">Admin Sign In</h2>
		<form method="POST" onsubmit={() => (submitting = true)}>
			<label for="email" class="form-label">Email</label>
			<input
				id="email"
				name="email"
				type="email"
				class="form-input"
				autocomplete="email"
				required
			/>

			<label for="password" class="form-label">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				class="form-input"
				autocomplete="current-password"
				required
			/>

			{#if form?.error}
				<p class="error-text">{form.error}</p>
			{/if}

			<button type="submit" disabled={submitting} class="btn-primary full-width">
				{submitting ? 'Signing in...' : 'Sign In'}
			</button>
		</form>
	</div>
</div>

<style>
	.login-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: 1.5rem;
	}
	.login-card {
		width: 100%;
		max-width: 24rem;
		background: var(--color-bg);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
	}
	.login-title {
		font-family: 'Lora', serif;
		text-align: center;
		margin: 0 0 1.5rem;
	}
	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 0.5rem;
	}
	.form-input {
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
	.form-input:focus {
		border-color: var(--color-sage);
		box-shadow: 0 0 0 2px rgba(107, 143, 113, 0.2);
	}
	.error-text {
		font-size: 0.875rem;
		color: var(--color-error-text);
		margin-bottom: 1rem;
	}
	.btn-primary {
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
	.full-width {
		width: 100%;
	}
</style>
