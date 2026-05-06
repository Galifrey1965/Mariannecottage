<script lang="ts">
	import { t, formatDate, formatCurrency, plural } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';
	import type { BookingWindow } from '$lib/booking-windows';

	interface Props {
		messages: Messages;
		lang: Locale;
		windows: BookingWindow[];
		minNights: number;
		/** Called when the guest commits a selection (full window or refined). */
		onPick: (checkIn: Date, checkOut: Date) => void;
	}

	let { messages, lang, windows, minNights, onPick }: Props = $props();

	let expandedIdx = $state<number | null>(null);
	let refineFromISO = $state<string>('');
	let refineToISO = $state<string>('');

	function fromISO(iso: string): Date {
		const [y, m, d] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	}
	function nightsBetween(aISO: string, bISO: string): number {
		const a = fromISO(aISO).getTime();
		const b = fromISO(bISO).getTime();
		return Math.round((b - a) / (1000 * 60 * 60 * 24));
	}
	function isoAddDays(iso: string, n: number): string {
		const d = fromISO(iso);
		d.setDate(d.getDate() + n);
		const y = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${y}-${mm}-${dd}`;
	}

	function commitFullWindow(idx: number) {
		const w = windows[idx];
		onPick(fromISO(w.from), fromISO(w.to));
	}

	function startShorten(idx: number) {
		expandedIdx = idx;
		const w = windows[idx];
		refineFromISO = w.from;
		refineToISO = w.to;
	}

	function cancelShorten() {
		expandedIdx = null;
	}

	const refineNights = $derived.by(() => {
		if (!refineFromISO || !refineToISO) return 0;
		if (refineFromISO >= refineToISO) return 0;
		return nightsBetween(refineFromISO, refineToISO);
	});

	const refineTotal = $derived.by(() => {
		if (expandedIdx === null) return null;
		const w = windows[expandedIdx];
		if (w.nightlyFromPrice === null) return null;
		if (refineNights <= 0) return null;
		return Math.round(w.nightlyFromPrice * refineNights * 100) / 100;
	});

	const refineValid = $derived.by(() => {
		if (expandedIdx === null) return false;
		const w = windows[expandedIdx];
		if (refineFromISO < w.from || refineToISO > w.to) return false;
		return refineNights >= minNights;
	});

	function commitShortened() {
		if (!refineValid || expandedIdx === null) return;
		onPick(fromISO(refineFromISO), fromISO(refineToISO));
		expandedIdx = null;
	}
</script>

<div class="windows-wrap">
	{#if windows.length === 0}
		<div class="empty">
			<p class="empty-title">{t(messages, 'windows.empty_title')}</p>
			<p class="empty-body">{t(messages, 'windows.empty_body')}</p>
		</div>
	{:else}
		<p class="lede">
			{t(messages, 'windows.lede', { count: String(windows.length) })}
		</p>
		<div class="cards">
			{#each windows as w, idx}
				<article class="card" class:expanded={expandedIdx === idx}>
					<div class="card-summary">
						<div class="card-dates">
							<span class="card-from">{formatDate(lang, fromISO(w.from), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
							<span class="card-arrow" aria-hidden="true">→</span>
							<span class="card-to">{formatDate(lang, fromISO(w.to), { weekday: 'short', day: 'numeric', month: 'short' })}</span>
						</div>
						<div class="card-meta">
							<span class="card-nights">
								{t(messages, 'windows.up_to_nights', { n: String(w.nights) })}
							</span>
							{#if w.floorPrice !== null}
								<span class="card-price">
									{t(messages, 'windows.from_price', {
										price: formatCurrency(lang, w.floorPrice),
										min: String(minNights)
									})}
								</span>
							{/if}
						</div>
					</div>
					<div class="card-actions">
						<button class="btn-primary" onclick={() => commitFullWindow(idx)}>
							{t(messages, 'windows.book_full', { nights: String(w.nights) })}
						</button>
						{#if w.nights > minNights}
							<button
								class="btn-outline"
								onclick={() => (expandedIdx === idx ? cancelShorten() : startShorten(idx))}
							>
								{expandedIdx === idx ? t(messages, 'windows.cancel') : t(messages, 'windows.shorten')}
							</button>
						{/if}
					</div>
					{#if expandedIdx === idx}
						<div class="refine">
							<p class="refine-hint">{t(messages, 'windows.refine_hint')}</p>
							<div class="refine-fields">
								<label class="refine-field">
									<span>{t(messages, 'book.label_checkin')}</span>
									<input
										type="date"
										bind:value={refineFromISO}
										min={w.from}
										max={isoAddDays(w.to, -minNights)}
									/>
								</label>
								<label class="refine-field">
									<span>{t(messages, 'book.label_checkout')}</span>
									<input
										type="date"
										bind:value={refineToISO}
										min={isoAddDays(refineFromISO || w.from, minNights)}
										max={w.to}
									/>
								</label>
							</div>
							<div class="refine-summary" aria-live="polite">
								{#if refineNights > 0}
									<span class="refine-nights">
										{plural(messages, 'book.night', 'book.nights', refineNights)}
									</span>
									{#if refineTotal !== null}
										<span class="refine-total">
											{t(messages, 'windows.total_label', {
												price: formatCurrency(lang, refineTotal)
											})}
										</span>
									{/if}
								{:else}
									<span class="refine-invalid">
										{t(messages, 'windows.refine_invalid', { n: String(minNights) })}
									</span>
								{/if}
							</div>
							<button class="btn-primary" disabled={!refineValid} onclick={commitShortened}>
								{t(messages, 'windows.confirm')}
							</button>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.windows-wrap { display: flex; flex-direction: column; gap: 1rem; }
	.lede { margin: 0 0 0.25rem; font-size: 0.92rem; color: var(--color-text-muted); }

	.cards { display: flex; flex-direction: column; gap: 0.75rem; }
	@media (min-width: 720px) {
		.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
		.card.expanded { grid-column: 1 / -1; }
	}

	.card {
		padding: 1rem 1.15rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: var(--md-shape-corner-medium);
		background: var(--md-sys-color-surface-container-lowest);
		transition: border-color 0.15s, box-shadow 0.15s, transform 0.08s;
	}
	.card:hover { border-color: var(--color-sage); }
	.card.expanded {
		border-color: var(--color-sage);
		box-shadow: 0 6px 16px color-mix(in srgb, var(--color-sage) 14%, transparent);
	}

	.card-summary { display: flex; flex-direction: column; gap: 0.35rem; }
	.card-dates { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem; font-family: 'Lora', serif; font-weight: 600; font-size: 1.05rem; color: var(--color-text); }
	.card-arrow { color: var(--color-text-muted); font-weight: 400; }
	.card-meta { display: flex; gap: 0.85rem; font-size: 0.85rem; color: var(--color-text-muted); align-items: center; flex-wrap: wrap; }
	.card-nights { background: color-mix(in srgb, var(--color-sage) 14%, transparent); color: var(--color-sage); padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 600; }
	.card-price { font-weight: 500; color: var(--color-text); }

	.card-actions { display: flex; gap: 0.6rem; margin-top: 0.85rem; flex-wrap: wrap; }
	.btn-primary {
		flex: 1 1 auto;
		display: inline-flex; align-items: center; justify-content: center;
		padding: 0.6rem 1rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		font-size: 0.875rem; transition: opacity 0.2s;
	}
	.btn-primary:hover { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
	.btn-outline {
		display: inline-flex; align-items: center; justify-content: center;
		padding: 0.6rem 0.95rem; border: 1px solid var(--color-sage);
		color: var(--color-sage); border-radius: 9999px; background: transparent;
		cursor: pointer; font-weight: 500; font-size: 0.85rem;
		transition: background 0.2s, color 0.2s;
	}
	.btn-outline:hover { background: var(--color-sage); color: white; }

	.refine {
		margin-top: 0.85rem;
		padding-top: 0.85rem;
		border-top: 1px dashed var(--color-cream-dark);
	}
	.refine-hint { margin: 0 0 0.65rem; font-size: 0.82rem; color: var(--color-text-muted); }
	.refine-fields { display: grid; gap: 0.65rem; grid-template-columns: 1fr; margin-bottom: 0.6rem; }
	@media (min-width: 480px) { .refine-fields { grid-template-columns: 1fr 1fr; } }
	.refine-field { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.82rem; color: var(--color-text-muted); }
	.refine-field input {
		padding: 0.5rem 0.7rem;
		border: 1px solid var(--color-cream-dark);
		border-radius: var(--md-shape-corner-small);
		font-size: 0.92rem; min-height: 40px;
		font-family: inherit;
	}
	.refine-summary { display: flex; gap: 0.85rem; margin-bottom: 0.7rem; flex-wrap: wrap; align-items: center; }
	.refine-nights { background: color-mix(in srgb, var(--color-sage) 14%, transparent); color: var(--color-sage); padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 600; font-size: 0.82rem; }
	.refine-total { font-size: 0.92rem; color: var(--color-text); font-weight: 500; }
	.refine-invalid { font-size: 0.82rem; color: var(--md-sys-color-error); }

	.empty {
		padding: 2rem 1.5rem;
		text-align: center;
		background: var(--color-cream);
		border-radius: var(--md-shape-corner-medium);
	}
	.empty-title { margin: 0 0 0.4rem; font-family: 'Lora', serif; font-size: 1.05rem; font-weight: 600; }
	.empty-body { margin: 0; font-size: 0.9rem; color: var(--color-text-muted); }
</style>
