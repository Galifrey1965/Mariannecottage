// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
	MIN_NIGHTS,
	MIN_LEAD_HOURS,
	getEarliestCheckInDate,
	nightsBetween
} from './booking-policy';

describe('booking-policy constants', () => {
	it('minimum stay is 2 nights', () => {
		expect(MIN_NIGHTS).toBe(2);
	});

	it('lead time is 48 hours', () => {
		expect(MIN_LEAD_HOURS).toBe(48);
	});
});

describe('getEarliestCheckInDate', () => {
	it('returns UTC start-of-day exactly 2 days ahead for the 48h policy', () => {
		// Pinned "now" so the test isn't time-dependent. The function uses
		// UTC anchors deliberately, so we compare via UTC accessors to make
		// the suite TZ-independent (CI agents may not run in UTC).
		const now = new Date('2026-05-06T10:00:00Z');
		const earliest = getEarliestCheckInDate(now);
		expect(earliest.getUTCDate()).toBe(8);
		expect(earliest.getUTCMonth()).toBe(4); // May (0-indexed)
		expect(earliest.getUTCFullYear()).toBe(2026);
		expect(earliest.getUTCHours()).toBe(0);
		expect(earliest.getUTCMinutes()).toBe(0);
	});

	it('end-of-day "now" still resolves to 2 days ahead (does not roll into 3)', () => {
		// Late-UTC-evening booking should still allow check-in 2 days out —
		// the "ceil(48/24)" arithmetic plus the UTC anchor is what guarantees
		// this. Without it, strict hour arithmetic could push forward to a
		// 3rd day around the midnight boundary.
		const now = new Date('2026-05-06T23:30:00Z');
		const earliest = getEarliestCheckInDate(now);
		expect(earliest.getUTCDate()).toBe(8);
		expect(earliest.getUTCMonth()).toBe(4);
	});

	it('start-of-day "now" still resolves to 2 days ahead', () => {
		const now = new Date('2026-05-06T00:00:01Z');
		const earliest = getEarliestCheckInDate(now);
		expect(earliest.getUTCDate()).toBe(8);
	});
});

describe('nightsBetween', () => {
	it('counts whole nights between two ISO dates', () => {
		expect(nightsBetween('2026-05-10', '2026-05-13')).toBe(3);
	});

	it('returns 1 for adjacent days', () => {
		expect(nightsBetween('2026-05-10', '2026-05-11')).toBe(1);
	});

	it('returns 0 for the same day', () => {
		expect(nightsBetween('2026-05-10', '2026-05-10')).toBe(0);
	});

	it('handles month rollover', () => {
		expect(nightsBetween('2026-05-30', '2026-06-02')).toBe(3);
	});
});
