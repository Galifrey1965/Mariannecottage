// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		BOOKING_COM_ICAL_URL: 'https://example.com/cal.ics',
		SYNC_SECRET: 'test-secret'
	}
}));

// Track insert/upsert/update calls so we can assert on them
const insertCalls: unknown[][] = [];
const upsertCalls: unknown[][] = [];
const updateCalls: unknown[][] = [];

vi.mock('$lib/server/supabase', () => {
	// chainable query stubs
	const bookingSelectQuery: any = {
		eq: vi.fn().mockReturnThis(),
		gte: vi.fn().mockResolvedValue({ data: [], error: null })
	};
	const availSelectQuery: any = {
		eq: vi.fn().mockReturnThis(),
		gte: vi.fn().mockResolvedValue({ data: [], error: null })
	};
	const updateQuery: any = {
		in: vi.fn().mockReturnThis(),
		eq: vi.fn().mockResolvedValue({ error: null })
	};

	const adminClient = {
		from: vi.fn((table: string) => ({
			select: vi.fn(() => (table === 'bookings' ? bookingSelectQuery : availSelectQuery)),
			insert: vi.fn((row: unknown) => {
				insertCalls.push([table, row]);
				return Promise.resolve({ error: null });
			}),
			upsert: vi.fn((rows: unknown, opts?: unknown) => {
				upsertCalls.push([table, rows, opts]);
				return Promise.resolve({ error: null });
			}),
			update: vi.fn((patch: unknown) => {
				updateCalls.push([table, patch]);
				return updateQuery;
			})
		}))
	};
	return { adminClient };
});

// iCal fixture WITH UIDs (the new sync filters out events lacking UID).
// One reservation, 2026-06-01 → 2026-06-03 (so 2 blocked nights).
const SAMPLE_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:RES-12345@booking.com
SUMMARY:CLOSED - Not available
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260603
END:VEVENT
END:VCALENDAR`;

const { POST } = await import('./+server');

describe('POST /api/sync-booking-com', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		insertCalls.length = 0;
		upsertCalls.length = 0;
		updateCalls.length = 0;
	});

	it('returns 401 without correct secret', async () => {
		const req = new Request('http://localhost/api/sync-booking-com', {
			method: 'POST',
			headers: { 'x-sync-secret': 'wrong' }
		});
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(401);
	});

	it('returns 401 with no secret header', async () => {
		const req = new Request('http://localhost/api/sync-booking-com', { method: 'POST' });
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(401);
	});

	it('promotes new BC iCal events to bookings rows + blocks the date range', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response(SAMPLE_ICAL, { status: 200 }));

		const req = new Request('http://localhost/api/sync-booking-com', {
			method: 'POST',
			headers: { 'x-sync-secret': 'test-secret' }
		});
		const res = await POST({ request: req } as any);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.inserted).toBe(1);
		expect(body.updated).toBe(0);
		expect(body.cancelled).toBe(0);
		expect(body.blocked_dates).toBe(2); // 2026-06-01, 2026-06-02

		// One booking row inserted with the iCal metadata
		const bookingInserts = insertCalls.filter(([table]) => table === 'bookings');
		expect(bookingInserts).toHaveLength(1);
		expect(bookingInserts[0][1]).toMatchObject({
			source: 'booking_com',
			status: 'confirmed',
			ical_uid: 'RES-12345@booking.com',
			ical_summary: 'CLOSED - Not available',
			check_in_date: '2026-06-01',
			check_out_date: '2026-06-03',
			num_nights: 2
		});

		// Availability upserted for both dates
		const availUpserts = upsertCalls.filter(([table]) => table === 'availability');
		expect(availUpserts).toHaveLength(1);
		const rows = availUpserts[0][1] as Array<{ date: string; available: boolean }>;
		expect(rows.map((r) => r.date).sort()).toEqual(['2026-06-01', '2026-06-02']);
		expect(rows.every((r) => r.available === false)).toBe(true);
	});

	it('returns 502 when iCal fetch fails', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }));

		const req = new Request('http://localhost/api/sync-booking-com', {
			method: 'POST',
			headers: { 'x-sync-secret': 'test-secret' }
		});
		const res = await POST({ request: req } as any);
		expect(res.status).toBe(502);
	});
});
