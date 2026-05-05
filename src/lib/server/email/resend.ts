// PR 5 (transactional email): Resend implementation.
//
// Uses the Resend SDK directly. Configured via env:
//   RESEND_API_KEY        — API key with sending scope on the verified domain.
//   EMAIL_FROM            — From header, e.g. "Marianne Cottage <bookings@mariannecottage.fr>".
//   EMAIL_REPLY_TO        — Optional. Reply-To header.
//   ADMIN_NOTIFY_EMAIL    — Comma-separated list of recipients for contact-enquiry
//                           admin notifications.
//
// Failures are logged and re-thrown — the caller decides whether to swallow
// (e.g. the webhook handler shouldn't fail the state machine over a flaky
// send) or surface to the user (e.g. /api/contact returns 500 if its own
// admin-notify fails because no other channel records the enquiry).

import { Resend } from 'resend';
import { env as privateEnv } from '$env/dynamic/private';
import type {
	BookingDetails,
	EmailService,
	EnquiryDetails,
	Locale,
	RefundSummary
} from './types';
import { renderBookingConfirmation } from './templates/booking-confirmation';
import { renderBookingCancelled } from './templates/booking-cancelled';
import { renderBookingOverbooked } from './templates/booking-overbooked';
import { renderRefundIssued } from './templates/refund-issued';
import { renderEnquiryAdminNotice } from './templates/contact-enquiry';
import { renderEnquiryAcknowledgement } from './templates/contact-acknowledgement';

export class ResendEmailService implements EmailService {
	private readonly client: Resend;
	private readonly from: string;
	private readonly replyTo: string | undefined;
	private readonly adminRecipients: string[];

	constructor(opts: {
		apiKey: string;
		from: string;
		replyTo?: string;
		adminNotify: string;
	}) {
		this.client = new Resend(opts.apiKey);
		this.from = opts.from;
		this.replyTo = opts.replyTo;
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
		const rendered = renderBookingConfirmation(booking, lang, cancelMagicLink);
		await this.send({
			to: [booking.guestEmail],
			subject: rendered.subject,
			html: rendered.html,
			text: rendered.text,
			tag: 'booking-confirmation'
		});
	}

	async sendBookingCancelled(
		booking: BookingDetails,
		refund: RefundSummary | null,
		lang: Locale
	): Promise<void> {
		const rendered = renderBookingCancelled(booking, refund, lang);
		await this.send({
			to: [booking.guestEmail],
			subject: rendered.subject,
			html: rendered.html,
			text: rendered.text,
			tag: 'booking-cancelled'
		});
	}

	async sendBookingOverbooked(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const rendered = renderBookingOverbooked(booking, refundAmount, lang);
		await this.send({
			to: [booking.guestEmail],
			subject: rendered.subject,
			html: rendered.html,
			text: rendered.text,
			tag: 'booking-overbooked'
		});
	}

	async sendRefundIssued(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const rendered = renderRefundIssued(booking, refundAmount, lang);
		await this.send({
			to: [booking.guestEmail],
			subject: rendered.subject,
			html: rendered.html,
			text: rendered.text,
			tag: 'refund-issued'
		});
	}

	async sendEnquiry(enquiry: EnquiryDetails, guestLang: Locale): Promise<void> {
		const adminMail = renderEnquiryAdminNotice(enquiry);
		const guestAck = renderEnquiryAcknowledgement(enquiry, guestLang);

		// Admin notification first — if this fails the caller wants to know,
		// because the enquiry would otherwise be lost (no DB row for /api/contact
		// submissions yet). The guest acknowledgement is a courtesy and we don't
		// want a Resend hiccup on it to lose the message either, so it runs
		// after the admin send and any failure there is logged but swallowed.
		if (this.adminRecipients.length > 0) {
			await this.send({
				to: this.adminRecipients,
				subject: adminMail.subject,
				html: adminMail.html,
				text: adminMail.text,
				replyTo: enquiry.email,
				tag: 'enquiry-admin'
			});
		} else {
			console.warn('[email-resend] ADMIN_NOTIFY_EMAIL not set; admin enquiry notification skipped');
		}

		try {
			await this.send({
				to: [enquiry.email],
				subject: guestAck.subject,
				html: guestAck.html,
				text: guestAck.text,
				tag: 'enquiry-ack'
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'unknown';
			console.warn(`[email-resend] enquiry acknowledgement failed (admin notice already sent): ${message}`);
		}
	}

	private async send(params: {
		to: string[];
		subject: string;
		html: string;
		text: string;
		replyTo?: string;
		tag: string;
	}): Promise<void> {
		const { error } = await this.client.emails.send({
			from: this.from,
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
			replyTo: params.replyTo ?? this.replyTo,
			tags: [{ name: 'category', value: params.tag }]
		});
		if (error) {
			const message = error.message || JSON.stringify(error);
			console.error(`[email-resend] send failed (${params.tag}) → ${params.to.join(', ')}: ${message}`);
			throw new Error(`Resend error: ${message}`);
		}
	}
}

export function buildResendServiceFromEnv(): ResendEmailService | null {
	const apiKey = privateEnv.RESEND_API_KEY;
	const from = privateEnv.EMAIL_FROM;
	const adminNotify = privateEnv.ADMIN_NOTIFY_EMAIL ?? '';
	if (!apiKey || !from) return null;
	return new ResendEmailService({
		apiKey,
		from,
		replyTo: privateEnv.EMAIL_REPLY_TO || undefined,
		adminNotify
	});
}
