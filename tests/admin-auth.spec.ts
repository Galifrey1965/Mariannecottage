// B-07 / PR 3: end-to-end auth flow with a throwaway user.
// Creates a test user via Admin API → logs in via the UI → asserts /admin
// loads → logs out → deletes the user. Verifies the on_auth_user_created
// trigger seeds user_profiles with the metadata we passed.

import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadDotenvIfMissing } from './helpers/env';

loadDotenvIfMissing(['PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let admin: SupabaseClient | null = null;

const TEST_EMAIL = `admin-auth-test-${Date.now()}@test.invalid`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_DISPLAY_NAME = 'Auth Test User';

let createdUserId: string | null = null;

test.describe('Admin auth — B-07 / PR 3', () => {
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
		if (error || !data.user) {
			throw new Error(`Failed to create test user: ${error?.message}`);
		}
		createdUserId = data.user.id;
	});

	test.afterAll(async () => {
		if (admin && createdUserId) {
			await admin.auth.admin.deleteUser(createdUserId);
		}
	});

	test('on_auth_user_created trigger seeds user_profiles with metadata', async () => {
		if (!admin || !createdUserId) test.skip();
		const { data, error } = await admin!
			.from('user_profiles')
			.select('user_id, display_name, role')
			.eq('user_id', createdUserId!)
			.single();
		expect(error).toBeNull();
		expect(data).toMatchObject({
			user_id: createdUserId,
			display_name: TEST_DISPLAY_NAME,
			role: 'owner'
		});
	});

	test('unauthenticated /admin redirects to /admin/login', async ({ page }) => {
		const response = await page.goto('/admin');
		// SvelteKit follows the redirect by default; confirm we land on /admin/login.
		await expect(page).toHaveURL(/\/admin\/login$/);
		expect(response?.ok()).toBe(true);
	});

	test('login → /admin → logout → /admin/login', async ({ page }) => {
		await page.goto('/admin/login');
		await page.fill('#email', TEST_EMAIL);
		await page.fill('#password', TEST_PASSWORD);
		await Promise.all([
			page.waitForURL(/\/admin/),
			page.click('button[type=submit]')
		]);

		await expect(page).toHaveURL(/\/admin$/);
		await expect(page.locator('h2.page-title')).toHaveText('Bookings');
		await expect(page.locator('.user-pill')).toContainText(TEST_DISPLAY_NAME);

		await page.click('button.logout-btn');
		await expect(page).toHaveURL(/\/admin\/login$/);
	});

	test('invalid credentials show error', async ({ page }) => {
		await page.goto('/admin/login');
		await page.fill('#email', TEST_EMAIL);
		await page.fill('#password', 'wrong-password');
		await page.click('button[type=submit]');
		await expect(page.locator('.error-text')).toBeVisible();
		await expect(page).toHaveURL(/\/admin\/login$/);
	});

	test('admin PATCH writes agent_events row attributed to user', async ({ page, request }) => {
		if (!admin || !createdUserId) test.skip();

		// Seed a booking we can PATCH.
		const ref = `MC-AUDIT-${Date.now()}`;
		const { data: created, error: createErr } = await admin!
			.from('bookings')
			.insert({
				guest_name: 'Audit Test',
				guest_email: 'audit@test.invalid',
				num_guests: 1,
				check_in_date: '2028-02-01',
				check_out_date: '2028-02-02',
				num_nights: 1,
				nightly_rate: 120,
				subtotal: 120,
				tax: 0.68,
				total_cost: 120.68,
				status: 'pending',
				booking_reference: ref
			})
			.select()
			.single();
		expect(createErr).toBeNull();
		const bookingId = (created as { id: string }).id;

		try {
			// Log in (sets session cookie on the page context).
			await page.goto('/admin/login');
			await page.fill('#email', TEST_EMAIL);
			await page.fill('#password', TEST_PASSWORD);
			await Promise.all([page.waitForURL(/\/admin/), page.click('button[type=submit]')]);

			// PATCH using the same auth context.
			const cookies = await page.context().cookies();
			const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
			const patchRes = await request.patch('/api/admin/bookings', {
				headers: { 'content-type': 'application/json', cookie: cookieHeader },
				data: { id: bookingId, status: 'confirmed' }
			});
			expect(patchRes.status()).toBe(200);

			// Verify agent_events row was written.
			const { data: events } = await admin!
				.from('agent_events')
				.select('user_id, action, target_type, target_id')
				.eq('target_id', bookingId);
			expect(events).toEqual([
				expect.objectContaining({
					user_id: createdUserId,
					action: 'booking.update',
					target_type: 'booking',
					target_id: bookingId
				})
			]);
		} finally {
			await admin!.from('bookings').delete().eq('id', bookingId);
			await admin!.from('agent_events').delete().eq('target_id', bookingId);
		}
	});
});
