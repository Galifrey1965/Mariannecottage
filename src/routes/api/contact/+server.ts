import { json } from '@sveltejs/kit';
import { emailService } from '$lib/server/email';
import { detectLocale, isValidLocale } from '$lib/i18n';
import type { Locale } from '$lib/i18n';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { name, email, message } = data;

		if (!name || !email || !message) {
			return json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		if (typeof name !== 'string' || name.trim().length < 2) {
			return json(
				{ error: 'Invalid name' },
				{ status: 400 }
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return json(
				{ error: 'Invalid email' },
				{ status: 400 }
			);
		}

		if (typeof message !== 'string' || message.trim().length < 10) {
			return json(
				{ error: 'Message must be at least 10 characters' },
				{ status: 400 }
			);
		}

		const locale: Locale = isValidLocale(data.locale)
			? data.locale
			: detectLocale(request.headers.get('accept-language'));

		await emailService.sendEnquiry(
			{
				name: name.trim(),
				email: email.trim(),
				message: message.trim()
			},
			locale
		);

		return json(
			{ success: true, message: 'Enquiry received' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Contact form error:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
};
