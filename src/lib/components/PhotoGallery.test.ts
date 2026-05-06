// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
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
		empty: 'No photos in this category yet.',
		categories: { all: 'All' }
	},
	a11y: { previous: 'Previous', next: 'Next', close: 'Close' }
};

const images = [
	{ thumb: '/img/a-thumb.webp', full: '/img/a-full.webp', alt: 'Room one', category_slug: 'rooms' },
	{ thumb: '/img/b-thumb.webp', full: '/img/b-full.webp', alt: 'Garden view', category_slug: 'garden' },
	{ thumb: '/img/c-thumb.webp', full: '/img/c-full.webp', alt: 'Exterior shot', category_slug: 'exterior' }
];

const categories = [
	{ slug: 'exterior', label: 'Exterior' },
	{ slug: 'rooms', label: 'Rooms' },
	{ slug: 'garden', label: 'Garden' }
];

describe('PhotoGallery', () => {
	it('renders filter buttons with aria-pressed', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const all = container.querySelector('.filter-chip') as HTMLElement;
		expect(all).toBeInTheDocument();
		expect(all.getAttribute('aria-pressed')).toBe('true');
	});

	it('renders one chip per DB-driven category plus All', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const chips = container.querySelectorAll('.filter-chip');
		// All + 3 categories = 4
		expect(chips.length).toBe(4);
	});

	it('uses thumb URL in the grid (not full)', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstImg = container.querySelector('.gallery-item img') as HTMLImageElement;
		expect(firstImg.getAttribute('src')).toBe('/img/a-thumb.webp');
	});

	it('renders gallery grid with aria-label', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const grid = container.querySelector('[role="grid"]');
		expect(grid).toBeInTheDocument();
		expect(grid?.getAttribute('aria-label')).toBe('Gallery');
	});

	it('opens lightbox with role=dialog when image clicked, using full URL', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).toBeInTheDocument();
		expect(lightbox?.getAttribute('aria-modal')).toBe('true');

		const lightboxImg = lightbox?.querySelector('img') as HTMLImageElement;
		expect(lightboxImg.getAttribute('src')).toBe('/img/a-full.webp');
	});

	it('lightbox closes on Escape key', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		await fireEvent.keyDown(container.ownerDocument, { key: 'Escape' });
		await tick();

		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).not.toBeInTheDocument();
	});

	it('lightbox close button has aria-label', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const closeBtn = container.ownerDocument.querySelector('.lightbox-close');
		expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
	});

	it('lightbox moves focus to close button when opened', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const closeBtn = container.ownerDocument.querySelector('.lightbox-close') as HTMLElement;
		expect(container.ownerDocument.activeElement).toBe(closeBtn);
	});

	it('lightbox nav buttons have aria-labels', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const prev = container.ownerDocument.querySelector('.lightbox-nav.prev');
		const next = container.ownerDocument.querySelector('.lightbox-nav.next');
		expect(prev?.getAttribute('aria-label')).toBe('Previous');
		expect(next?.getAttribute('aria-label')).toBe('Next');
	});

	it('shows empty-state copy when no images match the active filter', async () => {
		const onlyRooms = [{ thumb: '/r-t.webp', full: '/r-f.webp', alt: 'Bedroom', category_slug: 'rooms' }];
		const { container } = render(PhotoGallery, { props: { messages, images: onlyRooms, categories } });
		// Click the "garden" chip (3rd chip after "All" and "exterior")
		const chips = container.querySelectorAll('.filter-chip');
		const gardenChip = Array.from(chips).find((c) => c.textContent?.trim() === 'Garden') as HTMLElement;
		await fireEvent.click(gardenChip);
		await tick();

		const empty = container.querySelector('.empty');
		expect(empty?.textContent).toContain('No photos in this category yet.');
	});
});
