// B-06 Phase 2: server-side Stripe client wrapper.
//
// Lazy-initialised. Returns null when STRIPE_SECRET_KEY is unset so callers
// can fail soft (HTTP 503) during the dark-deploy window before Mark sends
// the test keys, rather than crashing on import.
//
// Webhook signature verification needs raw body, not parsed JSON — see
// src/routes/api/stripe/webhook/+server.ts for the SvelteKit-specific
// handling.

import Stripe from 'stripe';
import { env as privateEnv } from '$env/dynamic/private';

let cached: Stripe | null | undefined = undefined;

export function getStripe(): Stripe | null {
	if (cached !== undefined) return cached;
	const key = privateEnv.STRIPE_SECRET_KEY;
	if (!key) {
		cached = null;
		return null;
	}
	cached = new Stripe(key, {
		// Pin the API version so a Stripe-side change doesn't silently
		// alter event payload shape under us. Bump deliberately when
		// tested against new behaviour.
		apiVersion: '2026-04-22.dahlia',
		typescript: true
	});
	return cached;
}

export function getWebhookSecret(): string | null {
	return privateEnv.STRIPE_WEBHOOK_SECRET ?? null;
}

// Test-only: reset the lazy cache so unit tests can swap env between cases.
export function _resetStripeCacheForTests() {
	cached = undefined;
}
