import type { EnquiryDetails } from '../types';
import { escapeHtml, heading, paragraph, summaryTable, wrap } from './layout';
import { strings } from '../i18n';

// Admin-facing notification — always rendered in English (internal recipient).
export function renderEnquiryAdminNotice(
	enquiry: EnquiryDetails
): { subject: string; html: string; text: string } {
	const s = strings('en');
	const subject = `New enquiry from ${enquiry.name}`;

	const rows = [
		{ label: 'From', value: enquiry.name },
		{ label: 'Email', value: enquiry.email }
	];

	const messageHtml = `<div style="margin:8px 0 16px 0;padding:14px 16px;background:#fbf6ea;border-left:3px solid #c8a96a;font-size:14px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(enquiry.message)}</div>`;

	const innerHtml =
		heading('New enquiry from the website') +
		summaryTable(rows) +
		paragraph('Message:') +
		messageHtml +
		paragraph(`Reply directly to ${enquiry.email}.`);

	const html = wrap({ common: s.common, innerHtml });

	const text = [
		'New enquiry from the website',
		`From: ${enquiry.name}`,
		`Email: ${enquiry.email}`,
		'',
		'Message:',
		enquiry.message,
		'',
		`Reply directly to ${enquiry.email}.`
	].join('\n');

	return { subject, html, text };
}
