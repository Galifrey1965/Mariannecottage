<script lang="ts">
	interface Props {
		href: string;
		label: string;
		savingsHint: string;
		size?: 'default' | 'large';
		class?: string;
	}

	let { href, label, savingsHint, size = 'default', class: extraClass = '' }: Props = $props();
</script>

<a
	{href}
	class="bd-cta size-{size} {extraClass}"
	data-testid="book-direct-cta"
>
	<span class="bd-cta__label">{label}</span>
	<span class="bd-cta__hint" aria-hidden="true">
		<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
			<path d="M12 2v20M5 9l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 12 12)" />
		</svg>
		<span>{savingsHint}</span>
	</span>
	<span class="visually-hidden"> — {savingsHint}</span>
</a>

<style>
	.bd-cta {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 2rem;
		background: var(--color-sage);
		color: white;
		border-radius: 9999px;
		text-decoration: none;
		font-weight: 600;
		font-size: 1rem;
		line-height: 1.25;
		transition: padding 200ms ease, transform 200ms ease, box-shadow 200ms ease;
		position: relative;
	}
	.bd-cta.size-large { padding: 1rem 2.5rem; font-size: 1.125rem; }

	.bd-cta__label { display: block; }

	.bd-cta__hint {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		opacity: 1;
		max-height: 1.5em;
		transition: opacity 200ms ease, max-height 200ms ease;
	}
	.bd-cta__hint svg { flex-shrink: 0; }

	/* Desktop / pointer-fine: hover-reveal pattern. The hint starts hidden,
	   the button expands on hover/focus to surface the savings line. */
	@media (hover: hover) and (pointer: fine) {
		.bd-cta__hint {
			opacity: 0;
			max-height: 0;
			overflow: hidden;
		}
		.bd-cta:hover .bd-cta__hint,
		.bd-cta:focus-visible .bd-cta__hint {
			opacity: 1;
			max-height: 1.5em;
		}
		.bd-cta:hover,
		.bd-cta:focus-visible {
			padding-top: 0.625rem;
			padding-bottom: 0.625rem;
			transform: translateY(-1px);
			box-shadow: 0 6px 20px rgba(107, 143, 113, 0.35);
		}
		.bd-cta.size-large:hover,
		.bd-cta.size-large:focus-visible {
			padding-top: 0.875rem;
			padding-bottom: 0.875rem;
		}
	}

	/* Always show the hint on touch / coarse-pointer devices since hover
	   doesn't translate. */
	@media not all and (hover: hover) {
		.bd-cta { padding-top: 0.625rem; padding-bottom: 0.625rem; }
		.bd-cta.size-large { padding-top: 0.875rem; padding-bottom: 0.875rem; }
	}

	@media (prefers-reduced-motion: reduce) {
		.bd-cta,
		.bd-cta__hint { transition: none; }
		.bd-cta:hover,
		.bd-cta:focus-visible { transform: none; }
	}

	.bd-cta:focus-visible { outline: 2px solid var(--color-sage); outline-offset: 3px; }

	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0,0,0,0);
		white-space: nowrap;
		border: 0;
	}
</style>
