// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: { CANCEL_TOKEN_SECRET: 'test-secret-32-bytes-yes-really-long-enough' }
}));

import {
	signCancelToken,
	verifyCancelToken,
	expiryForCheckIn,
	CancelTokenError
} from './cancel-token';

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days

describe('signCancelToken / verifyCancelToken — round-trip', () => {
	it('signs and verifies a valid payload', () => {
		const payload = { bid: 'b-1', ref: 'MC-XYZ', exp: FUTURE_EXP };
		const token = signCancelToken(payload);
		const decoded = verifyCancelToken(token);
		expect(decoded).toEqual(payload);
	});

	it('produces tokens with two base64url segments separated by a dot', () => {
		const token = signCancelToken({ bid: 'b-1', ref: 'MC-X', exp: FUTURE_EXP });
		expect(token.split('.')).toHaveLength(2);
		// base64url alphabet: A-Z a-z 0-9 - _
		expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
	});
});

describe('verifyCancelToken — rejection paths', () => {
	it('rejects malformed token (no dot)', () => {
		expect(() => verifyCancelToken('garbage')).toThrowError(CancelTokenError);
	});

	it('rejects malformed token (empty payload segment)', () => {
		expect(() => verifyCancelToken('.signaturepart')).toThrowError(CancelTokenError);
	});

	it('rejects tampered payload', () => {
		const token = signCancelToken({ bid: 'b-1', ref: 'MC-X', exp: FUTURE_EXP });
		const [, sig] = token.split('.');
		// Replace payload with a different-but-valid-shape one.
		const tampered = `${Buffer.from(JSON.stringify({ bid: 'b-2', ref: 'MC-Y', exp: FUTURE_EXP })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${sig}`;
		expect(() => verifyCancelToken(tampered)).toThrowError(/signature/);
	});

	it('rejects tampered signature', () => {
		const token = signCancelToken({ bid: 'b-1', ref: 'MC-X', exp: FUTURE_EXP });
		const [payload] = token.split('.');
		const tampered = `${payload}.WrongSignatureBytesXXXXXXXXXXXXXXXXXXXXXXXX`;
		expect(() => verifyCancelToken(tampered)).toThrowError(/signature/);
	});

	it('rejects expired token', () => {
		const token = signCancelToken({ bid: 'b-1', ref: 'MC-X', exp: 1000 });
		expect(() => verifyCancelToken(token)).toThrowError(/expired/);
	});

	it('rejects token whose payload JSON is invalid', async () => {
		// Sign 'not-json' as the payload — the signature will verify, but parse fails.
		const fakePayload = Buffer.from('not-json').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		const { createHmac } = await import('node:crypto');
		const sig = createHmac('sha256', 'test-secret-32-bytes-yes-really-long-enough').update(fakePayload).digest();
		const sigEncoded = sig.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
		expect(() => verifyCancelToken(`${fakePayload}.${sigEncoded}`)).toThrowError(/malformed/);
	});
});

describe('expiryForCheckIn', () => {
	it('returns midnight-after-check-in in unix seconds', () => {
		// 2026-06-15 → expiry at 2026-06-16T00:00:00Z = unix seconds
		const exp = expiryForCheckIn('2026-06-15');
		const expected = Math.floor(Date.UTC(2026, 5, 16, 0, 0, 0) / 1000);
		expect(exp).toBe(expected);
	});

	it('ignores time-of-day in the input string', () => {
		expect(expiryForCheckIn('2026-06-15T23:59:59Z')).toBe(expiryForCheckIn('2026-06-15'));
	});
});

describe('signCancelToken — secret missing', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('throws no_secret when CANCEL_TOKEN_SECRET unset', async () => {
		vi.doMock('$env/dynamic/private', () => ({ env: { CANCEL_TOKEN_SECRET: '' } }));
		const mod = await import('./cancel-token');
		expect(() => mod.signCancelToken({ bid: 'b', ref: 'r', exp: FUTURE_EXP })).toThrowError(/no_secret/);
	});
});
