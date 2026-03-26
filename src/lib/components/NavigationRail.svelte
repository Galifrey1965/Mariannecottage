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

<nav class="rail" aria-label={label}>
	{#each items as item}
		<a
			href={item.href}
			class="rail-item"
			class:active={isActive(item.href)}
			aria-current={isActive(item.href) ? 'page' : undefined}
			title={item.label}
		>
			<span class="rail-icon" aria-hidden="true">{item.icon}</span>
			<span class="rail-label">{item.label}</span>
		</a>
	{/each}
</nav>


<style>
	.rail {
		display: none;
		flex-direction: column;
		position: fixed;
		left: 0;
		top: 56px;
		bottom: 0;
		width: 80px;
		background-color: var(--color-bg);
		border-right: 1px solid var(--color-cream-dark);
		z-index: 30;
		padding: 1rem 0;
		gap: 0.25rem;
		overflow-y: auto;
	}

	@media (min-width: 600px) {
		.rail {
			display: flex;
		}
	}

	@media (min-width: 840px) {
		.rail {
			display: none;
		}
	}

	.rail-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.75rem;
		border-radius: 16px;
		margin: 0 0.5rem;
		transition: all 0.2s ease;
		text-decoration: none;
		color: var(--color-text-muted);
		min-height: 48px;
		min-width: 48px;
	}

	.rail-item:hover {
		background-color: var(--color-cream);
		color: var(--color-text);
	}

	.rail-item.active {
		background-color: var(--color-sage);
		color: var(--md-sys-color-on-primary);
	}

	.rail-icon {
		font-size: 1.5rem;
	}

	.rail-label {
		font-size: 0.75rem;
		text-align: center;
		line-height: 1.2;
		font-weight: 500;
	}

</style>
