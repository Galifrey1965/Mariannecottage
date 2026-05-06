<script lang="ts">
	import type { PageData } from './$types';
	import type { RatePlan } from '$lib/server/supabase';

	let { data }: { data: PageData } = $props();

	let plans = $state<RatePlan[]>(data.plans);
	let archiving = $state<string | null>(null);

	const formatCurrency = (n: number | string) =>
		new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(Number(n));
	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const active = $derived(plans.filter((p) => p.is_active));
	const archived = $derived(plans.filter((p) => !p.is_active));

	async function archive(id: string) {
		archiving = id;
		try {
			const res = await fetch('/api/admin/rate-plans', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const result = await res.json();
			if (result.success) {
				plans = plans.map((p) => (p.id === id ? result.plan : p));
			}
		} finally {
			archiving = null;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Rate plans</h2>
			<p class="page-subtitle">{active.length} active, {archived.length} archived</p>
		</div>
		<a href="/admin/rate-plans/new" class="btn-primary">New rate plan</a>
	</div>

	<section class="section">
		<h3 class="section-title">Active</h3>
		{#if active.length === 0}
			<p class="empty">No active rate plans.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Valid</th>
							<th>1 guest</th>
							<th>2</th>
							<th>3</th>
							<th>4</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each active as p}
							<tr>
								<td>
									<a href="/admin/rate-plans/{p.id}" class="plan-link">{p.name}</a>
									{#if p.description}<p class="sub">{p.description}</p>{/if}
								</td>
								<td>{formatDate(p.valid_from)} → {formatDate(p.valid_until)}</td>
								<td>{formatCurrency(p.rate_per_night)}</td>
								<td>{formatCurrency(p.rate_2_guests)}</td>
								<td>{formatCurrency(p.rate_3_guests)}</td>
								<td>{formatCurrency(p.rate_4_guests)}</td>
								<td class="row-actions">
									<a href="/admin/rate-plans/{p.id}" class="link-btn">
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
										Edit
									</a>
									<button
										class="link-btn danger"
										disabled={archiving === p.id}
										onclick={() => archive(p.id)}>
										<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
										{archiving === p.id ? '…' : 'Archive'}
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
							<th>Valid</th>
							<th>1</th>
							<th>2</th>
							<th>3</th>
							<th>4</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each archived as p}
							<tr class="muted">
								<td>{p.name}</td>
								<td>{formatDate(p.valid_from)} → {formatDate(p.valid_until)}</td>
								<td>{formatCurrency(p.rate_per_night)}</td>
								<td>{formatCurrency(p.rate_2_guests)}</td>
								<td>{formatCurrency(p.rate_3_guests)}</td>
								<td>{formatCurrency(p.rate_4_guests)}</td>
								<td class="row-actions">
									<a href="/admin/rate-plans/{p.id}" class="link-btn">View</a>
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
	.page { display: flex; flex-direction: column; gap: 2rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.section { display: flex; flex-direction: column; gap: 0.5rem; }
	.section-title { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); margin: 0; }
	.empty { color: var(--color-text-muted); font-size: 0.875rem; margin: 0; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); border-bottom: 1px solid var(--color-sage); letter-spacing: 0.02em; }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); }
	tr:last-child td { border-bottom: none; }
	tr.muted td { color: var(--color-text-muted); }

	.plan-link { color: var(--color-text); font-weight: 500; text-decoration: none; }
	.plan-link:hover { color: var(--color-sage); text-decoration: underline; }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); margin: 0.125rem 0 0; }

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
