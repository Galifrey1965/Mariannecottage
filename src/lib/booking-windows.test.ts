// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeBookableWindows } from './booking-windows';
import type { RatePlan } from '$lib/server/supabase';

// A stub rate plan covering the whole test horizon. Exercises the price
// computation without coupling tests to any real plan structure.
const stubPlan: RatePlan = {
	id: 'stub',
	created_at: '2026-01-01',
	updated_at: '2026-01-01',
	name: 'Stub',
	rate_per_night: 100,
	rate_2_guests: 110,
	rate_3_guests: 120,
	rate_4_guests: 130,
	valid_from: '2026-01-01',
	valid_until: '2026-12-31',
	is_active: true
};

const earliest = new Date(2026, 4, 6); // 6 May 2026
const latest = new Date(2026, 6, 5); // 5 Jul 2026 — 60 day horizon

function buildAvailability(blockedRanges: Array<[string, string]>): Record<string, boolean> {
	const map: Record<string, boolean> = {};
	for (const [from, to] of blockedRanges) {
		const start = new Date(from + 'T00:00:00Z');
		const end = new Date(to + 'T00:00:00Z');
		for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
			map[d.toISOString().slice(0, 10)] = false;
		}
	}
	return map;
}

describe('computeBookableWindows', () => {
	it('returns one window covering the full horizon when nothing is booked', () => {
		const windows = computeBookableWindows({
			availability: {},
			checkoutOnlyDates: [],
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		expect(windows).toHaveLength(1);
		expect(windows[0].from).toBe('2026-05-06');
		expect(windows[0].nights).toBeGreaterThanOrEqual(60);
		expect(windows[0].floorPrice).not.toBeNull();
	});

	it('splits the horizon around a single existing booking', () => {
		// Booking 16→18 May → window 1 ends 16 May (checkout-only), window 2
		// starts 18 May (after the booking ends — check-out morning is free).
		const windows = computeBookableWindows({
			availability: buildAvailability([['2026-05-16', '2026-05-18']]),
			checkoutOnlyDates: ['2026-05-16'],
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		expect(windows.length).toBeGreaterThanOrEqual(2);
		const w1 = windows[0];
		expect(w1.from).toBe('2026-05-06');
		expect(w1.to).toBe('2026-05-16');
		expect(w1.nights).toBe(10);
		const w2 = windows[1];
		expect(w2.from).toBe('2026-05-18');
	});

	it('treats same-day turnover correctly: window can end on next booking check-in', () => {
		// Existing booking 18→22; window before it ends 18 May (a guest can
		// leave the morning of 18 while the existing booking checks in that
		// afternoon). Without the same-day-turnover handling the window
		// would be one night shorter.
		const windows = computeBookableWindows({
			availability: buildAvailability([['2026-05-18', '2026-05-22']]),
			checkoutOnlyDates: ['2026-05-18'],
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		const first = windows[0];
		expect(first.from).toBe('2026-05-06');
		expect(first.to).toBe('2026-05-18');
		expect(first.nights).toBe(12);
	});

	it('skips runs shorter than minNights', () => {
		// Two bookings creating a 1-night gap: 14→15 booking, then 16→18.
		// Free day 15 alone can't form a 2-night stay (orphan); must be
		// excluded from the windows list.
		const windows = computeBookableWindows({
			availability: buildAvailability([
				['2026-05-12', '2026-05-15'],
				['2026-05-16', '2026-05-18']
			]),
			checkoutOnlyDates: ['2026-05-12', '2026-05-16'],
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		// No window should cover only 15 May.
		const orphanWindow = windows.find((w) => w.from === '2026-05-15');
		expect(orphanWindow).toBeUndefined();
		// First window ends at 12 May (next booking's check-in).
		expect(windows[0].to).toBe('2026-05-12');
	});

	it('prices each window with the floor price = 1-guest nightly × minNights', () => {
		// Floor advertising price: a 3-night window at £100/night with a
		// 2-night minimum reads "from £200" — the cheapest stay possible,
		// not the full-window total. Stops the card mis-quoting longer
		// stays as their starting price.
		const windows = computeBookableWindows({
			availability: buildAvailability([['2026-05-09', '2026-05-11']]),
			checkoutOnlyDates: ['2026-05-09'],
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		const w1 = windows[0];
		expect(w1.from).toBe('2026-05-06');
		expect(w1.to).toBe('2026-05-09');
		expect(w1.nights).toBe(3);
		expect(w1.nightlyFromPrice).toBe(100);
		expect(w1.floorPrice).toBe(200); // 100 × minNights(2)
	});

	it('returns no price when no rate plan covers the window', () => {
		const windows = computeBookableWindows({
			availability: {},
			checkoutOnlyDates: [],
			ratePlans: [], // no plans at all
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		expect(windows[0].floorPrice).toBeNull();
		expect(windows[0].nightlyFromPrice).toBeNull();
	});

	it('returns an empty list when the whole horizon is blocked', () => {
		const blocked = buildAvailability([['2026-05-06', '2026-07-06']]);
		// Mark every blocked day as a check-in too — pessimistic case where
		// every single day is somebody's first night, so no run of free
		// days exists anywhere in the horizon.
		const checkoutOnly = Object.keys(blocked);
		const windows = computeBookableWindows({
			availability: blocked,
			checkoutOnlyDates: checkoutOnly,
			ratePlans: [stubPlan],
			earliestCheckIn: earliest,
			latestCheckIn: latest,
			minNights: 2
		});
		expect(windows).toEqual([]);
	});
});
