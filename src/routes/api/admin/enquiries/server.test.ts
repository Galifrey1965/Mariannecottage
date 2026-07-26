// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/supabase', () => ({
	getEnquiry: vi.fn(),
	updateEnquiryStatus: vi.fn(),
	logAdminEvent: vi.fn(async () => undefined)
}));

import { PATCH } from './+server';
import { getEnquiry, updateEnquiryStatus, logAdminEvent } from '$lib/server/supabase';

function makeLocals(authed = true) {
	return authed
		? { user: { id: 'user-123', email: 'admin@test.invalid' }, profile: null, supabase: {}, safeGetSession: vi.fn() }
		: { user: null, profile: null, supabase: {}, safeGetSession: vi.fn() };
}

function enquiry(overrides: Record<string, unknown> = {}) {
	return {
		id: 'enq-1',
		created_at: '2026-07-24T10:00:00Z',
		name: 'Jane',
		email: 'jane@example.invalid',
		message: 'Is the cottage free in September?',
		locale: 'en',
		status: 'new',
		spam_reason: null,
		admin_notified_at: null,
		ack_sent_at: null,
		notify_error: null,
		...overrides
	};
}

function call(body: unknown, authed = true) {
	return PATCH({
		locals: makeLocals(authed),
		request: new Request('http://localhost/api/admin/enquiries', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	} as any);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('PATCH /api/admin/enquiries — guards', () => {
	it('401 without an authenticated user', async () => {
		const res = await call({ id: 'enq-1', status: 'replied' }, false);
		expect(res.status).toBe(401);
		expect(getEnquiry).not.toHaveBeenCalled();
	});

	it('400 when id is missing', async () => {
		const res = await call({ status: 'replied' });
		expect(res.status).toBe(400);
		expect((await res.json()).error).toMatch(/Missing id/);
	});

	it('400 when status is not a known value', async () => {
		const res = await call({ id: 'enq-1', status: 'deleted' });
		expect(res.status).toBe(400);
		expect((await res.json()).error).toMatch(/status must be one of/);
	});

	it('404 when the enquiry does not exist', async () => {
		vi.mocked(getEnquiry).mockResolvedValueOnce(null);
		const res = await call({ id: 'nope', status: 'replied' });
		expect(res.status).toBe(404);
		expect(updateEnquiryStatus).not.toHaveBeenCalled();
	});

	it('tolerates a body that is not JSON at all', async () => {
		const res = await PATCH({
			locals: makeLocals(true),
			request: new Request('http://localhost/api/admin/enquiries', { method: 'PATCH', body: 'not json' })
		} as any);
		expect(res.status).toBe(400);
	});
});

describe('PATCH /api/admin/enquiries — allowed transitions', () => {
	const allowed: [string, string][] = [
		['new', 'replied'],
		['new', 'archived'],
		['replied', 'archived'],
		['replied', 'new'],
		['archived', 'new'],
		['spam', 'new']
	];

	for (const [from, to] of allowed) {
		it(`allows ${from} -> ${to}`, async () => {
			vi.mocked(getEnquiry).mockResolvedValueOnce(enquiry({ status: from }) as any);
			vi.mocked(updateEnquiryStatus).mockResolvedValueOnce(enquiry({ status: to }) as any);

			const res = await call({ id: 'enq-1', status: to });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body.success).toBe(true);
			expect(body.enquiry.status).toBe(to);
			expect(updateEnquiryStatus).toHaveBeenCalledWith('enq-1', to);
		});
	}

	it('is a no-op when the status already matches, without writing', async () => {
		vi.mocked(getEnquiry).mockResolvedValueOnce(enquiry({ status: 'replied' }) as any);
		const res = await call({ id: 'enq-1', status: 'replied' });
		expect(res.status).toBe(200);
		expect(updateEnquiryStatus).not.toHaveBeenCalled();
		expect(logAdminEvent).not.toHaveBeenCalled();
	});
});

describe('PATCH /api/admin/enquiries — refused transitions', () => {
	// Nothing may be moved *into* spam from here, and a spam row may only be
	// rescued to 'new' — landing it straight on 'replied'/'archived' would skip
	// the notification the classifier suppressed.
	const refused: [string, string][] = [
		['new', 'spam'],
		['replied', 'spam'],
		['archived', 'spam'],
		['archived', 'replied'],
		['spam', 'replied'],
		['spam', 'archived']
	];

	for (const [from, to] of refused) {
		it(`409 on ${from} -> ${to}`, async () => {
			vi.mocked(getEnquiry).mockResolvedValueOnce(enquiry({ status: from }) as any);
			const res = await call({ id: 'enq-1', status: to });
			expect(res.status).toBe(409);
			expect((await res.json()).error).toMatch(new RegExp(`from ${from} to ${to}`));
			expect(updateEnquiryStatus).not.toHaveBeenCalled();
		});
	}
});

describe('PATCH /api/admin/enquiries — audit trail', () => {
	it('logs the transition against the acting user', async () => {
		vi.mocked(getEnquiry).mockResolvedValueOnce(enquiry({ status: 'new' }) as any);
		vi.mocked(updateEnquiryStatus).mockResolvedValueOnce(enquiry({ status: 'replied' }) as any);

		await call({ id: 'enq-1', status: 'replied' });

		expect(logAdminEvent).toHaveBeenCalledWith({
			user_id: 'user-123',
			action: 'enquiry.status_change',
			target_type: 'enquiry',
			target_id: 'enq-1',
			metadata: { from: 'new', to: 'replied', spam_reason: null, was_notified: false }
		});
	});

	it('records which spam rule misfired when a false positive is rescued', async () => {
		vi.mocked(getEnquiry).mockResolvedValueOnce(
			enquiry({ status: 'spam', spam_reason: 'token_bad_signature' }) as any
		);
		vi.mocked(updateEnquiryStatus).mockResolvedValueOnce(enquiry({ status: 'new' }) as any);

		await call({ id: 'enq-1', status: 'new' });

		expect(vi.mocked(logAdminEvent).mock.calls[0][0].metadata).toMatchObject({
			from: 'spam',
			to: 'new',
			spam_reason: 'token_bad_signature'
		});
	});

	it('notes when the enquiry had already been emailed out', async () => {
		vi.mocked(getEnquiry).mockResolvedValueOnce(
			enquiry({ status: 'new', admin_notified_at: '2026-07-24T10:01:00Z' }) as any
		);
		vi.mocked(updateEnquiryStatus).mockResolvedValueOnce(enquiry({ status: 'replied' }) as any);

		await call({ id: 'enq-1', status: 'replied' });

		expect(vi.mocked(logAdminEvent).mock.calls[0][0].metadata).toMatchObject({ was_notified: true });
	});
});
