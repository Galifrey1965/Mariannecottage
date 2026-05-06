<script lang="ts">
	import type { PageData } from './$types';
	import type { GalleryImage, GalleryCategory, Room } from '$lib/server/gallery';
	import { modalA11y } from '$lib/actions/modal-a11y';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';

	let { data }: { data: PageData } = $props();

	let images = $state<GalleryImage[]>(data.images);
	let categories = $state<GalleryCategory[]>(data.categories);
	let rooms = $state<Room[]>(data.rooms);

	// Filter by category in the admin grid (defaults to "all"). Doesn't affect
	// what's saved — just collapses the working set when there are dozens of
	// photos.
	let filterCategoryId = $state<string>('');

	const filteredImages = $derived(
		filterCategoryId === ''
			? images
			: images.filter((i) => i.category_id === filterCategoryId)
	);

	// Editor / uploader state.
	let editing = $state<GalleryImage | null>(null);
	let uploading = $state(false);
	let uploadError = $state('');
	let uploadProgress = $state(0); // 0..1

	// Pending new upload (after file picked, before save).
	let pendingFile = $state<File | null>(null);
	let pendingPreviewUrl = $state<string>('');
	let pendingForm = $state({
		category_id: '',
		room_id: '',
		alt_en: '',
		alt_fr: '',
		alt_de: ''
	});

	let translatingNew = $state(false);
	let translatingEdit = $state(false);

	function resetPending() {
		pendingFile = null;
		if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
		pendingPreviewUrl = '';
		pendingForm = { category_id: '', room_id: '', alt_en: '', alt_fr: '', alt_de: '' };
		uploadError = '';
	}

	function pickFile(file: File) {
		const allowed = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowed.includes(file.type)) {
			uploadError = `Unsupported format: ${file.type || 'unknown'}. Use JPG, PNG or WebP.`;
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			uploadError = 'File too large (max 10 MB).';
			return;
		}
		pendingFile = file;
		if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
		pendingPreviewUrl = URL.createObjectURL(file);
		// Default category: whatever the filter is set to, else first category.
		pendingForm.category_id = filterCategoryId || categories[0]?.id || '';
		uploadError = '';
	}

	function onFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0];
		if (f) pickFile(f);
		input.value = '';
	}

	function onDropZoneDrag(e: DragEvent) {
		e.preventDefault();
	}

	function onDropZoneDrop(e: DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer?.files?.[0];
		if (f) pickFile(f);
	}

	async function translateNew() {
		const text = pendingForm.alt_en.trim();
		if (!text) return;
		translatingNew = true;
		try {
			const res = await fetch('/api/admin/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			const out = await res.json();
			if (out.fr) pendingForm.alt_fr = out.fr;
			if (out.de) pendingForm.alt_de = out.de;
		} finally {
			translatingNew = false;
		}
	}

	async function uploadPending() {
		if (!pendingFile) return;
		if (!pendingForm.category_id) {
			uploadError = 'Pick a category.';
			return;
		}
		if (!pendingForm.alt_en.trim()) {
			uploadError = 'English alt text is required.';
			return;
		}
		uploading = true;
		uploadProgress = 0;
		uploadError = '';
		try {
			const fd = new FormData();
			fd.append('file', pendingFile);
			fd.append('category_id', pendingForm.category_id);
			fd.append('room_id', pendingForm.room_id);
			fd.append('alt_en', pendingForm.alt_en);
			fd.append('alt_fr', pendingForm.alt_fr);
			fd.append('alt_de', pendingForm.alt_de);

			// XHR for upload progress (fetch doesn't support it natively).
			const result = await new Promise<{ success?: boolean; error?: string }>((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open('POST', '/api/admin/gallery');
				xhr.upload.onprogress = (ev) => {
					if (ev.lengthComputable) uploadProgress = ev.loaded / ev.total;
				};
				xhr.onload = () => {
					try {
						resolve(JSON.parse(xhr.responseText));
					} catch {
						reject(new Error(`HTTP ${xhr.status}`));
					}
				};
				xhr.onerror = () => reject(new Error('network error'));
				xhr.send(fd);
			});

			if (!result.success) {
				uploadError = result.error ?? 'Upload failed.';
				return;
			}

			// Refresh list from server so we get the canonical row + URLs.
			const refreshed = await fetch('/api/admin/gallery').then((r) => r.json());
			images = refreshed.images;
			resetPending();
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'upload failed';
		} finally {
			uploading = false;
			uploadProgress = 0;
		}
	}

	function openEdit(img: GalleryImage) {
		editing = { ...img };
	}
	function closeEdit() {
		editing = null;
	}

	async function translateEdit() {
		if (!editing) return;
		const text = editing.alt_en.trim();
		if (!text) return;
		translatingEdit = true;
		try {
			const res = await fetch('/api/admin/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			const out = await res.json();
			if (out.fr) editing.alt_fr = out.fr;
			if (out.de) editing.alt_de = out.de;
		} finally {
			translatingEdit = false;
		}
	}

	async function saveEdit() {
		if (!editing) return;
		const res = await fetch(`/api/admin/gallery/${editing.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				category_id: editing.category_id,
				room_id: editing.room_id ?? null,
				alt_en: editing.alt_en,
				alt_fr: editing.alt_fr,
				alt_de: editing.alt_de
			})
		});
		const out = await res.json();
		if (out.success && out.image) {
			images = images.map((i) => (i.id === editing!.id ? out.image : i));
			closeEdit();
		} else {
			alert(out.error ?? 'Save failed.');
		}
	}

	async function replaceFile(e: Event) {
		if (!editing) return;
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const fd = new FormData();
		fd.append('file', file);
		const res = await fetch(`/api/admin/gallery/${editing.id}`, { method: 'PUT', body: fd });
		const out = await res.json();
		if (out.success) {
			const refreshed = await fetch('/api/admin/gallery').then((r) => r.json());
			images = refreshed.images;
			editing = images.find((i) => i.id === editing!.id) ?? null;
		} else {
			alert(out.error ?? 'Replace failed.');
		}
	}

	async function deleteImage(img: GalleryImage) {
		if (!confirm(`Delete "${img.alt_en}"? This cannot be undone.`)) return;
		const res = await fetch(`/api/admin/gallery/${img.id}`, { method: 'DELETE' });
		const out = await res.json();
		if (out.success) {
			images = images.filter((i) => i.id !== img.id);
			if (editing?.id === img.id) editing = null;
		} else {
			alert(out.error ?? 'Delete failed.');
		}
	}

	// Drag-reorder. svelte-dnd-action emits `consider` (live) and `finalize`
	// (drop). We replace the working set on every event and only persist
	// sort_order on `finalize`.
	function handleConsider(e: CustomEvent<DndEvent<GalleryImage>>) {
		const reordered = e.detail.items;
		// Splice the reordered subset back into the global images array.
		images = mergeReorder(images, reordered);
	}

	async function handleFinalize(e: CustomEvent<DndEvent<GalleryImage>>) {
		const reordered = e.detail.items;
		images = mergeReorder(images, reordered);
		// Persist sort_order across the reordered items only — every 10 to
		// leave room for future drag insertions without renumbering everything.
		const order = reordered.map((img, idx) => ({ id: img.id, sort_order: (idx + 1) * 10 }));
		await fetch('/api/admin/gallery/reorder', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ order })
		});
	}

	function mergeReorder(all: GalleryImage[], reorderedSubset: GalleryImage[]): GalleryImage[] {
		// The subset comes from the filtered grid; preserve images not in the
		// current filter at their original positions.
		const subsetIds = new Set(reorderedSubset.map((i) => i.id));
		const out: GalleryImage[] = [];
		let subIdx = 0;
		for (const img of all) {
			if (subsetIds.has(img.id)) {
				out.push(reorderedSubset[subIdx++]);
			} else {
				out.push(img);
			}
		}
		return out;
	}

	function categoryLabel(id: string): string {
		return categories.find((c) => c.id === id)?.label_en ?? '?';
	}
	function roomLabel(id: string | null): string {
		if (!id) return '—';
		return rooms.find((r) => r.id === id)?.name_en ?? '?';
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Gallery</h2>
			<p class="page-subtitle">
				{images.length} image{images.length === 1 ? '' : 's'} · {categories.length} categories
			</p>
		</div>
		<a href="/admin/gallery/categories" class="btn-outline">
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
			Manage categories
		</a>
	</div>

	<!-- Upload zone -->
	<div
		class="dropzone"
		class:has-file={pendingFile}
		ondragover={onDropZoneDrag}
		ondrop={onDropZoneDrop}
		role="presentation"
	>
		{#if !pendingFile}
			<label class="dropzone-inner">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="17 8 12 3 7 8"></polyline>
					<line x1="12" y1="3" x2="12" y2="15"></line>
				</svg>
				<span class="dropzone-title">Drop a photo here, or click to browse</span>
				<span class="dropzone-sub">JPG, PNG or WebP · max 10 MB</span>
				<input type="file" accept="image/jpeg,image/png,image/webp" onchange={onFileInput} hidden />
			</label>
		{:else}
			<div class="pending">
				<img src={pendingPreviewUrl} alt="Preview" class="pending-preview" />
				<div class="pending-form">
					<label class="form-label" for="np-cat">Category *</label>
					<select id="np-cat" class="form-input" bind:value={pendingForm.category_id} disabled={uploading}>
						<option value="">— pick a category —</option>
						{#each categories as cat}
							<option value={cat.id}>{cat.label_en}</option>
						{/each}
					</select>

					<label class="form-label" for="np-room">Room (optional)</label>
					<select id="np-room" class="form-input" bind:value={pendingForm.room_id} disabled={uploading}>
						<option value="">— none —</option>
						{#each rooms as r}
							<option value={r.id}>{r.name_en}</option>
						{/each}
					</select>

					<div class="form-row">
						<label class="form-label" for="np-en">Alt text (English) *</label>
						<button
							type="button"
							class="link-btn"
							onclick={translateNew}
							disabled={!pendingForm.alt_en.trim() || translatingNew || uploading}
							title="Auto-fill French and German via Google Translate"
						>
							{translatingNew ? 'Translating…' : '↻ Translate'}
						</button>
					</div>
					<input id="np-en" type="text" class="form-input" bind:value={pendingForm.alt_en} maxlength="240" disabled={uploading} placeholder="e.g. Double bedroom with garden view" />

					<label class="form-label" for="np-fr">Alt text (French)</label>
					<input id="np-fr" type="text" class="form-input" bind:value={pendingForm.alt_fr} maxlength="240" disabled={uploading} />

					<label class="form-label" for="np-de">Alt text (German)</label>
					<input id="np-de" type="text" class="form-input" bind:value={pendingForm.alt_de} maxlength="240" disabled={uploading} />

					{#if uploadError}
						<p class="error">{uploadError}</p>
					{/if}

					{#if uploading}
						<div class="progress" aria-hidden="true">
							<div class="progress-fill" style="width: {Math.round(uploadProgress * 100)}%"></div>
						</div>
					{/if}

					<div class="pending-actions">
						<button type="button" class="btn-link" onclick={resetPending} disabled={uploading}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							Cancel
						</button>
						<button type="button" class="btn-primary" onclick={uploadPending} disabled={uploading}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
							{uploading ? 'Uploading…' : 'Upload'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Filter -->
	<div class="filter-row">
		<label class="filter-label" for="filter-cat">Filter:</label>
		<select id="filter-cat" class="form-input filter-select" bind:value={filterCategoryId}>
			<option value="">All ({images.length})</option>
			{#each categories as cat}
				{@const count = images.filter((i) => i.category_id === cat.id).length}
				<option value={cat.id}>{cat.label_en} ({count})</option>
			{/each}
		</select>
	</div>

	<!-- Grid -->
	{#if filteredImages.length === 0}
		<p class="empty">
			{images.length === 0 ? 'No photos yet — drop one above to get started.' : 'No photos in this category.'}
		</p>
	{:else}
		<div
			class="grid"
			use:dndzone={{ items: filteredImages, flipDurationMs: 200, dropTargetStyle: {} }}
			onconsider={handleConsider}
			onfinalize={handleFinalize}
		>
			{#each filteredImages as img (img.id)}
				<div class="tile" animate:flip={{ duration: 200 }}>
					<div class="tile-handle" title="Drag to reorder">⋮⋮</div>
					<button type="button" class="tile-img-btn" onclick={() => openEdit(img)}>
						<img src={img.urls.thumb} alt={img.alt_en} loading="lazy" />
					</button>
					<div class="tile-meta">
						<div class="tile-alt">{img.alt_en}</div>
						<div class="tile-tags">
							<span class="tag">{categoryLabel(img.category_id)}</span>
							{#if img.room_id}
								<span class="tag tag-room">{roomLabel(img.room_id)}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Edit modal -->
{#if editing}
	<div class="modal-backdrop" onclick={closeEdit} role="presentation">
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			use:modalA11y={{ onClose: closeEdit }}
		>
			<h3 class="modal-title">Edit image</h3>

			<img src={editing.urls.full} alt={editing.alt_en} class="modal-preview" />

			<label class="form-label" for="ed-cat">Category *</label>
			<select id="ed-cat" class="form-input" bind:value={editing.category_id}>
				{#each categories as cat}
					<option value={cat.id}>{cat.label_en}</option>
				{/each}
			</select>

			<label class="form-label" for="ed-room">Room (optional)</label>
			<select id="ed-room" class="form-input" value={editing.room_id ?? ''} onchange={(e) => (editing!.room_id = (e.target as HTMLSelectElement).value || null)}>
				<option value="">— none —</option>
				{#each rooms as r}
					<option value={r.id}>{r.name_en}</option>
				{/each}
			</select>

			<div class="form-row">
				<label class="form-label" for="ed-en">Alt text (English) *</label>
				<button
					type="button"
					class="link-btn"
					onclick={translateEdit}
					disabled={!editing.alt_en.trim() || translatingEdit}
				>
					{translatingEdit ? 'Translating…' : '↻ Translate'}
				</button>
			</div>
			<input id="ed-en" type="text" class="form-input" bind:value={editing.alt_en} maxlength="240" />

			<label class="form-label" for="ed-fr">Alt text (French)</label>
			<input id="ed-fr" type="text" class="form-input" bind:value={editing.alt_fr} maxlength="240" />

			<label class="form-label" for="ed-de">Alt text (German)</label>
			<input id="ed-de" type="text" class="form-input" bind:value={editing.alt_de} maxlength="240" />

			<p class="hint">
				Original file: {editing.original_filename ?? '—'} · {editing.width}×{editing.height}
			</p>

			<div class="modal-actions">
				<label class="btn-link">
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
					Replace file
					<input type="file" accept="image/jpeg,image/png,image/webp" onchange={replaceFile} hidden />
				</label>
				<button type="button" class="btn-link danger" onclick={() => deleteImage(editing!)}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
					Delete
				</button>
				<div class="spacer"></div>
				<button type="button" class="btn-link" onclick={closeEdit}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
					Cancel
				</button>
				<button type="button" class="btn-primary" onclick={saveEdit}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
					Save
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

	.dropzone {
		border: 2px dashed var(--color-cream-dark);
		border-radius: 14px;
		background: var(--color-bg);
		min-height: 8rem;
		display: flex;
		align-items: stretch;
		justify-content: center;
		transition: border-color 0.15s ease, background 0.15s ease;
	}
	.dropzone:hover { border-color: var(--color-sage); }
	.dropzone.has-file { border-style: solid; }

	.dropzone-inner {
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		gap: 0.4rem; padding: 1.5rem; cursor: pointer; width: 100%;
		color: var(--color-text-muted);
	}
	.dropzone-inner:hover { color: var(--color-sage); }
	.dropzone-title { font-weight: 500; }
	.dropzone-sub { font-size: 0.8rem; }

	.pending { display: grid; grid-template-columns: minmax(140px, 240px) 1fr; gap: 1.25rem; padding: 1rem; width: 100%; }
	@media (max-width: 600px) { .pending { grid-template-columns: 1fr; } }
	.pending-preview { width: 100%; height: auto; max-height: 360px; object-fit: cover; border-radius: 8px; background: var(--color-cream); }
	.pending-form { display: flex; flex-direction: column; }

	.filter-row { display: flex; align-items: center; gap: 0.5rem; }
	.filter-label { font-size: 0.875rem; color: var(--color-text-muted); }
	.filter-select { max-width: 18rem; }

	.empty { color: var(--color-text-muted); font-size: 0.875rem; }

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.85rem;
		min-height: 4rem;
	}
	.tile {
		position: relative;
		display: flex; flex-direction: column;
		background: var(--color-bg);
		border: 1px solid var(--color-cream-dark);
		border-radius: 10px;
		overflow: hidden;
		transition: box-shadow 0.15s ease;
	}
	.tile:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
	.tile-handle {
		position: absolute; top: 6px; left: 6px; z-index: 2;
		background: rgba(0,0,0,0.55); color: white;
		font-size: 0.85rem; padding: 0.1rem 0.4rem; border-radius: 6px;
		cursor: grab; user-select: none;
	}
	.tile-handle:active { cursor: grabbing; }
	.tile-img-btn { background: none; border: none; padding: 0; cursor: pointer; display: block; }
	.tile-img-btn img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
	.tile-meta { padding: 0.55rem 0.7rem 0.7rem; }
	.tile-alt { font-size: 0.85rem; line-height: 1.25; margin-bottom: 0.35rem; color: var(--color-text); }
	.tile-tags { display: flex; gap: 0.35rem; flex-wrap: wrap; }
	.tag {
		font-size: 0.7rem; padding: 0.1rem 0.45rem; border-radius: 9999px;
		background: var(--color-cream); color: var(--color-text-muted);
		border: 1px solid var(--color-cream-dark); letter-spacing: 0.02em;
	}
	.tag-room { background: var(--color-sage); color: white; border-color: var(--color-sage); }

	.form-label { display: block; font-size: 0.8125rem; font-weight: 500; margin: 0.85rem 0 0.35rem; color: var(--color-text-muted); letter-spacing: 0.04em; text-transform: uppercase; }
	.form-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
	.form-input {
		width: 100%; box-sizing: border-box;
		padding: 0.55rem 0.85rem; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; font-family: inherit; font-size: 0.9rem;
		background: var(--color-cream); outline: none;
	}
	.form-input:focus { border-color: var(--color-sage); }
	.form-input:disabled { opacity: 0.6; }

	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.55rem 1.15rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link { background: none; border: none; padding: 0.45rem 0.85rem; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.3rem; }
	.btn-outline {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		color: var(--color-sage);
		border: 1px solid var(--color-sage);
		border-radius: 9999px;
		font-weight: 600;
		font-size: 0.875rem;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.15s ease, color 0.15s ease;
	}
	.btn-outline:hover { background: var(--color-sage); color: white; }
	.btn-link:hover { text-decoration: underline; }
	.btn-link:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-link.danger { color: var(--color-error-text, #b91c1c); }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.8125rem; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.pending-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

	.progress { width: 100%; height: 6px; background: var(--color-cream); border-radius: 9999px; overflow: hidden; margin-top: 0.75rem; }
	.progress-fill { height: 100%; background: var(--color-sage); transition: width 0.15s ease; }

	.error {
		color: var(--color-error-text, #b91c1c);
		background: var(--color-error-bg, #fee2e2);
		border: 1px solid var(--color-error-border, #fecaca);
		padding: 0.55rem 0.85rem; border-radius: 8px; font-size: 0.85rem;
		margin: 0.75rem 0 0;
	}

	.hint { font-size: 0.8rem; color: var(--color-text-muted); margin: 0.85rem 0 0; }

	.modal-backdrop {
		position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45);
		display: flex; align-items: center; justify-content: center;
		padding: 1.5rem; z-index: 1000;
	}
	.modal {
		background: var(--color-bg);
		border-radius: 14px; padding: 1.5rem 1.75rem;
		width: 100%; max-width: 38rem;
		max-height: 90vh; overflow-y: auto;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
	}
	.modal-title { margin: 0 0 0.85rem; font-family: 'Lora', serif; font-size: 1.4rem; }
	.modal-preview { width: 100%; max-height: 320px; object-fit: contain; border-radius: 10px; background: var(--color-cream); }
	.modal-actions { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.25rem; flex-wrap: wrap; }
	.modal-actions .spacer { flex: 1; }
</style>
