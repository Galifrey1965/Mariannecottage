// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/email', () => ({
	emailService: {
		sendEnquiry: vi.fn()
	}
}));

vi.mock('$lib/server/supabase', () => ({
	createEnquiry: vi.fn(async () => 'enq-1'),
	markEnquiryNotified: vi.fn(async () => undefined),
	markEnquiryNotifyFailed: vi.fn(async () => undefined)
}));

vi.mock('$env/dynamic/private', () => ({
	env: { CANCEL_TOKEN_SECRET: 'test-secret-32-bytes-yes-really-long-enough' }
}));

import { POST } from './+server';
import { emailService } from '$lib/server/email';
import {
	createEnquiry,
	markEnquiryNotified,
	markEnquiryNotifyFailed
} from '$lib/server/supabase';
import { signFormToken, MIN_FILL_MS, MAX_AGE_MS } from '$lib/server/form-token';
import { _resetRateLimitState } from '$lib/server/rate-limit';

// Unique IP per call so the in-memory rate limiter (5/min/IP) doesn't
// 429 the later tests in the suite.
let ipCounter = 0;
function makeRequest(body: Record<string, unknown>) {
	const ip = `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`;
	ipCounter += 1;
	return {
		request: new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}),
		getClientAddress: () => ip
	} as any;
}

const validBody = {
	name: 'Jane Doe',
	email: 'jane@example.com',
	message: 'Hello, I would like to book a room for next month.'
};

// A token old enough to clear the fill floor but nowhere near expiry.
function goodToken() {
	return signFormToken(Date.now() - (MIN_FILL_MS + 7_000));
}

beforeEach(() => {
	vi.clearAllMocks();
	_resetRateLimitState();
	vi.mocked(createEnquiry).mockResolvedValue('enq-1');
});

describe('POST /api/contact — validation (unchanged, still 400)', () => {
	it('400 when name missing', async () => {
		const res = await POST(makeRequest({ email: 'a@b.com', message: 'Hello there world' }));
		expect(res.status).toBe(400);
	});

	it('400 when email missing', async () => {
		const res = await POST(makeRequest({ name: 'Jane', message: 'Hello there world' }));
		expect(res.status).toBe(400);
	});

	it('400 when message missing', async () => {
		const res = await POST(makeRequest({ name: 'Jane', email: 'a@b.com' }));
		expect(res.status).toBe(400);
	});

	it('400 when name too short', async () => {
		const res = await POST(makeRequest({ ...validBody, name: 'J' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('name');
	});

	it('400 for invalid email', async () => {
		const res = await POST(makeRequest({ ...validBody, email: 'not-email' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('email');
	});

	it('400 when message < 10 chars', async () => {
		const res = await POST(makeRequest({ ...validBody, message: 'Hi' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('10 characters');
	});

	it('does not persist anything when validation fails', async () => {
		await POST(makeRequest({ ...validBody, email: 'not-email' }));
		expect(createEnquiry).not.toHaveBeenCalled();
	});
});

describe('POST /api/contact — happy path', () => {
	it('persists the enquiry as new, emails it, and marks it notified', async () => {
		const res = await POST(makeRequest({ ...validBody, token: goodToken() }));
		expect(res.status).toBe(200);
		expect((await res.json()).success).toBe(true);

		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Jane Doe',
				email: 'jane@example.com',
				status: 'new',
				spam_reason: null
			})
		);
		expect(emailService.sendEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com' }),
			expect.stringMatching(/^(en|fr|de)$/)
		);
		expect(markEnquiryNotified).toHaveBeenCalledWith('enq-1');
		expect(markEnquiryNotifyFailed).not.toHaveBeenCalled();
	});

	it('persists before it notifies', async () => {
		const order: string[] = [];
		vi.mocked(createEnquiry).mockImplementationOnce(async () => {
			order.push('insert');
			return 'enq-1';
		});
		vi.mocked(emailService.sendEnquiry).mockImplementationOnce(async () => {
			order.push('send');
		});
		await POST(makeRequest(validBody));
		expect(order).toEqual(['insert', 'send']);
	});

	it('passes explicit locale through to both the row and the email', async () => {
		const res = await POST(makeRequest({ ...validBody, locale: 'fr' }));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ locale: 'fr' }));
		expect(emailService.sendEnquiry).toHaveBeenCalledWith(expect.any(Object), 'fr');
	});
});

// The regression test for the 2026-07-24 incident. Before this change the same
// scenario returned 500 and destroyed the enquiry.
describe('POST /api/contact — Brevo failure is no longer destructive', () => {
	it('returns 200, keeps the row, and records notify_error when the send throws', async () => {
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(
			new Error('Brevo error 401: unauthorized IP address 35.170.242.107')
		);

		const res = await POST(makeRequest(validBody));

		expect(res.status).toBe(200);
		expect((await res.json()).success).toBe(true);
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ status: 'new' }));
		// Third argument is E-02's attempt counter: this failure is attempt 1, so
		// the daily retry sweep has four more before it gives up on the row.
		expect(markEnquiryNotifyFailed).toHaveBeenCalledWith(
			'enq-1',
			expect.stringContaining('unauthorized IP address'),
			1
		);
		expect(markEnquiryNotified).not.toHaveBeenCalled();
	});

	it('still returns 200 when recording notify_error itself fails', async () => {
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(new Error('SMTP fail'));
		vi.mocked(markEnquiryNotifyFailed).mockRejectedValueOnce(new Error('db down'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
	});
});

describe('POST /api/contact — honeypot', () => {
	it('stores a honeypot hit as spam and never emails it', async () => {
		const res = await POST(
			makeRequest({
				name: 'Bot',
				email: 'bot@example.invalid',
				message: 'cheap watches for sale here',
				website: 'http://spam.example'
			})
		);

		expect(res.status).toBe(200);
		expect((await res.json()).success).toBe(true);
		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'spam', spam_reason: 'honeypot' })
		);
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});

	it('ignores an empty or whitespace-only honeypot', async () => {
		await POST(makeRequest({ ...validBody, website: '   ' }));
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ status: 'new' }));
		expect(emailService.sendEnquiry).toHaveBeenCalled();
	});
});

describe('POST /api/contact — form token', () => {
	it('treats a missing token as genuine', async () => {
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ status: 'new' }));
		expect(emailService.sendEnquiry).toHaveBeenCalled();
	});

	it('treats a null token as genuine', async () => {
		const res = await POST(makeRequest({ ...validBody, token: null }));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ status: 'new' }));
		expect(emailService.sendEnquiry).toHaveBeenCalled();
	});

	it('flags a submission faster than the fill floor as spam', async () => {
		const res = await POST(makeRequest({ ...validBody, token: signFormToken(Date.now()) }));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'spam', spam_reason: 'token_too_fast' })
		);
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});

	it('treats an expired token as genuine — the tab was just left open', async () => {
		const stale = signFormToken(Date.now() - (MAX_AGE_MS + 60_000));
		const res = await POST(makeRequest({ ...validBody, token: stale }));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({ status: 'new' }));
		expect(emailService.sendEnquiry).toHaveBeenCalled();
	});

	it('flags a tampered signature as spam', async () => {
		const [payload] = goodToken().split('.');
		const res = await POST(
			makeRequest({ ...validBody, token: `${payload}.WrongSignatureBytesXXXXXXXXXXXX` })
		);
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'spam', spam_reason: 'token_signature' })
		);
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});

	it('flags a malformed token as spam', async () => {
		const res = await POST(makeRequest({ ...validBody, token: 'garbage' }));
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'spam', spam_reason: 'token_malformed' })
		);
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});

	it('lets the honeypot win over the token verdict', async () => {
		const res = await POST(
			makeRequest({ ...validBody, website: 'http://spam.example', token: 'garbage' })
		);
		expect(res.status).toBe(200);
		expect(createEnquiry).toHaveBeenCalledWith(
			expect.objectContaining({ spam_reason: 'honeypot' })
		);
	});
});

describe('POST /api/contact — insert failure fallbacks', () => {
	it('200 when the insert fails but the email gets through', async () => {
		vi.mocked(createEnquiry).mockRejectedValueOnce(new Error('db down'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
		expect(emailService.sendEnquiry).toHaveBeenCalled();
		expect(markEnquiryNotified).not.toHaveBeenCalled();
	});

	it('500 only when the insert and the email both fail', async () => {
		vi.mocked(createEnquiry).mockRejectedValueOnce(new Error('db down'));
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(new Error('SMTP fail'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(500);
	});

	it('does not email a spam-flagged submission even when its insert failed', async () => {
		vi.mocked(createEnquiry).mockRejectedValueOnce(new Error('db down'));
		const res = await POST(
			makeRequest({ ...validBody, website: 'http://spam.example' })
		);
		expect(res.status).toBe(200);
		expect(emailService.sendEnquiry).not.toHaveBeenCalled();
	});
});
