// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the env modules. STRIPE keys default to empty so tests cover the
// dark-deploy 503 path; individual tests can override via vi.doMock.
vi.mock('$env/dynamic/private', () => ({
	env: { STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '' }
}));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon' }
}));

vi.mock('$lib/server/supabase', () => ({
	adminClient: { rpc: vi.fn(), from: vi.fn() }
}));

import { POST } from './+server';
import { _resetStripeCacheForTests } from '$lib/server/stripe';

function makeRequest(body: string, headers: Record<string, string> = {}) {
	return {
		request: new Request('http://localhost/api/stripe/webhook', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headers },
			body
		})
	} as any;
}

beforeEach(() => {
	_resetStripeCacheForTests();
});

describe('POST /api/stripe/webhook — dark-deploy guard', () => {
	it('returns 503 when STRIPE_SECRET_KEY not configured', async () => {
		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(503);
	});

	it('returns 400 when stripe-signature header missing (with keys present)', async () => {
		// Override env so the secret-key guard passes; we then expect the
		// missing-signature 400 to fire before signature verification.
		vi.resetModules();
		vi.doMock('$env/dynamic/private', () => ({
			env: { STRIPE_SECRET_KEY: 'sk_test_dummy', STRIPE_WEBHOOK_SECRET: 'whsec_dummy' }
		}));
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon' }
		}));
		vi.doMock('$lib/server/supabase', () => ({
			adminClient: { rpc: vi.fn(), from: vi.fn() }
		}));
		const { POST: PostWithKeys } = await import('./+server');
		const { _resetStripeCacheForTests: reset } = await import('$lib/server/stripe');
		reset();
		const res = await PostWithKeys(makeRequest('{}'));
		expect(res.status).toBe(400);
	});
});
