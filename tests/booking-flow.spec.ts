import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
	test('booking page loads with calendar', async ({ page }) => {
		await page.goto('/book');
		await expect(page.locator('.calendar')).toBeVisible();
		await expect(page.locator('.month-title')).toBeVisible();
	});

	test('calendar month navigation works', async ({ page }) => {
		await page.goto('/book');
		const monthTitle = page.locator('.month-title');
		const initialMonth = await monthTitle.textContent();

		await page.click('.nav-btn:last-of-type'); // next month
		const newMonth = await monthTitle.textContent();
		expect(newMonth).not.toBe(initialMonth);
	});

	test('step indicator shows dates step active', async ({ page }) => {
		await page.goto('/book');
		const activeStep = page.locator('.step-btn.active');
		await expect(activeStep).toBeVisible();
	});

	test('booking summary sidebar visible on desktop', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/book');
		await expect(page.locator('.summary')).toBeVisible();
	});
});
