// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Stub the supabase clients before importing — the helpers we test
// (rateForGuestCount) are pure, but the module imports clients at top-level.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'http://x', PUBLIC_SUPABASE_ANON_KEY: 'k' }
}));
vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_SERVICE_ROLE_KEY: 'k' }
}));
vi.mock('@supabase/supabase-js', () => ({
	createClient: () => ({})
}));

import { rateForGuestCount, type RatePlan } from './supabase';

const plan: RatePlan = {
	id: 'p1',
	created_at: '2026-05-03T00:00:00Z',
	updated_at: '2026-05-03T00:00:00Z',
	name: 'Test',
	rate_per_night: 100,
	rate_2_guests: 120,
	rate_3_guests: 140,
	rate_4_guests: 160,
	valid_from: '2026-01-01',
	valid_until: '2026-12-31',
	is_active: true
};

describe('rateForGuestCount', () => {
	it.each([
		[1, 100],
		[2, 120],
		[3, 140],
		[4, 160]
	])('returns rate for %i guests as %i', (n, expected) => {
		expect(rateForGuestCount(plan, n)).toBe(expected);
	});

	it('throws for out-of-range guest count', () => {
		expect(() => rateForGuestCount(plan, 0)).toThrow(/out of range/);
		expect(() => rateForGuestCount(plan, 5)).toThrow(/out of range/);
	});
});
