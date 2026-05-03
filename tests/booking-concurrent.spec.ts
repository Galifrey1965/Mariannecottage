// B-02 Phase 1: concurrent booking attempts must serialise.
// Two parallel POSTs to /api/book for identical dates → exactly one 200, one 409.
//
// Writes to the live Supabase project, then cleans up its own booking row +
// availability flips in afterEach. Requires PUBLIC_SUPABASE_URL +
// SUPABASE_SERVICE_ROLE_KEY (loaded from .env if present, since Playwright
// doesn't auto-load like Vite does). If absent, skips with a clear reason.

import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadDotenvIfMissing } from './helpers/env';

loadDotenvIfMissing(['PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_CHECK_IN = '2027-09-14';
const TEST_CHECK_OUT = '2027-09-17';
const TEST_DATES = ['2027-09-14', '2027-09-15', '2027-09-16'];
const TEST_RATE_PLAN_NAME = '__test_concurrent_booking__';

let admin: SupabaseClient | null = null;
let testPlanId: string | null = null;

async function cleanupTestRows() {
	if (!admin) return;
	await admin.from('bookings').delete().eq('check_in_date', TEST_CHECK_IN).eq('check_out_date', TEST_CHECK_OUT);
	await admin.from('availability').delete().in('date', TEST_DATES);
}

async function ensureTestRatePlan() {
	if (!admin) return;
	// PR 4 (B-01): /api/book now requires a rate plan covering check_in_date.
	// Seed a dedicated test plan for the 2027 dates; cleaned up in afterAll.
	const { data } = await admin
		.from('rate_plans')
		.insert([{
			name: TEST_RATE_PLAN_NAME,
			rate_per_night: 100,
			rate_2_guests: 120,
			rate_3_guests: 140,
			rate_4_guests: 160,
			valid_from: '2027-01-01',
			valid_until: '2027-12-31',
			is_active: true
		}])
		.select('id')
		.single();
	testPlanId = data?.id ?? null;
}

async function removeTestRatePlan() {
	if (!admin || !testPlanId) return;
	await admin.from('rate_plans').delete().eq('id', testPlanId);
	testPlanId = null;
}

function buildBookingPayload(suffix: string) {
	return {
		guest_name: `Concurrent Test ${suffix}`,
		guest_email: `concurrent-${suffix}@test.invalid`,
		num_guests: 2,
		check_in_date: TEST_CHECK_IN,
		check_out_date: TEST_CHECK_OUT
	};
}

test.describe('Concurrent booking — B-02 Phase 1', () => {
	test.beforeAll(async () => {
		if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
			test.skip(true, 'PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required for cleanup');
		}
		admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
		await ensureTestRatePlan();
	});

	test.afterAll(removeTestRatePlan);

	test.beforeEach(cleanupTestRows);
	test.afterEach(cleanupTestRows);

	test('two parallel POSTs to same dates → one 200, one 409', async ({ request }) => {
		const [resA, resB] = await Promise.all([
			request.post('/api/book', { data: buildBookingPayload('A') }),
			request.post('/api/book', { data: buildBookingPayload('B') })
		]);

		const statuses = [resA.status(), resB.status()].sort();
		expect(statuses).toEqual([200, 409]);

		const winner = resA.status() === 200 ? resA : resB;
		const loser = resA.status() === 409 ? resA : resB;

		const winnerBody = await winner.json();
		expect(winnerBody.success).toBe(true);
		expect(winnerBody.booking?.booking_reference).toMatch(/^MC-/);

		const loserBody = await loser.json();
		expect(loserBody.success).toBe(false);
		expect(loserBody.error_code).toBe('dates_taken');
	});
});
