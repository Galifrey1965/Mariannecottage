<script lang="ts">
	import type { SiteBanner, SiteBannerType } from '$lib/server/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let banners = $state<SiteBanner[]>(data.banners);
	let editing = $state<Partial<SiteBanner> & { id?: string } | null>(null);
	let saving = $state(false);
	let saveError = $state('');
	let deleting = $state<string | null>(null);

	const TYPES: SiteBannerType[] = ['info', 'construction', 'discount', 'seasonal', 'announcement'];

	function openCreate() {
		editing = {
			type: 'info',
			message_en: '',
			message_fr: '',
			message_de: '',
			enabled: true,
			display_order: 0,
			starts_at: null,
			ends_at: null
		};
		saveError = '';
	}

	function openEdit(b: SiteBanner) {
		editing = { ...b };
		saveError = '';
	}

	function close() {
		editing = null;
		saveError = '';
		saving = false;
	}

	function toLocalInput(iso: string | null | undefined): string {
		// `<input type="datetime-local">` expects "YYYY-MM-DDTHH:MM" without
		// timezone. Convert from ISO-with-Z.
		if (!iso) return '';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	function fromLocalInput(local: string): string | null {
		if (!local) return null;
		const d = new Date(local);
		if (Number.isNaN(d.getTime())) return null;
		return d.toISOString();
	}

	async function save() {
		if (!editing) return;
		saving = true;
		saveError = '';
		try {
			const payload = {
				id: editing.id,
				type: editing.type,
				message_en: (editing.message_en ?? '').trim(),
				message_fr: (editing.message_fr ?? '').trim() || null,
				message_de: (editing.message_de ?? '').trim() || null,
				enabled: !!editing.enabled,
				display_order: Number(editing.display_order ?? 0),
				starts_at: editing.starts_at ?? null,
				ends_at: editing.ends_at ?? null
			};
			const method = editing.id ? 'PATCH' : 'POST';
			const res = await fetch('/api/admin/banners', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				saveError = result.error || `Failed (${res.status})`;
				return;
			}
			const refreshed = await fetch('/api/admin/banners').then((r) => r.json());
			banners = refreshed.banners;
			close();
		} catch (e) {
			saveError = e instanceof Error ? e.message : 'unknown error';
		} finally {
			saving = false;
		}
	}

	async function toggle(b: SiteBanner) {
		const res = await fetch('/api/admin/banners', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: b.id, enabled: !b.enabled })
		});
		const result = await res.json();
		if (res.ok && result.success) {
			banners = banners.map((x) => (x.id === b.id ? result.banner : x));
		}
	}

	async function deleteBanner(b: SiteBanner) {
		if (!confirm(`Delete banner "${b.message_en.slice(0, 40)}…"?`)) return;
		deleting = b.id;
		try {
			const res = await fetch('/api/admin/banners', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: b.id })
			});
			const result = await res.json();
			if (res.ok && result.success) {
				banners = banners.filter((x) => x.id !== b.id);
			}
		} finally {
			deleting = null;
		}
	}

	const TYPE_LABELS: Record<SiteBannerType, string> = {
		info: 'ℹ Info',
		construction: '⚠ Construction',
		discount: '% Discount',
		seasonal: '✦ Seasonal',
		announcement: '📣 Announcement'
	};
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Banners</h2>
			<p class="page-subtitle">
				{banners.filter((b) => b.enabled).length} enabled, {banners.length} total
			</p>
		</div>
		<button class="btn-primary" onclick={openCreate}>New banner</button>
	</div>

	{#if banners.length === 0}
		<p class="empty">No banners yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Message (EN)</th>
						<th>Active</th>
						<th>Order</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each banners as b}
						<tr class:disabled={!b.enabled}>
							<td>{TYPE_LABELS[b.type]}</td>
							<td>
								<button class="row-btn" onclick={() => openEdit(b)}>{b.message_en}</button>
								{#if b.starts_at || b.ends_at}
									<p class="sub">
										{b.starts_at ? new Date(b.starts_at).toLocaleDateString() : '…'}
										→
										{b.ends_at ? new Date(b.ends_at).toLocaleDateString() : '…'}
									</p>
								{/if}
							</td>
							<td>
								<label class="toggle">
									<input type="checkbox" checked={b.enabled} onchange={() => toggle(b)} />
								</label>
							</td>
							<td>{b.display_order}</td>
							<td class="row-actions">
								<button class="link-btn" onclick={() => openEdit(b)}>Edit</button>
								<button
									class="link-btn danger"
									disabled={deleting === b.id}
									onclick={() => deleteBanner(b)}>
									{deleting === b.id ? '…' : 'Delete'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if editing}
	<div class="modal-backdrop" onclick={close} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			<h3 class="modal-title">{editing.id ? 'Edit' : 'New'} banner</h3>

			<label class="form-label" for="b-type">Type</label>
			<select id="b-type" class="form-input" bind:value={editing.type}>
				{#each TYPES as t}
					<option value={t}>{TYPE_LABELS[t]}</option>
				{/each}
			</select>
			<p class="hint">Type drives the colour + icon automatically.</p>

			<label class="form-label" for="b-en">Message (English) *</label>
			<input id="b-en" type="text" class="form-input" bind:value={editing.message_en} maxlength="240" />

			<label class="form-label" for="b-fr">Message (French)</label>
			<input id="b-fr" type="text" class="form-input" bind:value={editing.message_fr} maxlength="240" />

			<label class="form-label" for="b-de">Message (German)</label>
			<input id="b-de" type="text" class="form-input" bind:value={editing.message_de} maxlength="240" />

			<p class="hint">EN is shown if the visitor's locale isn't translated.</p>

			<div class="row-2">
				<div>
					<label class="form-label" for="b-starts">Starts (optional)</label>
					<input
						id="b-starts"
						type="datetime-local"
						class="form-input"
						value={toLocalInput(editing.starts_at)}
						oninput={(e) => (editing!.starts_at = fromLocalInput((e.target as HTMLInputElement).value))}
					/>
				</div>
				<div>
					<label class="form-label" for="b-ends">Ends (optional)</label>
					<input
						id="b-ends"
						type="datetime-local"
						class="form-input"
						value={toLocalInput(editing.ends_at)}
						oninput={(e) => (editing!.ends_at = fromLocalInput((e.target as HTMLInputElement).value))}
					/>
				</div>
			</div>

			<label class="form-label" for="b-order">Display order</label>
			<input id="b-order" type="number" class="form-input" bind:value={editing.display_order} step="1" />

			<label class="form-checkbox">
				<input type="checkbox" bind:checked={editing.enabled} />
				<span>Enabled</span>
			</label>

			{#if saveError}
				<p class="error">{saveError}</p>
			{/if}

			<div class="modal-actions">
				<button type="button" class="btn-link" onclick={close} disabled={saving}>Cancel</button>
				<button type="button" class="btn-primary" onclick={save} disabled={saving}>
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

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 500; color: var(--color-text-muted); background: var(--color-cream); border-bottom: 1px solid var(--color-cream-dark); }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: top; }
	tr:last-child td { border-bottom: none; }
	tr.disabled td { color: var(--color-text-muted); opacity: 0.65; }

	.row-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--color-text); font-weight: 500; font-size: 0.875rem; text-align: left; }
	.row-btn:hover { color: var(--color-sage); text-decoration: underline; }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.125rem 0 0; }

	.toggle { display: inline-flex; align-items: center; cursor: pointer; }

	.row-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
	.link-btn { background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; }
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
	.btn-link { background: none; border: none; padding: 0.625rem 1rem; color: var(--color-text-muted); cursor: pointer; font-size: 0.875rem; }
	.btn-link:hover { color: var(--color-sage); }

	.modal-backdrop {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
		display: flex; align-items: center; justify-content: center;
		padding: 1.5rem; z-index: 1000;
	}
	.modal {
		background: var(--color-bg);
		border-radius: 14px; padding: 1.75rem 2rem;
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

	.row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.form-checkbox { display: flex; align-items: center; gap: 0.6rem; margin-top: 1.25rem; font-size: 0.9rem; cursor: pointer; }
	.form-checkbox input { width: 1.1rem; height: 1.1rem; }

	.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem; }

	.error {
		color: var(--color-error-text, #b91c1c);
		background: var(--color-error-bg, #fee2e2);
		border: 1px solid var(--color-error-border, #fecaca);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		margin: 0.5rem 0;
	}
</style>
