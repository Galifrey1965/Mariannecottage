import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PoiCarousel from './PoiCarousel.svelte';
import type { PoiImage } from '$lib/data/poi';

const mockImages: PoiImage[] = [
	{ src: '/images/poi/test/1.jpg', alt: 'Test image 1', attribution: 'Author 1 / CC BY 4.0' },
	{ src: '/images/poi/test/2.jpg', alt: 'Test image 2', attribution: 'Author 2 / CC BY 4.0' },
	{ src: '/images/poi/test/3.jpg', alt: 'Test image 3', attribution: 'Author 3 / CC BY 4.0' }
];

describe('PoiCarousel', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('rendering', () => {
		it('renders all images in the DOM', () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			// querySelectorAll used because hidden slides have aria-hidden=true,
			// which getAllByRole excludes by default
			const imgs = container.querySelectorAll('img');
			expect(imgs).toHaveLength(mockImages.length);
		});

		it('first slide is visible (active), others hidden', () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[0]).toHaveClass('carousel__slide--active');
			expect(slides[0]).not.toHaveAttribute('aria-hidden', 'true');
			expect(slides[1]).not.toHaveClass('carousel__slide--active');
			expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
		});

		it('first image uses eager loading, rest use lazy', () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			const imgs = container.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
			expect(imgs[0].loading).toBe('eager');
			expect(imgs[1].loading).toBe('lazy');
			expect(imgs[2].loading).toBe('lazy');
		});

		it('shows navigation buttons when multiple images', () => {
			const { getByLabelText } = render(PoiCarousel, { props: { images: mockImages } });
			expect(getByLabelText('Previous image')).toBeInTheDocument();
			expect(getByLabelText('Next image')).toBeInTheDocument();
		});

		it('shows dot navigation when multiple images', () => {
			const { getAllByRole } = render(PoiCarousel, { props: { images: mockImages } });
			const dots = getAllByRole('tab');
			expect(dots).toHaveLength(mockImages.length);
		});

		it('shows attribution for the current image', () => {
			const { getByText } = render(PoiCarousel, { props: { images: mockImages } });
			expect(getByText('Author 1 / CC BY 4.0')).toBeInTheDocument();
		});
	});

	describe('empty state', () => {
		it('renders an empty state when images array is empty', () => {
			const { getByRole } = render(PoiCarousel, { props: { images: [] } });
			expect(getByRole('img')).toBeInTheDocument();
		});

		it('does not render navigation controls when images is empty', () => {
			const { queryByLabelText } = render(PoiCarousel, { props: { images: [] } });
			expect(queryByLabelText('Previous image')).not.toBeInTheDocument();
			expect(queryByLabelText('Next image')).not.toBeInTheDocument();
		});
	});

	describe('single image', () => {
		it('does not render navigation controls for a single image', () => {
			const { queryByLabelText, queryAllByRole } = render(PoiCarousel, {
				props: { images: [mockImages[0]] }
			});
			expect(queryByLabelText('Previous image')).not.toBeInTheDocument();
			expect(queryByLabelText('Next image')).not.toBeInTheDocument();
			expect(queryAllByRole('tab')).toHaveLength(0);
		});
	});

	describe('manual navigation', () => {
		it('advances to next slide on next button click', async () => {
			const { getByLabelText, container } = render(PoiCarousel, {
				props: { images: mockImages }
			});
			await fireEvent.click(getByLabelText('Next image'));
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[1]).toHaveClass('carousel__slide--active');
			expect(slides[0]).not.toHaveClass('carousel__slide--active');
		});

		it('wraps around to last slide on prev button click from first', async () => {
			const { getByLabelText, container } = render(PoiCarousel, {
				props: { images: mockImages }
			});
			await fireEvent.click(getByLabelText('Previous image'));
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[2]).toHaveClass('carousel__slide--active');
		});

		it('navigates to a specific slide via dot click', async () => {
			const { getAllByRole, container } = render(PoiCarousel, {
				props: { images: mockImages }
			});
			const dots = getAllByRole('tab');
			await fireEvent.click(dots[2]);
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[2]).toHaveClass('carousel__slide--active');
		});

		it('marks the active dot as selected', async () => {
			const { getAllByRole, getByLabelText } = render(PoiCarousel, {
				props: { images: mockImages }
			});
			await fireEvent.click(getByLabelText('Next image'));
			const dots = getAllByRole('tab');
			expect(dots[1]).toHaveAttribute('aria-selected', 'true');
			expect(dots[0]).toHaveAttribute('aria-selected', 'false');
		});
	});

	describe('auto-rotate', () => {
		it('advances slide after timer fires', async () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			// Advance past max interval (5s)
			await vi.advanceTimersByTimeAsync(5500);
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[1]).toHaveClass('carousel__slide--active');
		});

		it('does not auto-rotate with a single image', async () => {
			const { container } = render(PoiCarousel, {
				props: { images: [mockImages[0]] }
			});
			await vi.advanceTimersByTimeAsync(10000);
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[0]).toHaveClass('carousel__slide--active');
		});
	});

	describe('pause on hover', () => {
		it('pauses auto-rotate on mouseenter', async () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			const carousel = container.querySelector('.carousel') as HTMLElement;
			await fireEvent.mouseEnter(carousel);
			await vi.advanceTimersByTimeAsync(10000);
			const slides = container.querySelectorAll('.carousel__slide');
			// Should still be on first slide — paused
			expect(slides[0]).toHaveClass('carousel__slide--active');
		});

		it('resumes auto-rotate on mouseleave', async () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			const carousel = container.querySelector('.carousel') as HTMLElement;
			await fireEvent.mouseEnter(carousel);
			await vi.advanceTimersByTimeAsync(5500);
			// Still paused — should be on first slide
			expect(container.querySelectorAll('.carousel__slide')[0]).toHaveClass(
				'carousel__slide--active'
			);
			// Resume
			await fireEvent.mouseLeave(carousel);
			await vi.advanceTimersByTimeAsync(5500);
			// Now it should have advanced
			expect(container.querySelectorAll('.carousel__slide')[1]).toHaveClass(
				'carousel__slide--active'
			);
		});
	});

	describe('accessibility', () => {
		it('has a region role with aria-label', () => {
			const { getByRole } = render(PoiCarousel, {
				props: { images: mockImages, label: 'Omaha Beach photos' }
			});
			expect(getByRole('region', { name: 'Omaha Beach photos' })).toBeInTheDocument();
		});

		it('hidden slides have aria-hidden=true', () => {
			const { container } = render(PoiCarousel, { props: { images: mockImages } });
			const slides = container.querySelectorAll('.carousel__slide');
			expect(slides[1]).toHaveAttribute('aria-hidden', 'true');
			expect(slides[2]).toHaveAttribute('aria-hidden', 'true');
		});
	});
});
