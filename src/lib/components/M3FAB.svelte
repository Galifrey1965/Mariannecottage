<script lang="ts">
	/**
	 * Material Design 3 Extended FAB (Floating Action Button)
	 * Primary action for "Book Your Stay" or similar CTAs
	 * Position: bottom-right or inline
	 */

	interface Props {
		label: string;
		icon?: string;
		position?: 'fixed' | 'relative';
		onClick?: () => void;
		href?: string;
		variant?: 'primary' | 'secondary' | 'tertiary';
	}

	let { label, icon, position = 'fixed', onClick, href, variant = 'primary' }: Props = $props();

	const variantClasses = {
		primary: `
      bg-[var(--md-sys-color-primary)]
      text-[var(--md-sys-color-on-primary)]
    `,
		secondary: `
      bg-[var(--md-sys-color-secondary-container)]
      text-[var(--md-sys-color-on-secondary-container)]
    `,
		tertiary: `
      bg-[var(--md-sys-color-tertiary-container)]
      text-[var(--md-sys-color-on-tertiary-container)]
    `
	};

	const positionClasses =
		position === 'fixed' ? 'fixed bottom-6 right-6 z-40' : 'relative inline-flex';
</script>

{#if href}
	<a
		{href}
		class="group {positionClasses} h-14 px-6 rounded-full {variantClasses[variant]} shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center gap-3 font-[var(--md-typescale-label-large-font-family)] text-[var(--md-typescale-label-large-font-size)] font-[var(--md-typescale-label-large-font-weight)] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)]"
	>
		{#if icon}
			<span class="text-xl transition-transform duration-200 group-hover:rotate-12">
				{icon}
			</span>
		{/if}
		<span>{label}</span>
	</a>
{:else}
	<button
		on:click={onClick}
		class="group {positionClasses} h-14 px-6 rounded-full {variantClasses[variant]} shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 font-[var(--md-typescale-label-large-font-family)] text-[var(--md-typescale-label-large-font-size)] font-[var(--md-typescale-label-large-font-weight)] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--md-sys-color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{#if icon}
			<span class="text-xl transition-transform duration-200 group-hover:rotate-12">
				{icon}
			</span>
		{/if}
		<span>{label}</span>
	</button>
{/if}

<style>
	:global(a, button) {
		border: none;
		cursor: pointer;
		text-decoration: none;
		font-family: inherit;
	}
</style>
