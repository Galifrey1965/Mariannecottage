// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

// Mock $app/stores with ESM-compatible import
vi.mock('$app/stores', () => ({
	page: writable({
		url: new URL('http://localhost/rooms'),
		params: {}
	})
}));

// Must import component after mocks are set up
const { default: Header } = await import('./Header.svelte');

const messages = {
	nav: { home: 'Home', rooms: 'Rooms', gallery: 'Gallery', explore: 'Explore', contact: 'Contact', book: 'Book' },
	a11y: { main_navigation: 'Main navigation', mobile_navigation: 'Mobile navigation', toggle_menu: 'Toggle menu' }
};

describe('Header', () => {
	it('renders logo', () => {
		const { getByText } = render(Header, { props: { lang: 'en', messages } });
		expect(getByText('Marianne')).toBeInTheDocument();
		expect(getByText('Cottage')).toBeInTheDocument();
	});

	it('renders nav links', () => {
		const { getByText } = render(Header, { props: { lang: 'en', messages } });
		expect(getByText('Home')).toBeInTheDocument();
		expect(getByText('Rooms')).toBeInTheDocument();
		expect(getByText('Book')).toBeInTheDocument();
	});

	it('has menu toggle button with aria-expanded', () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle');
		expect(toggle).toBeInTheDocument();
		expect(toggle?.getAttribute('aria-expanded')).toBe('false');
	});

	it('toggle opens mobile drawer', async () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle') as HTMLElement;

		await fireEvent.click(toggle);

		const drawer = container.ownerDocument.querySelector('.mobile-drawer');
		expect(drawer).toBeInTheDocument();
	});
});
