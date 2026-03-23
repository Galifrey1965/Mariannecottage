// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/email', () => ({
	emailService: {
		sendEnquiry: vi.fn()
	}
}));

import { POST } from './+server';
import { emailService } from '$lib/server/email';

function makeRequest(body: Record<string, unknown>) {
	return {
		request: new Request('http://localhost/api/contact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	} as any;
}

const validBody = {
	name: 'Jane Doe',
	email: 'jane@example.com',
	message: 'Hello, I would like to book a room for next month.'
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /api/contact', () => {
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

	it('200 on success and calls sendEnquiry', async () => {
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(emailService.sendEnquiry).toHaveBeenCalledWith(expect.objectContaining({
			name: 'Jane Doe',
			email: 'jane@example.com'
		}));
	});

	it('500 when emailService throws', async () => {
		vi.mocked(emailService.sendEnquiry).mockRejectedValueOnce(new Error('SMTP fail'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(500);
	});
});
