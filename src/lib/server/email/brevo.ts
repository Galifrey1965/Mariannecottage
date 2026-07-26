// PR 5 (transactional email): Brevo implementation.
//
// Brevo (formerly Sendinblue) is the chosen transactional provider — see
// documentation/infrastructure.md "Email — outbound SMTP relay" for the
// account context. DKIM/SPF/DMARC for mariannecottage.fr already live in the
// OVH zone; the verified primary sender is `booking@mariannecottage.fr`.
//
// We use Brevo's v3 transactional HTTP API (single endpoint, no SMTP client
// dep needed):
//   POST https://api.brevo.com/v3/smtp/email
//   header: api-key: <BREVO_API_KEY>
//
// Mark generates the API key at Brevo dashboard → SMTP & API → API Keys.
// This is distinct from the SMTP key already in his password manager (which
// is for Gmail's "Send mail as" feature) — same account, separate credentials.

import { env as privateEnv } from '$env/dynamic/private';
import type {
	BookingDetails,
	EmailService,
	EnquiryDetails,
	EnquirySendResult,
	Locale,
	RefundSummary
} from './types';
import { renderBookingConfirmation } from './templates/booking-confirmation';
import { renderBookingCancelled } from './templates/booking-cancelled';
import { renderBookingOverbooked } from './templates/booking-overbooked';
import { renderRefundIssued } from './templates/refund-issued';
import { renderEnquiryAdminNotice } from './templates/contact-enquiry';
import { renderEnquiryAcknowledgement } from './templates/contact-acknowledgement';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

interface BrevoSender {
	email: string;
	name?: string;
}

export class BrevoEmailService implements EmailService {
	private readonly apiKey: string;
	private readonly sender: BrevoSender;
	private readonly replyToEmail: string | undefined;
	private readonly adminRecipients: string[];

	constructor(opts: {
		apiKey: string;
		from: string;       // RFC 5322 — 'Name <email>' or bare email
		replyTo?: string;   // bare email
		adminNotify: string;
	}) {
		this.apiKey = opts.apiKey;
		this.sender = parseFromHeader(opts.from);
		this.replyToEmail = opts.replyTo;
		this.adminRecipients = opts.adminNotify
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
	}

	async sendBookingConfirmation(
		booking: BookingDetails,
		lang: Locale,
		cancelMagicLink: string | null
	): Promise<void> {
		const r = renderBookingConfirmation(booking, lang, cancelMagicLink);
		await this.send({
			to: [{ email: booking.guestEmail, name: booking.guestName }],
			subject: r.subject,
			html: r.html,
			text: r.text,
			tag: 'booking-confirmation'
		});
	}

	async sendBookingCancelled(
		booking: BookingDetails,
		refund: RefundSummary | null,
		lang: Locale
	): Promise<void> {
		const r = renderBookingCancelled(booking, refund, lang);
		await this.send({
			to: [{ email: booking.guestEmail, name: booking.guestName }],
			subject: r.subject,
			html: r.html,
			text: r.text,
			tag: 'booking-cancelled'
		});
	}

	async sendBookingOverbooked(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const r = renderBookingOverbooked(booking, refundAmount, lang);
		await this.send({
			to: [{ email: booking.guestEmail, name: booking.guestName }],
			subject: r.subject,
			html: r.html,
			text: r.text,
			tag: 'booking-overbooked'
		});
	}

	async sendRefundIssued(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const r = renderRefundIssued(booking, refundAmount, lang);
		await this.send({
			to: [{ email: booking.guestEmail, name: booking.guestName }],
			subject: r.subject,
			html: r.html,
			text: r.text,
			tag: 'refund-issued'
		});
	}

	async sendEnquiry(
		enquiry: EnquiryDetails,
		guestLang: Locale,
		options?: { includeGuestAck?: boolean }
	): Promise<EnquirySendResult> {
		const adminMail = renderEnquiryAdminNotice(enquiry);
		let adminNotified = false;

		// Admin notification first — a failure here is what the retry sweep
		// exists to recover from, so it is still allowed to throw.
		if (this.adminRecipients.length > 0) {
			await this.send({
				to: this.adminRecipients.map((email) => ({ email })),
				subject: adminMail.subject,
				html: adminMail.html,
				text: adminMail.text,
				replyTo: enquiry.email,
				tag: 'enquiry-admin'
			});
			adminNotified = true;
		} else {
			// Reported rather than thrown, but adminNotified stays false so the
			// caller does not stamp admin_notified_at on an email that was never
			// sent — a misconfigured ADMIN_NOTIFY_EMAIL would otherwise look
			// identical to a delivered notice.
			console.warn('[email-brevo] ADMIN_NOTIFY_EMAIL not set; admin enquiry notification skipped');
		}

		if (options?.includeGuestAck === false) return { adminNotified, ackSent: false };

		const guestAck = renderEnquiryAcknowledgement(enquiry, guestLang);

		// Guest acknowledgement is a courtesy — log + swallow so a hiccup here
		// doesn't lose the message Mark already received.
		try {
			await this.send({
				to: [{ email: enquiry.email, name: enquiry.name }],
				subject: guestAck.subject,
				html: guestAck.html,
				text: guestAck.text,
				tag: 'enquiry-ack'
			});
			return { adminNotified, ackSent: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown';
			console.warn(`[email-brevo] enquiry acknowledgement failed (admin notice already sent): ${message}`);
			return { adminNotified, ackSent: false };
		}
	}

	private async send(params: {
		to: Array<{ email: string; name?: string }>;
		subject: string;
		html: string;
		text: string;
		replyTo?: string;
		tag: string;
	}): Promise<void> {
		const body: Record<string, unknown> = {
			sender: this.sender,
			to: params.to,
			subject: params.subject,
			htmlContent: params.html,
			textContent: params.text,
			tags: [params.tag]
		};
		const replyEmail = params.replyTo ?? this.replyToEmail;
		if (replyEmail) {
			body.replyTo = { email: replyEmail };
		}

		const res = await fetch(BREVO_ENDPOINT, {
			method: 'POST',
			headers: {
				'api-key': this.apiKey,
				'content-type': 'application/json',
				accept: 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const errText = await res.text().catch(() => '');
			console.error(
				`[email-brevo] send failed (${params.tag}, http ${res.status}) → ${params.to.map((t) => t.email).join(', ')}: ${errText}`
			);
			throw new Error(`Brevo error ${res.status}: ${errText.slice(0, 200)}`);
		}
	}
}

function parseFromHeader(s: string): BrevoSender {
	const match = s.match(/^\s*(.+?)\s*<([^>]+)>\s*$/);
	if (match) {
		return {
			name: match[1].replace(/^"|"$/g, '').trim() || undefined,
			email: match[2].trim()
		};
	}
	return { email: s.trim() };
}

export function buildBrevoServiceFromEnv(): BrevoEmailService | null {
	const apiKey = privateEnv.BREVO_API_KEY;
	const from = privateEnv.EMAIL_FROM;
	const adminNotify = privateEnv.ADMIN_NOTIFY_EMAIL ?? '';
	if (!apiKey || !from) return null;
	return new BrevoEmailService({
		apiKey,
		from,
		replyTo: privateEnv.EMAIL_REPLY_TO || undefined,
		adminNotify
	});
}
