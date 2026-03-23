// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the handler
vi.mock('$lib/server/supabase', () => ({
	createBooking: vi.fn(),
	generateBookingReference: vi.fn(() => 'MC-20260323-TEST')
}));

import { POST } from './+server';
import { createBooking } from '$lib/server/supabase';

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
	check_out_date: '2026-04-04',
	nightly_rate: 120
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe('POST /api/book', () => {
	it('400 when guest_name missing', async () => {
		const { guest_name, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('guest_name');
	});

	it('400 when guest_email missing', async () => {
		const { guest_email, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 when num_guests missing', async () => {
		const { num_guests, ...body } = validBody;
		const res = await POST(makeRequest(body));
		expect(res.status).toBe(400);
	});

	it('400 for invalid email', async () => {
		const res = await POST(makeRequest({ ...validBody, guest_email: 'not-an-email' }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toContain('email');
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

	it('calculates nights correctly for 3-night stay', async () => {
		vi.mocked(createBooking).mockResolvedValueOnce({ id: '1', booking_reference: 'MC-20260323-TEST' } as any);
		await POST(makeRequest(validBody));
		expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ num_nights: 3 }));
	});

	it('calculates tax at 10% of subtotal', async () => {
		vi.mocked(createBooking).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest(validBody));
		// 3 nights × 120 = 360 subtotal, tax = 36
		expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({
			subtotal: 360,
			tax: 36,
			total_cost: 396
		}));
	});

	it('defaults nightly_rate to 120 when not provided', async () => {
		vi.mocked(createBooking).mockResolvedValueOnce({ id: '1' } as any);
		const { nightly_rate, ...body } = validBody;
		await POST(makeRequest(body));
		expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 120 }));
	});

	it('uses provided nightly_rate', async () => {
		vi.mocked(createBooking).mockResolvedValueOnce({ id: '1' } as any);
		await POST(makeRequest({ ...validBody, nightly_rate: 150 }));
		expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ nightly_rate: 150 }));
	});

	it('returns booking on success', async () => {
		const mockBooking = { id: '1', booking_reference: 'MC-20260323-TEST', guest_name: 'John Doe' };
		vi.mocked(createBooking).mockResolvedValueOnce(mockBooking as any);
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		expect(data.booking.booking_reference).toBe('MC-20260323-TEST');
	});

	it('500 when createBooking throws', async () => {
		vi.mocked(createBooking).mockRejectedValueOnce(new Error('DB error'));
		const res = await POST(makeRequest(validBody));
		expect(res.status).toBe(500);
		const data = await res.json();
		expect(data.success).toBe(false);
	});
});
