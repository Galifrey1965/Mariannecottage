// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/supabase', () => ({
	getBookingsForIcalFeed: vi.fn(async () => [
		{
			booking_reference: 'MC-20260323-AAAA',
			check_in_date: '2026-09-01',
			check_out_date: '2026-09-04',
			updated_at: '2026-04-15T08:30:00Z',
			status: 'confirmed'
		}
	])
}));

const { GET } = await import('./+server');
import { getBookingsForIcalFeed } from '$lib/server/supabase';

beforeEach(() => {
	vi.clearAllMocks();
});

function makeRequest() {
	return {} as Parameters<typeof GET>[0];
}

describe('GET /api/ical/cottage.ics', () => {
	it('returns 200 with text/calendar content-type', async () => {
		const res = await GET(makeRequest());
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toContain('text/calendar');
	});

	it('sets a 5-minute public cache', async () => {
		const res = await GET(makeRequest());
		expect(res.headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=300');
	});

	it('marks the response noindex (not for search engines)', async () => {
		const res = await GET(makeRequest());
		expect(res.headers.get('X-Robots-Tag')).toBe('noindex');
	});

	it('body is a VCALENDAR with the seeded VEVENT', async () => {
		const res = await GET(makeRequest());
		const body = await res.text();
		expect(body).toContain('BEGIN:VCALENDAR');
		expect(body).toContain('END:VCALENDAR');
		expect(body).toContain('UID:MC-20260323-AAAA@mariannecottage.fr');
		expect(body).toContain('DTSTART;VALUE=DATE:20260901');
		expect(body).toContain('DTEND;VALUE=DATE:20260904');
	});

	it('passes today (YYYY-MM-DD) to the supabase helper', async () => {
		await GET(makeRequest());
		const arg = vi.mocked(getBookingsForIcalFeed).mock.calls[0][0];
		expect(arg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('returns an empty (but valid) calendar if the DB call throws', async () => {
		vi.mocked(getBookingsForIcalFeed).mockRejectedValueOnce(new Error('boom'));
		const res = await GET(makeRequest());
		expect(res.status).toBe(200);
		const body = await res.text();
		expect(body).toContain('BEGIN:VCALENDAR');
		expect(body).not.toContain('BEGIN:VEVENT');
	});
});
