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
	{ thumb: '/img/a-thumb.webp', full: '/img/a-full.webp', alt: 'Double bed', category_slug: 'rooms', room_slug: 'double-bedroom' },
	{ thumb: '/img/b-thumb.webp', full: '/img/b-full.webp', alt: 'Twin beds',  category_slug: 'rooms', room_slug: 'twin-bedroom' },
	{ thumb: '/img/c-thumb.webp', full: '/img/c-full.webp', alt: 'Garden',     category_slug: 'garden', room_slug: null },
	{ thumb: '/img/d-thumb.webp', full: '/img/d-full.webp', alt: 'Exterior',   category_slug: 'exterior', room_slug: null }
];

const categories = [
	{ slug: 'exterior', label: 'Exterior' },
	{ slug: 'garden', label: 'Garden' }
];

const rooms = [
	{ slug: 'double-bedroom', label: 'Double bedroom' },
	{ slug: 'twin-bedroom', label: 'Twin bedroom' }
];

function findChip(container: Element, label: string): HTMLElement {
	return Array.from(container.querySelectorAll('.filter-chip')).find(
		(c) => c.textContent?.trim() === label
	) as HTMLElement;
}

describe('PhotoGallery', () => {
	it('All chip is active by default with aria-pressed=true', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const all = findChip(container, 'All');
		expect(all).toBeInTheDocument();
		expect(all.getAttribute('aria-pressed')).toBe('true');
	});

	it('renders one chip per category and one per room, plus All', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const chips = container.querySelectorAll('.filter-chip');
		// All + 2 categories + 2 rooms = 5
		expect(chips.length).toBe(5);
	});

	it('uses thumb URL in the grid (not full)', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const firstImg = container.querySelector('.gallery-item img') as HTMLImageElement;
		expect(firstImg.getAttribute('src')).toBe('/img/a-thumb.webp');
	});

	it('clicking a category chip filters by category_slug', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		await fireEvent.click(findChip(container, 'Garden'));
		await tick();
		const items = container.querySelectorAll('.gallery-item');
		expect(items.length).toBe(1);
		expect((items[0].querySelector('img') as HTMLImageElement).getAttribute('alt')).toBe('Garden');
	});

	it('clicking a room chip filters by room_slug, even when categories overlap', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		await fireEvent.click(findChip(container, 'Double bedroom'));
		await tick();
		const items = container.querySelectorAll('.gallery-item');
		expect(items.length).toBe(1);
		expect((items[0].querySelector('img') as HTMLImageElement).getAttribute('alt')).toBe('Double bed');
	});

	it('switching between two room chips updates the visible photos', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		await fireEvent.click(findChip(container, 'Double bedroom'));
		await tick();
		await fireEvent.click(findChip(container, 'Twin bedroom'));
		await tick();
		const items = container.querySelectorAll('.gallery-item');
		expect(items.length).toBe(1);
		expect((items[0].querySelector('img') as HTMLImageElement).getAttribute('alt')).toBe('Twin beds');
	});

	it('opens lightbox with role=dialog when image clicked, using full URL', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();

		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).toBeInTheDocument();
		const lightboxImg = lightbox?.querySelector('img') as HTMLImageElement;
		expect(lightboxImg.getAttribute('src')).toBe('/img/a-full.webp');
	});

	it('lightbox closes on Escape key', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();
		await fireEvent.keyDown(container.ownerDocument, { key: 'Escape' });
		await tick();
		const lightbox = container.ownerDocument.querySelector('[role="dialog"]');
		expect(lightbox).not.toBeInTheDocument();
	});

	it('lightbox close button has aria-label and gets focus', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();
		const closeBtn = container.ownerDocument.querySelector('.lightbox-close') as HTMLElement;
		expect(closeBtn?.getAttribute('aria-label')).toBe('Close');
		expect(container.ownerDocument.activeElement).toBe(closeBtn);
	});

	it('lightbox nav buttons have aria-labels', async () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories, rooms } });
		const firstItem = container.querySelector('.gallery-item') as HTMLElement;
		await fireEvent.click(firstItem);
		await tick();
		const prev = container.ownerDocument.querySelector('.lightbox-nav.prev');
		const next = container.ownerDocument.querySelector('.lightbox-nav.next');
		expect(prev?.getAttribute('aria-label')).toBe('Previous');
		expect(next?.getAttribute('aria-label')).toBe('Next');
	});

	it('shows empty-state copy when an active filter has no matches', async () => {
		const onlyExterior = [
			{ thumb: '/x-t.webp', full: '/x-f.webp', alt: 'Exterior shot', category_slug: 'exterior', room_slug: null }
		];
		const { container } = render(PhotoGallery, {
			props: { messages, images: onlyExterior, categories, rooms }
		});
		await fireEvent.click(findChip(container, 'Garden'));
		await tick();
		const empty = container.querySelector('.empty');
		expect(empty?.textContent).toContain('No photos in this category yet.');
	});

	it('rooms prop is optional — gallery still renders without it', () => {
		const { container } = render(PhotoGallery, { props: { messages, images, categories } });
		const chips = container.querySelectorAll('.filter-chip');
		// All + 2 categories = 3
		expect(chips.length).toBe(3);
	});
});
