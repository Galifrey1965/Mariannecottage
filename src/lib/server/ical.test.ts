// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseIcal, getBlockedDates } from './ical';

const SAMPLE_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Booking.com//EN
BEGIN:VEVENT
UID:booking-1@booking.com
DTSTART;VALUE=DATE:20260401
DTEND;VALUE=DATE:20260405
SUMMARY:Blocked
END:VEVENT
BEGIN:VEVENT
UID:booking-2@booking.com
DTSTART;VALUE=DATE:20260410
DTEND;VALUE=DATE:20260412
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

describe('parseIcal()', () => {
	it('parses VEVENT blocks into events', () => {
		const events = parseIcal(SAMPLE_ICAL);
		expect(events).toHaveLength(2);
	});

	it('extracts start and end dates', () => {
		const events = parseIcal(SAMPLE_ICAL);
		expect(events[0].start).toBe('2026-04-01');
		expect(events[0].end).toBe('2026-04-05');
	});

	it('returns empty array for empty calendar', () => {
		const empty = `BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR`;
		expect(parseIcal(empty)).toHaveLength(0);
	});

	it('handles DTSTART without VALUE=DATE suffix', () => {
		const ical = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20260501T000000Z
DTEND:20260503T000000Z
END:VEVENT
END:VCALENDAR`;
		const events = parseIcal(ical);
		expect(events[0].start).toBe('2026-05-01');
		expect(events[0].end).toBe('2026-05-03');
	});
});

describe('getBlockedDates()', () => {
	it('returns all dates in blocked range (exclusive end)', () => {
		const events = parseIcal(SAMPLE_ICAL);
		const dates = getBlockedDates(events);
		// 2026-04-01 to 2026-04-04 (end exclusive) = 4 dates
		expect(dates).toContain('2026-04-01');
		expect(dates).toContain('2026-04-04');
		expect(dates).not.toContain('2026-04-05'); // end is exclusive
	});

	it('merges date ranges from multiple events', () => {
		const events = parseIcal(SAMPLE_ICAL);
		const dates = getBlockedDates(events);
		// First event: 4 dates, second: 2 dates
		expect(dates.length).toBe(6);
	});

	it('deduplicates overlapping dates', () => {
		const overlapping = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260605
END:VEVENT
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260603
DTEND;VALUE=DATE:20260607
END:VEVENT
END:VCALENDAR`;
		const events = parseIcal(overlapping);
		const dates = getBlockedDates(events);
		// 2026-06-01 to 06-06 = 6 unique dates
		expect(dates.length).toBe(6);
	});
});
