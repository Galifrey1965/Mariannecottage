import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		setupFiles: ['src/tests/setup.ts'],
		globals: true,
		alias: {
			// Force Svelte to use client-side (browser) bundle in tests
			'svelte': 'svelte'
		},
		server: {
			deps: {
				inline: ['svelte']
			}
		}
	},
	resolve: {
		conditions: ['browser']
	}
});
