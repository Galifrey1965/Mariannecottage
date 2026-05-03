// RFC 5545 iCal emitter for the cottage's outbound availability feed.
//
// Used by /api/ical/cottage.ics to publish blocked dates so OTAs (primarily
// Booking.com via the extranet's iCal-import option) can avoid
// double-booking against direct reservations.
//
// Public-by-design: the feed contains no PII — only blocked date ranges
// keyed by `booking_reference`. Anyone with the URL sees the same dates
// the cottage's calendar already shows.

export interface IcalFeedBooking {
	booking_reference: string;
	check_in_date: string;  // YYYY-MM-DD
	check_out_date: string; // YYYY-MM-DD (exclusive — matches RFC 5545 DTEND)
	updated_at?: string;    // ISO 8601 timestamp
}

interface BuildOptions {
	now?: Date;
}

const PRODID = '-//Marianne Cottage//mariannecottage.fr//EN';
const UID_DOMAIN = 'mariannecottage.fr';

function pad2(n: number): string {
	return n < 10 ? `0${n}` : String(n);
}

function formatDateOnly(yyyyMmDd: string): string {
	return yyyyMmDd.replace(/-/g, '');
}

function formatDateTimeUtc(d: Date): string {
	return (
		d.getUTCFullYear() +
		pad2(d.getUTCMonth() + 1) +
		pad2(d.getUTCDate()) +
		'T' +
		pad2(d.getUTCHours()) +
		pad2(d.getUTCMinutes()) +
		pad2(d.getUTCSeconds()) +
		'Z'
	);
}

export function buildIcalFeed(
	bookings: IcalFeedBooking[],
	options: BuildOptions = {}
): string {
	const now = options.now ?? new Date();
	const sorted = [...bookings].sort((a, b) =>
		a.check_in_date.localeCompare(b.check_in_date)
	);

	const lines: string[] = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:${PRODID}`,
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH'
	];

	for (const b of sorted) {
		const dtstamp = b.updated_at
			? formatDateTimeUtc(new Date(b.updated_at))
			: formatDateTimeUtc(now);

		lines.push(
			'BEGIN:VEVENT',
			`UID:${b.booking_reference}@${UID_DOMAIN}`,
			`DTSTAMP:${dtstamp}`,
			`DTSTART;VALUE=DATE:${formatDateOnly(b.check_in_date)}`,
			`DTEND;VALUE=DATE:${formatDateOnly(b.check_out_date)}`,
			`SUMMARY:Booked - ${b.booking_reference}`,
			'TRANSP:OPAQUE',
			'END:VEVENT'
		);
	}

	lines.push('END:VCALENDAR');

	return lines.join('\r\n') + '\r\n';
}
