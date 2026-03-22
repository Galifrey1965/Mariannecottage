<script lang="ts">
	/**
	 * Material Design 3 Navigation Rail (Tablet/Desktop)
	 * Left sidebar navigation for medium-to-large screens
	 * Shows on sm and up, hidden on mobile
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
	class="hidden sm:flex flex-col fixed left-0 top-0 bottom-0 w-20 bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] z-40 py-4 gap-4"
>
	{#each items as item}
		<a
			href={item.href}
			class="flex flex-col items-center justify-center gap-1 p-3 rounded-[var(--md-shape-corner-large)] mx-2 transition-all duration-200 ease-standard {isActive(
				item.href
			)
				? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
				: 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-low)]'}"
			aria-label={item.label}
			title={item.label}
		>
			<span class="text-2xl">{item.icon}</span>
			<span class="text-xs text-center leading-tight font-medium">{item.label}</span>
		</a>
	{/each}
</nav>

<!-- Spacer for rail -->
<div class="hidden sm:block w-20" />

<style>
	nav :global(a) {
		text-decoration: none;
		color: inherit;
		min-height: 48px;
		min-width: 48px;
	}
</style>
