// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { tick } from 'svelte';

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('http://localhost/contact'), params: {} })
}));

const { default: EnquiryForm } = await import('./EnquiryForm.svelte');

const messages = {
	contact: {
		form: {
			name: 'Name',
			email: 'Email',
			message: 'Message',
			submit: 'Send',
			submitting: 'Sending...',
			success: 'Message sent!',
			error: 'Something went wrong'
		}
	},
	enquiry_form: {
		all_fields_required: 'All fields are required'
	}
};

describe('EnquiryForm', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('renders all form fields', () => {
		const { container } = render(EnquiryForm, { props: { messages } });
		expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
		expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
		expect(container.querySelector('textarea')).toBeInTheDocument();
		expect(container.querySelector('button[type="submit"]')).toBeInTheDocument();
	});

	it('shows error alert on empty submit', async () => {
		const { container } = render(EnquiryForm, { props: { messages } });
		const form = container.querySelector('form') as HTMLFormElement;

		await fireEvent.submit(form);
		await tick();

		const alert = container.querySelector('.alert-error');
		expect(alert).toBeInTheDocument();
		expect(alert?.textContent).toContain('All fields are required');
	});

	it('calls fetch on valid submit', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: true });

		const { container } = render(EnquiryForm, { props: { messages } });

		const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
		const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
		const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

		await fireEvent.input(nameInput, { target: { value: 'Jane Doe' } });
		await fireEvent.input(emailInput, { target: { value: 'jane@example.com' } });
		await fireEvent.input(textarea, { target: { value: 'Hello, I would like to book a room for next month.' } });

		const form = container.querySelector('form') as HTMLFormElement;
		await fireEvent.submit(form);
		await tick();

		expect(global.fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
	});

	it('shows error on API failure', async () => {
		global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

		const { container } = render(EnquiryForm, { props: { messages } });

		const nameInput = container.querySelector('input[type="text"]') as HTMLInputElement;
		const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
		const textarea = container.querySelector('textarea') as HTMLTextAreaElement;

		await fireEvent.input(nameInput, { target: { value: 'Jane' } });
		await fireEvent.input(emailInput, { target: { value: 'jane@example.com' } });
		await fireEvent.input(textarea, { target: { value: 'Test message here' } });

		const form = container.querySelector('form') as HTMLFormElement;
		await fireEvent.submit(form);

		// Wait for async
		await vi.waitFor(() => {
			const alert = container.querySelector('.alert-error');
			expect(alert).toBeInTheDocument();
		});
	});
});
