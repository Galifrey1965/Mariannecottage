<script lang="ts">
	import { FLAG_SVGS, type FlagCode } from '$lib/flags/flags';

	interface Props {
		code: FlagCode | string;
		// CSS height. The flag width is fixed at 4:3 ratio relative to height.
		height?: string;
		// Optional accessible label. When omitted the flag is decorative
		// (aria-hidden) — fine when the surrounding control has its own label.
		label?: string;
		// Subtle border so light flags (e.g. cream / yellow) don't disappear
		// against light backgrounds. Default on.
		bordered?: boolean;
	}

	let { code, height = '1.1rem', label, bordered = true }: Props = $props();

	const normalised = $derived(code.toLowerCase() as FlagCode);
	const svg = $derived(FLAG_SVGS[normalised] ?? '');
</script>

{#if svg}
	<span
		class="flag"
		class:bordered
		style:height
		role={label ? 'img' : undefined}
		aria-label={label}
		aria-hidden={label ? undefined : true}
	>
		{@html svg}
	</span>
{/if}

<style>
	.flag {
		display: inline-block;
		aspect-ratio: 4 / 3;
		line-height: 0;
		vertical-align: middle;
		border-radius: 2px;
		overflow: hidden;
	}
	.flag.bordered { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12); }
	.flag :global(svg) { display: block; width: 100%; height: 100%; }
</style>
