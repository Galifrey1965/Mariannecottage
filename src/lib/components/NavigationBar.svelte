<script lang="ts">
	import { page } from '$app/stores';

	interface NavItem {
		label: string;
		icon: string;
		href: string;
	}

	interface Props {
		items: NavItem[];
		label: string;
	}

	let { items, label }: Props = $props();

	const isActive = (href: string) => {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	};
</script>

<nav class="bottom-nav" aria-label={label}>
	{#each items as item}
		<a
			href={item.href}
			class="nav-item"
			class:active={isActive(item.href)}
			aria-label={item.label}
			aria-current={isActive(item.href) ? 'page' : undefined}
		>
			<svg
				class="nav-icon"
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>{@html item.icon}</svg>
			<span class="nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<div class="nav-spacer" />

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--color-bg);
		border-top: 1px solid var(--color-cream-dark);
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
		z-index: 50;
		display: flex;
		justify-content: space-around;
		align-items: stretch;
		height: 68px;
	}

	@media (min-width: 600px) {
		.bottom-nav {
			display: none;
		}
	}

	.nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		flex: 1;
		padding: 6px 4px;
		transition: color 0.15s;
		text-decoration: none;
		color: var(--color-text-muted);
		position: relative;
	}

	.nav-item.active {
		color: var(--color-sage);
	}

	.nav-item.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 25%;
		right: 25%;
		height: 2px;
		background-color: var(--color-sage);
		border-radius: 0 0 2px 2px;
	}

	.nav-icon {
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 10px;
		font-weight: 500;
		white-space: nowrap;
	}

	.nav-spacer {
		height: 68px;
	}

	@media (min-width: 600px) {
		.nav-spacer {
			display: none;
		}
	}
</style>
