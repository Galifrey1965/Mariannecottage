<script lang="ts">
	import type { CancellationPolicy, CancellationPolicySchedule } from '$lib/server/supabase';
	import type { PageData } from './$types';
	import { modalA11y } from '$lib/actions/modal-a11y';

	let { data }: { data: PageData } = $props();

	let policies = $state<CancellationPolicy[]>(data.policies);

	// Edit/create dialog state. `editing.id === null` means "creating".
	let editing = $state<{
		id: string | null;
		name: string;
		description: string;
		schedule: CancellationPolicySchedule[];
		is_default: boolean;
	} | null>(null);
	let saving = $state(false);
	let saveError = $state('');
	let deleting = $state<string | null>(null);
	let deleteError = $state('');

	function previewSchedule(rows: CancellationPolicySchedule[]): string {
		const sorted = [...rows].sort(
			(a, b) => b.days_before_check_in - a.days_before_check_in
		);
		return sorted
			.map((r) => `≥${r.days_before_check_in}d → ${r.refund_pct}%`)
			.join('  ·  ');
	}

	function openCreate() {
		editing = {
			id: null,
			name: '',
			description: '',
			schedule: [
				{ days_before_check_in: 14, refund_pct: 100 },
				{ days_before_check_in: 7, refund_pct: 50 },
				{ days_before_check_in: 0, refund_pct: 0 }
			],
			is_default: false
		};
		saveError = '';
	}

	function openEdit(p: CancellationPolicy) {
		editing = {
			id: p.id,
			name: p.name,
			description: p.description ?? '',
			// Defensive copy so the dialog's edits don't bleed into the row before save.
			schedule: p.schedule.map((s) => ({ ...s })),
			is_default: p.is_default
		};
		saveError = '';
	}

	function close() {
		editing = null;
		saveError = '';
		saving = false;
	}

	function addRow() {
		if (!editing) return;
		editing.schedule = [...editing.schedule, { days_before_check_in: 0, refund_pct: 0 }];
	}

	function removeRow(i: number) {
		if (!editing) return;
		editing.schedule = editing.schedule.filter((_, idx) => idx !== i);
	}

	async function save() {
		if (!editing) return;
		saving = true;
		saveError = '';
		try {
			const payload = {
				id: editing.id ?? undefined,
				name: editing.name.trim(),
				description: editing.description.trim() || null,
				schedule: editing.schedule.map((s) => ({
					days_before_check_in: Number(s.days_before_check_in),
					refund_pct: Number(s.refund_pct)
				})),
				is_default: editing.is_default
			};
			const method = editing.id ? 'PATCH' : 'POST';
			const res = await fetch('/api/admin/cancellation-policies', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				saveError = result.error || `Failed (${res.status})`;
				return;
			}
			// Refresh list.
			const refreshed = await fetch('/api/admin/cancellation-policies').then((r) => r.json());
			policies = refreshed.policies;
			close();
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'unknown error';
		} finally {
			saving = false;
		}
	}

	async function deletePolicy(p: CancellationPolicy) {
		if (!confirm(`Delete the "${p.name}" policy? This is irreversible.`)) return;
		deleting = p.id;
		deleteError = '';
		try {
			const res = await fetch('/api/admin/cancellation-policies', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: p.id })
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				deleteError = `${p.name}: ${result.error || `Failed (${res.status})`}`;
				return;
			}
			policies = policies.filter((x) => x.id !== p.id);
		} finally {
			deleting = null;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Cancellation policies</h2>
			<p class="page-subtitle">
				{policies.length} polic{policies.length === 1 ? 'y' : 'ies'} ·
				{policies.find((p) => p.is_default)?.name ?? 'none'} is default
			</p>
		</div>
		<button class="btn-primary" onclick={openCreate}>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
			New policy
		</button>
	</div>

	{#if deleteError}
		<p class="error-banner">{deleteError}</p>
	{/if}

	{#if policies.length === 0}
		<p class="empty">No cancellation policies yet. Create one to start.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Schedule</th>
						<th>Default</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each policies as p}
						<tr>
							<td>
								<button class="row-btn" onclick={() => openEdit(p)}>{p.name}</button>
								{#if p.description}<p class="sub">{p.description}</p>{/if}
							</td>
							<td class="mono">{previewSchedule(p.schedule)}</td>
							<td>{p.is_default ? '✓' : ''}</td>
							<td class="row-actions">
								<button class="link-btn" onclick={() => openEdit(p)}>
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
									Edit
								</button>
								<button
									class="link-btn danger"
									disabled={deleting === p.id}
									onclick={() => deletePolicy(p)}
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
									{deleting === p.id ? '…' : 'Delete'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<p class="hint">
		Bookings snapshot the policy <em>at booking time</em>, so editing or deleting a policy
		never changes the refund rules for an already-confirmed booking.
	</p>
</div>

{#if editing}
	<div class="modal-backdrop" onclick={close} role="presentation">
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			use:modalA11y={{ onClose: close }}
		>
			<h3 class="modal-title">{editing.id ? 'Edit' : 'New'} cancellation policy</h3>

			<label class="form-label" for="cp-name">Name</label>
			<input id="cp-name" type="text" class="form-input" bind:value={editing.name} />

			<label class="form-label" for="cp-desc">Description (optional)</label>
			<textarea id="cp-desc" class="form-input" rows="2" bind:value={editing.description}></textarea>

			<label class="form-label">Refund schedule</label>
			<p class="hint">
				Walked top-down — the first window where days-before-check-in ≥ threshold wins.
				Always include a <code>days_before_check_in: 0</code> row as the catch-all.
			</p>
			<div class="schedule">
				<div class="schedule-head">
					<span>Days before check-in</span>
					<span>Refund %</span>
					<span></span>
				</div>
				{#each editing.schedule as row, i}
					<div class="schedule-row">
						<input type="number" min="0" step="1" bind:value={row.days_before_check_in} />
						<input type="number" min="0" max="100" step="1" bind:value={row.refund_pct} />
						<button
							type="button"
							class="link-btn danger"
							onclick={() => removeRow(i)}
							disabled={editing.schedule.length === 1}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>
							Remove
						</button>
					</div>
				{/each}
			</div>
			<button type="button" class="link-btn" onclick={addRow}>
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
				Add window
			</button>

			<label class="form-checkbox">
				<input type="checkbox" bind:checked={editing.is_default} />
				<span>Default policy (applied to new bookings)</span>
			</label>

			{#if saveError}
				<p class="error">{saveError}</p>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn-link" onclick={close} disabled={saving}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					Cancel
				</button>
				<button type="button" class="btn-primary" onclick={save} disabled={saving}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page { display: flex; flex-direction: column; gap: 1.5rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.empty { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }
	.hint { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); border-bottom: 1px solid var(--color-sage); letter-spacing: 0.02em; }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: top; }
	tr:last-child td { border-bottom: none; }

	.row-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--color-text); font-weight: 500; font-size: 0.875rem; text-align: left; }
	.row-btn:hover { color: var(--color-sage); text-decoration: underline; }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.125rem 0 0; }
	.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.8125rem; }

	.row-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; text-decoration: none; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.link-btn.danger { color: var(--color-error-text, #b91c1c); }

	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.625rem 1.25rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link { display: inline-flex; align-items: center; gap: 0.4rem; background: none; border: none; padding: 0.625rem 1rem; color: var(--color-text-muted); cursor: pointer; font-size: 0.875rem; }
	.btn-link:hover { color: var(--color-sage); }
	.btn-link:disabled { opacity: 0.5; cursor: not-allowed; }

	.error-banner, .error {
		color: var(--color-error-text, #b91c1c);
		background: var(--color-error-bg, #fee2e2);
		border: 1px solid var(--color-error-border, #fecaca);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}

	.modal-backdrop {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
		display: flex; align-items: center; justify-content: center;
		padding: 1.5rem; z-index: 1000;
	}
	.modal {
		background: var(--color-bg);
		border-radius: 14px;
		padding: 1.75rem 2rem;
		width: 100%; max-width: 36rem;
		max-height: 90vh; overflow-y: auto;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
	}
	.modal-title { margin: 0 0 1rem; font-family: 'Lora', serif; font-size: 1.4rem; }

	.form-label { display: block; font-size: 0.8125rem; font-weight: 500; margin: 1rem 0 0.4rem; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
	.form-input {
		width: 100%; box-sizing: border-box;
		padding: 0.6rem 0.85rem; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; font-family: inherit; font-size: 0.9rem;
		background: var(--color-cream); outline: none;
	}
	.form-input:focus { border-color: var(--color-sage); }

	.schedule { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.5rem; }
	.schedule-head, .schedule-row {
		display: grid; grid-template-columns: 1fr 1fr 5rem; gap: 0.75rem; align-items: center;
	}
	.schedule-head { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.04em; padding: 0 0.25rem; }
	.schedule-row input {
		padding: 0.45rem 0.65rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: 6px; font-family: ui-monospace, monospace; font-size: 0.875rem;
		background: var(--color-cream); outline: none;
	}
	.schedule-row input:focus { border-color: var(--color-sage); }

	.form-checkbox { display: flex; align-items: center; gap: 0.6rem; margin-top: 1.25rem; font-size: 0.9rem; cursor: pointer; }
	.form-checkbox input { width: 1.1rem; height: 1.1rem; }

	.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }

	code { font-family: ui-monospace, monospace; font-size: 0.8125rem; background: var(--color-cream); padding: 0.05rem 0.3rem; border-radius: 3px; }
</style>
