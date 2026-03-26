// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { tick } from 'svelte';

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

	it('has menu toggle button with aria-expanded=false initially', () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle');
		expect(toggle).toBeInTheDocument();
		expect(toggle?.getAttribute('aria-expanded')).toBe('false');
	});

	it('toggle opens mobile drawer and sets aria-expanded=true', async () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle') as HTMLElement;

		await fireEvent.click(toggle);

		const drawer = container.ownerDocument.querySelector('.mobile-drawer');
		expect(drawer).toBeInTheDocument();
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
	});

	it('Escape key closes open drawer', async () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle') as HTMLElement;
		await fireEvent.click(toggle);

		await fireEvent.keyDown(container.ownerDocument, { key: 'Escape' });
		await tick();

		const drawer = container.ownerDocument.querySelector('.mobile-drawer');
		expect(drawer).not.toBeInTheDocument();
	});

	it('mobile drawer moves focus to first link when opened', async () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle') as HTMLElement;
		await fireEvent.click(toggle);
		await tick();

		const firstDrawerLink = container.ownerDocument.querySelector('.drawer-link') as HTMLElement;
		expect(container.ownerDocument.activeElement).toBe(firstDrawerLink);
	});

	it('mobile drawer is hidden after Escape and focus returns to toggle', async () => {
		const { container } = render(Header, { props: { lang: 'en', messages } });
		const toggle = container.querySelector('.menu-toggle') as HTMLElement;
		await fireEvent.click(toggle);
		await tick();

		await fireEvent.keyDown(container.ownerDocument, { key: 'Escape' });
		await tick();

		expect(container.ownerDocument.activeElement).toBe(toggle);
	});
});
