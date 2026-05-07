<script lang="ts">
	import { goto } from '$app/navigation';
	import type { SeasonKind } from '$lib/server/supabase';

	let name = $state('');
	let description = $state('');
	let kind = $state<SeasonKind>('high');
	let rate_per_night = $state<number | ''>('');
	let rate_2_guests = $state<number | ''>('');
	let rate_3_guests = $state<number | ''>('');
	let rate_4_guests = $state<number | ''>('');
	let start_date = $state('');
	let end_date = $state('');

	let submitting = $state(false);
	let formError = $state('');

	async function submit(ev: SubmitEvent) {
		ev.preventDefault();
		submitting = true;
		formError = '';
		try {
			const res = await fetch('/api/admin/seasons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					description: description || null,
					kind,
					rate_per_night,
					rate_2_guests,
					rate_3_guests,
					rate_4_guests,
					start_date,
					end_date
				})
			});
			const result = await res.json();
			if (!result.success) {
				formError = result.error || 'Failed to create season';
				return;
			}
			goto('/admin/seasons');
		} catch {
			formError = 'Network error';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page">
	<header class="page-header">
		<a href="/admin/seasons" class="back-link">← Seasons</a>
		<h2 class="page-title">New season</h2>
	</header>

	<form class="card" onsubmit={submit}>
		<div class="grid">
			<label class="field">
				<span class="label">Name</span>
				<input class="input" type="text" bind:value={name} required maxlength="80" placeholder="e.g. High season 2027" />
			</label>

			<label class="field">
				<span class="label">Description</span>
				<input class="input" type="text" bind:value={description} maxlength="200" />
			</label>

			<label class="field">
				<span class="label">Kind</span>
				<select class="input" bind:value={kind} required>
					<option value="low">Low</option>
					<option value="high">High</option>
					<option value="peak">Peak</option>
				</select>
				<span class="sub">Drives the sidebar grouping. Smallest-span season wins on overlap, so a Peak overlay inside a longer High season takes precedence on its own dates.</span>
			</label>

			<div class="row">
				<label class="field">
					<span class="label">Start date</span>
					<input class="input" type="date" bind:value={start_date} required />
				</label>
				<label class="field">
					<span class="label">End date</span>
					<input class="input" type="date" bind:value={end_date} required />
				</label>
			</div>

			<fieldset class="rates">
				<legend class="label">Per-guest rates (€ / night)</legend>
				<div class="rates-grid">
					<label class="field"><span class="sub">1 guest</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_per_night} required />
					</label>
					<label class="field"><span class="sub">2 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_2_guests} required />
					</label>
					<label class="field"><span class="sub">3 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_3_guests} required />
					</label>
					<label class="field"><span class="sub">4 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_4_guests} required />
					</label>
				</div>
			</fieldset>
		</div>

		{#if formError}<p class="error" role="alert">{formError}</p>{/if}

		<div class="actions">
			<a class="btn-outline" href="/admin/seasons">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
				Cancel
			</a>
			<button class="btn-primary" type="submit" disabled={submitting}>
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
				{submitting ? 'Saving…' : 'Create season'}
			</button>
		</div>
	</form>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px; }
	.page-header { display: flex; flex-direction: column; gap: 0.25rem; }
	.back-link { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: none; }
	.back-link:hover { color: var(--color-sage); }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }

	.card { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
	.grid { display: flex; flex-direction: column; gap: 1rem; }
	.field { display: flex; flex-direction: column; gap: 0.375rem; }
	.label { font-size: 0.875rem; font-weight: 500; color: var(--color-text); }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); }
	.input {
		width: 100%; padding: 0.625rem 0.75rem; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; background: var(--color-bg); color: var(--color-text);
		font-size: 0.875rem; box-sizing: border-box;
	}
	.input:focus { outline: none; border-color: var(--color-sage); box-shadow: 0 0 0 2px rgba(107,143,113,0.2); }

	.row { display: grid; grid-template-columns: 1fr; gap: 1rem; }
	@media (min-width: 600px) { .row { grid-template-columns: 1fr 1fr; } }

	.rates { border: 1px solid var(--color-cream-dark); border-radius: 8px; padding: 1rem; margin: 0; display: flex; flex-direction: column; gap: 0.75rem; }
	.rates legend { padding: 0 0.375rem; }
	.rates-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
	@media (min-width: 600px) { .rates-grid { grid-template-columns: repeat(4, 1fr); } }

	.error { color: var(--color-error-text, #b91c1c); font-size: 0.875rem; margin: 0; }

	.actions { display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-cream-dark); }
	.btn-outline { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border: 1px solid var(--color-cream-dark); border-radius: 9999px; background: transparent; color: var(--color-text); font-size: 0.875rem; text-decoration: none; cursor: pointer; }
	.btn-outline:hover { background: var(--color-cream); }
	.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border: none; border-radius: 9999px; background: var(--color-sage); color: white; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
