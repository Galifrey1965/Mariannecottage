// Playwright doesn't auto-load .env (Vite does, for the webServer process).
// This loader populates process.env from the repo-root .env file when keys are
// missing, so tests that need service-role access (booking-concurrent,
// admin-auth) can find their credentials without requiring the user to
// duplicate them in shell env.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadDotenvIfMissing(keys: string[]): void {
	if (keys.every((k) => process.env[k])) return;
	try {
		const envPath = resolve(process.cwd(), '.env');
		const raw = readFileSync(envPath, 'utf8');
		for (const line of raw.split(/\r?\n/)) {
			const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
			if (!m) continue;
			const [, key, rawVal] = m;
			if (process.env[key]) continue;
			let val = rawVal;
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			process.env[key] = val;
		}
	} catch {
		// no .env — env vars must be set externally or the test will skip
	}
}
