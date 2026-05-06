<script lang="ts">
	import type {
		SiteBanner,
		SiteBannerEffect,
		SiteBannerEffectIntensity,
		SiteBannerLocale,
		SiteBannerIcon,
		SiteBannerPalette
	} from '$lib/server/supabase';
	import type { PageData } from './$types';
	import BannerPreview from '$lib/components/BannerPreview.svelte';
	import { PALETTES, PALETTE_NAMES, ICON_LABELS, ICON_NAMES, ICON_PATHS } from '$lib/banners/presets';
	import { modalA11y } from '$lib/actions/modal-a11y';

	let { data }: { data: PageData } = $props();

	let banners = $state<SiteBanner[]>(data.banners);
	let editing = $state<Partial<SiteBanner> & { id?: string } | null>(null);
	let saving = $state(false);
	let saveError = $state('');
	let deleting = $state<string | null>(null);
	let previewing = $state<Partial<SiteBanner> | null>(null);
	let translating = $state(false);

	const EFFECTS: SiteBannerEffect[] = ['none', 'fireworks', 'snow', 'sparkles', 'hearts', 'confetti'];
	const INTENSITIES: SiteBannerEffectIntensity[] = ['continuous', 'burst-idle', 'load-only'];
	const ALL_LOCALES: SiteBannerLocale[] = ['en', 'fr', 'de'];

	const EFFECT_LABELS: Record<SiteBannerEffect, string> = {
		none: '— None —',
		fireworks: '🎆 Fireworks',
		snow: '❄ Snow',
		sparkles: '✨ Sparkles',
		hearts: '💗 Hearts',
		confetti: '🎉 Confetti'
	};
	const INTENSITY_LABELS: Record<SiteBannerEffectIntensity, string> = {
		continuous: 'Continuous',
		'burst-idle': 'Burst then idle (recommended)',
		'load-only': 'Once on page load'
	};
	const LOCALE_LABELS: Record<SiteBannerLocale, string> = {
		en: 'English',
		fr: 'Français',
		de: 'Deutsch'
	};

	function setIcon(value: SiteBannerIcon | '') {
		if (!editing) return;
		editing.icon = value === '' ? null : value;
	}

	function setPalette(value: SiteBannerPalette) {
		if (!editing) return;
		editing.palette = value;
	}

	function toggleLocale(loc: SiteBannerLocale) {
		if (!editing) return;
		const current = editing.locales ?? ['en', 'fr', 'de'];
		if (current.includes(loc)) {
			editing.locales = current.filter((l) => l !== loc);
		} else {
			editing.locales = [...current, loc];
		}
	}

	function openCreate() {
		editing = {
			icon: 'info',
			palette: 'sage',
			message_en: '',
			message_fr: '',
			message_de: '',
			enabled: true,
			display_order: 0,
			starts_at: null,
			ends_at: null,
			effect: 'none',
			effect_intensity: 'burst-idle',
			locales: ['en', 'fr', 'de'],
			is_recurring: false
		};
		saveError = '';
	}

	function fmtDate(iso: string | null | undefined, recurring: boolean): string {
		if (!iso) return '…';
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return '…';
		const opts: Intl.DateTimeFormatOptions = recurring
			? { day: 'numeric', month: 'short' }
			: { day: 'numeric', month: 'short', year: 'numeric' };
		return d.toLocaleDateString(undefined, opts);
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

	async function translateMessage() {
		if (!editing) return;
		const text = (editing.message_en ?? '').trim();
		if (!text) return;
		translating = true;
		try {
			const res = await fetch('/api/admin/translate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			});
			const out = await res.json();
			if (out.fr) editing.message_fr = out.fr;
			if (out.de) editing.message_de = out.de;
		} finally {
			translating = false;
		}
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
				icon: editing.icon ?? null,
				palette: editing.palette ?? 'sage',
				message_en: (editing.message_en ?? '').trim(),
				message_fr: (editing.message_fr ?? '').trim() || null,
				message_de: (editing.message_de ?? '').trim() || null,
				enabled: !!editing.enabled,
				display_order: Number(editing.display_order ?? 0),
				starts_at: editing.starts_at ?? null,
				ends_at: editing.ends_at ?? null,
				effect: editing.effect ?? 'none',
				effect_intensity: editing.effect_intensity ?? 'burst-idle',
				locales: editing.locales ?? ['en', 'fr', 'de'],
				is_recurring: !!editing.is_recurring
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

	function paletteOf(b: { palette?: SiteBannerPalette }) {
		return PALETTES[b.palette ?? 'sage'];
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Banners</h2>
			<p class="page-subtitle">
				{banners.filter((b) => b.enabled).length} enabled, {banners.length} total
			</p>
		</div>
		<button class="btn-primary" onclick={openCreate}>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
			New banner
		</button>
	</div>

	{#if banners.length === 0}
		<p class="empty">No banners yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Look</th>
						<th>Message (EN)</th>
						<th>Effect</th>
						<th>Locales</th>
						<th>Active</th>
						<th>Order</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each banners as b}
						<tr class:disabled={!b.enabled}>
							<td class="look-cell">
								<span
									class="swatch"
									style="background:{paletteOf(b).bg};color:{paletteOf(b).fg};border-color:{paletteOf(b).border};"
									title={paletteOf(b).label}
								>
									{#if b.icon}
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">{@html ICON_PATHS[b.icon]}</svg>
									{:else}
										<span class="swatch-empty" aria-hidden="true">·</span>
									{/if}
								</span>
							</td>
							<td>
								<button class="row-btn" onclick={() => openEdit(b)}>{b.message_en}</button>
								{#if b.starts_at || b.ends_at}
									<p class="sub">
										{fmtDate(b.starts_at, !!b.is_recurring)} → {fmtDate(b.ends_at, !!b.is_recurring)}
										{#if b.is_recurring}
											<span class="badge-recurring" title="Repeats every year">↻ yearly</span>
										{/if}
									</p>
								{/if}
							</td>
							<td class="effect-cell">
								{EFFECT_LABELS[b.effect ?? 'none']}
								{#if (b.effect ?? 'none') !== 'none'}
									<span class="sub">{INTENSITY_LABELS[b.effect_intensity ?? 'burst-idle']}</span>
								{/if}
							</td>
							<td class="locales-cell">
								{(b.locales ?? ['en', 'fr', 'de']).map((l) => l.toUpperCase()).join(' · ')}
							</td>
							<td>
								<label class="toggle">
									<input type="checkbox" checked={b.enabled} onchange={() => toggle(b)} />
								</label>
							</td>
							<td>{b.display_order}</td>
							<td class="row-actions">
								<div class="row-actions-inner">
									<button class="link-btn" onclick={() => (previewing = b)} title="Preview banner + effect">
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
										Preview
									</button>
									<button class="link-btn" onclick={() => openEdit(b)}>
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
										Edit
									</button>
									<button
										class="link-btn danger"
										disabled={deleting === b.id}
										onclick={() => deleteBanner(b)}>
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
										{deleting === b.id ? '…' : 'Delete'}
									</button>
								</div>
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
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			use:modalA11y={{ onClose: close }}
		>
			<h3 class="modal-title">{editing.id ? 'Edit' : 'New'} banner</h3>

			<div class="row-2">
				<div>
					<label class="form-label" for="b-icon">Icon</label>
					<select
						id="b-icon"
						class="form-input"
						value={editing.icon ?? ''}
						onchange={(e) => setIcon((e.target as HTMLSelectElement).value as SiteBannerIcon | '')}
					>
						<option value="">— None —</option>
						{#each ICON_NAMES as iname}
							<option value={iname}>{ICON_LABELS[iname]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="form-label" for="b-palette">Palette</label>
					<select
						id="b-palette"
						class="form-input"
						value={editing.palette ?? 'sage'}
						onchange={(e) => setPalette((e.target as HTMLSelectElement).value as SiteBannerPalette)}
					>
						{#each PALETTE_NAMES as pname}
							<option value={pname}>{PALETTES[pname].label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div
				class="look-chip"
				style="background:{PALETTES[editing.palette ?? 'sage'].bg};color:{PALETTES[editing.palette ?? 'sage'].fg};border-color:{PALETTES[editing.palette ?? 'sage'].border};"
			>
				{#if editing.icon}
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html ICON_PATHS[editing.icon]}</svg>
				{/if}
				<span>{(editing.message_en ?? '').trim() || 'Live look — your message appears here'}</span>
			</div>

			<div class="label-row">
				<label class="form-label" for="b-en">Message (English) *</label>
				<button
					type="button"
					class="translate-btn"
					onclick={translateMessage}
					disabled={!(editing.message_en ?? '').trim() || translating}
					title="Auto-fill French and German via Google Translate"
				>
					{translating ? 'Translating…' : '↻ Translate'}
				</button>
			</div>
			<input id="b-en" type="text" class="form-input" bind:value={editing.message_en} maxlength="240" />

			<label class="form-label" for="b-fr">Message (French)</label>
			<input id="b-fr" type="text" class="form-input" bind:value={editing.message_fr} maxlength="240" />

			<label class="form-label" for="b-de">Message (German)</label>
			<input id="b-de" type="text" class="form-input" bind:value={editing.message_de} maxlength="240" />

			<p class="hint">EN is shown if the visitor's locale isn't translated. ↻ Translate uses Google Translate to fill FR + DE — both fields stay editable.</p>

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

			<div class="row-2">
				<div>
					<label class="form-label" for="b-effect">Effect</label>
					<select id="b-effect" class="form-input" bind:value={editing.effect}>
						{#each EFFECTS as e}
							<option value={e}>{EFFECT_LABELS[e]}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="form-label" for="b-intensity">Cadence</label>
					<select
						id="b-intensity"
						class="form-input"
						bind:value={editing.effect_intensity}
						disabled={(editing.effect ?? 'none') === 'none'}
					>
						{#each INTENSITIES as i}
							<option value={i}>{INTENSITY_LABELS[i]}</option>
						{/each}
					</select>
				</div>
			</div>
			<p class="hint">
				Fireworks + Confetti use canvas; Snow / Sparkles / Hearts are CSS-only. All respect
				prefers-reduced-motion. Visitors get a "stop effects" button on the banner.
			</p>

			<label class="form-label">Show to languages</label>
			<div class="locale-checks">
				{#each ALL_LOCALES as loc}
					<label class="locale-check">
						<input
							type="checkbox"
							checked={(editing.locales ?? ['en', 'fr', 'de']).includes(loc)}
							onchange={() => toggleLocale(loc)}
						/>
						<span>{LOCALE_LABELS[loc]}</span>
					</label>
				{/each}
			</div>
			<p class="hint">
				e.g. tick only English for Bonfire Night, only French for Bastille Day, all three for Christmas.
			</p>

			<label class="form-label" for="b-order">Display order</label>
			<input id="b-order" type="number" class="form-input" bind:value={editing.display_order} step="1" />

			<label class="form-checkbox">
				<input type="checkbox" bind:checked={editing.enabled} />
				<span>Enabled</span>
			</label>

			<label class="form-checkbox">
				<input type="checkbox" bind:checked={editing.is_recurring} />
				<span>Repeats every year (ignore the year on the dates above — fires on the same day annually)</span>
			</label>

			{#if saveError}
				<p class="error">{saveError}</p>
			{/if}

			<div class="modal-actions">
				<button
					type="button"
					class="btn-link"
					onclick={() => (previewing = { ...editing! })}
					disabled={saving || !(editing.message_en ?? '').trim()}
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
					Preview
				</button>
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

{#if previewing}
	<BannerPreview banner={previewing} onclose={() => (previewing = null)} />
{/if}

<style>
	.page { display: flex; flex-direction: column; gap: 1.5rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }
	.empty { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }
	.hint { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
	.translate-btn {
		background: none; border: none; padding: 0;
		color: var(--color-sage); cursor: pointer; font-size: 0.8125rem;
		font-family: inherit; font-weight: 500;
	}
	.translate-btn:hover { text-decoration: underline; }
	.translate-btn:disabled { opacity: 0.5; cursor: not-allowed; text-decoration: none; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); border-bottom: 1px solid var(--color-sage); letter-spacing: 0.02em; }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: middle; }
	tr:last-child td { border-bottom: none; }
	tr.disabled td { color: var(--color-text-muted); opacity: 0.65; }

	.row-btn { background: none; border: none; padding: 0; cursor: pointer; color: var(--color-text); font-weight: 500; font-size: 0.875rem; text-align: left; }
	.row-btn:hover { color: var(--color-sage); text-decoration: underline; }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.125rem 0 0; }

	.toggle { display: inline-flex; align-items: center; cursor: pointer; }

	.row-actions { text-align: right; white-space: nowrap; }
	.row-actions-inner { display: inline-flex; gap: 0.75rem; align-items: center; justify-content: flex-end; }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; }
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

	.locale-checks { display: flex; gap: 1.25rem; margin-top: 0.4rem; flex-wrap: wrap; }
	.locale-check { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.875rem; cursor: pointer; }
	.locale-check input { width: 1rem; height: 1rem; }

	.effect-cell { font-size: 0.85rem; }
	.effect-cell .sub { display: block; }
	.locales-cell { font-size: 0.78rem; color: var(--color-text-muted); letter-spacing: 0.05em; }

	.look-cell { width: 56px; }
	.swatch {
		display: inline-flex; align-items: center; justify-content: center;
		width: 32px; height: 32px;
		border-radius: 8px;
		border: 1px solid;
	}
	.swatch-empty { font-size: 1rem; opacity: 0.45; }

	.look-chip {
		display: flex; align-items: center; justify-content: center; gap: 0.5rem;
		padding: 0.55rem 1rem;
		margin-top: 0.75rem;
		border: 1px solid;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 500;
		text-align: center;
	}
	.look-chip svg { flex-shrink: 0; }

	.badge-recurring {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.45rem;
		border-radius: 9999px;
		background: var(--color-cream);
		border: 1px solid var(--color-cream-dark);
		font-size: 0.7rem;
		color: var(--color-sage);
		font-weight: 500;
		letter-spacing: 0.02em;
	}

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
