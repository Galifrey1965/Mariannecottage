// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env vars (route uses $env/dynamic/private)
vi.mock('$env/dynamic/private', () => ({
	env: {
		BOOKING_COM_ICAL_URL: 'https://example.com/cal.ics',
		SYNC_SECRET: 'test-secret'
	}
}));

// Mock supabase adminClient
// Must support both:
//   from('availability').select(...).eq(...).gte(...)  → fetch existing BC rows (S-01)
//   from('availability').upsert(...)                    → block new dates
//   from('availability').update(...).in(...).eq(...)   → free stale BC rows (S-01)
vi.mock('$lib/server/supabase', () => {
	const selectQuery: any = {
		eq: vi.fn().mockReturnThis(),
		gte: vi.fn().mockResolvedValue({ data: [], error: null })
	};
	const updateQuery: any = {
		in: vi.fn().mockReturnThis(),
		eq: vi.fn().mockResolvedValue({ error: null })
	};
	const adminClient = {
		from: vi.fn(() => ({
			select: vi.fn(() => selectQuery),
			upsert: vi.fn().mockResolvedValue({ error: null }),
			update: vi.fn(() => updateQuery)
		}))
	};
	return { adminClient };
});

const SAMPLE_ICAL = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260603
SUMMARY:Blocked
END:VEVENT
END:VCALENDAR`;

const { POST } = await import('./+server');

describe('POST /api/sync-booking-com', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
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

	it('fetches iCal and upserts blocked dates', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(SAMPLE_ICAL, { status: 200 })
		);

		const req = new Request('http://localhost/api/sync-booking-com', {
			method: 'POST',
			headers: { 'x-sync-secret': 'test-secret' }
		});
		const res = await POST({ request: req } as any);
		const body = await res.json();
		expect(res.status).toBe(200);
		expect(body.synced).toBe(2); // 2026-06-01 and 2026-06-02
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
