// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';

const { default: BookDirectCta } = await import('./BookDirectCta.svelte');

const baseProps = {
	href: '/en/book',
	label: 'Check Availability',
	savingsHint: 'Save 5% vs Booking.com'
};

describe('BookDirectCta', () => {
	it('renders an anchor pointing at href', () => {
		const { container } = render(BookDirectCta, { props: baseProps });
		const a = container.querySelector('a[data-testid="book-direct-cta"]') as HTMLAnchorElement;
		expect(a).toBeInTheDocument();
		expect(a.getAttribute('href')).toBe('/en/book');
	});

	it('shows the label text', () => {
		const { getByText } = render(BookDirectCta, { props: baseProps });
		expect(getByText('Check Availability')).toBeInTheDocument();
	});

	it('renders the savings hint in the DOM (visible on touch, hover-revealed on desktop)', () => {
		const { container } = render(BookDirectCta, { props: baseProps });
		const hint = container.querySelector('.bd-cta__hint') as HTMLElement;
		expect(hint).toBeInTheDocument();
		expect(hint.textContent).toContain('Save 5% vs Booking.com');
	});

	it('exposes the savings hint to assistive tech via a visually-hidden suffix', () => {
		const { container } = render(BookDirectCta, { props: baseProps });
		const sr = container.querySelector('.visually-hidden') as HTMLElement;
		expect(sr).toBeInTheDocument();
		expect(sr.textContent).toContain('Save 5% vs Booking.com');
	});

	it('applies the size-large class when size="large"', () => {
		const { container } = render(BookDirectCta, {
			props: { ...baseProps, size: 'large' }
		});
		const a = container.querySelector('a.bd-cta') as HTMLElement;
		expect(a.classList.contains('size-large')).toBe(true);
	});

	it('forwards an extra class through the `class` prop', () => {
		const { container } = render(BookDirectCta, {
			props: { ...baseProps, class: 'home-cta' }
		});
		const a = container.querySelector('a.bd-cta') as HTMLElement;
		expect(a.classList.contains('home-cta')).toBe(true);
	});
});
