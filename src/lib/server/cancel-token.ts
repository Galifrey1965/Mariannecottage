// PR 4: HMAC-signed cancellation magic-link tokens for guest-initiated cancels.
//
// Token format: <base64url(payload-json)>.<base64url(hmac-sha256(payload, secret))>
//
// Payload is { bid, ref, exp } — booking id (uuid), booking reference (display),
// expiry (unix seconds). The token engine verifies signature + expiry only;
// "used once" replay protection is a DB column (bookings.cancellation_token_used_at)
// checked + set by the cancel route. Two layers because the HMAC alone is replay-
// vulnerable for the lifetime of the signed expiry, and the DB-only flag would
// require a DB hit even for tampered URLs.
//
// Secret: env var CANCEL_TOKEN_SECRET. Generate with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env as privateEnv } from '$env/dynamic/private';

export interface CancelTokenPayload {
	bid: string;     // booking id (uuid)
	ref: string;     // booking_reference (display only)
	exp: number;     // unix seconds
}

export class CancelTokenError extends Error {
	constructor(public reason: 'malformed' | 'signature' | 'expired' | 'no_secret') {
		super(`cancel token ${reason}`);
		this.name = 'CancelTokenError';
	}
}

function getSecret(): string {
	const s = privateEnv.CANCEL_TOKEN_SECRET;
	if (!s) throw new CancelTokenError('no_secret');
	return s;
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

function sign(payloadEncoded: string, secret: string): string {
	const mac = createHmac('sha256', secret).update(payloadEncoded).digest();
	return b64urlEncode(mac);
}

export function signCancelToken(payload: CancelTokenPayload): string {
	const secret = getSecret();
	const json = JSON.stringify(payload);
	const payloadEncoded = b64urlEncode(json);
	const sigEncoded = sign(payloadEncoded, secret);
	return `${payloadEncoded}.${sigEncoded}`;
}

export function verifyCancelToken(token: string, now?: number): CancelTokenPayload {
	const secret = getSecret();
	const parts = token.split('.');
	if (parts.length !== 2) throw new CancelTokenError('malformed');
	const [payloadEncoded, sigEncoded] = parts;
	if (!payloadEncoded || !sigEncoded) throw new CancelTokenError('malformed');

	const expectedSig = sign(payloadEncoded, secret);
	const a = Buffer.from(expectedSig);
	const b = Buffer.from(sigEncoded);
	// Length-mismatch shortcut — timingSafeEqual throws on different-length inputs.
	if (a.length !== b.length || !timingSafeEqual(a, b)) {
		throw new CancelTokenError('signature');
	}

	let payload: CancelTokenPayload;
	try {
		const json = b64urlDecode(payloadEncoded).toString('utf8');
		payload = JSON.parse(json) as CancelTokenPayload;
	} catch {
		throw new CancelTokenError('malformed');
	}
	if (
		typeof payload?.bid !== 'string' ||
		typeof payload?.ref !== 'string' ||
		typeof payload?.exp !== 'number'
	) {
		throw new CancelTokenError('malformed');
	}

	const nowSec = Math.floor((now ?? Date.now()) / 1000);
	if (payload.exp <= nowSec) throw new CancelTokenError('expired');

	return payload;
}

// Helper: compute a sensible expiry given a check-in date (ISO string).
// Returns unix seconds. We give 24h past midnight on the check-in day so a
// guest who realises at the last moment can still cancel via the link they
// were emailed at booking time. Post-check-in cancels are rejected by the
// booking-status check separately, so this isn't a real footgun.
export function expiryForCheckIn(checkInDate: string): number {
	const d = new Date(`${checkInDate.slice(0, 10)}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return Math.floor(d.getTime() / 1000);
}
