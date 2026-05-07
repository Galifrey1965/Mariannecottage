// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the handler.
vi.mock('$lib/server/supabase', () => {
	class FakeBookingDatesTakenError extends Error {
		constructor() {
			super('DATES_TAKEN');
			this.name = 'BookingDatesTakenError';
		}
	}
	return {
		// adminClient is used by the pre-book expire_pending_bookings sweep.
		adminClient: { rpc: vi.fn(async () => ({ error: null })) },
		createBookingAtomic: vi.fn(),
		BookingDatesTakenError: FakeBookingDatesTakenError,
		generateBookingReference: vi.fn(() => 'MC-20260323-TEST'),
		getTaxSettings: vi.fn(async () => ({
			id: 1,
			taxe_de_sejour_per_person_per_night: 0.68,
			updated_at: '2026-05-03T00:00:00Z'
		})),
		getRateForBooking: vi.fn(async (_date: string, num_guests: number) => ({
			season: {
				id: 'season-1',
				name: 'Test',
				kind: 'high',
				rate_per_night: 100,
				rate_2_guests: 120,
				rate_3_guests: 140,
				rate_4_guests: 160,
				start_date: '2026-01-01',
				end_date: '2026-12-31',
				is_active: true,
				reviewed_by_admin: true
			},
			nightly_rate: [100, 120, 140, 160][num_guests - 1] ?? 120
		}))
	};
});

import { POST } from './+server';
import { adminClient, createBookingAtomic, BookingDatesTakenError, getRateForBooking } from '$lib/server/supabase';

// Unique IP per call so the in-memory rate limiter (per /api/book IP)
// doesn't 429 the later tests in the suite.
let ipCounter = 0;
function makeRequest(body: Record<string, unknown>) {
	const ip = `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`;
	ipCounter += 1;
	return {
		request: new Request('http://localhost/api/book', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		}),
		getClientAddress: () => ip
	} as any;
}

function isoDateNDaysAhead(n: number): string {
	// UTC-anchored to match getEarliestCheckInDate's TZ behaviour. Otherwise
	// a non-UTC test host could pick a "today" that's a day off from the
	// server's "today" and the lead-time guard would land in the wrong
	// branch.
	const d = new Date();
	d.setUTCHours(0, 0, 0, 0);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

// 30 days out keeps clear of the 48h lead-time + 2-night minimum guards;
// computed at call-time so the suite never goes stale relative to "now".
function makeValidBody(): Record<string, unknown> {
	return {
		guest_name: 'John Doe',
		guest_email: 'john@example.com',
		num_guests: 2,
		check_in_date: isoDateNDaysAhead(30),
		check_out_date: isoDateNDaysAhead(33)
	};
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /api/book', () => {
	it('400 when guest_name missing', async () => {
		const { guest_name: _g, ...body } = makeValidBody();
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('guest_name');
	});

	it('400 when guest_email missing', async () => {
		const { guest_email: _e, ...body } = makeValidBody();
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 when num_guests missing', async () => {
		const { num_guests: _n, ...body } = makeValidBody();
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 for invalid email', async () => {
		const res = await POST(makeRequest({ ...makeValidBody(), guest_email: 'not-an-email' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('email');
	});

	it('400 when num_guests out of range (5)', async () => {
		const res = await POST(makeRequest({ ...makeValidBody(), num_guests: 5 }));
		expect(res.status).toBe(400);
	});

	it('400 when checkout <= checkin', async () => {
		const res = await POST(makeRequest({
			...makeValidBody(),
			check_in_date: '2026-04-04',
			check_out_date: '2026-04-01'
		}));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('Check-out');
	});

	it('400 with min_nights when stay is shorter than the policy minimum', async () => {
		const res = await POST(makeRequest({
			...makeValidBody(),
			check_in_date: isoDateNDaysAhead(30),
			check_out_date: isoDateNDaysAhead(31) // 1 night
		}));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error_code).toBe('min_nights');
		expect(data.min_nights).toBe(2);
		expect(createBookingAtomic).not.toHaveBeenCalled();
	});

	it('400 with lead_time when check-in is inside the lead-time window', async () => {
		// Same-day check-in is well inside the 48h floor.
		const res = await POST(makeRequest({
			...makeValidBody(),
			check_in_date: isoDateNDaysAhead(0),
			check_out_date: isoDateNDaysAhead(3)
		}));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error_code).toBe('lead_time');
		expect(data.min_lead_hours).toBe(48);
		expect(createBookingAtomic).not.toHaveBeenCalled();
	});

	it('400 with no_rate_plan when no plan covers the dates', async () => {
		vi.mocked(getRateForBooking).mockResolvedValueOnce(null);
		const res = await POST(makeRequest(makeValidBody()));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error_code).toBe('no_rate_plan');
		expect(createBookingAtomic).not.toHaveBeenCalled();
	});

	it('calculates nights correctly for 3-night stay', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1', booking_reference: 'MC-20260323-TEST' } as any);
		await POST(makeRequest(makeValidBody()));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ num_nights: 3 }));
	});

	it('uses per-guest rate from rate plan (2 guests => 120)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest(makeValidBody()));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 120 }));
	});

	it('uses per-guest rate from rate plan (3 guests => 140)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest({ ...makeValidBody(), num_guests: 3 }));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 140 }));
	});

	it('treats per-night rate as tax-inclusive — total === subtotal, no taxe de séjour added', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest(makeValidBody()));
		// nightly_rate = 120 (mocked plan rate_2_guests)
		// subtotal = 3 × 120 = 360. Tourist tax is included in the quote per Mark.
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({
			subtotal: 360,
			tax: 0,
			total_cost: 360
		}));
	});

	it('ignores any client-supplied nightly_rate (server-authoritative)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest({ ...makeValidBody(), nightly_rate: 9999 }));
		// rate plan still wins
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 120 }));
	});

	it('returns booking on success', async () => {
		const mockBooking = { id: '1', booking_reference: 'MC-20260323-TEST' };
		vi.mocked(createBookingAtomic).mockResolvedValueOnce(mockBooking as any);
		const res = await POST(makeRequest(makeValidBody()));
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.booking.booking_reference).toBe('MC-20260323-TEST');
	});

	it('sweeps expired pending_payment rows before attempting the booking', async () => {
		// Without the pre-book sweep, a guest who clicked Confirm a few
		// minutes ago and bounced would have a stuck pending_payment row
		// blocking their own retry inside the 20-min TTL window.
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1', booking_reference: 'MC-X' } as any);
		await POST(makeRequest(makeValidBody()));
		expect(vi.mocked(adminClient.rpc)).toHaveBeenCalledWith('expire_pending_bookings');
	});

	it('attempts the booking even if the pre-book sweep itself fails', async () => {
		// Sweep failure shouldn't take down the whole flow — we log and
		// continue. The atomic RPC still gets a chance.
		vi.mocked(adminClient.rpc).mockRejectedValueOnce(new Error('rpc broken'));
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1', booking_reference: 'MC-Y' } as any);
		const res = await POST(makeRequest(makeValidBody()));
		expect(res.status).toBe(200);
		expect(createBookingAtomic).toHaveBeenCalled();
	});

	it('returns 409 with dates_taken error_code when BookingDatesTakenError thrown', async () => {
		vi.mocked(createBookingAtomic).mockRejectedValueOnce(new BookingDatesTakenError());
		const res = await POST(makeRequest(makeValidBody()));
		expect(res.status).toBe(409);
		const data = await res.json();
		expect(data.success).toBe(false);
		expect(data.error_code).toBe('dates_taken');
	});

	it('500 when createBookingAtomic throws unexpected error', async () => {
		vi.mocked(createBookingAtomic).mockRejectedValueOnce(new Error('DB error'));
		const res = await POST(makeRequest(makeValidBody()));
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.success).toBe(false);
	});
});
