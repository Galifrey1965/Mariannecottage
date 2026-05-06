<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Locale = 'en' | 'fr' | 'de';
	type Variant = { locale: Locale; subject: string; html: string; text: string };
	type Template = {
		id: string;
		name: string;
		when: string;
		multilingual: boolean;
		variants: Variant[];
	};

	const templates = (data.templates ?? []) as Template[];

	let selectedId = $state<string>(templates[0]?.id ?? '');
	let selectedLocale = $state<Locale>('en');
	let view = $state<'html' | 'text'>('html');
	let iframeEl = $state<HTMLIFrameElement | null>(null);
	let iframeHeight = $state<number>(540);

	const selected = $derived<Template | undefined>(
		templates.find((t) => t.id === selectedId)
	);
	const currentVariant = $derived<Variant | undefined>(
		selected?.variants.find((v) => v.locale === selectedLocale) ?? selected?.variants[0]
	);

	const LOCALE_LABELS: Record<Locale, string> = { en: 'English', fr: 'Français', de: 'Deutsch' };

	function selectTemplate(id: string) {
		selectedId = id;
		const tmpl = templates.find((t) => t.id === id);
		if (tmpl && !tmpl.variants.some((v) => v.locale === selectedLocale)) {
			selectedLocale = tmpl.variants[0]?.locale ?? 'en';
		}
	}

	// Auto-size the preview iframe to its content so the parent page (not the
	// iframe) provides scrolling. allow-same-origin in the sandbox lets us read
	// the inner documentElement.
	function resizeIframe() {
		const doc = iframeEl?.contentDocument;
		if (!doc) return;
		const next = Math.max(
			doc.documentElement?.scrollHeight ?? 0,
			doc.body?.scrollHeight ?? 0
		);
		if (next > 0) iframeHeight = next + 16;
	}
</script>

<div class="page">
	<header class="page-header">
		<div>
			<h2 class="page-title">Email templates</h2>
			<p class="page-subtitle">
				Read-only previews of every transactional email, rendered against canned sample data.
				Editing comes later — this is so you can see what guests get before they get it.
			</p>
		</div>
	</header>

	<div class="layout">
		<aside class="sidebar" aria-label="Templates">
			<ul class="tmpl-list">
				{#each templates as t}
					<li>
						<button
							type="button"
							class="tmpl-btn"
							class:active={t.id === selectedId}
							onclick={() => selectTemplate(t.id)}
						>
							<span class="tmpl-name">{t.name}</span>
							<span class="tmpl-when">{t.when}</span>
						</button>
					</li>
				{/each}
			</ul>
		</aside>

		<section class="preview" aria-live="polite">
			{#if selected && currentVariant}
				<div class="preview-toolbar">
					<div class="locale-switcher" role="tablist" aria-label="Locale">
						{#each selected.variants as v}
							<button
								type="button"
								role="tab"
								class="locale-btn"
								class:active={v.locale === selectedLocale}
								aria-selected={v.locale === selectedLocale}
								onclick={() => (selectedLocale = v.locale)}
							>
								{LOCALE_LABELS[v.locale]}
							</button>
						{/each}
						{#if !selected.multilingual}
							<span class="single-lang-note">Internal — English only</span>
						{/if}
					</div>
					<div class="view-switcher" role="tablist" aria-label="View">
						<button
							type="button"
							role="tab"
							class="view-btn"
							class:active={view === 'html'}
							onclick={() => (view = 'html')}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
							HTML
						</button>
						<button
							type="button"
							role="tab"
							class="view-btn"
							class:active={view === 'text'}
							onclick={() => (view = 'text')}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
							Plain text
						</button>
					</div>
				</div>

				<div class="subject-row">
					<span class="label">Subject</span>
					<span class="subject">{currentVariant.subject}</span>
				</div>

				{#if view === 'html'}
					<iframe
						bind:this={iframeEl}
						title={`${selected.name} — ${LOCALE_LABELS[currentVariant.locale]}`}
						srcdoc={currentVariant.html}
						class="html-frame"
						sandbox="allow-same-origin"
						style="height: {iframeHeight}px;"
						onload={resizeIframe}
					></iframe>
				{:else}
					<pre class="text-body">{currentVariant.text}</pre>
				{/if}
			{:else}
				<p class="empty">No template selected.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	.layout { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; align-items: start; }
	@media (max-width: 800px) { .layout { grid-template-columns: 1fr; } }

	.sidebar {
		background: var(--color-bg);
		border: 1px solid var(--color-cream-dark);
		border-radius: 12px;
		padding: 0.5rem;
	}
	.tmpl-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.25rem; }
	.tmpl-btn {
		display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem;
		width: 100%; text-align: left; padding: 0.6rem 0.75rem; border-radius: 8px;
		border: 1px solid transparent; background: transparent; cursor: pointer;
		font: inherit; color: var(--color-text);
	}
	.tmpl-btn:hover { background: var(--color-cream); border-color: var(--color-cream-dark); }
	.tmpl-btn.active { background: var(--color-sage); color: white; border-color: var(--color-sage); }
	.tmpl-btn.active .tmpl-when { color: rgba(255,255,255,0.85); }
	.tmpl-name { font-weight: 600; font-size: 0.92rem; }
	.tmpl-when { font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.3; }

	.preview {
		background: var(--color-bg);
		border: 1px solid var(--color-cream-dark);
		border-radius: 12px;
		padding: 1rem;
		display: flex; flex-direction: column; gap: 0.75rem;
	}
	.preview-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.locale-switcher, .view-switcher { display: inline-flex; gap: 0.25rem; background: var(--color-cream); padding: 0.2rem; border-radius: 8px; }
	.locale-btn, .view-btn {
		display: inline-flex; align-items: center; gap: 0.35rem;
		border: none; background: transparent; padding: 0.4rem 0.75rem;
		font-size: 0.85rem; border-radius: 6px; cursor: pointer; color: var(--color-text);
	}
	.locale-btn.active, .view-btn.active { background: var(--color-sage); color: white; }
	.single-lang-note { font-size: 0.78rem; color: var(--color-text-muted); padding: 0 0.5rem; }

	.subject-row {
		display: flex; align-items: baseline; gap: 0.5rem;
		padding: 0.5rem 0.75rem; background: var(--color-cream); border-radius: 8px;
		font-size: 0.875rem; flex-wrap: wrap;
	}
	.subject-row .label { color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
	.subject-row .subject { font-weight: 500; }

	.html-frame {
		width: 100%;
		border: 1px solid var(--color-cream-dark);
		border-radius: 8px;
		background: white;
		display: block;
		overflow: hidden;
	}
	.text-body {
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 0.85rem; background: var(--color-cream); padding: 1rem;
		border-radius: 8px; white-space: pre-wrap; margin: 0;
	}

	.empty { color: var(--color-text-muted); }
</style>
