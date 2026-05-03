import { describe, it, expect } from 'vitest';
import {
	computeRefund,
	daysBetween,
	estimateAbsorbedFee,
	selectWindow
} from './cancellation';
import type { CancellationPolicy } from './supabase';

const MODERATE: CancellationPolicy = {
	id: 'p1',
	name: 'Moderate',
	description: 'Test seed',
	schedule: [
		{ days_before_check_in: 14, refund_pct: 100 },
		{ days_before_check_in: 7, refund_pct: 50 },
		{ days_before_check_in: 0, refund_pct: 0 }
	],
	is_default: true,
	created_at: '2026-05-03T00:00:00Z',
	updated_at: '2026-05-03T00:00:00Z'
};

describe('daysBetween', () => {
	it('counts whole days forward', () => {
		expect(daysBetween('2026-05-03', '2026-05-17')).toBe(14);
	});
	it('returns 0 for same day', () => {
		expect(daysBetween('2026-05-03', '2026-05-03')).toBe(0);
	});
	it('returns negative for past', () => {
		expect(daysBetween('2026-05-10', '2026-05-03')).toBe(-7);
	});
	it('ignores time-of-day in ISO strings', () => {
		expect(daysBetween('2026-05-03T23:59:59Z', '2026-05-04T00:00:01Z')).toBe(1);
	});
});

describe('selectWindow', () => {
	it('returns the 100% window when far ahead', () => {
		expect(selectWindow(MODERATE.schedule, 30)?.refund_pct).toBe(100);
	});
	it('returns 100% on exact 14-day boundary', () => {
		expect(selectWindow(MODERATE.schedule, 14)?.refund_pct).toBe(100);
	});
	it('drops to 50% one day inside', () => {
		expect(selectWindow(MODERATE.schedule, 13)?.refund_pct).toBe(50);
	});
	it('returns 50% on exact 7-day boundary', () => {
		expect(selectWindow(MODERATE.schedule, 7)?.refund_pct).toBe(50);
	});
	it('drops to 0% one day inside the 7-day window', () => {
		expect(selectWindow(MODERATE.schedule, 6)?.refund_pct).toBe(0);
	});
	it('returns 0% on check-in day', () => {
		expect(selectWindow(MODERATE.schedule, 0)?.refund_pct).toBe(0);
	});
	it('returns null when no window matches a negative day (post check-in)', () => {
		// Schedule's smallest threshold is 0 days; -1 doesn't match.
		expect(selectWindow(MODERATE.schedule, -1)).toBeNull();
	});
	it('returns null on empty schedule', () => {
		expect(selectWindow([], 30)).toBeNull();
	});
});

describe('estimateAbsorbedFee', () => {
	it('estimates ~1.5% + €0.25 for a typical refund', () => {
		// 350 * 0.015 + 0.25 = 5.50
		expect(estimateAbsorbedFee(350)).toBe(5.5);
	});
	it('returns 0 when refund is 0', () => {
		expect(estimateAbsorbedFee(0)).toBe(0);
	});
	it('returns 0 for negative refund (defensive)', () => {
		expect(estimateAbsorbedFee(-10)).toBe(0);
	});
	it('rounds to 2dp', () => {
		// 100 * 0.015 + 0.25 = 1.75
		expect(estimateAbsorbedFee(100)).toBe(1.75);
	});
});

describe('computeRefund — full pipeline', () => {
	it('30 days before check-in → 100% refund of €350 = €350', () => {
		const q = computeRefund({
			policy: MODERATE,
			checkInDate: '2026-06-02',
			totalCost: 350,
			now: '2026-05-03T12:00:00Z'
		});
		expect(q.refund_pct).toBe(100);
		expect(q.refund_amount).toBe(350);
		expect(q.absorbed_fee_estimate).toBe(5.5);
		expect(q.matched_window?.days_before_check_in).toBe(14);
	});

	it('13 days before → 50% of €350 = €175', () => {
		const q = computeRefund({
			policy: MODERATE,
			checkInDate: '2026-05-16',
			totalCost: 350,
			now: '2026-05-03T12:00:00Z'
		});
		expect(q.refund_pct).toBe(50);
		expect(q.refund_amount).toBe(175);
		expect(q.absorbed_fee_estimate).toBe(2.88);
	});

	it('5 days before → 0% refund', () => {
		const q = computeRefund({
			policy: MODERATE,
			checkInDate: '2026-05-08',
			totalCost: 350,
			now: '2026-05-03T12:00:00Z'
		});
		expect(q.refund_pct).toBe(0);
		expect(q.refund_amount).toBe(0);
		expect(q.absorbed_fee_estimate).toBe(0);
	});

	it('post check-in → 0%, no matched window', () => {
		const q = computeRefund({
			policy: MODERATE,
			checkInDate: '2026-05-02',
			totalCost: 350,
			now: '2026-05-03T12:00:00Z'
		});
		expect(q.refund_pct).toBe(0);
		expect(q.refund_amount).toBe(0);
		expect(q.matched_window).toBeNull();
		expect(q.days_before_check_in).toBe(-1);
	});

	it('surfaces policy name on the quote', () => {
		const q = computeRefund({
			policy: MODERATE,
			checkInDate: '2026-06-02',
			totalCost: 350,
			now: '2026-05-03T12:00:00Z'
		});
		expect(q.policy_name).toBe('Moderate');
	});
});
