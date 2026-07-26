// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

const SECRET = 'test-secret-32-bytes-yes-really-long-enough';

vi.mock('$env/dynamic/private', () => ({
	env: { CANCEL_TOKEN_SECRET: 'test-secret-32-bytes-yes-really-long-enough' }
}));

import {
	signFormToken,
	verifyFormToken,
	MIN_FILL_MS,
	MAX_AGE_MS
} from './form-token';

function b64url(s: string | Buffer): string {
	const b = typeof s === 'string' ? Buffer.from(s, 'utf8') : s;
	return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Pinned to an exact second boundary. iat is stored in whole seconds, so a
// Date.now() with a sub-second remainder would be floored and shift the
// measured age by up to 999 ms — enough to make the boundary cases flaky.
const ISSUED_AT = 1_800_000_000_000;

// A time comfortably inside the accepted window: past the fill floor, well
// short of expiry.
const OK_AGE_MS = MIN_FILL_MS + 5_000;

describe('signFormToken / verifyFormToken — round-trip', () => {
	it('accepts a token once the fill floor has passed', () => {
		const token = signFormToken(ISSUED_AT);
		expect(verifyFormToken(token, ISSUED_AT + OK_AGE_MS)).toEqual({ ok: true });
	});

	it('produces two base64url segments separated by a dot', () => {
		const token = signFormToken();
		expect(token.split('.')).toHaveLength(2);
		expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
	});

	it('carries only an iat claim — no IP, user agent or other PII', () => {
		const token = signFormToken();
		const payload = JSON.parse(
			Buffer.from(token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
		);
		expect(Object.keys(payload)).toEqual(['iat']);
	});
});

describe('verifyFormToken — rejection paths', () => {
	it('rejects a malformed token (no dot)', () => {
		expect(verifyFormToken('garbage')).toEqual({ ok: false, reason: 'malformed' });
	});

	it('rejects a malformed token (empty payload segment)', () => {
		expect(verifyFormToken('.signaturepart')).toEqual({ ok: false, reason: 'malformed' });
	});

	it('rejects a tampered payload', () => {
		const [, sig] = signFormToken(ISSUED_AT).split('.');
		const tampered = `${b64url(JSON.stringify({ iat: Math.floor(ISSUED_AT / 1000) - 99 }))}.${sig}`;
		expect(verifyFormToken(tampered, ISSUED_AT + OK_AGE_MS)).toEqual({
			ok: false,
			reason: 'signature'
		});
	});

	it('rejects a tampered signature', () => {
		const [payload] = signFormToken(ISSUED_AT).split('.');
		const tampered = `${payload}.WrongSignatureBytesXXXXXXXXXXXXXXXXXXXXXXXX`;
		expect(verifyFormToken(tampered, ISSUED_AT + OK_AGE_MS)).toEqual({
			ok: false,
			reason: 'signature'
		});
	});

	it('rejects a token submitted faster than a human could type (too_fast)', () => {
		const token = signFormToken(ISSUED_AT);
		expect(verifyFormToken(token, ISSUED_AT + MIN_FILL_MS - 1)).toEqual({
			ok: false,
			reason: 'too_fast'
		});
	});

	it('reports expired past the max age', () => {
		const token = signFormToken(ISSUED_AT);
		expect(verifyFormToken(token, ISSUED_AT + MAX_AGE_MS + 1_000)).toEqual({
			ok: false,
			reason: 'expired'
		});
	});

	it('treats a future-dated token as too_fast rather than accepting it', () => {
		const token = signFormToken(ISSUED_AT + 60_000);
		expect(verifyFormToken(token, ISSUED_AT)).toEqual({ ok: false, reason: 'too_fast' });
	});

	it('rejects a validly-signed token whose payload is not JSON', async () => {
		const fakePayload = b64url('not-json');
		const { createHmac } = await import('node:crypto');
		const key = createHmac('sha256', SECRET).update('enquiry-form-v1').digest();
		const sig = b64url(createHmac('sha256', key).update(fakePayload).digest());
		expect(verifyFormToken(`${fakePayload}.${sig}`)).toEqual({ ok: false, reason: 'malformed' });
	});

	it('rejects a validly-signed token whose iat is not a number', async () => {
		const fakePayload = b64url(JSON.stringify({ iat: 'soon' }));
		const { createHmac } = await import('node:crypto');
		const key = createHmac('sha256', SECRET).update('enquiry-form-v1').digest();
		const sig = b64url(createHmac('sha256', key).update(fakePayload).digest());
		expect(verifyFormToken(`${fakePayload}.${sig}`)).toEqual({ ok: false, reason: 'malformed' });
	});
});

describe('domain separation from cancel-token', () => {
	it('does not sign with the raw secret, so a cancel token cannot pass as a form token', async () => {
		const payload = b64url(JSON.stringify({ iat: Math.floor(ISSUED_AT / 1000) }));
		const { createHmac } = await import('node:crypto');
		// Signed with the bare secret — i.e. the way cancel-token.ts signs.
		const rawSig = b64url(createHmac('sha256', SECRET).update(payload).digest());
		expect(verifyFormToken(`${payload}.${rawSig}`, ISSUED_AT + OK_AGE_MS)).toEqual({
			ok: false,
			reason: 'signature'
		});
	});
});

describe('secret missing', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('signFormToken throws no_secret when CANCEL_TOKEN_SECRET is unset', async () => {
		vi.doMock('$env/dynamic/private', () => ({ env: { CANCEL_TOKEN_SECRET: '' } }));
		const mod = await import('./form-token');
		expect(() => mod.signFormToken()).toThrowError(/no_secret/);
	});

	it('verifyFormToken reports no_secret rather than throwing', async () => {
		vi.doMock('$env/dynamic/private', () => ({ env: { CANCEL_TOKEN_SECRET: '' } }));
		const mod = await import('./form-token');
		expect(mod.verifyFormToken('anything.atall')).toEqual({ ok: false, reason: 'no_secret' });
	});
});
