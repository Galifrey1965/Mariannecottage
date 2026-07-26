// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabase', () => ({
	listUnnotifiedEnquiries: vi.fn(),
	countAbandonedEnquiries: vi.fn(async () => 0),
	markEnquiryNotified: vi.fn(async () => undefined),
	markEnquiryNotifyFailed: vi.fn(async () => undefined)
}));

vi.mock('./email', () => ({
	emailService: { sendEnquiry: vi.fn(async () => undefined) }
}));

import {
	retryUnnotifiedEnquiries,
	RETRY_MAX_ATTEMPTS,
	RETRY_MAX_AGE_DAYS,
	RETRY_BATCH_LIMIT
} from './enquiry-retry';
import {
	listUnnotifiedEnquiries,
	countAbandonedEnquiries,
	markEnquiryNotified,
	markEnquiryNotifyFailed
} from './supabase';
import { emailService } from './email';

function row(overrides: Record<string, unknown> = {}) {
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
		notify_error: 'Brevo error 401',
		notify_attempts: 1,
		last_notify_attempt_at: '2026-07-24T10:00:01Z',
		...overrides
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(countAbandonedEnquiries).mockResolvedValue(0);
	vi.mocked(emailService.sendEnquiry).mockResolvedValue(undefined);
});

describe('retryUnnotifiedEnquiries — selection', () => {
	it('asks for the right window: attempt ceiling, age ceiling, batch limit', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([]);
		await retryUnnotifiedEnquiries();
		expect(listUnnotifiedEnquiries).toHaveBeenCalledWith({
			maxAttempts: RETRY_MAX_ATTEMPTS,
			maxAgeDays: RETRY_MAX_AGE_DAYS,
			limit: RETRY_BATCH_LIMIT
		});
	});

	it('does nothing and sends nothing when there is no backlog', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([]);
		const result = await retryUnnotifiedEnquiries();
		expect(result).toEqual({ considered: 0, sent: 0, failed: 0, abandoned: 0 });
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});

	it('keeps the batch bounded so it cannot blow the function timeout', () => {
		expect(RETRY_BATCH_LIMIT).toBeLessThanOrEqual(10);
		// Comfortably inside Brevo's 300/day free tier even if every run is full.
		expect(RETRY_BATCH_LIMIT * 1).toBeLessThan(300);
	});
});

describe('retryUnnotifiedEnquiries — successful resend', () => {
	it('sends the admin notice and stamps the incremented attempt count', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([row({ notify_attempts: 2 })] as any);

		const result = await retryUnnotifiedEnquiries();

		expect(result).toMatchObject({ considered: 1, sent: 1, failed: 0 });
		expect(markEnquiryNotified).toHaveBeenCalledWith('enq-1', 3);
		expect(markEnquiryNotifyFailed).not.toHaveBeenCalled();
	});

	it('never re-sends the guest acknowledgement', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([row()] as any);
		await retryUnnotifiedEnquiries();
		expect(emailService.sendEnquiry).toHaveBeenCalledWith(
			{ name: 'Jane', email: 'jane@example.invalid', message: 'Is the cottage free in September?' },
			'en',
			{ includeGuestAck: false }
		);
	});

	it('treats a missing attempt count as zero rather than NaN', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([
			row({ notify_attempts: null })
		] as any);
		await retryUnnotifiedEnquiries();
		expect(markEnquiryNotified).toHaveBeenCalledWith('enq-1', 1);
	});

	it('passes the guest locale through, falling back to en on junk', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([
			row({ id: 'a', locale: 'fr' }),
			row({ id: 'b', locale: 'kl' })
		] as any);
		await retryUnnotifiedEnquiries();
		expect(vi.mocked(emailService.sendEnquiry).mock.calls[0][1]).toBe('fr');
		expect(vi.mocked(emailService.sendEnquiry).mock.calls[1][1]).toBe('en');
	});
});

describe('retryUnnotifiedEnquiries — failure handling', () => {
	it('records the attempt and the error when the send fails again', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([row({ notify_attempts: 3 })] as any);
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(new Error('Brevo error 401: bad IP'));

		const result = await retryUnnotifiedEnquiries();

		expect(result).toMatchObject({ considered: 1, sent: 0, failed: 1 });
		expect(markEnquiryNotifyFailed).toHaveBeenCalledWith('enq-1', 'Brevo error 401: bad IP', 4);
		expect(markEnquiryNotified).not.toHaveBeenCalled();
	});

	it('carries on through the batch after one row fails', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([
			row({ id: 'a' }),
			row({ id: 'b' }),
			row({ id: 'c' })
		] as any);
		vi.mocked(emailService.sendEnquiry)
			.mockRejectedValueOnce(new Error('transient'))
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce(undefined);

		const result = await retryUnnotifiedEnquiries();

		expect(result).toMatchObject({ considered: 3, sent: 2, failed: 1 });
		expect(emailService.sendEnquiry).toHaveBeenCalledTimes(3);
	});

	it('does not abort the batch when the bookkeeping write itself fails', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([
			row({ id: 'a' }),
			row({ id: 'b' })
		] as any);
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(new Error('boom'));
		vi.mocked(markEnquiryNotifyFailed).mockRejectedValueOnce(new Error('db down'));

		const result = await retryUnnotifiedEnquiries();

		expect(result).toMatchObject({ considered: 2, sent: 1, failed: 1 });
	});

	it('stringifies a non-Error rejection rather than storing undefined', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([row()] as any);
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce('plain string failure');
		await retryUnnotifiedEnquiries();
		expect(markEnquiryNotifyFailed).toHaveBeenCalledWith('enq-1', 'plain string failure', 2);
	});
});

describe('retryUnnotifiedEnquiries — giving up', () => {
	it('reports rows that can no longer be retried', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([]);
		vi.mocked(countAbandonedEnquiries).mockResolvedValueOnce(3);

		const result = await retryUnnotifiedEnquiries();

		expect(result.abandoned).toBe(3);
		expect(countAbandonedEnquiries).toHaveBeenCalledWith({
			maxAttempts: RETRY_MAX_ATTEMPTS,
			maxAgeDays: RETRY_MAX_AGE_DAYS
		});
	});

	it('still returns a usable result if the abandoned count query fails', async () => {
		vi.mocked(listUnnotifiedEnquiries).mockResolvedValueOnce([row()] as any);
		vi.mocked(countAbandonedEnquiries).mockRejectedValueOnce(new Error('db down'));

		const result = await retryUnnotifiedEnquiries();

		expect(result).toMatchObject({ considered: 1, sent: 1, abandoned: 0 });
	});

	it('gives a permanently-bad row a bounded number of tries', () => {
		// The guard that matters: the ceiling is finite and small, so a dead
		// sender is retried a handful of times rather than daily forever.
		expect(RETRY_MAX_ATTEMPTS).toBeGreaterThan(1);
		expect(RETRY_MAX_ATTEMPTS).toBeLessThanOrEqual(5);
		expect(RETRY_MAX_AGE_DAYS).toBeLessThanOrEqual(30);
	});
});
