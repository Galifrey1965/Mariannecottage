// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';

vi.mock('$app/stores', () => ({
	page: { subscribe: vi.fn(() => () => {}) }
}));

const { default: PhotoGallery } = await import('./PhotoGallery.svelte');

const messages = {
	gallery: {
		title: 'Gallery',
		filter_label: 'Filter images',
		categories: {
			all: 'All', exterior: 'Exterior', rooms: 'Rooms',
			bathroom: 'Bathroom', garden: 'Garden', breakfast: 'Breakfast', surroundings: 'Surroundings'
		}
	},
	a11y: { previous: 'Previous', next: 'Next', close: 'Close' }
};

const images = [
	{ src: '/img/a.jpg', alt: 'Room one', category: 'rooms' },
	{ src: '/img/b.jpg', alt: 'Garden view', category: 'garden' },
	{ src: '/img/c.jpg', alt: 'Exterior shot', category: 'exterior' }
];

describe('PhotoGallery', () => {
	it('renders filter buttons with aria-pressed', () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const all = container.querySelector('.filter-chip') as HTMLElement;
		expect(all).toBeInTheDocument();
		expect(all.getAttribute('aria-pressed')).toBe('true');
	});

	it('renders gallery grid with aria-label', () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const grid = container.querySelector('[role="grid"]');
		expect(grid).toBeInTheDocument();
		expect(grid?.getAttribute('aria-label')).toBe('Gallery');
	});

	it('opens lightbox with role=dialog when image clicked', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).toBeInTheDocument();
		expect(lightbox?.getAttribute('aria-modal')).toBe('true');
	});

	it('lightbox closes on Escape key', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		await fireEvent.keyDown(container.ownerDocument, { key: 'Escape' });
		await tick();

		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).not.toBeInTheDocument();
	});

	it('lightbox close button has aria-label', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const closeBtn = container.ownerDocument.querySelector('.lightbox-close');
		expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
	});

	it('lightbox moves focus to close button when opened', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const closeBtn = container.ownerDocument.querySelector('.lightbox-close') as HTMLElement;
		expect(container.ownerDocument.activeElement).toBe(closeBtn);
	});

	it('lightbox nav buttons have aria-labels', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const prev = container.ownerDocument.querySelector('.lightbox-nav.prev');
		const next = container.ownerDocument.querySelector('.lightbox-nav.next');
		expect(prev?.getAttribute('aria-label')).toBe('Previous');
		expect(next?.getAttribute('aria-label')).toBe('Next');
	});
});
