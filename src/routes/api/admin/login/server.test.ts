// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './+server';

function makeCookies() {
	const store: Record<string, string> = {};
	return {
		get: vi.fn((key: string) => store[key]),
		set: vi.fn((key: string, value: string) => { store[key] = value; }),
		delete: vi.fn((key: string) => { delete store[key]; })
	};
}

function makeLoginRequest(password: string) {
	return {
		request: new Request('http://localhost/api/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password })
		}),
		cookies: makeCookies()
	} as any;
}

describe('POST /api/admin/login', () => {
	it('200 and sets cookie for correct password', async () => {
		const event = makeLoginRequest('marianne2024');
		const res = await POST(event);
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(event.cookies.set).toHaveBeenCalledWith(
			'admin_session',
			'authenticated',
			expect.objectContaining({ httpOnly: true })
		);
	});

	it('401 for wrong password', async () => {
		const event = makeLoginRequest('wrongpassword');
		const res = await POST(event);
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});
});

describe('DELETE /api/admin/login', () => {
	it('clears admin_session cookie', async () => {
		const cookies = makeCookies();
		const res = await DELETE({ cookies } as any);
		expect(res.status).toBe(200);
		expect(cookies.delete).toHaveBeenCalledWith('admin_session', expect.objectContaining({ path: '/' }));
	});
});
