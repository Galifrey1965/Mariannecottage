// PR 5 (transactional email): public entry point.
//
// Re-exports the same `emailService` symbol the old single-file module did,
// so existing import paths (`$lib/server/email`) keep working. The chosen
// implementation is decided once, at module load:
//   - BREVO_API_KEY + EMAIL_FROM both set, and EMAIL_DRY_RUN !== 'true'  → BrevoEmailService
//   - otherwise                                                          → StubEmailService
//
// Brevo is the chosen provider — see documentation/infrastructure.md
// "Email — transactional". The DNS for mariannecottage.fr is already
// configured for Brevo (DKIM/SPF/DMARC).

import { env as privateEnv } from '$env/dynamic/private';
import type { EmailService } from './types';
import { StubEmailService } from './stub';
import { buildBrevoServiceFromEnv } from './brevo';

export type { BookingDetails, EmailService, EnquiryDetails, Locale, RefundSummary } from './types';

function selectImplementation(): EmailService {
	if (privateEnv.EMAIL_DRY_RUN === 'true') {
		console.log('[email] EMAIL_DRY_RUN=true — using StubEmailService');
		return new StubEmailService();
	}
	const brevo = buildBrevoServiceFromEnv();
	if (brevo) return brevo;
	if (privateEnv.BREVO_API_KEY || privateEnv.EMAIL_FROM) {
		console.warn('[email] Brevo partially configured (need both BREVO_API_KEY and EMAIL_FROM) — falling back to StubEmailService');
	}
	return new StubEmailService();
}

export const emailService: EmailService = selectImplementation();
