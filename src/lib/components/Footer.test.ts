// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';

vi.mock('$app/stores', () => ({
	page: { subscribe: vi.fn(() => () => {}) }
}));

const { default: Footer } = await import('./Footer.svelte');

const messages = {
	footer: {
		tagline: 'Your retreat in Normandy',
		contact: 'Contact',
		copyright: '© 2025 Marianne Cottage',
		report_issue: 'Report a website issue',
		version: 'Version'
	},
	contact: { address: '123 Road', email: 'a@b.com', phone: '01234' }
};

describe('Footer', () => {
	it('renders brand name', () => {
		const { getByText } = render(Footer, { props: { lang: 'en', messages } });
		expect(getByText('Marianne Cottage')).toBeInTheDocument();
	});

	it('renders copyright', () => {
		const { getByText } = render(Footer, { props: { lang: 'en', messages } });
		expect(getByText('© 2025 Marianne Cottage')).toBeInTheDocument();
	});

	it('shows a version link that links to GitHub releases', () => {
		const { container } = render(Footer, { props: { lang: 'en', messages } });
		const versionLink = container.querySelector('.version-link') as HTMLAnchorElement;
		expect(versionLink).toBeInTheDocument();
		expect(versionLink.href).toContain('github.com');
		expect(versionLink.href).toContain('releases');
	});

	it('version link text contains a version number', () => {
		const { container } = render(Footer, { props: { lang: 'en', messages } });
		const versionLink = container.querySelector('.version-link');
		expect(versionLink?.textContent).toMatch(/v?\d+\.\d+/);
	});

	it('version link text contains a date', () => {
		const { container } = render(Footer, { props: { lang: 'en', messages } });
		const versionLink = container.querySelector('.version-link');
		// date: YYYY-MM-DD or similar
		expect(versionLink?.textContent).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
	});
});
