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

// The component fetches an anti-bot token on mount and then POSTs the enquiry,
// so tests have to answer both routes. Fields are looked up by id rather than
// by position: the form carries a hidden honeypot input, and positional
// selectors silently pick the wrong element the moment the markup moves.
type FetchMock = ReturnType<typeof vi.fn<(url: string, init?: RequestInit) => Promise<Response>>>;

function mockFetch(postResponse: Partial<Response> = { ok: true }): FetchMock {
	const fn: FetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
		if (String(url).includes('/api/contact/token')) {
			return { ok: true, json: async () => ({ token: 'tok.sig' }) } as unknown as Response;
		}
		return postResponse as Response;
	});
	global.fetch = fn as unknown as typeof fetch;
	return fn;
}

function fill(container: HTMLElement, values: { name: string; email: string; message: string }) {
	const name = container.querySelector('#enq-name') as HTMLInputElement;
	const email = container.querySelector('#enq-email') as HTMLInputElement;
	const message = container.querySelector('#enq-message') as HTMLTextAreaElement;
	return Promise.all([
		fireEvent.input(name, { target: { value: values.name } }),
		fireEvent.input(email, { target: { value: values.email } }),
		fireEvent.input(message, { target: { value: values.message } })
	]);
}

const validValues = {
	name: 'Jane Doe',
	email: 'jane@example.com',
	message: 'Hello, I would like to book a room for next month.'
};

function bodyOf(fn: FetchMock) {
	const post = fn.mock.calls.find(([url]) => String(url) === '/api/contact');
	if (!post?.[1]?.body) throw new Error('no POST to /api/contact was made');
	return JSON.parse(post[1].body as string);
}

describe('EnquiryForm', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockFetch();
	});

	it('renders all form fields', () => {
		const { container } = render(EnquiryForm, { props: { messages } });
		expect(container.querySelector('#enq-name')).toBeInTheDocument();
		expect(container.querySelector('#enq-email')).toBeInTheDocument();
		expect(container.querySelector('#enq-message')).toBeInTheDocument();
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
		const fetchMock = mockFetch();
		const { container } = render(EnquiryForm, { props: { messages } });

		await fill(container, validValues);
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
		await tick();

		expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }));
		expect(bodyOf(fetchMock)).toMatchObject(validValues);
	});

	it('shows error on API failure', async () => {
		mockFetch({ ok: false, status: 500 } as Partial<Response>);
		const { container } = render(EnquiryForm, { props: { messages } });

		await fill(container, { ...validValues, message: 'Test message here' });
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);

		await vi.waitFor(() => {
			expect(container.querySelector('.alert-error')).toBeInTheDocument();
		});
	});
});

describe('EnquiryForm — anti-bot honeypot', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		mockFetch();
	});

	it('renders an empty honeypot hidden from assistive tech and keyboard users', () => {
		const { container } = render(EnquiryForm, { props: { messages } });
		const honeypot = container.querySelector('#enq-website') as HTMLInputElement;

		expect(honeypot).toBeInTheDocument();
		expect(honeypot.value).toBe('');
		expect(honeypot.getAttribute('tabindex')).toBe('-1');
		expect(honeypot.getAttribute('autocomplete')).toBe('off');
		expect(honeypot.closest('.honeypot')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('keeps the honeypot last so it does not shift the visible field order', () => {
		const { container } = render(EnquiryForm, { props: { messages } });
		const ids = Array.from(container.querySelectorAll('input, textarea')).map((el) => el.id);
		expect(ids).toEqual(['enq-name', 'enq-email', 'enq-message', 'enq-website']);
	});

	it('submits an empty honeypot for a real visitor', async () => {
		const fetchMock = mockFetch();
		const { container } = render(EnquiryForm, { props: { messages } });

		await fill(container, validValues);
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
		await tick();

		expect(bodyOf(fetchMock).website).toBe('');
	});

	it('forwards whatever a bot typed into the honeypot', async () => {
		const fetchMock = mockFetch();
		const { container } = render(EnquiryForm, { props: { messages } });

		await fill(container, validValues);
		await fireEvent.input(container.querySelector('#enq-website') as HTMLInputElement, {
			target: { value: 'http://spam.example' }
		});
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
		await tick();

		expect(bodyOf(fetchMock).website).toBe('http://spam.example');
	});
});

describe('EnquiryForm — form token', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches a token on mount and posts it back with the enquiry', async () => {
		const fetchMock = mockFetch();
		const { container } = render(EnquiryForm, { props: { messages } });

		await vi.waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith('/api/contact/token');
		});

		await fill(container, validValues);
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
		await tick();

		expect(bodyOf(fetchMock).token).toBe('tok.sig');
	});

	it('still submits with a null token when the token endpoint fails', async () => {
		const fetchMock: FetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
			if (String(url).includes('/api/contact/token')) throw new Error('offline');
			return { ok: true } as Response;
		});
		global.fetch = fetchMock as unknown as typeof fetch;

		const { container } = render(EnquiryForm, { props: { messages } });
		await fill(container, validValues);
		await fireEvent.submit(container.querySelector('form') as HTMLFormElement);
		await tick();

		expect(bodyOf(fetchMock).token).toBeNull();
	});
});
