// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Stub the supabase clients before importing — the helpers we test
// (rateForGuestCount, resolveSeason) are pure, but the module imports
// clients at top-level.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'http://x', PUBLIC_SUPABASE_ANON_KEY: 'k' }
}));
vi.mock('$env/dynamic/private', () => ({
	env: { SUPABASE_SERVICE_ROLE_KEY: 'k' }
}));
vi.mock('@supabase/supabase-js', () => ({
	createClient: () => ({})
}));

import { rateForGuestCount, resolveSeason, type Season } from './supabase';

function mkSeason(over: Partial<Season> = {}): Season {
	return {
		id: 'p1',
		created_at: '2026-05-03T00:00:00Z',
		updated_at: '2026-05-03T00:00:00Z',
		name: 'Test',
		kind: 'high',
		rate_per_night: 100,
		rate_2_guests: 120,
		rate_3_guests: 140,
		rate_4_guests: 160,
		rate_per_night_nonref: null,
		rate_2_guests_nonref: null,
		rate_3_guests_nonref: null,
		rate_4_guests_nonref: null,
		start_date: '2026-01-01',
		end_date: '2026-12-31',
		is_active: true,
		reviewed_by_admin: true,
		...over
	};
}

describe('rateForGuestCount', () => {
	const plan = mkSeason();
	it.each([
		[1, 100],
		[2, 120],
		[3, 140],
		[4, 160]
	])('returns refundable rate for %i guests as %i (default plan)', (n, expected) => {
		expect(rateForGuestCount(plan, n)).toBe(expected);
	});

	it('throws for out-of-range guest count', () => {
		expect(() => rateForGuestCount(plan, 0)).toThrow(/out of range/);
		expect(() => rateForGuestCount(plan, 5)).toThrow(/out of range/);
	});

	it('returns non-refundable rates when rate_plan=non_refundable', () => {
		const withNonref = mkSeason({
			rate_per_night_nonref: 80,
			rate_2_guests_nonref: 95,
			rate_3_guests_nonref: 110,
			rate_4_guests_nonref: 125
		});
		expect(rateForGuestCount(withNonref, 1, 'non_refundable')).toBe(80);
		expect(rateForGuestCount(withNonref, 2, 'non_refundable')).toBe(95);
		expect(rateForGuestCount(withNonref, 3, 'non_refundable')).toBe(110);
		expect(rateForGuestCount(withNonref, 4, 'non_refundable')).toBe(125);
		// Refundable still returned by default.
		expect(rateForGuestCount(withNonref, 1)).toBe(100);
	});

	it('throws when non_refundable requested on a season with no nonref rates', () => {
		expect(() => rateForGuestCount(mkSeason(), 1, 'non_refundable'))
			.toThrow(/non.refundable/);
	});
});

describe('resolveSeason — smallest-span wins', () => {
	it('returns null on empty input', () => {
		expect(resolveSeason([])).toBeNull();
	});

	it('returns the only season when one matches', () => {
		const high = mkSeason({ id: 'high', start_date: '2026-04-01', end_date: '2026-10-31' });
		expect(resolveSeason([high])?.id).toBe('high');
	});

	it('picks the smaller-span season when two overlap (premium overlay)', () => {
		// High covers Apr–Oct (213 days), Peak overlay covers a 4-day weekend
		// inside it. Peak should win — that is the shape of Mark's
		// "Ascension Weekend on top of High Season" data.
		const high = mkSeason({ id: 'high', kind: 'high', start_date: '2026-04-01', end_date: '2026-10-31' });
		const peak = mkSeason({ id: 'peak', kind: 'peak', start_date: '2026-05-14', end_date: '2026-05-17' });
		expect(resolveSeason([high, peak])?.id).toBe('peak');
		expect(resolveSeason([peak, high])?.id).toBe('peak');
	});

	it('picks the smaller-span season when two overlap (discount overlay)', () => {
		// Discount overlay (cheaper) wins for its dates because it has the
		// smaller span — same rule, regardless of price direction.
		const high = mkSeason({ id: 'high', kind: 'high', rate_per_night: 100, start_date: '2026-04-01', end_date: '2026-10-31' });
		const sale = mkSeason({ id: 'sale', kind: 'low', rate_per_night: 75, start_date: '2026-05-10', end_date: '2026-05-16' });
		expect(resolveSeason([high, sale])?.id).toBe('sale');
	});

	it('breaks span ties on most-recent created_at', () => {
		const a = mkSeason({ id: 'a', start_date: '2026-04-01', end_date: '2026-04-07', created_at: '2026-01-01T00:00:00Z' });
		const b = mkSeason({ id: 'b', start_date: '2026-04-01', end_date: '2026-04-07', created_at: '2026-02-01T00:00:00Z' });
		expect(resolveSeason([a, b])?.id).toBe('b');
	});
});
