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
		createBookingAtomic: vi.fn(),
		BookingDatesTakenError: FakeBookingDatesTakenError,
		generateBookingReference: vi.fn(() => 'MC-20260323-TEST'),
		getTaxSettings: vi.fn(async () => ({
			id: 1,
			taxe_de_sejour_per_person_per_night: 0.68,
			updated_at: '2026-05-03T00:00:00Z'
		})),
		getRateForBooking: vi.fn(async (_date: string, num_guests: number) => ({
			plan: {
				id: 'plan-1',
				name: 'Test',
				rate_per_night: 100,
				rate_2_guests: 120,
				rate_3_guests: 140,
				rate_4_guests: 160,
				valid_from: '2026-01-01',
				valid_until: '2026-12-31',
				is_active: true
			},
			nightly_rate: [100, 120, 140, 160][num_guests - 1] ?? 120
		}))
	};
});

import { POST } from './+server';
import { createBookingAtomic, BookingDatesTakenError, getRateForBooking } from '$lib/server/supabase';

function makeRequest(body: Record<string, unknown>) {
	return {
		request: new Request('http://localhost/api/book', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	} as any;
}

const validBody = {
	guest_name: 'John Doe',
	guest_email: 'john@example.com',
	num_guests: 2,
	check_in_date: '2026-04-01',
	check_out_date: '2026-04-04'
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /api/book', () => {
	it('400 when guest_name missing', async () => {
		const { guest_name: _g, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('guest_name');
	});

	it('400 when guest_email missing', async () => {
		const { guest_email: _e, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 when num_guests missing', async () => {
		const { num_guests: _n, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 for invalid email', async () => {
		const res = await POST(makeRequest({ ...validBody, guest_email: 'not-an-email' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('email');
	});

	it('400 when num_guests out of range (5)', async () => {
		const res = await POST(makeRequest({ ...validBody, num_guests: 5 }));
		expect(res.status).toBe(400);
	});

	it('400 when checkout <= checkin', async () => {
		const res = await POST(makeRequest({
			...validBody,
			check_in_date: '2026-04-04',
			check_out_date: '2026-04-01'
		}));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('Check-out');
	});

	it('400 with no_rate_plan when no plan covers the dates', async () => {
		vi.mocked(getRateForBooking).mockResolvedValueOnce(null);
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error_code).toBe('no_rate_plan');
		expect(createBookingAtomic).not.toHaveBeenCalled();
	});

	it('calculates nights correctly for 3-night stay', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1', booking_reference: 'MC-20260323-TEST' } as any);
		await POST(makeRequest(validBody));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ num_nights: 3 }));
	});

	it('uses per-guest rate from rate plan (2 guests => 120)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest(validBody));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 120 }));
	});

	it('uses per-guest rate from rate plan (3 guests => 140)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest({ ...validBody, num_guests: 3 }));
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 140 }));
	});

	it('calculates taxe de séjour as guests × nights × per-person-per-night rate', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest(validBody));
		// 2 guests × 3 nights × 0.68 = 4.08
		// nightly_rate = 120 (mocked plan rate_2_guests)
		// subtotal = 3 × 120 = 360
		// total = 360 + 4.08 = 364.08
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({
			subtotal: 360,
			tax: 4.08,
			total_cost: 364.08
		}));
	});

	it('ignores any client-supplied nightly_rate (server-authoritative)', async () => {
		vi.mocked(createBookingAtomic).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest({ ...validBody, nightly_rate: 9999 }));
		// rate plan still wins
		expect(createBookingAtomic).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 120 }));
	});

	it('returns booking on success', async () => {
		const mockBooking = { id: '1', booking_reference: 'MC-20260323-TEST' };
		vi.mocked(createBookingAtomic).mockResolvedValueOnce(mockBooking as any);
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.booking.booking_reference).toBe('MC-20260323-TEST');
	});

	it('returns 409 with dates_taken error_code when BookingDatesTakenError thrown', async () => {
		vi.mocked(createBookingAtomic).mockRejectedValueOnce(new BookingDatesTakenError());
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(409);
		const data = await res.json();
		expect(data.success).toBe(false);
		expect(data.error_code).toBe('dates_taken');
	});

	it('500 when createBookingAtomic throws unexpected error', async () => {
		vi.mocked(createBookingAtomic).mockRejectedValueOnce(new Error('DB error'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.success).toBe(false);
	});
});
