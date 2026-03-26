// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { writable } from 'svelte/store';

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('http://localhost/'), params: {} })
}));

const { default: NavigationBar } = await import('./NavigationBar.svelte');

const items = [
	{ label: 'Home', icon: '🏠', href: '/' },
	{ label: 'Rooms', icon: '🛏️', href: '/rooms' },
	{ label: 'Book', icon: '✨', href: '/book' }
];

describe('NavigationBar', () => {
	it('renders nav items', () => {
		const { getByText } = render(NavigationBar, { props: { items, label: 'Mobile navigation' } });
		expect(getByText('Home')).toBeInTheDocument();
		expect(getByText('Rooms')).toBeInTheDocument();
	});

	it('nav has aria-label from label prop', () => {
		const { container } = render(NavigationBar, { props: { items, label: 'Navigation mobile' } });
		const nav = container.querySelector('.bottom-nav');
		expect(nav?.getAttribute('aria-label')).toBe('Navigation mobile');
	});

	it('active item has aria-current=page', () => {
		const { container } = render(NavigationBar, { props: { items, label: 'Mobile navigation' } });
		const homeLink = container.querySelector('a[href="/"]');
		expect(homeLink?.getAttribute('aria-current')).toBe('page');
	});

	it('each item has aria-label', () => {
		const { container } = render(NavigationBar, { props: { items, label: 'Mobile navigation' } });
		const links = container.querySelectorAll('.nav-item');
		expect(links.length).toBe(3);
		expect(links[0].getAttribute('aria-label')).toBe('Home');
	});
});
