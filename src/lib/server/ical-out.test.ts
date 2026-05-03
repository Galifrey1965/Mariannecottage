// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildIcalFeed, type IcalFeedBooking } from './ical-out';

const fixedNow = new Date('2026-05-03T12:34:56Z');

function booking(overrides: Partial<IcalFeedBooking> = {}): IcalFeedBooking {
	return {
		booking_reference: 'MC-20260323-AAAA',
		check_in_date: '2026-09-01',
		check_out_date: '2026-09-04',
		updated_at: '2026-05-03T11:00:00Z',
		...overrides
	};
}

describe('buildIcalFeed', () => {
	it('produces a valid VCALENDAR with VERSION:2.0 and a PRODID', () => {
		const out = buildIcalFeed([], { now: fixedNow });
		expect(out.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
		expect(out.endsWith('END:VCALENDAR\r\n')).toBe(true);
		expect(out).toContain('VERSION:2.0\r\n');
		expect(out).toMatch(/PRODID:.+mariannecottage/i);
	});

	it('uses CRLF line endings throughout (RFC 5545)', () => {
		const out = buildIcalFeed([booking()], { now: fixedNow });
		// No bare LFs not preceded by CR
		expect(out.replace(/\r\n/g, '')).not.toMatch(/\n/);
	});

	it('emits a VEVENT per booking with date-only DTSTART/DTEND', () => {
		const out = buildIcalFeed([booking()], { now: fixedNow });
		expect(out).toContain('BEGIN:VEVENT\r\n');
		expect(out).toContain('END:VEVENT\r\n');
		expect(out).toContain('DTSTART;VALUE=DATE:20260901\r\n');
		// DTEND is exclusive in iCal — same as our check_out_date
		expect(out).toContain('DTEND;VALUE=DATE:20260904\r\n');
	});

	it('UID is the booking reference at the cottage domain', () => {
		const out = buildIcalFeed([booking({ booking_reference: 'MC-20260323-BBBB' })], { now: fixedNow });
		expect(out).toContain('UID:MC-20260323-BBBB@mariannecottage.fr\r\n');
	});

	it('SUMMARY references the booking but contains no PII', () => {
		const out = buildIcalFeed(
			[booking({ booking_reference: 'MC-20260323-CCCC' })],
			{ now: fixedNow }
		);
		const summaryLine = out.split('\r\n').find((l) => l.startsWith('SUMMARY:'));
		expect(summaryLine).toBeDefined();
		expect(summaryLine).toContain('MC-20260323-CCCC');
		// No email addresses, names, or phone numbers in the user-visible field
		expect(summaryLine).not.toMatch(/@/);
	});

	it('DTSTAMP uses booking updated_at when present', () => {
		const out = buildIcalFeed(
			[booking({ updated_at: '2026-04-15T08:30:00Z' })],
			{ now: fixedNow }
		);
		expect(out).toContain('DTSTAMP:20260415T083000Z\r\n');
	});

	it('DTSTAMP falls back to now when updated_at missing', () => {
		const out = buildIcalFeed(
			[booking({ updated_at: undefined })],
			{ now: fixedNow }
		);
		expect(out).toContain('DTSTAMP:20260503T123456Z\r\n');
	});

	it('emits multiple events sorted by check-in date', () => {
		const out = buildIcalFeed(
			[
				booking({ booking_reference: 'MC-LATER', check_in_date: '2026-12-01', check_out_date: '2026-12-05' }),
				booking({ booking_reference: 'MC-EARLY', check_in_date: '2026-06-01', check_out_date: '2026-06-04' })
			],
			{ now: fixedNow }
		);
		const earlyIdx = out.indexOf('MC-EARLY');
		const laterIdx = out.indexOf('MC-LATER');
		expect(earlyIdx).toBeGreaterThan(0);
		expect(laterIdx).toBeGreaterThan(earlyIdx);
	});

	it('returns a feed with zero events for empty input', () => {
		const out = buildIcalFeed([], { now: fixedNow });
		expect(out).not.toContain('BEGIN:VEVENT');
	});
});
