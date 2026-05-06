// Tiny in-memory rate limiter for state-changing public endpoints.
//
// Caveat: this is per-Netlify-Function instance. Cold starts reset the
// counters and parallel instances each have their own map. That is fine
// against bots and casual abuse — the bar we need before launch — but
// not against a coordinated DoS. Upgrade to a Netlify Edge Function or
// Cloudflare WAF if traffic warrants it.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweepExpired(now: number) {
	if (now - lastSweep < SWEEP_INTERVAL_MS) return;
	lastSweep = now;
	for (const [k, v] of buckets) {
		if (v.resetAt < now) buckets.delete(k);
	}
}

export type RateLimitResult =
	| { allowed: true }
	| { allowed: false; retryAfterSec: number };

export function rateLimit(
	key: string,
	maxRequests: number,
	windowMs: number
): RateLimitResult {
	const now = Date.now();
	sweepExpired(now);

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true };
	}
	if (bucket.count >= maxRequests) {
		return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
	}
	bucket.count += 1;
	return { allowed: true };
}

// Convenience helper for SvelteKit endpoints — returns null if allowed,
// or a Response (HTTP 429) ready to return if not.
export function rateLimitResponse(
	key: string,
	maxRequests: number,
	windowMs: number
): Response | null {
	const result = rateLimit(key, maxRequests, windowMs);
	if (result.allowed) return null;
	return new Response(
		JSON.stringify({ error: 'rate_limited', retry_after: result.retryAfterSec }),
		{
			status: 429,
			headers: {
				'Content-Type': 'application/json',
				'Retry-After': String(result.retryAfterSec)
			}
		}
	);
}

// Test-only: clear all buckets between tests.
export function _resetRateLimitState() {
	buckets.clear();
	lastSweep = 0;
}
