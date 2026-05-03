<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let name = $state(data.plan.name);
	let description = $state(data.plan.description ?? '');
	let rate_per_night = $state<number | ''>(Number(data.plan.rate_per_night));
	let rate_2_guests = $state<number | ''>(Number(data.plan.rate_2_guests));
	let rate_3_guests = $state<number | ''>(Number(data.plan.rate_3_guests));
	let rate_4_guests = $state<number | ''>(Number(data.plan.rate_4_guests));
	let valid_from = $state(data.plan.valid_from);
	let valid_until = $state(data.plan.valid_until);
	let is_active = $state(data.plan.is_active);

	let submitting = $state(false);
	let archiving = $state(false);
	let formError = $state('');

	async function save(ev: SubmitEvent) {
		ev.preventDefault();
		submitting = true;
		formError = '';
		try {
			const res = await fetch('/api/admin/rate-plans', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: data.plan.id,
					name,
					description: description || null,
					rate_per_night,
					rate_2_guests,
					rate_3_guests,
					rate_4_guests,
					valid_from,
					valid_until,
					is_active
				})
			});
			const result = await res.json();
			if (!result.success) {
				formError = result.error || 'Failed to update rate plan';
				return;
			}
			goto('/admin/rate-plans');
		} catch {
			formError = 'Network error';
		} finally {
			submitting = false;
		}
	}

	async function archive() {
		if (!confirm('Archive this rate plan? It will stop being used for new bookings.')) return;
		archiving = true;
		try {
			const res = await fetch('/api/admin/rate-plans', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.plan.id })
			});
			const result = await res.json();
			if (result.success) goto('/admin/rate-plans');
			else formError = result.error || 'Failed to archive';
		} finally {
			archiving = false;
		}
	}
</script>

<div class="page">
	<header class="page-header">
		<a href="/admin/rate-plans" class="back-link">← Rate plans</a>
		<h2 class="page-title">{data.plan.name}</h2>
		{#if !is_active}<span class="archived-pill">Archived</span>{/if}
	</header>

	<form class="card" onsubmit={save}>
		<div class="grid">
			<label class="field">
				<span class="label">Name</span>
				<input class="input" type="text" bind:value={name} required maxlength="80" />
			</label>

			<label class="field">
				<span class="label">Description</span>
				<input class="input" type="text" bind:value={description} maxlength="200" />
			</label>

			<div class="row">
				<label class="field">
					<span class="label">Valid from</span>
					<input class="input" type="date" bind:value={valid_from} required />
				</label>
				<label class="field">
					<span class="label">Valid until</span>
					<input class="input" type="date" bind:value={valid_until} required />
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

			<label class="checkbox">
				<input type="checkbox" bind:checked={is_active} />
				<span>Active (used for new bookings)</span>
			</label>
		</div>

		{#if formError}<p class="error" role="alert">{formError}</p>{/if}

		<div class="actions">
			{#if is_active}
				<button type="button" class="btn-danger" onclick={archive} disabled={archiving}>
					{archiving ? 'Archiving…' : 'Archive'}
				</button>
			{/if}
			<div class="actions-right">
				<a class="btn-outline" href="/admin/rate-plans">Cancel</a>
				<button class="btn-primary" type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : 'Save changes'}
				</button>
			</div>
		</div>
	</form>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 720px; }
	.page-header { display: flex; flex-direction: column; gap: 0.25rem; }
	.back-link { font-size: 0.75rem; color: var(--color-text-muted); text-decoration: none; }
	.back-link:hover { color: var(--color-sage); }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.archived-pill {
		display: inline-block; align-self: flex-start;
		padding: 0.125rem 0.625rem; background: var(--color-cream); color: var(--color-text-muted);
		border-radius: 9999px; font-size: 0.75rem; font-weight: 500;
	}

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

	.checkbox { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; }

	.error { color: var(--color-error-text, #b91c1c); font-size: 0.875rem; margin: 0; }

	.actions { display: flex; justify-content: space-between; gap: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--color-cream-dark); }
	.actions-right { display: flex; gap: 0.75rem; margin-left: auto; }
	.btn-outline { padding: 0.625rem 1.25rem; border: 1px solid var(--color-cream-dark); border-radius: 9999px; background: transparent; color: var(--color-text); font-size: 0.875rem; text-decoration: none; cursor: pointer; }
	.btn-outline:hover { background: var(--color-cream); }
	.btn-primary { padding: 0.625rem 1.25rem; border: none; border-radius: 9999px; background: var(--color-sage); color: white; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled, .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-danger { padding: 0.625rem 1.25rem; border: 1px solid var(--color-error-text, #b91c1c); border-radius: 9999px; background: transparent; color: var(--color-error-text, #b91c1c); font-size: 0.875rem; cursor: pointer; }
	.btn-danger:hover { background: var(--color-error-bg); }
</style>
