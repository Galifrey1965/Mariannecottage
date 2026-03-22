<script lang="ts">
	/**
	 * Material Design 3 Chip Component
	 * Used for: amenities, tags, filters
	 * Supports: input, filter, and suggestion variants
	 */

	interface Props {
		label: string;
		icon?: string;
		variant?: 'input' | 'filter' | 'suggestion';
		selected?: boolean;
		removable?: boolean;
		onRemove?: () => void;
		onClick?: () => void;
	}

	let { label, icon, variant = 'filter', selected = false, removable = false, onRemove, onClick }: Props = $props();

	const variantClasses = {
		filter: `
      border border-[var(--md-sys-color-outline)]
      bg-[var(--md-sys-color-surface)]
      text-[var(--md-sys-color-on-surface)]
      hover:bg-[var(--md-sys-color-surface-container-low)]
    `,
		input: `
      border-2 border-[var(--md-sys-color-outline)]
      bg-[var(--md-sys-color-surface-container-low)]
      text-[var(--md-sys-color-on-surface)]
    `,
		suggestion: `
      border border-[var(--md-sys-color-outline)]
      bg-[var(--md-sys-color-surface)]
      text-[var(--md-sys-color-on-surface)]
    `
	};

	const selectedClasses = selected
		? `
      bg-[var(--md-sys-color-primary-container)]
      text-[var(--md-sys-color-on-primary-container)]
      border-[var(--md-sys-color-primary)]
    `
		: '';
</script>

<button
	on:click={onClick}
	class="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--md-shape-corner-full)] transition-all duration-200 ease-standard font-[var(--md-typescale-label-medium-font-family)] text-[var(--md-typescale-label-medium-font-size)] font-[var(--md-typescale-label-medium-font-weight)] {variantClasses[variant]} {selectedClasses} hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
	type="button"
>
	{#if icon}
		<span class="text-lg">{icon}</span>
	{/if}
	<span>{label}</span>
	{#if removable}
		<button
			on:click|stopPropagation={onRemove}
			class="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)]"
		>
			✕
		</button>
	{/if}
</button>

<style>
	button {
		border: inherit;
		cursor: pointer;
		font-family: inherit;
	}
</style>
