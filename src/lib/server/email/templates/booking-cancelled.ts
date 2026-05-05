import type { BookingDetails, Locale, RefundSummary } from '../types';
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

export function renderBookingCancelled(
	booking: BookingDetails,
	refund: RefundSummary | null,
	lang: Locale
): { subject: string; html: string; text: string } {
	const s = strings(lang);
	const t = s.bookingCancelled;

	const subject = interpolate(t.subject, { ref: booking.reference });
	const headingLine = interpolate(t.heading, { name: booking.guestName });

	const intro =
		refund && refund.refundAmount > 0
			? interpolate(t.introWithRefund, {
					amount: formatCurrencyForLocale(refund.refundAmount, booking.currency, lang),
					pct: refund.refundPct,
					policy: refund.policyName
			  })
			: t.introWithoutRefund;

	const rows = [
		{ label: t.labelReference, value: booking.reference },
		{ label: t.labelCheckIn, value: formatDateForLocale(booking.checkIn, lang) },
		{ label: t.labelCheckOut, value: formatDateForLocale(booking.checkOut, lang) }
	];

	const innerHtml =
		heading(headingLine) +
		paragraph(intro) +
		paragraph(t.summaryHeading) +
		summaryTable(rows) +
		paragraph(t.closing) +
		signatureBlock(s.common.signature);

	const html = wrap({ common: s.common, innerHtml });

	const textLines = [
		headingLine,
		'',
		intro,
		'',
		t.summaryHeading,
		plainTextSummary(rows),
		'',
		t.closing,
		'',
		s.common.signature,
		'—',
		s.common.footer
	];
	return { subject, html, text: textLines.join('\n') };
}
