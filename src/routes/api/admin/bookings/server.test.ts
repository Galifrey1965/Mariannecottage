// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a chainable mock for adminClient.from('bookings')
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

const chainable = () => ({
	select: mockSelect.mockReturnThis(),
	eq: mockEq.mockReturnThis(),
	order: mockOrder.mockReturnThis(),
	update: mockUpdate.mockReturnThis(),
	single: mockSingle
});

vi.mock('$lib/server/supabase', () => ({
	adminClient: {
		from: vi.fn(() => chainable())
	}
}));

import { GET, PATCH } from './+server';
import { adminClient } from '$lib/server/supabase';

function makeCookies(authenticated = true) {
	return {
		get: vi.fn((key: string) => authenticated && key === 'admin_session' ? 'authenticated' : undefined),
		set: vi.fn(),
		delete: vi.fn()
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /api/admin/bookings', () => {
	it('401 without admin_session', async () => {
		const res = await GET({
			cookies: makeCookies(false),
			url: new URL('http://localhost/api/admin/bookings')
		} as any);
		expect(res.status).toBe(401);
	});

	it('returns bookings when authenticated', async () => {
		const bookings = [{ id: '1', guest_name: 'Test' }];
		// First query (list) resolves with bookings
		const chain1 = chainable();
		chain1.order = vi.fn(() => ({ data: bookings, error: null })) as any;
		// Second query (count) resolves
		const chain2 = chainable();
		chain2.select = vi.fn(() => ({ count: 1 })) as any;

		vi.mocked(adminClient.from)
			.mockReturnValueOnce(chain1 as any)
			.mockReturnValueOnce(chain2 as any);

		const res = await GET({
			cookies: makeCookies(true),
			url: new URL('http://localhost/api/admin/bookings')
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.bookings).toHaveLength(1);
	});
});

describe('PATCH /api/admin/bookings', () => {
	it('401 without admin_session', async () => {
		const res = await PATCH({
			cookies: makeCookies(false),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(401);
	});

	it('updates booking status', async () => {
		const updated = { id: '1', status: 'confirmed' };
		const chain = chainable();
		chain.single = vi.fn(() => ({ data: updated, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(chain as any);

		const res = await PATCH({
			cookies: makeCookies(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});
});
