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

export type EmailServiceMode = 'brevo' | 'dry-run' | 'stub';

function isProductionLike(): boolean {
	// Treat Netlify deployed environments as production-like for email checks.
	// `CONTEXT` is set by Netlify build to 'production' | 'deploy-preview' | 'branch-deploy'.
	if (privateEnv.CONTEXT === 'production') return true;
	if (privateEnv.NETLIFY === 'true' && privateEnv.CONTEXT !== undefined) return true;
	return privateEnv.NODE_ENV === 'production';
}

function loudWarning(lines: string[]) {
	const banner = '*'.repeat(72);
	console.warn(`\n${banner}\n${lines.map((l) => `  ${l}`).join('\n')}\n${banner}\n`);
}

function selectImplementation(): { service: EmailService; mode: EmailServiceMode } {
	if (privateEnv.EMAIL_DRY_RUN === 'true') {
		console.log('[email] EMAIL_DRY_RUN=true — using StubEmailService');
		return { service: new StubEmailService(), mode: 'dry-run' };
	}

	const brevo = buildBrevoServiceFromEnv();
	if (brevo) return { service: brevo, mode: 'brevo' };

	const partial = Boolean(privateEnv.BREVO_API_KEY || privateEnv.EMAIL_FROM);
	const prod = isProductionLike();

	if (prod) {
		// Loud, multi-line warning so it can't be missed in Netlify function
		// logs. Stays a warning (not throw) so the site still serves pages
		// — but transactional email will silently no-op until env is fixed.
		loudWarning([
			'EMAIL CONFIG ERROR — running in production-like environment with no Brevo configuration.',
			partial
				? 'BREVO_API_KEY or EMAIL_FROM is set but not both. Both are required.'
				: 'Neither BREVO_API_KEY nor EMAIL_FROM is set.',
			'Booking confirmations, cancellations, and contact enquiries will NOT be delivered.',
			'Set BREVO_API_KEY and EMAIL_FROM in Netlify env vars (or set EMAIL_DRY_RUN=true to silence in dev).'
		]);
	} else if (partial) {
		console.warn('[email] Brevo partially configured (need both BREVO_API_KEY and EMAIL_FROM) — falling back to StubEmailService');
	} else {
		console.log('[email] No Brevo config and EMAIL_DRY_RUN unset — using StubEmailService (dev default).');
	}

	return { service: new StubEmailService(), mode: 'stub' };
}

const selected = selectImplementation();
export const emailService: EmailService = selected.service;
export const emailServiceMode: EmailServiceMode = selected.mode;
