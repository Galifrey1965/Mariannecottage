// /api/admin/availability — owner-driven date blocks via synthetic
// source='admin_block' bookings. Spec covers POST/DELETE round-trip, the
// 409 collision rule, the source guard on DELETE, and that admin_notes
// supplied on POST is persisted on the synthetic booking row.
//
// (The standalone /admin/availability page was retired 2026-05-06 — the
// flow now lives inline on the admin booking calendar's empty-day click.)

import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadDotenvIfMissing } from './helpers/env';

loadDotenvIfMissing(['PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: SupabaseClient | null = null;

const TEST_EMAIL = `avail-test-${Date.now()}@test.invalid`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_DISPLAY_NAME = 'Avail Test User';

let createdUserId: string | null = null;
const cleanupBookingIds: string[] = [];

function pickFutureDate(daysAhead: number): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + daysAhead);
	return d.toISOString().slice(0, 10);
}

test.describe('Admin availability — block create/delete', () => {
	test.beforeAll(async () => {
		if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
			test.skip(true, 'PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');
		}
		admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);
		const { data, error } = await admin.auth.admin.createUser({
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
			email_confirm: true,
			user_metadata: { display_name: TEST_DISPLAY_NAME, role: 'owner' }
		});
		if (error || !data.user) throw new Error(`Failed to create test user: ${error?.message}`);
		createdUserId = data.user.id;
	});

	test.afterAll(async () => {
		if (!admin) return;
		if (cleanupBookingIds.length > 0) {
			await admin.from('bookings').delete().in('id', cleanupBookingIds);
		}
		if (createdUserId) {
			await admin.auth.admin.deleteUser(createdUserId);
		}
	});

	test('POST creates admin_block, DELETE releases, agent_events written', async ({ page, request }) => {
		if (!admin || !createdUserId) test.skip();

		await page.goto('/admin/login');
		await page.fill('#email', TEST_EMAIL);
		await page.fill('#password', TEST_PASSWORD);
		await Promise.all([page.waitForURL(/\/admin/), page.click('button[type=submit]')]);

		const cookies = await page.context().cookies();
		const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

		// Pick a future date that's unlikely to collide with seeded fixtures.
		const targetDate = pickFutureDate(450);

		// Make sure the target is free before we start (cleanup from a prior failed run).
		await admin!
			.from('bookings')
			.delete()
			.eq('source', 'admin_block')
			.eq('check_in_date', targetDate);
		await admin!.from('availability').delete().eq('date', targetDate);

		// 1. POST blocks the date — with an admin_notes reason that should
		// persist verbatim on the synthetic booking row.
		const reason = 'Maintenance — boiler service';
		const postRes = await request.post('/api/admin/availability', {
			headers: { 'content-type': 'application/json', cookie: cookieHeader },
			data: { date: targetDate, admin_notes: reason }
		});
		expect(postRes.status()).toBe(200);
		const postBody = await postRes.json();
		expect(postBody.success).toBe(true);
		expect(postBody.id).toBeTruthy();
		const blockId = postBody.id as string;
		cleanupBookingIds.push(blockId);

		// Booking row exists with admin_block source + the supplied notes.
		const { data: row } = await admin!
			.from('bookings')
			.select('id, source, status, total_cost, num_nights, admin_notes')
			.eq('id', blockId)
			.single();
		expect(row).toMatchObject({
			source: 'admin_block',
			status: 'confirmed',
			total_cost: 0,
			num_nights: 1,
			admin_notes: reason
		});

		// Availability row marked unavailable for the target date.
		const { data: availRow } = await admin!
			.from('availability')
			.select('available, synced_from')
			.eq('date', targetDate)
			.single();
		expect(availRow?.available).toBe(false);
		expect(availRow?.synced_from).toBe('manual');

		// 2. POST again on the same date returns 409.
		const dupRes = await request.post('/api/admin/availability', {
			headers: { 'content-type': 'application/json', cookie: cookieHeader },
			data: { date: targetDate }
		});
		expect(dupRes.status()).toBe(409);

		// 3. DELETE releases the block.
		const delRes = await request.delete('/api/admin/availability', {
			headers: { 'content-type': 'application/json', cookie: cookieHeader },
			data: { id: blockId }
		});
		expect(delRes.status()).toBe(200);

		const { data: gone } = await admin!
			.from('bookings')
			.select('id')
			.eq('id', blockId)
			.maybeSingle();
		expect(gone).toBeNull();
		cleanupBookingIds.splice(cleanupBookingIds.indexOf(blockId), 1);

		const { data: freed } = await admin!
			.from('availability')
			.select('available')
			.eq('date', targetDate)
			.maybeSingle();
		expect(freed?.available).toBe(true);

		// agent_events: one create + one delete attributed to the user.
		const { data: events } = await admin!
			.from('agent_events')
			.select('user_id, action, target_id')
			.in('action', ['availability.block.create', 'availability.block.delete'])
			.eq('target_id', blockId);
		const actions = (events ?? []).map((e) => e.action).sort();
		expect(actions).toEqual(['availability.block.create', 'availability.block.delete']);
		for (const e of events ?? []) {
			expect(e.user_id).toBe(createdUserId);
		}
		await admin!.from('agent_events').delete().eq('target_id', blockId);
	});

	test('DELETE refuses non-admin_block bookings', async ({ page, request }) => {
		if (!admin || !createdUserId) test.skip();

		await page.goto('/admin/login');
		await page.fill('#email', TEST_EMAIL);
		await page.fill('#password', TEST_PASSWORD);
		await Promise.all([page.waitForURL(/\/admin/), page.click('button[type=submit]')]);

		const cookies = await page.context().cookies();
		const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

		const ref = `MC-NOTBLOCK-${Date.now()}`;
		const { data: realBooking } = await admin!
			.from('bookings')
			.insert({
				guest_name: 'Guard Test',
				guest_email: 'guard@test.invalid',
				num_guests: 1,
				check_in_date: pickFutureDate(460),
				check_out_date: pickFutureDate(461),
				num_nights: 1,
				nightly_rate: 100,
				subtotal: 100,
				tax: 0,
				total_cost: 100,
				status: 'confirmed',
				booking_reference: ref,
				source: 'web'
			})
			.select()
			.single();
		const realId = (realBooking as { id: string }).id;
		cleanupBookingIds.push(realId);

		const res = await request.delete('/api/admin/availability', {
			headers: { 'content-type': 'application/json', cookie: cookieHeader },
			data: { id: realId }
		});
		expect(res.status()).toBe(409);

		// Booking still exists.
		const { data: still } = await admin!
			.from('bookings')
			.select('id')
			.eq('id', realId)
			.maybeSingle();
		expect(still?.id).toBe(realId);
	});
});
