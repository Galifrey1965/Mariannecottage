<script lang="ts">
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

<nav class="bottom-nav">
	{#each items as item}
		<a
			href={item.href}
			class="nav-item"
			class:active={isActive(item.href)}
			aria-label={item.label}
		>
			<span class="nav-icon">{item.icon}</span>
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
		z-index: 50;
		display: flex;
		justify-content: space-around;
		height: 80px;
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
		gap: 0.25rem;
		width: 100%;
		transition: all 0.2s ease;
		text-decoration: none;
		color: var(--color-text-muted);
		position: relative;
	}

	.nav-item:hover {
		color: var(--color-text);
	}

	.nav-item.active {
		color: var(--color-sage);
	}

	.nav-item.active::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background-color: var(--color-sage);
	}

	.nav-icon {
		font-size: 1.5rem;
	}

	.nav-label {
		font-size: 0.75rem;
		font-weight: 500;
	}

	.nav-spacer {
		height: 80px;
	}

	@media (min-width: 600px) {
		.nav-spacer {
			height: 0;
		}
	}
</style>
