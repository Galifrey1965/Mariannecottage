<script lang="ts">
	import { onMount } from 'svelte';

	const themes = [
		{ id: 'stone-sage', label: 'Stone & Sage' },
		{ id: 'terracotta', label: 'Terracotta' },
		{ id: 'linen-ochre', label: 'Linen & Ochre' }
	];

	let active = $state('stone-sage');
	let open = $state(false);

	onMount(() => {
		const saved = localStorage.getItem('mc-theme');
		if (saved) active = saved;
		else active = document.documentElement.getAttribute('data-theme') ?? 'stone-sage';
	});

	function pick(id: string) {
		active = id;
		document.documentElement.setAttribute('data-theme', id);
		localStorage.setItem('mc-theme', id);
	}
</script>

<div class="ts-root" class:open>
	<button
		class="ts-toggle"
		type="button"
		aria-label="Theme switcher"
		onclick={() => (open = !open)}
	>
		🎨
	</button>
	{#if open}
		<div class="ts-panel" role="group" aria-label="Palette">
			{#each themes as t (t.id)}
				<button
					type="button"
					class="ts-opt"
					class:active={active === t.id}
					onclick={() => pick(t.id)}
				>
					<span class="ts-swatch" data-swatch={t.id}></span>
					{t.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.ts-root {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 9999;
		font-family: system-ui, sans-serif;
		font-size: 0.85rem;
	}
	.ts-toggle {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
		background: #fff;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
		padding: 0;
	}
	.ts-panel {
		position: absolute;
		bottom: 3rem;
		right: 0;
		background: #fff;
		border: 1px solid rgba(0, 0, 0, 0.15);
		border-radius: 0.5rem;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 11rem;
	}
	.ts-opt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid transparent;
		border-radius: 0.35rem;
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: #222;
	}
	.ts-opt:hover {
		background: #f4f4f4;
	}
	.ts-opt.active {
		border-color: #888;
		background: #f0f0f0;
	}
	.ts-swatch {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.2);
	}
	.ts-swatch[data-swatch='stone-sage'] {
		background: linear-gradient(135deg, #f5f1ea 50%, #7a8b6f 50%);
	}
	.ts-swatch[data-swatch='terracotta'] {
		background: linear-gradient(135deg, #f7efe2 50%, #b85a3a 50%);
	}
	.ts-swatch[data-swatch='linen-ochre'] {
		background: linear-gradient(135deg, #f4ecdc 50%, #c79a3a 50%);
	}
</style>
