<script lang="ts">
	/**
	 * Material Design 3 Navigation Bar (Mobile)
	 * Bottom navigation with 3-5 items
	 * Shows on small screens only
	 */

	import { page } from '$app/stores';

	interface NavItem {
		label: string;
		icon: string;
		href: string;
	}

	interface Props {
		items: NavItem[];
	}

	let { items }: Props = $props();

	const isActive = (href: string) => {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	};
</script>

<nav
	class="fixed bottom-0 left-0 right-0 bg-[var(--md-sys-color-surface)] border-t border-[var(--md-sys-color-outline-variant)] sm:hidden z-50 flex justify-around h-20"
>
	{#each items as item}
		<a
			href={item.href}
			class="flex flex-col items-center justify-center gap-1 w-full transition-all duration-200 ease-standard {isActive(item.href)
				? 'text-[var(--md-sys-color-primary)]'
				: 'text-[var(--md-sys-color-on-surface-variant)]'}"
			aria-label={item.label}
		>
			<span class="text-2xl">{item.icon}</span>
			<span class="text-xs font-medium">{item.label}</span>
		</a>
	{/each}
</nav>

<!-- Spacer for mobile nav -->
<div class="h-20 sm:h-0" />

<style>
	nav :global(a) {
		text-decoration: none;
		color: inherit;
		position: relative;
	}

	nav :global(a::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background-color: var(--md-sys-color-primary);
		transform: scaleX(0);
		transition: transform 200ms ease-standard;
		transform-origin: center;
	}

	nav :global(a:is(.active, [aria-current="page"])::before) {
		transform: scaleX(1);
	}
</style>
