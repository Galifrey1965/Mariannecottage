// Stub implementation used in tests and in any dev environment without
// a Brevo key. Logs to stdout instead of sending.
//
// Also used in production when EMAIL_DRY_RUN=true, so a preview deploy
// can exercise the booking flow without spamming a real inbox. Per-call
// logs deliberately omit the recipient email — if this stub ever runs
// against real guests by accident, we don't want their addresses
// landing in Netlify function logs. The booking reference is enough
// to correlate with anything else.

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

export class StubEmailService implements EmailService {
	async sendBookingConfirmation(
		booking: BookingDetails,
		lang: Locale,
		cancelMagicLink: string | null
	): Promise<void> {
		const { subject } = renderBookingConfirmation(booking, lang, cancelMagicLink);
		console.log(`[email-stub] sendBookingConfirmation ref=${booking.reference} (${lang}) :: ${subject}`);
	}

	async sendBookingCancelled(
		booking: BookingDetails,
		refund: RefundSummary | null,
		lang: Locale
	): Promise<void> {
		const { subject } = renderBookingCancelled(booking, refund, lang);
		console.log(`[email-stub] sendBookingCancelled ref=${booking.reference} (${lang}) :: ${subject}`);
	}

	async sendBookingOverbooked(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const { subject } = renderBookingOverbooked(booking, refundAmount, lang);
		console.log(`[email-stub] sendBookingOverbooked ref=${booking.reference} (${lang}) :: ${subject}`);
	}

	async sendRefundIssued(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const { subject } = renderRefundIssued(booking, refundAmount, lang);
		console.log(`[email-stub] sendRefundIssued ref=${booking.reference} (${lang}) :: ${subject}`);
	}

	async sendEnquiry(
		enquiry: EnquiryDetails,
		guestLang: Locale,
		options?: { includeGuestAck?: boolean }
	): Promise<EnquirySendResult> {
		const admin = renderEnquiryAdminNotice(enquiry);
		console.log(`[email-stub] sendEnquiry admin :: ${admin.subject}`);
		if (options?.includeGuestAck === false) {
			console.log('[email-stub] sendEnquiry ack skipped (retry)');
			return { adminNotified: true, ackSent: false };
		}
		const ack = renderEnquiryAcknowledgement(enquiry, guestLang);
		console.log(`[email-stub] sendEnquiry ack (${guestLang}) :: ${ack.subject}`);
		return { adminNotified: true, ackSent: true };
	}
}
