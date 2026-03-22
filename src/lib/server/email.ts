export type Locale = 'en' | 'fr' | 'de';

export interface BookingDetails {
	reference: string;
	guestName: string;
	guestEmail: string;
	checkIn: string;
	checkOut: string;
	totalPrice: number;
	currency: string;
}

export interface EnquiryDetails {
	name: string;
	email: string;
	message: string;
}

export interface EmailService {
	sendBookingConfirmation(booking: BookingDetails, lang: Locale): Promise<void>;
	sendEnquiry(enquiry: EnquiryDetails): Promise<void>;
}

export class StubEmailService implements EmailService {
	async sendBookingConfirmation(booking: BookingDetails, lang: Locale): Promise<void> {
		console.log(
			'[EMAIL STUB] Booking confirmation sent to:',
			booking.guestEmail,
			'Reference:',
			booking.reference
		);
	}

	async sendEnquiry(enquiry: EnquiryDetails): Promise<void> {
		console.log('[EMAIL STUB] Enquiry received from:', enquiry.name, '(' + enquiry.email + ')');
		console.log('Message:', enquiry.message);
	}
}

// Default stub service - replace with real implementation later
export const emailService = new StubEmailService();
