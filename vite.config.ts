import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
		__BUILD_DATE__: JSON.stringify(buildDate)
	},
	test: {
		define: {
			__APP_VERSION__: JSON.stringify(pkg.version),
			__BUILD_DATE__: JSON.stringify(buildDate)
		},
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
