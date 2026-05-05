import type { PageServerLoad } from './$types';
import type { BookingDetails, EnquiryDetails, Locale, RefundSummary } from '$lib/server/email';
import { renderBookingConfirmation } from '$lib/server/email/templates/booking-confirmation';
import { renderBookingCancelled } from '$lib/server/email/templates/booking-cancelled';
import { renderBookingOverbooked } from '$lib/server/email/templates/booking-overbooked';
import { renderRefundIssued } from '$lib/server/email/templates/refund-issued';
import { renderEnquiryAcknowledgement } from '$lib/server/email/templates/contact-acknowledgement';
import { renderEnquiryAdminNotice } from '$lib/server/email/templates/contact-enquiry';

const SAMPLE_BOOKING: BookingDetails = {
	id: '00000000-0000-0000-0000-000000000000',
	reference: 'MC-SAMPLE-1234',
	guestName: 'Alex Sample',
	guestEmail: 'alex.sample@example.com',
	checkIn: '2026-07-14',
	checkOut: '2026-07-21',
	numGuests: 2,
	numNights: 7,
	totalPrice: 1190,
	currency: 'EUR'
};

const SAMPLE_ENQUIRY: EnquiryDetails = {
	name: 'Alex Sample',
	email: 'alex.sample@example.com',
	message: 'Hello! Are dates 14-21 July still available, and do you allow well-behaved dogs?\n\nThanks,\nAlex'
};

const SAMPLE_REFUND: RefundSummary = {
	refundAmount: 595,
	refundPct: 50,
	policyName: 'Moderate'
};

const SAMPLE_CANCEL_LINK = 'https://mariannecottage.fr/book/cancel?token=sample-jwt-redacted';

const LOCALES: Locale[] = ['en', 'fr', 'de'];

interface PreviewVariant {
	locale: Locale;
	subject: string;
	html: string;
	text: string;
}

interface PreviewTemplate {
	id: string;
	name: string;
	when: string;
	multilingual: boolean;
	variants: PreviewVariant[];
}

function renderForLocales(
	make: (lang: Locale) => { subject: string; html: string; text: string }
): PreviewVariant[] {
	return LOCALES.map((locale) => ({ locale, ...make(locale) }));
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { templates: [] as PreviewTemplate[] };
	}

	const templates: PreviewTemplate[] = [
		{
			id: 'booking-confirmation',
			name: 'Booking confirmation',
			when: 'Sent on payment_intent.succeeded → booking confirmed.',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderBookingConfirmation(SAMPLE_BOOKING, lang, SAMPLE_CANCEL_LINK)
			)
		},
		{
			id: 'booking-cancelled-with-refund',
			name: 'Booking cancelled (with refund)',
			when: 'Sent when admin or guest cancels and a refund is issued.',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderBookingCancelled(SAMPLE_BOOKING, SAMPLE_REFUND, lang)
			)
		},
		{
			id: 'booking-cancelled-no-refund',
			name: 'Booking cancelled (no refund)',
			when: 'Sent when a booking is cancelled with no refund (e.g. inside non-refundable window).',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderBookingCancelled(SAMPLE_BOOKING, null, lang)
			)
		},
		{
			id: 'booking-overbooked',
			name: 'Booking overbooked (auto-refund)',
			when: 'Sent on the late-success race: payment cleared after the row was already swept and we auto-refunded.',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderBookingOverbooked(SAMPLE_BOOKING, SAMPLE_BOOKING.totalPrice, lang)
			)
		},
		{
			id: 'refund-issued',
			name: 'Refund issued',
			when: 'Sent on charge.refunded webhook — guest-facing confirmation that the refund cleared.',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderRefundIssued(SAMPLE_BOOKING, SAMPLE_REFUND.refundAmount, lang)
			)
		},
		{
			id: 'enquiry-acknowledgement',
			name: 'Enquiry acknowledgement (guest)',
			when: 'Sent on /api/contact submission to the guest, in their locale.',
			multilingual: true,
			variants: renderForLocales((lang) =>
				renderEnquiryAcknowledgement(SAMPLE_ENQUIRY, lang)
			)
		},
		{
			id: 'enquiry-admin-notice',
			name: 'Enquiry admin notice',
			when: 'Sent on /api/contact submission to ADMIN_NOTIFY_EMAIL. English only — internal.',
			multilingual: false,
			variants: [{ locale: 'en', ...renderEnquiryAdminNotice(SAMPLE_ENQUIRY) }]
		}
	];

	return { templates };
};
