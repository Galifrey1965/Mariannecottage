// PR 5 (transactional email): stub implementation used in tests and in any
// dev environment without a Resend key. Logs to stdout instead of sending.
//
// Also used in production when EMAIL_DRY_RUN=true, so a preview deploy can
// exercise the booking flow without spamming a real inbox.

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

export class StubEmailService implements EmailService {
	async sendBookingConfirmation(
		booking: BookingDetails,
		lang: Locale,
		cancelMagicLink: string | null
	): Promise<void> {
		const { subject } = renderBookingConfirmation(booking, lang, cancelMagicLink);
		console.log(`[email-stub] sendBookingConfirmation → ${booking.guestEmail} (${lang}) :: ${subject}`);
	}

	async sendBookingCancelled(
		booking: BookingDetails,
		refund: RefundSummary | null,
		lang: Locale
	): Promise<void> {
		const { subject } = renderBookingCancelled(booking, refund, lang);
		console.log(`[email-stub] sendBookingCancelled → ${booking.guestEmail} (${lang}) :: ${subject}`);
	}

	async sendBookingOverbooked(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const { subject } = renderBookingOverbooked(booking, refundAmount, lang);
		console.log(`[email-stub] sendBookingOverbooked → ${booking.guestEmail} (${lang}) :: ${subject}`);
	}

	async sendRefundIssued(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void> {
		const { subject } = renderRefundIssued(booking, refundAmount, lang);
		console.log(`[email-stub] sendRefundIssued → ${booking.guestEmail} (${lang}) :: ${subject}`);
	}

	async sendEnquiry(enquiry: EnquiryDetails, guestLang: Locale): Promise<void> {
		const admin = renderEnquiryAdminNotice(enquiry);
		const ack = renderEnquiryAcknowledgement(enquiry, guestLang);
		console.log(`[email-stub] sendEnquiry admin :: ${admin.subject}`);
		console.log(`[email-stub] sendEnquiry ack → ${enquiry.email} (${guestLang}) :: ${ack.subject}`);
	}
}
