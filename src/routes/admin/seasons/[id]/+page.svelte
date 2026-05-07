<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { SeasonKind } from '$lib/server/supabase';

	let { data }: { data: PageData } = $props();

	let name = $state(data.season.name);
	let description = $state(data.season.description ?? '');
	let kind = $state<SeasonKind>(data.season.kind);
	let rate_per_night = $state<number | ''>(Number(data.season.rate_per_night));
	let rate_2_guests = $state<number | ''>(Number(data.season.rate_2_guests));
	let rate_3_guests = $state<number | ''>(Number(data.season.rate_3_guests));
	let rate_4_guests = $state<number | ''>(Number(data.season.rate_4_guests));
	// Non-refundable rates — null on the row maps to '' in the form so
	// the input renders empty. Keep the all-or-none rule on save.
	const initialNonref = (v: number | null | undefined): number | '' =>
		v === null || v === undefined ? '' : Number(v);
	let rate_per_night_nonref = $state<number | ''>(initialNonref(data.season.rate_per_night_nonref));
	let rate_2_guests_nonref = $state<number | ''>(initialNonref(data.season.rate_2_guests_nonref));
	let rate_3_guests_nonref = $state<number | ''>(initialNonref(data.season.rate_3_guests_nonref));
	let rate_4_guests_nonref = $state<number | ''>(initialNonref(data.season.rate_4_guests_nonref));
	let start_date = $state(data.season.start_date);
	let end_date = $state(data.season.end_date);
	let is_active = $state(data.season.is_active);

	let submitting = $state(false);
	let archiving = $state(false);
	let formError = $state('');

	const nonrefValues = $derived([rate_per_night_nonref, rate_2_guests_nonref, rate_3_guests_nonref, rate_4_guests_nonref]);
	const nonrefSetCount = $derived(nonrefValues.filter((v) => v !== '' && v !== null).length);
	const nonrefAllOrNone = $derived(nonrefSetCount === 0 || nonrefSetCount === 4);

	async function save(ev: SubmitEvent) {
		ev.preventDefault();
		if (!nonrefAllOrNone) {
			formError = 'Non-refundable rates must be all set or all empty.';
			return;
		}
		submitting = true;
		formError = '';
		try {
			const nonrefPayload = nonrefSetCount === 4 ? {
				rate_per_night_nonref,
				rate_2_guests_nonref,
				rate_3_guests_nonref,
				rate_4_guests_nonref
			} : {
				rate_per_night_nonref: null,
				rate_2_guests_nonref: null,
				rate_3_guests_nonref: null,
				rate_4_guests_nonref: null
			};
			const res = await fetch('/api/admin/seasons', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: data.season.id,
					name,
					description: description || null,
					kind,
					rate_per_night,
					rate_2_guests,
					rate_3_guests,
					rate_4_guests,
					...nonrefPayload,
					start_date,
					end_date,
					is_active
				})
			});
			const result = await res.json();
			if (!result.success) {
				formError = result.error || 'Failed to update season';
				return;
			}
			goto('/admin/seasons');
		} catch {
			formError = 'Network error';
		} finally {
			submitting = false;
		}
	}

	async function archive() {
		if (!confirm('Archive this season? Dates inside it will close on the public calendar.')) return;
		archiving = true;
		try {
			const res = await fetch('/api/admin/seasons', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: data.season.id })
			});
			const result = await res.json();
			if (result.success) goto('/admin/seasons');
			else formError = result.error || 'Failed to archive';
		} finally {
			archiving = false;
		}
	}
</script>

<div class="page">
	<header class="page-header">
		<a href="/admin/seasons" class="back-link">← Seasons</a>
		<h2 class="page-title">{data.season.name}</h2>
		{#if !is_active}<span class="archived-pill">Archived</span>{/if}
		{#if !data.season.reviewed_by_admin}
			<span class="review-pill">Review pending — confirm dates and prices, save to clear.</span>
		{/if}
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

			<label class="field">
				<span class="label">Kind</span>
				<select class="input" bind:value={kind} required>
					<option value="low">Low</option>
					<option value="high">High</option>
					<option value="peak">Peak</option>
				</select>
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
				<legend class="label">Refundable rates (€ / night)</legend>
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

			<fieldset class="rates">
				<legend class="label">Non-refundable rates (€ / night) — optional</legend>
				<p class="sub">Leave all four blank to skip the non-refundable plan for this season. If any are set, all four must be set.</p>
				<div class="rates-grid">
					<label class="field"><span class="sub">1 guest</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_per_night_nonref} />
					</label>
					<label class="field"><span class="sub">2 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_2_guests_nonref} />
					</label>
					<label class="field"><span class="sub">3 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_3_guests_nonref} />
					</label>
					<label class="field"><span class="sub">4 guests</span>
						<input class="input" type="number" min="0" step="0.01" bind:value={rate_4_guests_nonref} />
					</label>
				</div>
				{#if !nonrefAllOrNone}
					<p class="error">Set all four or leave all four empty.</p>
				{/if}
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
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
					{archiving ? 'Archiving…' : 'Archive'}
				</button>
			{/if}
			<div class="actions-right">
				<a class="btn-outline" href="/admin/seasons">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					Cancel
				</a>
				<button class="btn-primary" type="submit" disabled={submitting}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
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
	.review-pill {
		display: inline-block; align-self: flex-start;
		padding: 0.25rem 0.75rem; background: #fef3c7; color: #78350f;
		border-radius: 8px; font-size: 0.75rem; font-weight: 500;
		border: 1px solid #fbbf24;
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
	.btn-outline { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border: 1px solid var(--color-cream-dark); border-radius: 9999px; background: transparent; color: var(--color-text); font-size: 0.875rem; text-decoration: none; cursor: pointer; }
	.btn-outline:hover { background: var(--color-cream); }
	.btn-primary { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border: none; border-radius: 9999px; background: var(--color-sage); color: white; font-weight: 600; font-size: 0.875rem; cursor: pointer; }
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled, .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-danger { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.625rem 1.25rem; border: 1px solid var(--color-error-text, #b91c1c); border-radius: 9999px; background: transparent; color: var(--color-error-text, #b91c1c); font-size: 0.875rem; cursor: pointer; }
	.btn-danger:hover { background: var(--color-error-bg); }
</style>
