import type { BookingDetails, Locale } from '../types';
import {
	formatCurrencyForLocale,
	formatDateForLocale,
	interpolate,
	strings
} from '../i18n';
import {
	heading,
	paragraph,
	plainTextSummary,
	signatureBlock,
	summaryTable,
	wrap
} from './layout';

// PR 5: late-success race apology email. Fires when payment_intent.succeeded
// arrives after the booking row was already swept to 'expired' — we couldn't
// honour the dates, took the guest's money, and auto-refunded.
//
// Distinct from booking-cancelled: framing is "we let you down" not "you
// cancelled, here's your refund per policy".
export function renderBookingOverbooked(
	booking: BookingDetails,
	refundAmount: number,
	lang: Locale
): { subject: string; html: string; text: string } {
	const s = strings(lang);
	const t = s.bookingOverbooked;

	const subject = interpolate(t.subject, { ref: booking.reference });
	const headingLine = interpolate(t.heading, { name: booking.guestName });
	const refundLine = interpolate(t.refundLine, {
		amount: formatCurrencyForLocale(refundAmount, booking.currency, lang)
	});

	const rows = [
		{ label: t.labelReference, value: booking.reference },
		{ label: t.labelCheckIn, value: formatDateForLocale(booking.checkIn, lang) },
		{ label: t.labelCheckOut, value: formatDateForLocale(booking.checkOut, lang) }
	];

	const innerHtml =
		heading(headingLine) +
		paragraph(t.apology) +
		paragraph(refundLine) +
		paragraph(t.summaryHeading) +
		summaryTable(rows) +
		paragraph(t.closing) +
		signatureBlock(s.common.signature);

	const html = wrap({ common: s.common, innerHtml });

	const text = [
		headingLine,
		'',
		t.apology,
		'',
		refundLine,
		'',
		t.summaryHeading,
		plainTextSummary(rows),
		'',
		t.closing,
		'',
		s.common.signature,
		'—',
		s.common.footer
	].join('\n');

	return { subject, html, text };
}
