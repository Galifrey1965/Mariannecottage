<script lang="ts">
	import type { PageData } from './$types';
	import type { Season, SeasonKind } from '$lib/server/supabase';

	let { data }: { data: PageData } = $props();

	let seasons = $state<Season[]>(data.seasons);
	let archiving = $state<string | null>(null);

	const formatCurrency = (n: number | string) =>
		new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(Number(n));
	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const KIND_LABEL: Record<SeasonKind, string> = { low: 'Low', high: 'High', peak: 'Peak' };

	const active = $derived(seasons.filter((s) => s.is_active));
	const archived = $derived(seasons.filter((s) => !s.is_active));
	const reviewPending = $derived(active.filter((s) => !s.reviewed_by_admin));

	// Coverage-gap detector — looks at the next 12 months from today and
	// flags windows ≥ 2 days where no active season covers the date. Days
	// before the earliest active season's start_date and after the latest
	// end_date are reported as "from X" / "after Y" respectively. Helps
	// Mark spot a forgotten extension into the next year.
	type Gap = { from: string; to: string };
	const gaps: Gap[] = $derived.by(() => {
		const today = new Date();
		const horizon = new Date(today);
		horizon.setDate(horizon.getDate() + 365);
		const horizonISO = horizon.toISOString().slice(0, 10);
		const todayISO = today.toISOString().slice(0, 10);
		const out: Gap[] = [];
		const activeRows = active;
		if (activeRows.length === 0) return out;

		// Walk day-by-day. Cheap enough for a 365-day window.
		const fmt = (d: Date) => {
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		};
		const isCovered = (iso: string) =>
			activeRows.some((s) => s.start_date <= iso && s.end_date >= iso);

		const cursor = new Date(today);
		let runStart: string | null = null;
		while (fmt(cursor) <= horizonISO) {
			const iso = fmt(cursor);
			if (!isCovered(iso)) {
				if (runStart === null) runStart = iso;
			} else if (runStart !== null) {
				const prev = new Date(cursor);
				prev.setDate(prev.getDate() - 1);
				out.push({ from: runStart, to: fmt(prev) });
				runStart = null;
			}
			cursor.setDate(cursor.getDate() + 1);
		}
		if (runStart !== null && runStart >= todayISO) {
			out.push({ from: runStart, to: horizonISO });
		}
		// Filter out trivial 1-day gaps caused by adjacent ranges meeting on
		// the boundary day.
		return out.filter((g) => g.from !== g.to);
	});

	async function archive(id: string) {
		archiving = id;
		try {
			const res = await fetch('/api/admin/seasons', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = await res.json();
			if (result.success) {
				seasons = seasons.map((s) => (s.id === id ? result.season : s));
			}
		} finally {
			archiving = null;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Seasons</h2>
			<p class="page-subtitle">{active.length} active, {archived.length} archived</p>
		</div>
		<a href="/admin/seasons/new" class="btn-primary">New season</a>
	</div>

	{#if reviewPending.length > 0}
		<div class="banner warn" role="alert">
			<strong>{reviewPending.length} season{reviewPending.length === 1 ? '' : 's'} need review.</strong>
			These were imported from the legacy rate-plans table — confirm the kind, dates, and prices are right before guests can rely on them.
		</div>
	{/if}

	{#if gaps.length > 0}
		<div class="banner info">
			<strong>Coverage gaps in the next 12 months:</strong>
			<ul>
				{#each gaps as g}
					<li>{formatDate(g.from)} → {formatDate(g.to)} — closed (no active season covers these dates).</li>
				{/each}
			</ul>
			Guests can't book closed dates. Add or extend a season if any of these should be open.
		</div>
	{/if}

	<section class="section">
		<h3 class="section-title">Active</h3>
		{#if active.length === 0}
			<p class="empty">No active seasons. Add one to open the calendar for bookings.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Kind</th>
							<th>Dates</th>
							<th>1 guest</th>
							<th>2</th>
							<th>3</th>
							<th>4</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each active as s}
							<tr>
								<td>
									<a href="/admin/seasons/{s.id}" class="plan-link">{s.name}</a>
									{#if !s.reviewed_by_admin}
										<span class="badge review">review</span>
									{/if}
									{#if s.description}<p class="sub">{s.description}</p>{/if}
								</td>
								<td><span class="kind-pill kind-{s.kind}">{KIND_LABEL[s.kind]}</span></td>
								<td>{formatDate(s.start_date)} → {formatDate(s.end_date)}</td>
								<td>
									{formatCurrency(s.rate_per_night)}
									{#if s.rate_per_night_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_per_night_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_2_guests)}
									{#if s.rate_2_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_2_guests_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_3_guests)}
									{#if s.rate_3_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_3_guests_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_4_guests)}
									{#if s.rate_4_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_4_guests_nonref)}</div>
									{/if}
								</td>
								<td class="row-actions">
									<a href="/admin/seasons/{s.id}" class="link-btn">
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
										Edit
									</a>
									<button
										class="link-btn danger"
										disabled={archiving === s.id}
										onclick={() => archive(s.id)}>
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
										{archiving === s.id ? '…' : 'Archive'}
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	{#if archived.length > 0}
		<section class="section">
			<h3 class="section-title">Archived</h3>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Kind</th>
							<th>Dates</th>
							<th>1</th>
							<th>2</th>
							<th>3</th>
							<th>4</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each archived as s}
							<tr class="muted">
								<td>{s.name}</td>
								<td><span class="kind-pill kind-{s.kind}">{KIND_LABEL[s.kind]}</span></td>
								<td>{formatDate(s.start_date)} → {formatDate(s.end_date)}</td>
								<td>
									{formatCurrency(s.rate_per_night)}
									{#if s.rate_per_night_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_per_night_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_2_guests)}
									{#if s.rate_2_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_2_guests_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_3_guests)}
									{#if s.rate_3_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_3_guests_nonref)}</div>
									{/if}
								</td>
								<td>
									{formatCurrency(s.rate_4_guests)}
									{#if s.rate_4_guests_nonref !== null}
										<div class="nonref-cell">{formatCurrency(s.rate_4_guests_nonref)}</div>
									{/if}
								</td>
								<td class="row-actions">
									<a href="/admin/seasons/{s.id}" class="link-btn">View</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.5rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.banner {
		padding: 0.85rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.banner.warn {
		background: var(--color-warning-bg, #fef3c7);
		color: var(--color-warning-text, #78350f);
		border: 1px solid #fbbf24;
	}
	.banner.info {
		background: color-mix(in srgb, var(--color-sage) 8%, var(--color-bg));
		color: var(--color-text);
		border: 1px solid var(--color-cream-dark);
	}
	.banner ul { margin: 0.5rem 0; padding-left: 1.25rem; }
	.banner strong { font-weight: 600; }

	.section { display: flex; flex-direction: column; gap: 0.5rem; }
	.section-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin: 0; }
	.empty { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); border-bottom: 1px solid var(--color-sage); letter-spacing: 0.02em; }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: top; }
	tr:last-child td { border-bottom: none; }
	tr.muted td { color: var(--color-text-muted); }

	.plan-link { color: var(--color-text); font-weight: 500; text-decoration: none; }
	.plan-link:hover { color: var(--color-sage); text-decoration: underline; }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.125rem 0 0; }
	.nonref-cell { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 0.15rem; font-style: italic; }

	.kind-pill {
		display: inline-block;
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.kind-pill.kind-low { background: color-mix(in srgb, var(--color-sage) 15%, transparent); color: var(--color-sage); }
	.kind-pill.kind-high { background: color-mix(in srgb, #b8860b 18%, transparent); color: #8b6508; }
	.kind-pill.kind-peak { background: color-mix(in srgb, #b91c1c 15%, transparent); color: #b91c1c; }

	.badge.review {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.1rem 0.45rem;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #fbbf24;
		color: #78350f;
		border-radius: 4px;
	}

	.row-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; text-decoration: none; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.link-btn.danger { color: var(--color-error-text, #b91c1c); }

	.btn-primary {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.625rem 1.25rem; background: var(--color-sage); color: white;
		font-weight: 600; border-radius: 9999px; border: none; cursor: pointer;
		text-decoration: none; font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
</style>
