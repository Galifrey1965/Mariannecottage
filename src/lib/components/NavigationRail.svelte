<script lang="ts">
	import { page } from '$app/state';

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
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
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
			<span class="active-indicator" aria-hidden="true"></span>
			<svg
				class="rail-icon"
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>{@html item.icon}</svg>
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
		width: 72px;
		background-color: var(--theme-bg);
		border-right: var(--theme-border-thin);
		z-index: 30;
		padding: 0.5rem 0;
		gap: 0.25rem;
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
		gap: 4px;
		height: 56px;
		width: 60px;
		border-radius: var(--theme-radius-sm);
		margin: 0 6px;
		transition: background 0.15s, color 0.15s;
		text-decoration: none;
		color: var(--theme-text-muted);
		position: relative;
	}

	.rail-item:hover {
		background-color: var(--theme-surface);
		color: var(--theme-text);
	}

	.rail-item.active {
		color: var(--theme-accent);
		background-color: transparent;
	}

	.active-indicator {
		display: none;
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 24px;
		height: 2px;
		background-color: var(--theme-accent);
		border-radius: 0 0 2px 2px;
	}

	.rail-item.active .active-indicator {
		display: block;
	}

	.rail-icon {
		flex-shrink: 0;
	}

	.rail-label {
		font-size: 10px;
		font-weight: 500;
		text-align: center;
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
