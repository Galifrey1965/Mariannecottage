// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
	list: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	del: vi.fn(),
	count: vi.fn(),
	logEvent: vi.fn(async () => undefined)
}));

vi.mock('$lib/server/supabase', () => ({
	listCancellationPoliciesAdmin: (...a: unknown[]) => (mocks.list as (...x: unknown[]) => unknown)(...a),
	createCancellationPolicy: (...a: unknown[]) => (mocks.create as (...x: unknown[]) => unknown)(...a),
	updateCancellationPolicy: (...a: unknown[]) => (mocks.update as (...x: unknown[]) => unknown)(...a),
	deleteCancellationPolicy: (...a: unknown[]) => (mocks.del as (...x: unknown[]) => unknown)(...a),
	countBookingsUsingPolicy: (...a: unknown[]) => (mocks.count as (...x: unknown[]) => unknown)(...a),
	logAdminEvent: (...a: unknown[]) => (mocks.logEvent as (...x: unknown[]) => unknown)(...a)
}));

import { GET, POST, PATCH, DELETE } from './+server';

const authedLocals = {
	user: { id: 'admin-1', email: 'admin@test.invalid' },
	profile: null,
	supabase: {},
	safeGetSession: vi.fn()
};
const anonLocals = { user: null, profile: null, supabase: {}, safeGetSession: vi.fn() };

function makeJsonRequest(body: unknown) {
	return {
		request: new Request('http://localhost/api/admin/cancellation-policies', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('GET /api/admin/cancellation-policies', () => {
	it('401 unauthed', async () => {
		const res = await GET({ locals: anonLocals } as never);
		expect(res.status).toBe(401);
	});

	it('returns list of policies', async () => {
		mocks.list.mockResolvedValue([{ id: 'p1', name: 'Moderate', is_default: true, schedule: [] }]);
		const res = await GET({ locals: authedLocals } as never);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.policies).toHaveLength(1);
	});
});

describe('POST /api/admin/cancellation-policies', () => {
	it('400 when name missing', async () => {
		const res = await POST({
			locals: authedLocals,
			...makeJsonRequest({ schedule: [{ days_before_check_in: 0, refund_pct: 0 }] })
		} as never);
		expect(res.status).toBe(400);
	});

	it('400 when schedule missing', async () => {
		const res = await POST({
			locals: authedLocals,
			...makeJsonRequest({ name: 'Strict' })
		} as never);
		expect(res.status).toBe(400);
	});

	it('400 when refund_pct out of range', async () => {
		const res = await POST({
			locals: authedLocals,
			...makeJsonRequest({
				name: 'Bad',
				schedule: [{ days_before_check_in: 0, refund_pct: 150 }]
			})
		} as never);
		expect(res.status).toBe(400);
	});

	it('creates and logs event on valid input', async () => {
		mocks.create.mockResolvedValue({ id: 'p_new', name: 'Strict', is_default: false });
		const res = await POST({
			locals: authedLocals,
			...makeJsonRequest({
				name: 'Strict',
				schedule: [{ days_before_check_in: 0, refund_pct: 0 }]
			})
		} as never);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mocks.create).toHaveBeenCalled();
		expect(mocks.logEvent).toHaveBeenCalledWith(
			expect.objectContaining({ action: 'cancellation_policy.create' })
		);
	});
});

describe('DELETE /api/admin/cancellation-policies', () => {
	it('refuses to delete a policy still referenced by bookings', async () => {
		mocks.count.mockResolvedValue(3);
		const res = await DELETE({
			locals: authedLocals,
			...makeJsonRequest({ id: 'p_used' })
		} as never);
		const body = await res.json();
		expect(res.status).toBe(409);
		expect(body.error).toMatch(/3 bookings/);
		expect(mocks.del).not.toHaveBeenCalled();
	});

	it('deletes a policy with zero references', async () => {
		mocks.count.mockResolvedValue(0);
		mocks.del.mockResolvedValue(undefined);
		const res = await DELETE({
			locals: authedLocals,
			...makeJsonRequest({ id: 'p_unused' })
		} as never);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.success).toBe(true);
		expect(mocks.del).toHaveBeenCalledWith('p_unused');
		expect(mocks.logEvent).toHaveBeenCalledWith(
			expect.objectContaining({ action: 'cancellation_policy.delete' })
		);
	});
});

describe('PATCH /api/admin/cancellation-policies', () => {
	it('400 when id missing', async () => {
		const res = await PATCH({
			locals: authedLocals,
			...makeJsonRequest({ name: 'New name' })
		} as never);
		expect(res.status).toBe(400);
	});

	it('updates with partial payload', async () => {
		mocks.update.mockResolvedValue({ id: 'p1', name: 'Updated', is_default: true });
		const res = await PATCH({
			locals: authedLocals,
			...makeJsonRequest({ id: 'p1', name: 'Updated' })
		} as never);
		expect(res.status).toBe(200);
		expect(mocks.update).toHaveBeenCalledWith('p1', { name: 'Updated' });
	});
});
