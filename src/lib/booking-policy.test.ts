// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
	MIN_NIGHTS,
	MIN_LEAD_HOURS,
	getEarliestCheckInDate,
	nightsBetween,
	rangesOverlap
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

describe('rangesOverlap (same-day turnover)', () => {
	it('does NOT overlap when one booking ends the morning the next begins', () => {
		// Industry-standard turnover: A leaves morning of 13 May, B arrives
		// afternoon of 13 May. Same calendar date, different halves of the
		// day, no conflict. This is the lost-revenue case the calendar must
		// not block.
		expect(rangesOverlap('2026-05-10', '2026-05-13', '2026-05-13', '2026-05-16')).toBe(false);
	});

	it('does NOT overlap when the new check-out morning equals an existing check-in afternoon', () => {
		// Mirror of the above — the 14→16 booking ends the morning of 16,
		// existing booking checks in afternoon of 16. Should be allowed.
		expect(rangesOverlap('2026-05-14', '2026-05-16', '2026-05-16', '2026-05-19')).toBe(false);
	});

	it('overlaps when a new booking middle night falls on an existing check-in', () => {
		// New booking 14→17 wants to sleep nights 14, 15, 16. Existing
		// booking starts 16. Night of 16 belongs to the existing booking,
		// so this is a real conflict.
		expect(rangesOverlap('2026-05-14', '2026-05-17', '2026-05-16', '2026-05-19')).toBe(true);
	});

	it('overlaps when a new booking starts on an existing check-in', () => {
		expect(rangesOverlap('2026-05-16', '2026-05-19', '2026-05-16', '2026-05-19')).toBe(true);
	});

	it('overlaps on a fully contained range', () => {
		expect(rangesOverlap('2026-05-15', '2026-05-17', '2026-05-10', '2026-05-20')).toBe(true);
	});

	it('does NOT overlap when ranges are entirely disjoint', () => {
		expect(rangesOverlap('2026-05-10', '2026-05-12', '2026-05-20', '2026-05-22')).toBe(false);
	});

	it('is symmetric', () => {
		const a = rangesOverlap('2026-05-14', '2026-05-16', '2026-05-16', '2026-05-19');
		const b = rangesOverlap('2026-05-16', '2026-05-19', '2026-05-14', '2026-05-16');
		expect(a).toBe(b);
	});
});
