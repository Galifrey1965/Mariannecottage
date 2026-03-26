// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { writable } from 'svelte/store';

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('http://localhost/'), params: {} })
}));

const { default: NavigationRail } = await import('./NavigationRail.svelte');

const items = [
	{ label: 'Home', icon: '🏠', href: '/' },
	{ label: 'Rooms', icon: '🛏️', href: '/rooms' }
];

describe('NavigationRail', () => {
	it('renders nav items', () => {
		const { getByText } = render(NavigationRail, { props: { items, label: 'Side navigation' } });
		expect(getByText('Home')).toBeInTheDocument();
		expect(getByText('Rooms')).toBeInTheDocument();
	});

	it('nav has aria-label from label prop', () => {
		const { container } = render(NavigationRail, { props: { items, label: 'Navigation latérale' } });
		const nav = container.querySelector('.rail');
		expect(nav?.getAttribute('aria-label')).toBe('Navigation latérale');
	});

	it('active item has aria-current=page', () => {
		const { container } = render(NavigationRail, { props: { items, label: 'Side navigation' } });
		const homeLink = container.querySelector('a[href="/"]');
		expect(homeLink?.getAttribute('aria-current')).toBe('page');
	});
});
