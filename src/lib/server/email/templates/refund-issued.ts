import type { BookingDetails, Locale } from '../types';
import { formatCurrencyForLocale, interpolate, strings } from '../i18n';
import { heading, paragraph, signatureBlock, wrap } from './layout';

export function renderRefundIssued(
	booking: BookingDetails,
	refundAmount: number,
	lang: Locale
): { subject: string; html: string; text: string } {
	const s = strings(lang);
	const t = s.refundIssued;

	const subject = interpolate(t.subject, { ref: booking.reference });
	const headingLine = interpolate(t.heading, { name: booking.guestName });
	const bodyLine = interpolate(t.body, {
		amount: formatCurrencyForLocale(refundAmount, booking.currency, lang),
		ref: booking.reference
	});

	const innerHtml =
		heading(headingLine) +
		paragraph(bodyLine) +
		paragraph(t.timing) +
		paragraph(t.closing) +
		signatureBlock(s.common.signature);

	const html = wrap({ common: s.common, innerHtml });

	const text = [
		headingLine,
		'',
		bodyLine,
		'',
		t.timing,
		'',
		t.closing,
		'',
		s.common.signature,
		'—',
		s.common.footer
	].join('\n');

	return { subject, html, text };
}
