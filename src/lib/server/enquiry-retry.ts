// E-02: retry the admin notification for enquiries nobody was ever told about.
//
// The 2026-07-26 persistence fix made a failed send non-destructive: the row is
// written before the email is attempted, so a Brevo outage costs a notification
// rather than the message. What it did not do is try again. A row could sit at
// status='new' with admin_notified_at IS NULL indefinitely, and until E-01
// nothing displayed it either.
//
// This runs from the existing @daily /api/sweep-pending cron. It is deliberately
// conservative — it will give up rather than hammer a permanently broken sender.

import { emailService } from './email';
import {
	listUnnotifiedEnquiries,
	countAbandonedEnquiries,
	markEnquiryNotified,
	markEnquiryNotifyFailed
} from './supabase';
import type { Locale } from './email';

// Five attempts total, counting the original one from /api/contact. Enough to
// ride out a transient outage or an IP allow-list that gets fixed the next day
// (which is exactly what happened on 2026-07-24), without re-sending to a dead
// address every day for a year.
export const RETRY_MAX_ATTEMPTS = 5;

// Past a fortnight a notification has stopped being useful — the visitor has
// long since given up or booked elsewhere, and the row is a case for a human
// reading /admin/enquiries, not for another automated send.
export const RETRY_MAX_AGE_DAYS = 14;

// Bounded by the ~10s Netlify synchronous-function ceiling this cron runs under,
// not by Brevo's quota: ten sequential sends is a few seconds, and ten a day
// never approaches the 300/day free-tier limit.
export const RETRY_BATCH_LIMIT = 10;

export interface EnquiryRetryResult {
	considered: number;
	sent: number;
	failed: number;
	// Rows the sweep will no longer pick up (attempts exhausted or too old).
	// Reported rather than silently dropped — they still need somebody.
	abandoned: number;
}

const LOCALES: Locale[] = ['en', 'fr', 'de'];

function asLocale(value: string): Locale {
	return (LOCALES as string[]).includes(value) ? (value as Locale) : 'en';
}

export async function retryUnnotifiedEnquiries(): Promise<EnquiryRetryResult> {
	const candidates = await listUnnotifiedEnquiries({
		maxAttempts: RETRY_MAX_ATTEMPTS,
		maxAgeDays: RETRY_MAX_AGE_DAYS,
		limit: RETRY_BATCH_LIMIT
	});

	const result: EnquiryRetryResult = {
		considered: candidates.length,
		sent: 0,
		failed: 0,
		abandoned: 0
	};

	// Sequential, not Promise.all: this shares a 10s function budget with the
	// booking sweep and the retention purge, and a burst of parallel sends buys
	// nothing at a volume of ten.
	for (const enquiry of candidates) {
		const attempts = (enquiry.notify_attempts ?? 0) + 1;
		try {
			await emailService.sendEnquiry(
				{ name: enquiry.name, email: enquiry.email, message: enquiry.message },
				asLocale(enquiry.locale),
				// No acknowledgement on a retry — see the EmailService docstring.
				{ includeGuestAck: false }
			);
			await markEnquiryNotified(enquiry.id, { attempts });
			result.sent += 1;
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			result.failed += 1;
			console.error(
				`[enquiry-retry] attempt ${attempts}/${RETRY_MAX_ATTEMPTS} failed for ${enquiry.id}: ${detail}`
			);
			// One row's failure must not abandon the rest of the batch, and the
			// bookkeeping write is what stops this row being retried forever — so
			// its own failure is logged and swallowed too.
			await markEnquiryNotifyFailed(enquiry.id, detail, { attempts }).catch((updateError) =>
				console.error(`[enquiry-retry] could not record attempt on ${enquiry.id}:`, updateError)
			);
		}
	}

	try {
		result.abandoned = await countAbandonedEnquiries({
			maxAttempts: RETRY_MAX_ATTEMPTS,
			maxAgeDays: RETRY_MAX_AGE_DAYS
		});
	} catch (error) {
		console.error('[enquiry-retry] could not count abandoned enquiries:', error);
	}

	return result;
}
