// PR 5 (transactional email): adapter from DB rows + env to email-module
// inputs. Keeps the call sites clean and one place to fix when fields change.

import { env as publicEnv } from '$env/dynamic/public';
import type { Booking } from './supabase';
import type { BookingDetails, Locale } from './email';
import { signCancelToken, expiryForCheckIn, CancelTokenError } from './cancel-token';

const DEFAULT_CURRENCY = 'EUR';
const VALID_LOCALES = new Set<Locale>(['en', 'fr', 'de']);

export function bookingToEmailDetails(booking: Booking): BookingDetails {
	return {
		id: booking.id,
		reference: booking.booking_reference,
		guestName: booking.guest_name,
		guestEmail: booking.guest_email ?? '',
		checkIn: booking.check_in_date,
		checkOut: booking.check_out_date,
		numGuests: booking.num_guests,
		numNights: booking.num_nights,
		totalPrice: Number(booking.total_cost),
		currency: DEFAULT_CURRENCY
	};
}

export function localeFromBooking(booking: Booking | { guest_locale?: string | null }): Locale {
	const candidate = (booking as { guest_locale?: string | null }).guest_locale ?? 'en';
	return VALID_LOCALES.has(candidate as Locale) ? (candidate as Locale) : 'en';
}

/**
 * Build the guest cancellation magic link for a booking, returning null when
 * the secret isn't configured (e.g. local dev without CANCEL_TOKEN_SECRET set).
 * Webhook + admin paths swallow the null so a missing secret doesn't block
 * the actual booking confirmation email.
 */
export function buildCancelMagicLink(booking: Pick<Booking, 'id' | 'booking_reference' | 'check_in_date'>): string | null {
	try {
		const expSec = expiryForCheckIn(booking.check_in_date);
		const token = signCancelToken({
			bid: booking.id,
			ref: booking.booking_reference,
			exp: expSec
		});
		const base = publicEnv.PUBLIC_SITE_URL;
		if (!base) {
			// Same handling as missing CANCEL_TOKEN_SECRET — return null so
			// the confirmation email goes out without a cancel link rather
			// than embedding a localhost URL the guest can't open. The
			// admin can re-mint the link via /api/admin/bookings/cancel-link
			// if needed. PUBLIC_SITE_URL is set on Netlify production; this
			// path should only fire in misconfigured environments.
			console.warn('[email-adapter] PUBLIC_SITE_URL not set — cancel link omitted from confirmation email');
			return null;
		}
		return `${base.replace(/\/$/, '')}/book/cancel?token=${encodeURIComponent(token)}`;
	} catch (err) {
		if (err instanceof CancelTokenError && err.reason === 'no_secret') {
			console.warn('[email-adapter] CANCEL_TOKEN_SECRET not set — cancel link omitted from confirmation email');
			return null;
		}
		throw err;
	}
}
