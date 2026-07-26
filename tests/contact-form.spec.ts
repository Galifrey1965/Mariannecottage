import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
	test('contact page loads with form', async ({ page }) => {
		await page.goto('/contact');
		await expect(page.locator('form')).toBeVisible();
		// Addressed by id, not by type: the form also carries a hidden
		// anti-bot honeypot text input, so `input[type="text"]` is ambiguous.
		await expect(page.locator('input#enq-name')).toBeVisible();
		await expect(page.locator('input#enq-email')).toBeVisible();
		await expect(page.locator('textarea#enq-message')).toBeVisible();
	});

	test('form fields have required attribute', async ({ page }) => {
		await page.goto('/contact');
		const nameInput = page.locator('input#enq-name');
		const emailInput = page.locator('input#enq-email');
		const textarea = page.locator('textarea#enq-message');
		await expect(nameInput).toHaveAttribute('required', '');
		await expect(emailInput).toHaveAttribute('required', '');
		await expect(textarea).toHaveAttribute('required', '');
	});

	test('anti-bot honeypot is present but out of reach of real visitors', async ({ page }) => {
		await page.goto('/contact');
		const honeypot = page.locator('input#enq-website');

		// Present in the DOM and submitted empty — a bot that fills it gets the
		// enquiry flagged as spam server-side.
		await expect(honeypot).toBeAttached();
		await expect(honeypot).toHaveValue('');

		// Deliberately positioned off-screen rather than display:none, since some
		// bots skip hidden inputs. Note Playwright still reports it as "visible":
		// it has a 1x1 bounding box and is not visibility:hidden. So assert the
		// property that actually matters — it sits entirely left of the viewport.
		const box = await honeypot.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.x + box!.width).toBeLessThan(0);

		// And is kept away from keyboard and screen-reader users.
		await expect(honeypot).toHaveAttribute('tabindex', '-1');
		await expect(page.locator('.honeypot')).toHaveAttribute('aria-hidden', 'true');
	});

	test('social links have correct hrefs', async ({ page }) => {
		await page.goto('/contact');
		const bookingLink = page.locator('a[href*="booking.com"]');
		await expect(bookingLink).toBeVisible();

		const tripLink = page.locator('a[href*="tripadvisor.com"]');
		await expect(tripLink).toBeVisible();
	});
});
