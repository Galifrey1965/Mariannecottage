<script lang="ts">
	/**
	 * Material Design 3 Button Component
	 * Supports: filled, outlined, text, elevated, tonal variants
	 * Touch target: 48x48 dp minimum
	 */

	import { onMount } from 'svelte';

	interface Props {
		variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
		size?: 'small' | 'medium' | 'large';
		disabled?: boolean;
		href?: string;
		type?: 'button' | 'submit' | 'reset';
		icon?: boolean;
		fullWidth?: boolean;
		children?: any;
	}

	let {
		variant = 'filled',
		size = 'medium',
		disabled = false,
		href,
		type = 'button',
		icon = false,
		fullWidth = false,
		children
	}: Props = $props();

	let isPressed = $state(false);

	const handleMouseDown = () => {
		isPressed = true;
	};

	const handleMouseUp = () => {
		isPressed = false;
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Space' || e.code === 'Enter') {
			isPressed = true;
		}
	};

	const handleKeyUp = (e: KeyboardEvent) => {
		if (e.code === 'Space' || e.code === 'Enter') {
			isPressed = false;
		}
	};

	let element: HTMLElement;

	onMount(() => {
		if (element) {
			element.addEventListener('mousedown', handleMouseDown);
			element.addEventListener('mouseup', handleMouseUp);
			element.addEventListener('keydown', handleKeyDown);
			element.addEventListener('keyup', handleKeyUp);

			return () => {
				element.removeEventListener('mousedown', handleMouseDown);
				element.removeEventListener('mouseup', handleMouseUp);
				element.removeEventListener('keydown', handleKeyDown);
				element.removeEventListener('keyup', handleKeyUp);
			};
		}
	});

	const baseClasses = `
    inline-flex items-center justify-center gap-2 rounded-full
    transition-all duration-200 ease-standard
    focus-visible:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    min-h-[48px] min-w-[48px]
    font-[var(--md-typescale-label-large-font-family)]
    text-[var(--md-typescale-label-large-font-size)]
    font-[var(--md-typescale-label-large-font-weight)]
    leading-[var(--md-typescale-label-large-line-height)]
  `;

	const variantClasses = {
		filled: `
      bg-[var(--md-sys-color-primary)]
      text-[var(--md-sys-color-on-primary)]
      hover:shadow-md
      active:bg-[var(--md-sys-color-primary)]
    `,
		outlined: `
      border-2 border-[var(--md-sys-color-outline)]
      text-[var(--md-sys-color-primary)]
      bg-transparent
      hover:bg-[rgba(45,111,80,0.08)]
    `,
		text: `
      text-[var(--md-sys-color-primary)]
      bg-transparent
      hover:bg-[rgba(45,111,80,0.08)]
    `,
		elevated: `
      bg-[var(--md-sys-color-surface-container-low)]
      text-[var(--md-sys-color-primary)]
      shadow-sm
      hover:shadow-md
    `,
		tonal: `
      bg-[var(--md-sys-color-primary-container)]
      text-[var(--md-sys-color-on-primary-container)]
      hover:shadow-sm
    `
	};

	const sizeClasses = {
		small: 'px-3 py-2 text-sm',
		medium: 'px-6 py-3',
		large: 'px-8 py-4 text-lg'
	};
</script>

{#if href}
	<a
		{href}
		bind:this={element}
		class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''}"
		{disabled}
		role="button"
	>
		<slot />
	</a>
{:else}
	<button
		bind:this={element}
		class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {fullWidth ? 'w-full' : ''}"
		{type}
		{disabled}
	>
		<slot />
	</button>
{/if}

<style>
	:global(.md-ripple) {
		position: relative;
		overflow: hidden;
	}

	:global(.md-ripple::after) {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		animation: ripple 600ms ease-out;
	}

	@keyframes ripple {
		to {
			width: 400px;
			height: 400px;
			opacity: 0;
		}
	}
</style>
