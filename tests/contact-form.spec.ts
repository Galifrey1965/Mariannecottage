import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
	test('contact page loads with form', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.locator('form')).toBeVisible();
		await expect(page.locator('input[type="text"]')).toBeVisible();
		await expect(page.locator('input[type="email"]')).toBeVisible();
		await expect(page.locator('textarea')).toBeVisible();
	});

	test('form fields have required attribute', async ({ page }) => {
		await page.goto('/contact');
		const nameInput = page.locator('input#name');
		const emailInput = page.locator('input#email');
		const textarea = page.locator('textarea#message');
		await expect(nameInput).toHaveAttribute('required', '');
		await expect(emailInput).toHaveAttribute('required', '');
		await expect(textarea).toHaveAttribute('required', '');
	});

	test('social links have correct hrefs', async ({ page }) => {
		await page.goto('/contact');
		const bookingLink = page.locator('a[href*="booking.com"]');
		await expect(bookingLink).toBeVisible();

		const tripLink = page.locator('a[href*="tripadvisor.com"]');
		await expect(tripLink).toBeVisible();
	});
});
