// 2026-07-26: HMAC-signed timestamp token for the public contact form.
//
// Purpose: give /api/contact a cheap, privacy-preserving way to tell a human
// filling in a form from a bot POSTing straight at the endpoint. The form
// fetches a token on mount; the endpoint checks how long ago it was issued.
// A bot that skips GET /api/contact/token has no token to present, and one
// that submits instantly trips the fill-time floor.
//
// Token format: <base64url(payload-json)>.<base64url(hmac-sha256(payload, key))>
// — the same shape as cancel-token.ts, deliberately.
//
// Payload is { iat } — issued-at, unix seconds. Nothing else: no IP, no user
// agent, no PII. There is nothing in a form token worth stealing, and nothing
// that would need disclosing on /legal.
//
// Key: derived from the existing CANCEL_TOKEN_SECRET rather than a new env var,
// so this ships without Mark having to set anything in Netlify first. The
// derivation is what makes reuse safe:
//
//   key = HMAC-SHA256(CANCEL_TOKEN_SECRET, 'enquiry-form-v1')
//
// Domain separation means a form token can never be mistaken for a cancellation
// token or vice versa — the two are signed under different keys even though
// they share a root secret. Keep the version suffix; bump to -v2 if the payload
// shape ever changes, which invalidates outstanding tokens by design.

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';

export interface FormTokenPayload {
	iat: number;     // issued-at, unix seconds
}

export type FormTokenFailure =
	| 'malformed'
	| 'signature'
	| 'too_fast'
	| 'expired'
	| 'no_secret';

export type FormTokenResult =
	| { ok: true }
	| { ok: false; reason: FormTokenFailure };

export class FormTokenError extends Error {
	constructor(public reason: FormTokenFailure) {
		super(`form token ${reason}`);
		this.name = 'FormTokenError';
	}
}

// Nobody reads a form, types a name, an email address and a ten-character
// message in under three seconds. Kept low so a fast, prepared human pasting
// text is never caught.
//
// iat is whole seconds, so the floor is only accurate to the second: the real
// cut-off sits somewhere in 2.001–3.000 s depending on where in the second the
// token was minted. That imprecision is irrelevant to a heuristic this coarse,
// but it does mean boundary tests must pin iat to an exact second.
export const MIN_FILL_MS = 3_000;

// Two hours. Long enough for someone who opened the page, wandered off and came
// back — an expired token is explicitly not treated as spam by /api/contact.
export const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const KEY_DOMAIN = 'enquiry-form-v1';

function getKey(): Buffer {
	const secret = privateEnv.CANCEL_TOKEN_SECRET;
	if (!secret) throw new FormTokenError('no_secret');
	return createHmac('sha256', secret).update(KEY_DOMAIN).digest();
}

function b64urlEncode(buf: Buffer | string): string {
	const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf;
	return b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
	// Restore padding for Node's base64 parser.
	const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
	return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payloadEncoded: string, key: Buffer): string {
	return b64urlEncode(createHmac('sha256', key).update(payloadEncoded).digest());
}

export function signFormToken(now = Date.now()): string {
	const key = getKey();
	const payload: FormTokenPayload = { iat: Math.floor(now / 1000) };
	const payloadEncoded = b64urlEncode(JSON.stringify(payload));
	return `${payloadEncoded}.${sign(payloadEncoded, key)}`;
}

export function verifyFormToken(token: string, now = Date.now()): FormTokenResult {
	let key: Buffer;
	try {
		key = getKey();
	} catch {
		return { ok: false, reason: 'no_secret' };
	}

	const parts = token.split('.');
	if (parts.length !== 2) return { ok: false, reason: 'malformed' };
	const [payloadEncoded, sigEncoded] = parts;
	if (!payloadEncoded || !sigEncoded) return { ok: false, reason: 'malformed' };

	const a = Buffer.from(sign(payloadEncoded, key));
	const b = Buffer.from(sigEncoded);
	// Length-mismatch shortcut — timingSafeEqual throws on different-length inputs.
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		return { ok: false, reason: 'signature' };
	}

	let payload: FormTokenPayload;
	try {
		payload = JSON.parse(b64urlDecode(payloadEncoded).toString('utf8')) as FormTokenPayload;
	} catch {
		return { ok: false, reason: 'malformed' };
	}
	if (typeof payload?.iat !== 'number' || !Number.isFinite(payload.iat)) {
		return { ok: false, reason: 'malformed' };
	}

	// A negative age (clock skew, or a token minted in the future) falls through
	// to too_fast, which is the conservative reading.
	const ageMs = now - payload.iat * 1000;
	if (ageMs < MIN_FILL_MS) return { ok: false, reason: 'too_fast' };
	if (ageMs > MAX_AGE_MS) return { ok: false, reason: 'expired' };

	return { ok: true };
}
