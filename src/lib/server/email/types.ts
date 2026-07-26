// PR 5 (transactional email): shared types.
//
// EmailService is implemented by both ResendEmailService (production) and
// StubEmailService (tests + dev when no Resend key). Call sites import
// `emailService` from index.ts; the choice happens once, at module load.

export type Locale = 'en' | 'fr' | 'de';

export interface BookingDetails {
	id: string;
	reference: string;
	guestName: string;
	guestEmail: string;
	checkIn: string;       // ISO date (YYYY-MM-DD)
	checkOut: string;      // ISO date (YYYY-MM-DD)
	numGuests: number;
	numNights: number;
	totalPrice: number;
	currency: string;      // ISO 4217 — typically 'EUR'
}

export interface RefundSummary {
	refundAmount: number;
	refundPct: number;
	policyName: string;
}

export interface EnquiryDetails {
	name: string;
	email: string;
	message: string;
}

export interface EmailService {
	/**
	 * Sent on payment_intent.succeeded → booking confirmed.
	 * `cancelMagicLink` is a guest-facing /book/cancel?token=… URL signed for
	 * this booking; pass null when no link is available (e.g. legacy rows
	 * pre-CANCEL_TOKEN_SECRET).
	 */
	sendBookingConfirmation(
		booking: BookingDetails,
		lang: Locale,
		cancelMagicLink: string | null
	): Promise<void>;

	/**
	 * Sent when a booking is cancelled (admin or guest path) — independently of
	 * whether a refund was issued. `refund` is null when no refund applied.
	 */
	sendBookingCancelled(
		booking: BookingDetails,
		refund: RefundSummary | null,
		lang: Locale
	): Promise<void>;

	/**
	 * Sent on the late-success race: payment cleared after the row was already
	 * swept to 'expired' and we auto-refunded. Apology framing — distinct from
	 * sendBookingCancelled which addresses guest-initiated cancellations.
	 */
	sendBookingOverbooked(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void>;

	/**
	 * Sent on charge.refunded webhook — guest-facing confirmation that the
	 * refund has actually cleared back to their card (vs sendBookingCancelled
	 * which fires when we *initiate* the refund).
	 */
	sendRefundIssued(
		booking: BookingDetails,
		refundAmount: number,
		lang: Locale
	): Promise<void>;

	/**
	 * Sent on /api/contact submission. By default sends BOTH the admin
	 * notification (to ADMIN_NOTIFY_EMAIL, in English — internal) AND the guest
	 * acknowledgement (to enquiry.email, in their locale).
	 *
	 * Pass `{ includeGuestAck: false }` when re-sending a notification that
	 * failed earlier (E-02's retry sweep). Two reasons: an acknowledgement
	 * arriving days after someone filled in the form is confusing, and because
	 * the ack may well have succeeded on the original attempt when only the
	 * admin notice failed, so repeating it risks emailing the guest twice.
	 */
	sendEnquiry(
		enquiry: EnquiryDetails,
		guestLang: Locale,
		options?: { includeGuestAck?: boolean }
	): Promise<void>;
}
