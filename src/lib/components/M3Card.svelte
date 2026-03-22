<script lang="ts">
	/**
	 * Material Design 3 Card Component
	 * Supports elevated and outlined variants with media, title, and supporting text
	 */

	interface Props {
		variant?: 'elevated' | 'outlined';
		clickable?: boolean;
		mediaAlt?: string;
		mediaUrl?: string;
		title?: string;
		supportingText?: string;
		href?: string;
	}

	let {
		variant = 'elevated',
		clickable = false,
		mediaAlt = '',
		mediaUrl,
		title,
		supportingText,
		href
	}: Props = $props();

	const variantClasses = {
		elevated: `
      bg-[var(--md-sys-color-surface-container-low)]
      shadow-md
      hover:shadow-lg
    `,
		outlined: `
      bg-[var(--md-sys-color-surface)]
      border border-[var(--md-sys-color-outline-variant)]
      hover:bg-[var(--md-sys-color-surface-container-low)]
    `
	};

	const Container = href ? 'a' : 'div';
</script>

<svelte:component
	this={Container}
	href={href || undefined}
	class="group rounded-[var(--md-shape-corner-medium)] overflow-hidden transition-all duration-200 ease-standard {variantClasses[variant]} {clickable
		? 'cursor-pointer hover:shadow-lg'
		: ''}"
>
	{#if mediaUrl}
		<div class="relative w-full h-48 overflow-hidden bg-gray-200">
			<img
				src={mediaUrl}
				alt={mediaAlt}
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
			/>
		</div>
	{/if}

	<div class="p-6">
		{#if title}
			<h3
				class="text-[var(--md-typescale-headline-medium-font-size)] font-[var(--md-typescale-headline-medium-font-weight)] leading-[var(--md-typescale-headline-medium-line-height)] text-[var(--md-sys-color-on-surface)] mb-2"
			>
				{title}
			</h3>
		{/if}

		{#if supportingText}
			<p class="text-[var(--md-typescale-body-medium-font-size)] text-[var(--md-sys-color-on-surface-variant)] mb-4">
				{supportingText}
			</p>
		{/if}

		<slot />
	</div>
</svelte:component>

<style>
	:global(a) {
		text-decoration: none;
		color: inherit;
	}
</style>
