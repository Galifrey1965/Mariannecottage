// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type Stripe from 'stripe';

// Hoisted mock refs so vi.mock factories below can reference them, but tests
// can swap their behaviour per-case via .mockImplementation / .mockReturnValue.
const mocks = vi.hoisted(() => {
	return {
		getStripe: vi.fn(),
		getWebhookSecret: vi.fn<() => string | null>(() => 'whsec_dummy'),
		constructEvent: vi.fn(),
		refundsCreate: vi.fn(),
		rpc: vi.fn(),
		from: vi.fn()
	};
});

vi.mock('$env/dynamic/private', () => ({
	env: { STRIPE_SECRET_KEY: '', STRIPE_WEBHOOK_SECRET: '' }
}));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SUPABASE_URL: 'https://example.supabase.co', PUBLIC_SUPABASE_ANON_KEY: 'anon' }
}));

vi.mock('$lib/server/supabase', () => ({
	adminClient: {
		rpc: (...args: unknown[]) => mocks.rpc(...args),
		from: (...args: unknown[]) => mocks.from(...args)
	}
}));

vi.mock('$lib/server/stripe', () => ({
	getStripe: () => mocks.getStripe(),
	getWebhookSecret: () => mocks.getWebhookSecret(),
	_resetStripeCacheForTests: () => {}
}));

vi.mock('$lib/server/email', () => ({
	emailService: {
		sendBookingConfirmation: vi.fn(async () => undefined),
		sendBookingCancelled: vi.fn(async () => undefined),
		sendBookingOverbooked: vi.fn(async () => undefined),
		sendRefundIssued: vi.fn(async () => undefined),
		sendEnquiry: vi.fn(async () => undefined)
	}
}));

vi.mock('$lib/server/email-adapter', async () => {
	// Real adapter except the magic-link generator — we don't want tests to
	// require CANCEL_TOKEN_SECRET in the env and the link content isn't what
	// these tests assert.
	const actual = await vi.importActual<typeof import('$lib/server/email-adapter')>(
		'$lib/server/email-adapter'
	);
	return {
		...actual,
		buildCancelMagicLink: () => null
	};
});

import { POST } from './+server';
import { emailService } from '$lib/server/email';

function makeRequest(body: string, headers: Record<string, string> = {}) {
	return {
		request: new Request('http://localhost/api/stripe/webhook', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', ...headers },
			body
		})
	} as never;
}

// Mock Stripe instance shared across the "happy" tests below — its
// constructEvent + refunds.create are both vi.fn()s configured per-test.
function makeMockStripe() {
	return {
		webhooks: { constructEvent: mocks.constructEvent },
		refunds: { create: mocks.refundsCreate }
	} as unknown as Stripe;
}

// fluent .from('bookings').select('...').eq('...').maybeSingle() chain — returns
// the configured booking row for the FIRST .eq lookup (by payment_intent_id).
// The fallback metadata.booking_id branch isn't exercised by these tests.
function mockBookingLookup(booking: { id: string; status: string; check_in_date?: string; check_out_date?: string } | null) {
	const maybeSingle = vi.fn().mockResolvedValue({ data: booking, error: null });
	const eq = vi.fn().mockReturnValue({ maybeSingle });
	const select = vi.fn().mockReturnValue({ eq });
	mocks.from.mockReturnValue({ select });
	return { select, eq, maybeSingle };
}

beforeEach(() => {
	mocks.getStripe.mockReset();
	mocks.getWebhookSecret.mockReset().mockReturnValue('whsec_dummy');
	mocks.constructEvent.mockReset();
	mocks.refundsCreate.mockReset();
	mocks.rpc.mockReset();
	mocks.from.mockReset();
	vi.mocked(emailService.sendBookingConfirmation).mockClear();
	vi.mocked(emailService.sendBookingCancelled).mockClear();
	vi.mocked(emailService.sendBookingOverbooked).mockClear();
	vi.mocked(emailService.sendRefundIssued).mockClear();
	vi.mocked(emailService.sendEnquiry).mockClear();
});

describe('POST /api/stripe/webhook — dark-deploy guard', () => {
	it('returns 503 when STRIPE_SECRET_KEY not configured', async () => {
		mocks.getStripe.mockReturnValue(null);
		mocks.getWebhookSecret.mockReturnValue(null);
		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(503);
	});

	it('returns 400 when stripe-signature header missing (with keys present)', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());
		const res = await POST(makeRequest('{}'));
		expect(res.status).toBe(400);
	});
});

describe('POST /api/stripe/webhook — idempotency replay', () => {
	it('calls handle_stripe_event for both replays; second returns duplicate=true', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());

		const eventId = 'evt_idempotent_1';
		const event = {
			id: eventId,
			type: 'payment_intent.succeeded',
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: 'pi_idem_1',
					amount: 35000,
					metadata: { booking_id: 'b1' }
				}
			}
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);

		mockBookingLookup({
			id: 'b1',
			status: 'pending_payment',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-04'
		});

		// First call: dedup row inserted (duplicate=false). Second call: duplicate=true.
		mocks.rpc
			.mockResolvedValueOnce({ data: { duplicate: false }, error: null })
			.mockResolvedValueOnce({ data: { duplicate: true }, error: null });

		const first = await POST(makeRequest('{}', { 'stripe-signature': 'sig1' }));
		const firstBody = await first.json();
		expect(first.status).toBe(200);
		expect(firstBody.duplicate).toBe(false);
		expect(firstBody.action).toBe('confirmed');

		// Second replay — same event id, same body.
		mockBookingLookup({
			id: 'b1',
			status: 'pending_payment',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-04'
		});
		const second = await POST(makeRequest('{}', { 'stripe-signature': 'sig1' }));
		const secondBody = await second.json();
		expect(second.status).toBe(200);
		expect(secondBody.duplicate).toBe(true);

		// Both replays MUST call handle_stripe_event with the same event id —
		// the SQL function is the dedup gate; the handler doesn't pre-check.
		expect(mocks.rpc).toHaveBeenCalledTimes(2);
		expect(mocks.rpc.mock.calls[0][1].p_event_id).toBe(eventId);
		expect(mocks.rpc.mock.calls[1][1].p_event_id).toBe(eventId);

		// And no refunds issued on either pass (this is the happy-path branch,
		// not the late-success race).
		expect(mocks.refundsCreate).not.toHaveBeenCalled();
	});
});

describe('POST /api/stripe/webhook — email side-effects', () => {
	function fullBookingRow(overrides: Partial<Record<string, unknown>> = {}) {
		return {
			id: 'b_email',
			status: 'pending_payment',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-04',
			booking_reference: 'MC-EMAIL-001',
			guest_name: 'Test Guest',
			guest_email: 'guest@example.invalid',
			num_guests: 2,
			num_nights: 3,
			total_cost: 350,
			guest_locale: 'fr',
			...overrides
		};
	}

	it('sends booking confirmation on first (non-duplicate) confirmed event', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());
		const event = {
			id: 'evt_email_confirm_1',
			type: 'payment_intent.succeeded',
			created: Math.floor(Date.now() / 1000),
			data: { object: { id: 'pi_email_1', amount: 35000, metadata: { booking_id: 'b_email' } } }
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);
		mockBookingLookup(fullBookingRow());
		mocks.rpc.mockResolvedValue({ data: { duplicate: false }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(200);

		expect(emailService.sendBookingConfirmation).toHaveBeenCalledTimes(1);
		const [bookingArg, langArg, linkArg] = vi.mocked(emailService.sendBookingConfirmation).mock.calls[0];
		expect(bookingArg.reference).toBe('MC-EMAIL-001');
		expect(bookingArg.guestEmail).toBe('guest@example.invalid');
		expect(langArg).toBe('fr');
		expect(linkArg).toBeNull();
	});

	it('does NOT send booking confirmation on duplicate (replayed) event', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());
		const event = {
			id: 'evt_email_confirm_dup',
			type: 'payment_intent.succeeded',
			created: Math.floor(Date.now() / 1000),
			data: { object: { id: 'pi_email_2', amount: 35000, metadata: { booking_id: 'b_email' } } }
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);
		mockBookingLookup(fullBookingRow());
		mocks.rpc.mockResolvedValue({ data: { duplicate: true }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(200);
		expect(emailService.sendBookingConfirmation).not.toHaveBeenCalled();
	});

	it('sends overbooked apology (not cancellation) on late-success refund', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());
		const event = {
			id: 'evt_email_overbooked',
			type: 'payment_intent.succeeded',
			created: Math.floor(Date.now() / 1000),
			data: { object: { id: 'pi_email_3', amount: 35000, metadata: { booking_id: 'b_email' } } }
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);
		mockBookingLookup(fullBookingRow({ status: 'expired' }));
		mocks.refundsCreate.mockResolvedValue({ id: 're_2', status: 'pending' });
		mocks.rpc.mockResolvedValue({ data: { duplicate: false }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(200);

		expect(emailService.sendBookingOverbooked).toHaveBeenCalledTimes(1);
		expect(emailService.sendBookingCancelled).not.toHaveBeenCalled();
		const [bookingArg, refundAmount, langArg] = vi.mocked(
			emailService.sendBookingOverbooked
		).mock.calls[0];
		expect(bookingArg.reference).toBe('MC-EMAIL-001');
		expect(refundAmount).toBe(350); // pi.amount 35000 cents → 350 EUR
		expect(langArg).toBe('fr');
	});

	it('sends refund-issued on charge.refunded for non-duplicate event', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());
		const event = {
			id: 'evt_email_refund',
			type: 'charge.refunded',
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: 'ch_1',
					payment_intent: 'pi_email_4',
					amount_refunded: 17500
				}
			}
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);
		mockBookingLookup(fullBookingRow({ status: 'cancelled' }));
		mocks.rpc.mockResolvedValue({ data: { duplicate: false }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		expect(res.status).toBe(200);

		expect(emailService.sendRefundIssued).toHaveBeenCalledTimes(1);
		const [, refundAmount, langArg] = vi.mocked(emailService.sendRefundIssued).mock.calls[0];
		expect(refundAmount).toBe(175); // 17500 cents
		expect(langArg).toBe('fr');
	});
});

describe('POST /api/stripe/webhook — late-success race (refunded_overbooked)', () => {
	it('issues refund + flips to refunded_overbooked when booking already expired', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());

		const eventId = 'evt_late_success_1';
		const event = {
			id: eventId,
			type: 'payment_intent.succeeded',
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: 'pi_late_1',
					amount: 35000,
					metadata: { booking_id: 'b_expired' }
				}
			}
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);

		// The TTL sweep beat the webhook — booking is already 'expired'.
		mockBookingLookup({
			id: 'b_expired',
			status: 'expired',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-04'
		});

		mocks.refundsCreate.mockResolvedValue({ id: 're_1', status: 'pending' });
		mocks.rpc.mockResolvedValue({ data: { duplicate: false }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.action).toBe('refunded_overbooked');

		// Refund issued — with the event id as the Stripe idempotency key so a
		// retry doesn't double-refund.
		expect(mocks.refundsCreate).toHaveBeenCalledTimes(1);
		const [refundArgs, refundOpts] = mocks.refundsCreate.mock.calls[0];
		expect(refundArgs.payment_intent).toBe('pi_late_1');
		expect(refundArgs.metadata.reason).toBe('overbooked');
		expect(refundOpts.idempotencyKey).toBe(eventId);

		// Booking patched to refunded_overbooked, payment_intent_id stamped,
		// pending_until cleared. Crucially: NOT confirmed.
		expect(mocks.rpc).toHaveBeenCalledTimes(1);
		const [, rpcArgs] = mocks.rpc.mock.calls[0];
		expect(rpcArgs.p_booking_patch.status).toBe('refunded_overbooked');
		expect(rpcArgs.p_booking_patch.payment_intent_id).toBe('pi_late_1');
		expect(rpcArgs.p_booking_patch.pending_until).toBeNull();
		expect(rpcArgs.p_audit.outcome).toBe('refunded_overbooked');
		expect(rpcArgs.p_audit.prior_status).toBe('expired');
	});
});

describe('POST /api/stripe/webhook — payment_failed retry semantics', () => {
	it('keeps booking in pending_payment, increments attempts, records error; no availability change', async () => {
		mocks.getStripe.mockReturnValue(makeMockStripe());

		const eventId = 'evt_failed_1';
		const event = {
			id: eventId,
			type: 'payment_intent.payment_failed',
			created: Math.floor(Date.now() / 1000),
			data: {
				object: {
					id: 'pi_failed_1',
					amount: 35000,
					metadata: { booking_id: 'b_pending' },
					last_payment_error: {
						code: 'card_declined',
						message: 'Your card was declined.'
					}
				}
			}
		} as unknown as Stripe.Event;
		mocks.constructEvent.mockReturnValue(event);

		mockBookingLookup({
			id: 'b_pending',
			status: 'pending_payment',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-04'
		});
		mocks.rpc.mockResolvedValue({ data: { duplicate: false }, error: null });

		const res = await POST(makeRequest('{}', { 'stripe-signature': 'sig' }));
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.action).toBe('attempt_failed');

		// No refund attempted on a failed payment.
		expect(mocks.refundsCreate).not.toHaveBeenCalled();

		// Single rpc call with the right patch shape.
		expect(mocks.rpc).toHaveBeenCalledTimes(1);
		const [, rpcArgs] = mocks.rpc.mock.calls[0];

		// Critically: the patch does NOT set status — SQL COALESCE preserves
		// pending_payment so the inventory hold stays in place while the guest
		// retries. The TTL sweep is the only path that releases it.
		expect(rpcArgs.p_booking_patch.status).toBeUndefined();
		expect(rpcArgs.p_booking_patch.increment_payment_attempts).toBe(true);
		expect(rpcArgs.p_booking_patch.last_payment_error).toBe('Your card was declined.');
		expect(rpcArgs.p_audit.outcome).toBe('attempt_failed');
		expect(rpcArgs.p_audit.error_code).toBe('card_declined');

		// Only one .from() call — the booking lookup. No availability touch.
		// (Availability writes go through book_dates_atomic / sweep, never the webhook.)
		expect(mocks.from).toHaveBeenCalledTimes(1);
		expect(mocks.from).toHaveBeenCalledWith('bookings');
	});
});
