// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockOr = vi.fn();
const mockRange = vi.fn();
const mockNeq = vi.fn();
const mockGt = vi.fn();
const mockIn = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

const chainable = () => ({
	select: mockSelect.mockReturnThis(),
	eq: mockEq.mockReturnThis(),
	order: mockOrder.mockReturnThis(),
	or: mockOr.mockReturnThis(),
	range: mockRange.mockReturnThis(),
	neq: mockNeq.mockReturnThis(),
	gt: mockGt.mockReturnThis(),
	in: mockIn.mockReturnThis(),
	update: mockUpdate.mockReturnThis(),
	delete: mockDelete.mockReturnThis(),
	single: mockSingle,
	maybeSingle: mockMaybeSingle
});

vi.mock('$lib/server/supabase', () => ({
	adminClient: {
		from: vi.fn(() => chainable())
	},
	logAdminEvent: vi.fn(async () => undefined)
}));

import { GET, PATCH, DELETE } from './+server';
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

	it('returns paged bookings when authenticated', async () => {
		const bookings = [{ id: '1', guest_name: 'Test' }];
		// New shape: single chained query that ends in .range() and resolves to
		// { data, error, count } via the awaitable PostgREST builder.
		const chain = chainable();
		chain.range = vi.fn(() => ({ data: bookings, error: null, count: 1 })) as any;

		vi.mocked(adminClient.from).mockReturnValueOnce(chain as any);

		const res = await GET({
			locals: makeLocals(true),
			url: new URL('http://localhost/api/admin/bookings?page=0&pageSize=10')
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.bookings).toHaveLength(1);
		expect(data.total).toBe(1);
		expect(data.page).toBe(0);
		expect(data.pageSize).toBe(10);
		// .range(start, end) was applied with page-0 / pageSize-10 bounds.
		expect(chain.range).toHaveBeenCalledWith(0, 9);
	});

	it('mode=all skips .range() so the calendar gets the full set', async () => {
		const bookings = [{ id: '1' }, { id: '2' }];
		const chain = chainable();
		// Without .range(), the awaitable terminal is .order() — return the
		// resolved shape from there. The PostgREST builder is awaitable at any
		// point so this models real behaviour closely enough for the test.
		chain.order = vi.fn(() => ({ data: bookings, error: null, count: 2 })) as any;

		vi.mocked(adminClient.from).mockReturnValueOnce(chain as any);

		const res = await GET({
			locals: makeLocals(true),
			url: new URL('http://localhost/api/admin/bookings?mode=all')
		} as any);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.bookings).toHaveLength(2);
		expect(chain.range).not.toHaveBeenCalled();
	});

	it('search term hits Supabase .or() with ilike across guest_name/email/reference', async () => {
		const chain = chainable();
		chain.range = vi.fn(() => ({ data: [], error: null, count: 0 })) as any;

		vi.mocked(adminClient.from).mockReturnValueOnce(chain as any);

		await GET({
			locals: makeLocals(true),
			url: new URL('http://localhost/api/admin/bookings?search=smith')
		} as any);

		expect(chain.or).toHaveBeenCalledWith(
			'guest_name.ilike.%smith%,guest_email.ilike.%smith%,booking_reference.ilike.%smith%'
		);
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

		// pending → confirmed is now classed as a manual confirm (see
		// bf85063 admin pre-launch polish), so the audit action is
		// 'booking.manual_confirm' rather than the generic 'booking.update'.
		expect(logAdminEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: 'user-123',
				action: 'booking.manual_confirm',
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

describe('DELETE /api/admin/bookings', () => {
	function makeDeleteRequest(body: Record<string, unknown>) {
		return {
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			})
		} as any;
	}

	it('401 without authenticated user', async () => {
		const res = await DELETE({
			locals: makeLocals(false),
			request: new Request('http://localhost/api/admin/bookings', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: '1' })
			})
		} as any);
		expect(res.status).toBe(401);
	});

	it('400 when id missing', async () => {
		const res = await DELETE(makeDeleteRequest({}));
		expect(res.status).toBe(400);
	});

	it('404 when booking does not exist', async () => {
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({ data: null, error: null })) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await DELETE(makeDeleteRequest({ id: 'nope' }));
		expect(res.status).toBe(404);
	});

	it('409 for an active (confirmed) booking — admin must cancel first', async () => {
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({
			data: { id: '1', source: 'web', status: 'confirmed', check_in_date: '2026-09-01', check_out_date: '2026-09-03', booking_reference: 'MC-X' },
			error: null
		})) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await DELETE(makeDeleteRequest({ id: '1' }));
		expect(res.status).toBe(409);
		const body = await res.json();
		expect(body.current_status).toBe('confirmed');
		expect(logAdminEvent).not.toHaveBeenCalled();
	});

	it('409 for admin_block source — points to the availability endpoint instead', async () => {
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({
			data: { id: '1', source: 'admin_block', status: 'cancelled', check_in_date: '2026-09-01', check_out_date: '2026-09-02', booking_reference: 'MC-X' },
			error: null
		})) as any;
		vi.mocked(adminClient.from).mockReturnValueOnce(lookupChain as any);

		const res = await DELETE(makeDeleteRequest({ id: '1' }));
		expect(res.status).toBe(409);
	});

	it('deletes a cancelled booking, frees its dates, writes audit log', async () => {
		// Lookup → returns a cancelled booking covering 2 nights.
		const lookupChain = chainable();
		lookupChain.maybeSingle = vi.fn(() => ({
			data: {
				id: '1',
				source: 'web',
				status: 'cancelled',
				check_in_date: '2026-09-01',
				check_out_date: '2026-09-03',
				booking_reference: 'MC-DEL'
			},
			error: null
		})) as any;

		// Availability free chain — terminates on .eq() returning {error:null}.
		const availChain = chainable();
		availChain.eq = vi.fn(() => ({ error: null })) as any;

		// Booking delete chain — terminates on .eq() returning {error:null}.
		const deleteChain = chainable();
		deleteChain.eq = vi.fn(() => ({ error: null })) as any;

		vi.mocked(adminClient.from)
			.mockReturnValueOnce(lookupChain as any)
			.mockReturnValueOnce(availChain as any)
			.mockReturnValueOnce(deleteChain as any);

		const res = await DELETE(makeDeleteRequest({ id: '1' }));
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);

		// Audit log entry written with the prior status + the dates we freed.
		expect(logAdminEvent).toHaveBeenCalledWith(
			expect.objectContaining({
				action: 'booking.delete',
				target_id: '1',
				metadata: expect.objectContaining({
					prior_status: 'cancelled',
					source: 'web',
					booking_reference: 'MC-DEL',
					dates: ['2026-09-01', '2026-09-02']
				})
			})
		);
	});
});
