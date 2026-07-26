<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Enquiry = {
		id: string;
		created_at: string;
		name: string;
		email: string;
		message: string;
		locale: string;
		status: 'new' | 'spam' | 'replied' | 'archived';
		spam_reason: string | null;
		admin_notified_at: string | null;
		ack_sent_at: string | null;
		notify_error: string | null;
	};

	const enquiries = $derived(data.enquiries as Enquiry[]);
	const page = $derived(data.page ?? 0);
	const pageSize = $derived(data.pageSize ?? 25);
	const total = $derived(data.total ?? 0);
	const status = $derived(data.status ?? 'new');
	const newCount = $derived(data.newCount ?? 0);
	const spamCount = $derived(data.spamCount ?? 0);
	const unnotifiedCount = $derived(data.unnotifiedCount ?? 0);

	const lastPage = $derived(Math.max(0, Math.ceil(total / pageSize) - 1));

	const FILTERS = ['new', 'replied', 'archived', 'spam', 'all'] as const;

	let expanded = $state<Record<string, boolean>>({});
	let pendingId = $state<string | null>(null);
	let actionError = $state<string>('');

	function formatDateTime(iso: string): string {
		return new Date(iso).toLocaleString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatRelativeTime(iso: string | null): string {
		if (!iso) return 'never';
		const ms = Date.now() - new Date(iso).getTime();
		if (ms < 0) return 'just now';
		const min = Math.round(ms / 60_000);
		if (min < 1) return 'just now';
		if (min < 60) return `${min} min ago`;
		const hr = Math.round(min / 60);
		if (hr < 24) return `${hr}h ago`;
		const day = Math.round(hr / 24);
		return `${day}d ago`;
	}

	// Reply in the language the guest wrote in. Three locales, so a local map is
	// cheaper than reaching for the i18n layer from an admin-only screen.
	const REPLY_COPY: Record<string, { subject: string; greeting: string; thanks: string; quoted: string }> = {
		en: {
			subject: 'Re: your enquiry - Marianne Cottage',
			greeting: 'Hello',
			thanks: 'Thank you for getting in touch about Marianne Cottage.',
			quoted: 'Your message'
		},
		fr: {
			subject: 'Re : votre demande - Marianne Cottage',
			greeting: 'Bonjour',
			thanks: 'Merci de nous avoir contactes au sujet de Marianne Cottage.',
			quoted: 'Votre message'
		},
		de: {
			subject: 'Re: Ihre Anfrage - Marianne Cottage',
			greeting: 'Hallo',
			thanks: 'vielen Dank fuer Ihre Anfrage zu Marianne Cottage.',
			quoted: 'Ihre Nachricht'
		}
	};

	function mailtoHref(e: Enquiry): string {
		const copy = REPLY_COPY[e.locale] ?? REPLY_COPY.en;
		const body = [
			`${copy.greeting} ${e.name},`,
			'',
			copy.thanks,
			'',
			'',
			`--- ${copy.quoted} ---`,
			e.message
		].join('\n');
		return `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(body)}`;
	}

	function statusBadgeClass(s: string): string {
		switch (s) {
			case 'new':
				return 'new';
			case 'replied':
				return 'replied';
			case 'spam':
				return 'spam';
			default:
				return 'archived';
		}
	}

	function setFilter(next: string) {
		const params = new URLSearchParams();
		params.set('status', next);
		params.set('page', '0');
		void goto(`/admin/enquiries?${params.toString()}`);
	}

	function gotoPage(p: number) {
		const params = new URLSearchParams();
		params.set('status', status);
		params.set('page', String(p));
		void goto(`/admin/enquiries?${params.toString()}`);
	}

	// invalidateAll rather than patching $state: the filter is applied
	// server-side, so a row that no longer matches has to leave the table, and
	// the header counts have to move with it.
	async function setStatus(e: Enquiry, next: string) {
		pendingId = e.id;
		actionError = '';
		try {
			const res = await fetch('/api/admin/enquiries', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: e.id, status: next })
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				actionError = result.error || `Failed (${res.status})`;
				return;
			}
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : String(err);
		} finally {
			pendingId = null;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<h2 class="page-title">Enquiries</h2>
			<p class="page-subtitle">
				{total.toLocaleString()} in this view · {newCount} new · {spamCount} flagged as spam
			</p>
		</div>
	</div>

	{#if unnotifiedCount > 0}
		<!-- The whole point of this page. A row nobody was told about used to be
		     invisible; now it is the first thing on the screen. -->
		<div class="alert" role="status">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
			<span>
				<strong>{unnotifiedCount}</strong>
				{unnotifiedCount === 1 ? 'enquiry was' : 'enquiries were'} never emailed out. The message is
				safe here, but nobody was told about it — reply from this screen.
			</span>
		</div>
	{/if}

	<div class="status-filters" role="tablist" aria-label="Filter by status">
		{#each FILTERS as f}
			<button
				role="tab"
				aria-selected={status === f}
				class="filter-btn"
				class:active={status === f}
				onclick={() => setFilter(f)}
			>
				{f}
				{#if f === 'new' && newCount > 0}<span class="count">{newCount}</span>{/if}
				{#if f === 'spam' && spamCount > 0}<span class="count">{spamCount}</span>{/if}
			</button>
		{/each}
	</div>

	{#if actionError}
		<p class="error">{actionError}</p>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Received</th>
					<th>From</th>
					<th>Message</th>
					<th>Status</th>
					<th>Notification</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if enquiries.length === 0}
					<tr><td colspan="6" class="empty">No enquiries in this view.</td></tr>
				{/if}
				{#each enquiries as e}
					<tr>
						<td class="nowrap">
							{formatDateTime(e.created_at)}
							<br /><span class="sub">{formatRelativeTime(e.created_at)}</span>
						</td>
						<td>
							{e.name}
							<br /><a href="mailto:{e.email}" class="btn-link">{e.email}</a>
							<br /><span class="sub">{e.locale.toUpperCase()}</span>
						</td>
						<td class="message-cell">
							{#if expanded[e.id]}
								<p class="message-full">{e.message}</p>
							{:else}
								<p class="message-snip">{e.message}</p>
							{/if}
							<!-- Threshold sits well past the 3-line clamp so the toggle is not
						     offered on a message that is already fully visible; newlines
						     clip regardless of length. -->
						{#if e.message.length > 220 || e.message.includes('\n')}
								<button type="button" class="link-btn small" onclick={() => (expanded[e.id] = !expanded[e.id])}>
									{expanded[e.id] ? 'Show less' : 'Show more'}
								</button>
							{/if}
						</td>
						<td>
							<span class="status-badge {statusBadgeClass(e.status)}">{e.status}</span>
							{#if e.spam_reason}
								<br /><code class="small">{e.spam_reason}</code>
							{/if}
						</td>
						<td>
							{#if e.admin_notified_at}
								<span class="ok">sent</span>
								<br /><span class="sub">{formatRelativeTime(e.admin_notified_at)}</span>
							{:else if e.status === 'spam'}
								<span class="muted">not sent</span>
								<br /><span class="sub">flagged as spam</span>
							{:else}
								<span class="bad">never sent</span>
							{/if}
							{#if e.notify_error}
								<br /><button
									type="button"
									class="link-btn small"
									onclick={() => (expanded[`err-${e.id}`] = !expanded[`err-${e.id}`])}
								>
									{expanded[`err-${e.id}`] ? 'Hide error' : 'Why?'}
								</button>
								{#if expanded[`err-${e.id}`]}
									<pre class="meta">{e.notify_error}</pre>
								{/if}
							{/if}
						</td>
						<td>
							<div class="row-actions">
								<a class="link-btn small" href={mailtoHref(e)}>
									<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z"/><path d="m22 8-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 8"/></svg>
									Reply
								</a>
								{#if e.status === 'new'}
									<button class="link-btn small" disabled={pendingId === e.id} onclick={() => setStatus(e, 'replied')}>
										{pendingId === e.id ? '...' : 'Mark replied'}
									</button>
									<button class="link-btn small" disabled={pendingId === e.id} onclick={() => setStatus(e, 'archived')}>
										Archive
									</button>
								{:else if e.status === 'replied'}
									<button class="link-btn small" disabled={pendingId === e.id} onclick={() => setStatus(e, 'archived')}>
										{pendingId === e.id ? '...' : 'Archive'}
									</button>
									<button class="link-btn small" disabled={pendingId === e.id} onclick={() => setStatus(e, 'new')}>
										Reopen
									</button>
								{:else if e.status === 'spam'}
									<button
										class="link-btn small"
										disabled={pendingId === e.id}
										title="Move back to new — this also queues the notification the spam filter suppressed"
										onclick={() => setStatus(e, 'new')}
									>
										{pendingId === e.id ? '...' : 'Not spam'}
									</button>
								{:else}
									<button class="link-btn small" disabled={pendingId === e.id} onclick={() => setStatus(e, 'new')}>
										{pendingId === e.id ? '...' : 'Reopen'}
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<nav class="pager" aria-label="Pagination">
		<button class="link-btn" disabled={page === 0} onclick={() => gotoPage(page - 1)}>
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
			Prev
		</button>
		<span class="page-info">Page {page + 1} of {lastPage + 1}</span>
		<button class="link-btn" disabled={page >= lastPage} onclick={() => gotoPage(page + 1)}>
			Next
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
		</button>
	</nav>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.alert {
		display: flex; align-items: flex-start; gap: 0.625rem;
		background: var(--color-warning-bg); color: var(--color-warning-text);
		border: 1px solid var(--color-warning-border); border-radius: 8px;
		padding: 0.75rem 1rem; font-size: 0.875rem; line-height: 1.5;
	}
	.alert svg { flex-shrink: 0; margin-top: 0.15rem; }

	.status-filters {
		display: flex; gap: 0.25rem; background: var(--color-bg);
		border-radius: 8px; border: 1px solid var(--color-cream-dark);
		padding: 0.25rem; align-self: flex-start; flex-wrap: wrap;
	}
	.filter-btn {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.375rem 0.75rem; background: none; border: none; border-radius: 6px;
		color: var(--color-text); cursor: pointer; font-size: 0.8rem;
		text-transform: capitalize;
	}
	.filter-btn.active { background: var(--color-sage); color: white; font-weight: 500; }
	.count {
		background: var(--color-cream-dark); color: var(--color-text);
		border-radius: 9999px; padding: 0 0.375rem; font-size: 0.7rem; font-weight: 600;
	}
	.filter-btn.active .count { background: rgba(255, 255, 255, 0.25); color: white; }

	.table-wrap { background: var(--color-bg); border: 1px solid var(--color-cream-dark); border-radius: 12px; overflow: hidden; overflow-x: auto; }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; background: var(--color-sage); }
	td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-cream-dark); vertical-align: top; }
	tr:last-child td { border-bottom: none; }
	td.nowrap { white-space: nowrap; }
	.muted { color: var(--color-text-muted); }
	.sub { font-size: 0.75rem; color: var(--color-text-muted); }
	.empty { color: var(--color-text-muted); text-align: center; padding: 2rem; }
	.error { color: var(--color-error-text, #b91c1c); font-size: 0.875rem; margin: 0; }

	.message-cell { min-width: 260px; max-width: 420px; }
	.message-snip {
		margin: 0; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3;
		-webkit-box-orient: vertical; overflow: hidden;
	}
	.message-full { margin: 0; white-space: pre-wrap; }

	.status-badge {
		display: inline-block; padding: 0.125rem 0.625rem; border-radius: 9999px;
		font-size: 0.75rem; font-weight: 500; text-transform: capitalize;
	}
	.status-badge.new { background: var(--color-info-bg); color: var(--color-info-text); }
	.status-badge.replied { background: var(--color-success-bg); color: var(--color-success-text); }
	.status-badge.spam { background: var(--color-error-bg); color: var(--color-error-text); }
	.status-badge.archived { background: var(--color-cream-dark); color: var(--color-text-muted); }

	.ok { color: var(--color-success-text); font-weight: 500; }
	.bad { color: var(--color-error-text, #b91c1c); font-weight: 500; }

	.row-actions { display: flex; flex-direction: column; gap: 0.375rem; align-items: flex-start; }

	code { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 0.82rem; background: var(--color-cream); padding: 0.125rem 0.375rem; border-radius: 4px; }
	code.small { font-size: 0.7rem; word-break: break-all; }

	pre.meta {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.75rem; background: var(--color-cream); padding: 0.625rem;
		border-radius: 6px; white-space: pre-wrap; max-width: 320px;
		overflow-x: auto; margin: 0.5rem 0 0;
	}

	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; padding: 0; color: var(--color-sage); cursor: pointer; font-size: 0.875rem; text-decoration: none; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: none; }
	.link-btn.small { font-size: 0.8rem; }
	.btn-link { color: var(--color-sage); font-size: 0.8rem; }

	.pager { display: flex; align-items: center; justify-content: center; gap: 1.5rem; padding: 0.5rem; }
	.page-info { color: var(--color-text-muted); font-size: 0.875rem; }
</style>
