// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const chainable = () => ({
	select: mockSelect.mockReturnThis(),
	eq: mockEq.mockReturnThis(),
	order: mockOrder.mockReturnThis(),
	update: mockUpdate.mockReturnThis(),
	single: mockSingle,
	maybeSingle: mockMaybeSingle
});

vi.mock('$lib/server/supabase', () => ({
	adminClient: {
		from: vi.fn(() => chainable())
	},
	logAdminEvent: vi.fn(async () => undefined)
}));

import { GET, PATCH } from './+server';
import { adminClient, logAdminEvent } from '$lib/server/supabase';

function makeLocals(authed = true) {
	return authed
		? { user: { id: 'user-123', email: 'admin@test.invalid' }, profile: null, supabase: {}, safeGetSession: vi.fn() }
		: { user: null, profile: null, supabase: {}, safeGetSession: vi.fn() };
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /api/admin/bookings', () => {
	it('401 without authenticated user', async () => {
		const res = await GET({
			locals: makeLocals(false),
			url: new URL('http://localhost/api/admin/bookings')
		} as any);
		expect(res.status).toBe(401);
	});

	it('returns bookings when authenticated', async () => {
		const bookings = [{ id: '1', guest_name: 'Test' }];
		const chain1 = chainable();
		chain1.order = vi.fn(() => ({ data: bookings, error: null })) as any;
		const chain2 = chainable();
		chain2.select = vi.fn(() => ({ count: 1 })) as any;

		vi.mocked(adminClient.from)
			.mockReturnValueOnce(chain1 as any)
			.mockReturnValueOnce(chain2 as any);

		const res = await GET({
			locals: makeLocals(true),
			url: new URL('http://localhost/api/admin/bookings')
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.bookings).toHaveLength(1);
	});
});

describe('PATCH /api/admin/bookings', () => {
	it('401 without authenticated user', async () => {
		const res = await PATCH({
			locals: makeLocals(false),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(401);
	});

	it('updates booking status (pending → confirmed) and writes audit log entry', async () => {
		// PATCH now does a pre-flight lookup to validate the transition.
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({ data: { status: 'pending' }, error: null })) as any;

		const updated = { id: '1', status: 'confirmed' };
		const updateChain = chainable();
		updateChain.single = vi.fn(() => ({ data: updated, error: null })) as any;

		vi.mocked(adminClient.from)
			.mockReturnValueOnce(lookupChain as any)
			.mockReturnValueOnce(updateChain as any);

		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);

		expect(logAdminEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: 'user-123',
				action: 'booking.update',
				target_type: 'booking',
				target_id: '1'
			})
		);
	});

	it('rejects cancelled → confirmed transition with 409', async () => {
		// State-machine bug discovered 2026-05-03 — admin had been able to
		// flip cancelled rows back to confirmed by clicking the old free-form
		// status toggle, bypassing the cancel/refund flow. This test pins the
		// fix.
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({ data: { status: 'cancelled' }, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body.current_status).toBe('cancelled');
		expect(logAdminEvent).not.toHaveBeenCalled();
	});

	it('rejects pending_payment → confirmed (webhook-only path)', async () => {
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({ data: { status: 'pending_payment' }, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(409);
	});

	it('returns 404 when booking does not exist', async () => {
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({ data: null, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: 'nope', status: 'confirmed' })
			})
		} as any);
		expect(res.status).toBe(404);
	});

	it('allows notes-only PATCH without transition validation', async () => {
		// No status field on the request → no pre-flight lookup, just update.
		const updated = { id: '1', admin_notes: 'note' };
		const updateChain = chainable();
		updateChain.single = vi.fn(() => ({ data: updated, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(updateChain as any);

		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1', admin_notes: 'note' })
			})
		} as any);
		expect(res.status).toBe(200);
	});
});
