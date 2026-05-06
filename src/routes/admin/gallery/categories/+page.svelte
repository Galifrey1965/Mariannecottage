<script lang="ts">
	import type { PageData } from './$types';

	type CategoryRow = PageData['categories'][number];

	let { data }: { data: PageData } = $props();

	let categories = $state<CategoryRow[]>(data.categories);
	let editing = $state<Partial<CategoryRow> & { id?: string } | null>(null);
	let saving = $state(false);
	let saveError = $state('');
	let translating = $state(false);

	function openCreate() {
		editing = { slug: '', label_en: '', label_fr: '', label_de: '', sort_order: 0 };
		saveError = '';
	}
	function openEdit(c: CategoryRow) {
		editing = { ...c };
		saveError = '';
	}
	function close() {
		editing = null;
		saveError = '';
		saving = false;
	}

	async function translate() {
		if (!editing?.label_en?.trim()) return;
		translating = true;
		try {
			const res = await fetch('/api/admin/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: editing.label_en })
			});
			const out = await res.json();
			if (out.fr) editing.label_fr = out.fr;
			if (out.de) editing.label_de = out.de;
		} finally {
			translating = false;
		}
	}

	async function save() {
		if (!editing) return;
		saving = true;
		saveError = '';
		try {
			const method = editing.id ? 'PATCH' : 'POST';
			const res = await fetch('/api/admin/gallery/categories', {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: editing.id,
					slug: editing.slug,
					label_en: editing.label_en,
					label_fr: editing.label_fr,
					label_de: editing.label_de,
					sort_order: Number(editing.sort_order ?? 0)
				})
			});
			const out = await res.json();
			if (!out.success) {
				saveError = out.error ?? 'Save failed.';
				return;
			}
			const refreshed = await fetch('/api/admin/gallery/categories').then((r) => r.json());
			categories = refreshed.categories;
			close();
		} finally {
			saving = false;
		}
	}

	async function deleteCategory(c: CategoryRow) {
		if (c.image_count > 0) {
			alert(`Can't delete — ${c.image_count} image(s) still reference this category.`);
			return;
		}
		if (!confirm(`Delete category "${c.label_en}"?`)) return;
		const res = await fetch('/api/admin/gallery/categories', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: c.id })
		});
		const out = await res.json();
		if (out.success) {
			categories = categories.filter((x) => x.id !== c.id);
		} else {
			alert(out.error ?? 'Delete failed.');
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Gallery categories</h2>
			<p class="page-subtitle">{categories.length} categories · drag-bar order on the public gallery is taken from here</p>
		</div>
		<div class="header-actions">
			<a href="/admin/gallery" class="btn-link">← Back to gallery</a>
			<button class="btn-primary" onclick={openCreate}>New category</button>
		</div>
	</div>

	{#if categories.length === 0}
		<p class="empty">No categories yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Slug</th>
						<th>English</th>
						<th>French</th>
						<th>German</th>
						<th>Order</th>
						<th>Photos</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each categories as c}
						<tr>
							<td><code class="slug">{c.slug}</code></td>
							<td>{c.label_en}</td>
							<td>{c.label_fr}</td>
							<td>{c.label_de}</td>
							<td>{c.sort_order}</td>
							<td>{c.image_count}</td>
							<td class="row-actions">
								<button class="link-btn" onclick={() => openEdit(c)}>Edit</button>
								<button class="link-btn danger" disabled={c.image_count > 0} onclick={() => deleteCategory(c)} title={c.image_count > 0 ? 'Has photos — cannot delete' : 'Delete'}>Delete</button>
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
			<h3 class="modal-title">{editing.id ? 'Edit' : 'New'} category</h3>

			<label class="form-label" for="c-slug">Slug *</label>
			<input id="c-slug" type="text" class="form-input" bind:value={editing.slug} placeholder="e.g. garden" />
			<p class="hint">Lowercase, no spaces. Used internally — don't change once images are using it.</p>

			<div class="form-row">
				<label class="form-label" for="c-en">Label (English) *</label>
				<button type="button" class="link-btn" onclick={translate} disabled={!editing.label_en?.trim() || translating}>
					{translating ? 'Translating…' : '↻ Translate'}
				</button>
			</div>
			<input id="c-en" type="text" class="form-input" bind:value={editing.label_en} />

			<label class="form-label" for="c-fr">Label (French) *</label>
			<input id="c-fr" type="text" class="form-input" bind:value={editing.label_fr} />

			<label class="form-label" for="c-de">Label (German) *</label>
			<input id="c-de" type="text" class="form-input" bind:value={editing.label_de} />

			<label class="form-label" for="c-order">Sort order</label>
			<input id="c-order" type="number" class="form-input" bind:value={editing.sort_order} step="1" />
			<p class="hint">Lower numbers appear first in the public filter bar. Existing categories use 10, 20, 30… so leave gaps for inserts.</p>

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
	.page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }
	.header-actions { display: flex; gap: 0.5rem; align-items: center; }
	.empty { color: var(--color-text-muted); font-size: 0.875rem; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.7rem 1rem; font-weight: 600; color: white; background: var(--color-sage); border-bottom: 1px solid var(--color-sage); }
	td { padding: 0.7rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: middle; }
	tr:last-child td { border-bottom: none; }

	.slug { font-family: ui-monospace, monospace; font-size: 0.78rem; background: var(--color-cream); padding: 0.1rem 0.4rem; border-radius: 4px; }
	.row-actions { text-align: right; white-space: nowrap; display: flex; gap: 0.7rem; justify-content: flex-end; }

	.link-btn { background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.link-btn.danger { color: var(--color-error-text, #b91c1c); }

	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.6rem 1.2rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link { background: none; border: none; padding: 0.45rem 0.85rem; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; text-decoration: none; }
	.btn-link:hover { text-decoration: underline; }

	.modal-backdrop {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
		display: flex; align-items: center; justify-content: center;
		padding: 1.5rem; z-index: 1000;
	}
	.modal {
		background: var(--color-bg);
		border-radius: 14px; padding: 1.6rem 1.75rem;
		width: 100%; max-width: 32rem;
		max-height: 90vh; overflow-y: auto;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
	}
	.modal-title { margin: 0 0 0.85rem; font-family: 'Lora', serif; font-size: 1.35rem; }

	.form-label { display: block; font-size: 0.8125rem; font-weight: 500; margin: 0.85rem 0 0.35rem; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
	.form-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
	.form-input {
		width: 100%; box-sizing: border-box;
		padding: 0.55rem 0.85rem; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; font-family: inherit; font-size: 0.9rem;
		background: var(--color-cream); outline: none;
	}
	.form-input:focus { border-color: var(--color-sage); }

	.hint { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.3rem 0 0; }
	.error {
		color: var(--color-error-text, #b91c1c);
		background: var(--color-error-bg, #fee2e2);
		border: 1px solid var(--color-error-border, #fecaca);
		padding: 0.55rem 0.85rem; border-radius: 8px; font-size: 0.85rem;
		margin: 0.85rem 0 0;
	}

	.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
</style>
