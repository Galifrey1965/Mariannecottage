import { json } from '@sveltejs/kit';
import { emailService } from '$lib/server/email';
import { detectLocale, isValidLocale } from '$lib/i18n';
import { rateLimitResponse } from '$lib/server/rate-limit';
import { verifyFormToken } from '$lib/server/form-token';
import {
	createEnquiry,
	markEnquiryNotified,
	markEnquiryNotifyFailed
} from '$lib/server/supabase';
import type { Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

// Public-facing form, no auth — rate limit by IP. 5 submissions / minute is
// generous for a real human filling in a contact form and well below
// what's needed to spam the inbox.
const CONTACT_MAX = 5;
const CONTACT_WINDOW_MS = 60_000;

// 2026-07-26: persist first, notify second.
//
// This route used to email the enquiry and store nothing, which made the email
// the only copy. On 2026-07-24 that cost a real enquiry: Brevo's IP allow-list
// rejected the send from a fresh Lambda egress IP, sendEnquiry threw out of the
// admin notice, this route returned 500 — and the message was gone for good,
// because there was no row, no Brevo transactional log entry (the call never
// reached the sending pipeline) and Netlify retains no function logs.
//
// So: write the row, then try to notify. Once the row exists the visitor's
// enquiry has genuinely been received, and a send failure is an operational
// problem for us rather than a lost message. Returning 500 at that point would
// be a lie that also invites the visitor to retype and resubmit.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const limited = rateLimitResponse(`contact:${ip}`, CONTACT_MAX, CONTACT_WINDOW_MS);
	if (limited) return limited;

	try {
		const data = await request.json();
		const { name, email, message } = data;

		// Anti-bot, checked before validation so a bot never learns which field
		// it got wrong. Flagged rather than rejected — see below.
		let spamReason: string | null = null;
		if (typeof data.website === 'string' && data.website.trim().length > 0) {
			spamReason = 'honeypot';
		}

		if (!name || !email || !message) {
			return json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		if (typeof name !== 'string' || name.trim().length < 2) {
			return json(
				{ error: 'Invalid name' },
				{ status: 400 }
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json(
				{ error: 'Invalid email' },
				{ status: 400 }
			);
		}

		if (typeof message !== 'string' || message.trim().length < 10) {
			return json(
				{ error: 'Message must be at least 10 characters' },
				{ status: 400 }
			);
		}

		// Timing check. A missing or null token is NOT spam — it means the token
		// endpoint failed or CANCEL_TOKEN_SECRET is unset, and visitors must not
		// be punished for our own outage. 'expired' is not spam either: someone
		// left the tab open for two hours, which is a human thing to do.
		if (!spamReason && typeof data.token === 'string' && data.token.length > 0) {
			const verdict = verifyFormToken(data.token);
			if (!verdict.ok && verdict.reason !== 'expired' && verdict.reason !== 'no_secret') {
				spamReason = `token_${verdict.reason}`;
			}
		}

		const locale: Locale = isValidLocale(data.locale)
			? data.locale
			: detectLocale(request.headers.get('accept-language'));

		const enquiry = {
			name: name.trim(),
			email: email.trim(),
			message: message.trim()
		};

		// Spam-flagged submissions are still stored, with status='spam', and are
		// never emailed. A false positive stays recoverable; a silent discard
		// would not be.
		let enquiryId: string | null = null;
		let insertError: unknown = null;
		try {
			enquiryId = await createEnquiry({
				...enquiry,
				locale,
				status: spamReason ? 'spam' : 'new',
				spam_reason: spamReason
			});
		} catch (error) {
			insertError = error;
			console.error('[contact] enquiry insert failed:', error);
		}

		// Silence is the point for spam: an error response tells a bot to retry
		// with different input, and a real person caught by a false positive
		// gets the same reassuring message as everyone else.
		if (spamReason) {
			console.warn(`[contact] enquiry flagged as spam (${spamReason}), id=${enquiryId ?? 'not-stored'}`);
			return json(
				{ success: true, message: 'Enquiry received' },
				{ status: 200 }
			);
		}

		try {
			await emailService.sendEnquiry(enquiry, locale);
			if (enquiryId) {
				// ack_sent_at is deliberately left NULL: sendEnquiry swallows
				// guest-acknowledgement failures internally, so this route cannot
				// tell "ack sent" from "ack failed" without a wider refactor.
				await markEnquiryNotified(enquiryId).catch((error) =>
					console.error(`[contact] could not mark enquiry ${enquiryId} notified:`, error)
				);
			}
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			console.error(`[contact] notification failed for enquiry ${enquiryId ?? 'not-stored'}: ${detail}`);

			// Nothing captured the enquiry anywhere — the row failed AND the email
			// failed. This is the only remaining case where 500 is honest, and it
			// matches the pre-2026-07-26 behaviour so nothing regresses.
			if (!enquiryId) {
				console.error('[contact] enquiry lost: insert and notification both failed', insertError);
				return json(
					{ error: 'Internal server error' },
					{ status: 500 }
				);
			}

			await markEnquiryNotifyFailed(enquiryId, detail).catch((updateError) =>
				console.error(`[contact] could not record notify_error on ${enquiryId}:`, updateError)
			);
		}

		return json(
			{ success: true, message: 'Enquiry received' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Contact form error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
