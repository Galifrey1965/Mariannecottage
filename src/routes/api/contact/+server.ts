import { json } from '@sveltejs/kit';
import { emailService } from '$lib/server/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		const { name, email, message } = data;

		// Validation
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

		// Send email via stub service
		await emailService.sendEnquiry({
			name: name.trim(),
			email: email.trim(),
			message: message.trim()
		});

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
