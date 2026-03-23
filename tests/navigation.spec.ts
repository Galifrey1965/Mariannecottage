import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('home page loads with header', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.header')).toBeVisible();
		await expect(page.locator('.logo-name')).toBeVisible();
	});

	test('desktop nav visible at 840px+', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');
		await expect(page.locator('.desktop-nav')).toBeVisible();
		await expect(page.locator('.menu-toggle')).not.toBeVisible();
	});

	test('hamburger visible below 600px, no desktop nav', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');
		await expect(page.locator('.menu-toggle')).toBeVisible();
		await expect(page.locator('.desktop-nav')).not.toBeVisible();
	});

	test('nav rail visible at 600-839px', async ({ page }) => {
		await page.setViewportSize({ width: 720, height: 900 });
		await page.goto('/');
		await expect(page.locator('.rail')).toBeVisible();
		await expect(page.locator('.menu-toggle')).not.toBeVisible();
	});

	test('nav rail hidden at 840px+', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');
		await expect(page.locator('.rail')).not.toBeVisible();
	});

	test('nav links navigate to pages', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');

		await page.click('.desktop-nav >> text=Rooms');
		await expect(page).toHaveURL(/\/rooms/);

		await page.click('.desktop-nav >> text=Gallery');
		await expect(page).toHaveURL(/\/gallery/);
	});

	test('mobile menu opens and links work', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		await page.click('.menu-toggle');
		await expect(page.locator('.mobile-drawer')).toBeVisible();

		await page.click('.mobile-drawer >> text=Contact');
		await expect(page).toHaveURL(/\/contact/);
	});
});
