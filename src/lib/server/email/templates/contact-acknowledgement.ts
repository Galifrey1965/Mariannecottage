import type { EnquiryDetails, Locale } from '../types';
import { interpolate, strings } from '../i18n';
import { heading, paragraph, signatureBlock, wrap } from './layout';

export function renderEnquiryAcknowledgement(
	enquiry: EnquiryDetails,
	lang: Locale
): { subject: string; html: string; text: string } {
	const s = strings(lang);
	const t = s.contactAcknowledgement;

	const subject = t.subject;
	const headingLine = interpolate(t.heading, { name: enquiry.name });

	const innerHtml =
		heading(headingLine) +
		paragraph(t.body) +
		paragraph(t.closing) +
		signatureBlock(s.common.signature);

	const html = wrap({ common: s.common, innerHtml });

	const text = [
		headingLine,
		'',
		t.body,
		'',
		t.closing,
		'',
		s.common.signature,
		'—',
		s.common.footer
	].join('\n');

	return { subject, html, text };
}
