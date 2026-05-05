<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Event = {
		id: string;
		user_id: string | null;
		action: string;
		target_type: string | null;
		target_id: string | null;
		metadata: Record<string, unknown> | null;
		created_at: string;
	};

	let events = $state<Event[]>(data.events as Event[]);
	let profilesById = $state(data.profilesById ?? {});
	let page = $state<number>(data.page ?? 0);
	let pageSize = $state<number>(data.pageSize ?? 50);
	let total = $state<number>(data.total ?? 0);
	let actionPrefix = $state<string>(data.actionPrefix ?? '');
	let fromDate = $state<string>(data.fromDate ?? '');
	let toDate = $state<string>(data.toDate ?? '');
	let expanded = $state<Record<string, boolean>>({});

	$effect(() => {
		events = data.events as Event[];
		profilesById = data.profilesById ?? {};
		page = data.page ?? 0;
		total = data.total ?? 0;
	});

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function whoLabel(userId: string | null): string {
		if (!userId) return 'system';
		return profilesById[userId]?.display_name ?? userId.slice(0, 8);
	}

	function pretty(meta: Record<string, unknown> | null): string {
		if (!meta) return '';
		try {
			return JSON.stringify(meta, null, 2);
		} catch {
			return String(meta);
		}
	}

	function applyFilters(e: SubmitEvent) {
		e.preventDefault();
		const params = new URLSearchParams();
		if (actionPrefix) params.set('action', actionPrefix);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		params.set('page', '0');
		void goto(`/admin/audit-log?${params.toString()}`);
	}

	function clearFilters() {
		actionPrefix = '';
		fromDate = '';
		toDate = '';
		void goto('/admin/audit-log');
	}

	function gotoPage(p: number) {
		const params = new URLSearchParams();
		if (actionPrefix) params.set('action', actionPrefix);
		if (fromDate) params.set('from', fromDate);
		if (toDate) params.set('to', toDate);
		params.set('page', String(p));
		void goto(`/admin/audit-log?${params.toString()}`);
	}

	const lastPage = $derived(Math.max(0, Math.ceil(total / pageSize) - 1));
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Audit log</h2>
			<p class="page-subtitle">{total.toLocaleString()} events</p>
		</div>
	</div>

	<form class="filters" onsubmit={applyFilters}>
		<label>
			<span>Action prefix</span>
			<input type="text" bind:value={actionPrefix} placeholder="e.g. site_banner. or booking." />
		</label>
		<label>
			<span>From</span>
			<input type="date" bind:value={fromDate} />
		</label>
		<label>
			<span>To</span>
			<input type="date" bind:value={toDate} />
		</label>
		<div class="filter-actions">
			<button type="submit" class="btn-primary">Apply</button>
			<button type="button" class="link-btn" onclick={clearFilters}>Clear</button>
		</div>
	</form>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>When</th>
					<th>Who</th>
					<th>Action</th>
					<th>Target</th>
					<th>Metadata</th>
				</tr>
			</thead>
			<tbody>
				{#if events.length === 0}
					<tr><td colspan="5" class="empty">No events match.</td></tr>
				{/if}
				{#each events as e}
					<tr>
						<td class="nowrap">{formatDateTime(e.created_at)}</td>
						<td>{whoLabel(e.user_id)}</td>
						<td><code>{e.action}</code></td>
						<td>
							{#if e.target_type}
								<span class="muted">{e.target_type}</span>
								{#if e.target_id}
									<br /><code class="small">{e.target_id}</code>
								{/if}
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td>
							{#if e.metadata && Object.keys(e.metadata).length > 0}
								<button
									type="button"
									class="link-btn small"
									onclick={() => (expanded[e.id] = !expanded[e.id])}
								>
									{expanded[e.id] ? 'Hide' : 'Show'}
								</button>
								{#if expanded[e.id]}
									<pre class="meta">{pretty(e.metadata)}</pre>
								{/if}
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<nav class="pager" aria-label="Pagination">
		<button class="link-btn" disabled={page === 0} onclick={() => gotoPage(page - 1)}>← Prev</button>
		<span class="page-info">Page {page + 1} of {lastPage + 1}</span>
		<button class="link-btn" disabled={page >= lastPage} onclick={() => gotoPage(page + 1)}>Next →</button>
	</nav>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.filters {
		display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 0.75rem 1rem; align-items: end;
		background: var(--color-bg); padding: 1rem; border: 1px solid var(--color-cream-dark); border-radius: 12px;
	}
	@media (max-width: 720px) { .filters { grid-template-columns: 1fr; } }
	.filters label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; color: var(--color-text-muted); }
	.filters input {
		padding: 0.5rem 0.75rem; border: 1px solid var(--color-cream-dark); border-radius: 6px;
		background: var(--color-bg); color: var(--color-text); font-size: 0.875rem;
	}
	.filter-actions { display: flex; gap: 0.75rem; align-items: center; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: top; }
	tr:last-child td { border-bottom: none; }
	td.nowrap { white-space: nowrap; }
	.muted { color: var(--color-text-muted); }
	.empty { color: var(--color-text-muted); text-align: center; padding: 2rem; }

	code { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.82rem; background: var(--color-cream); padding: 0.125rem 0.375rem; border-radius: 4px; }
	code.small { font-size: 0.7rem; word-break: break-all; }

	pre.meta {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.75rem; background: var(--color-cream); padding: 0.625rem;
		border-radius: 6px; white-space: pre-wrap; max-width: 480px;
		overflow-x: auto; margin: 0.5rem 0 0;
	}

	.btn-primary {
		padding: 0.5rem 1rem; background: var(--color-sage); color: white; font-weight: 600;
		border-radius: 6px; border: none; cursor: pointer; font-size: 0.875rem;
	}
	.btn-primary:hover { opacity: 0.9; }
	.link-btn { background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: none; }
	.link-btn.small { font-size: 0.8rem; }

	.pager { display: flex; align-items: center; justify-content: center; gap: 1.5rem; padding: 0.5rem; }
	.page-info { color: var(--color-text-muted); font-size: 0.875rem; }
</style>
