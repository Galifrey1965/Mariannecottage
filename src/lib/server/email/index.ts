// PR 5 (transactional email): public entry point.
//
// Re-exports the same `emailService` symbol the old single-file module did,
// so existing import paths (`$lib/server/email`) keep working. The chosen
// implementation is decided once, at module load:
//   - RESEND_API_KEY + EMAIL_FROM both set, and EMAIL_DRY_RUN !== 'true'  → ResendEmailService
//   - otherwise                                                           → StubEmailService

import { env as privateEnv } from '$env/dynamic/private';
import type { EmailService } from './types';
import { StubEmailService } from './stub';
import { buildResendServiceFromEnv } from './resend';

export type { BookingDetails, EmailService, EnquiryDetails, Locale, RefundSummary } from './types';

function selectImplementation(): EmailService {
	if (privateEnv.EMAIL_DRY_RUN === 'true') {
		console.log('[email] EMAIL_DRY_RUN=true — using StubEmailService');
		return new StubEmailService();
	}
	const resend = buildResendServiceFromEnv();
	if (resend) return resend;
	if (privateEnv.RESEND_API_KEY || privateEnv.EMAIL_FROM) {
		console.warn('[email] Resend partially configured (need both RESEND_API_KEY and EMAIL_FROM) — falling back to StubEmailService');
	}
	return new StubEmailService();
}

export const emailService: EmailService = selectImplementation();
