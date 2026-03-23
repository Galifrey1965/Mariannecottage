<script lang="ts">
	import '../../app.css';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<div class="min-h-screen bg-[var(--md-sys-color-surface-dim)]">
	<!-- Admin top bar -->
	<header class="bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)] px-4 sm:px-6 py-3 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<a href="/" class="text-sm text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]">
				← Back to site
			</a>
			<span class="text-[var(--md-sys-color-outline)]">|</span>
			<h1 class="md-headline-small text-[var(--md-sys-color-on-surface)]">Marianne Cottage Admin</h1>
		</div>
		<nav class="flex items-center gap-4 text-sm">
			<a href="/admin" class="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] font-medium">Bookings</a>
			<a href="/admin/availability" class="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)]">Availability</a>
		</nav>
	</header>

	<main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
		{@render children()}
	</main>
</div>
