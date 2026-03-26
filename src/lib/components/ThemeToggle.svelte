<script lang="ts">
	type Theme = 'system' | 'light' | 'dark';

	let theme = $state<Theme>('system');

	$effect(() => {
		const stored = localStorage.getItem('theme') as Theme | null;
		if (stored === 'light' || stored === 'dark') {
			theme = stored;
		}
	});

	function cycleTheme() {
		const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
		theme = next;
		applyTheme(next);
	}

	function applyTheme(t: Theme) {
		const html = document.documentElement;
		const smuiLight = document.getElementById('smui-light') as HTMLLinkElement | null;
		const smuiDark = document.getElementById('smui-dark') as HTMLLinkElement | null;

		if (t === 'system') {
			delete html.dataset.theme;
			localStorage.removeItem('theme');
			if (smuiLight) smuiLight.media = '(prefers-color-scheme: light)';
			if (smuiDark) smuiDark.media = 'screen and (prefers-color-scheme: dark)';
		} else if (t === 'light') {
			html.dataset.theme = 'light';
			localStorage.setItem('theme', 'light');
			if (smuiLight) smuiLight.media = 'all';
			if (smuiDark) smuiDark.media = 'not all';
		} else {
			html.dataset.theme = 'dark';
			localStorage.setItem('theme', 'dark');
			if (smuiLight) smuiLight.media = 'not all';
			if (smuiDark) smuiDark.media = 'all';
		}
	}

	const labels: Record<Theme, string> = {
		system: 'Theme: system (click for light)',
		light: 'Theme: light (click for dark)',
		dark: 'Theme: dark (click for system)'
	};
</script>

<button
	class="theme-toggle"
	onclick={cycleTheme}
	aria-label={labels[theme]}
	title={labels[theme]}
>
	{#if theme === 'light'}
		<!-- Sun icon -->
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="4"/>
			<line x1="12" y1="2" x2="12" y2="4"/>
			<line x1="12" y1="20" x2="12" y2="22"/>
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
			<line x1="2" y1="12" x2="4" y2="12"/>
			<line x1="20" y1="12" x2="22" y2="12"/>
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
		</svg>
	{:else if theme === 'dark'}
		<!-- Moon icon -->
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
		</svg>
	{:else}
		<!-- Monitor/auto icon -->
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
			<line x1="8" y1="21" x2="16" y2="21"/>
			<line x1="12" y1="17" x2="12" y2="21"/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: 8px;
		color: var(--color-text);
		transition: background 0.2s;
		flex-shrink: 0;
	}

	.theme-toggle:hover {
		background: var(--color-cream);
	}
</style>
