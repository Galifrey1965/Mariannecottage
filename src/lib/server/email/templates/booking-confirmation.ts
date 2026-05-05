import type { BookingDetails, Locale } from '../types';
import {
	formatCurrencyForLocale,
	formatDateForLocale,
	interpolate,
	strings
} from '../i18n';
import {
	buttonLink,
	heading,
	paragraph,
	plainTextSummary,
	signatureBlock,
	summaryTable,
	wrap
} from './layout';

export function renderBookingConfirmation(
	booking: BookingDetails,
	lang: Locale,
	cancelMagicLink: string | null
): { subject: string; html: string; text: string } {
	const s = strings(lang);
	const t = s.bookingConfirmation;

	const subject = interpolate(t.subject, { ref: booking.reference });
	const headingLine = interpolate(t.heading, { name: booking.guestName });

	const rows = [
		{ label: t.labelReference, value: booking.reference },
		{ label: t.labelCheckIn, value: formatDateForLocale(booking.checkIn, lang) },
		{ label: t.labelCheckOut, value: formatDateForLocale(booking.checkOut, lang) },
		{ label: t.labelGuests, value: String(booking.numGuests) },
		{ label: t.labelNights, value: String(booking.numNights) },
		{
			label: t.labelTotal,
			value: formatCurrencyForLocale(booking.totalPrice, booking.currency, lang)
		}
	];

	const cancelBlock = cancelMagicLink
		? paragraph(t.cancelLinkPrompt) + buttonLink(t.cancelLinkLabel, cancelMagicLink)
		: '';

	const innerHtml =
		heading(headingLine) +
		paragraph(t.intro) +
		paragraph(t.summaryHeading) +
		summaryTable(rows) +
		paragraph(t.nextSteps) +
		cancelBlock +
		paragraph(t.closing) +
		signatureBlock(s.common.signature);

	const html = wrap({ common: s.common, innerHtml });

	const textLines = [
		headingLine,
		'',
		t.intro,
		'',
		t.summaryHeading,
		plainTextSummary(rows),
		'',
		t.nextSteps,
		...(cancelMagicLink ? ['', t.cancelLinkPrompt, cancelMagicLink] : []),
		'',
		t.closing,
		'',
		s.common.signature,
		'—',
		s.common.footer
	];
	return { subject, html, text: textLines.join('\n') };
}
