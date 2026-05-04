import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import PoiFilterBar from './PoiFilterBar.svelte';
import * as en from '../../../../messages/en.json';

const defaultProps = {
	messages: en,
	lang: 'en' as const,
	selectedCategory: 'all' as const,
	sortBy: 'distance' as const
};

describe('PoiFilterBar', () => {
	describe('rendering', () => {
		it('renders All chip as active by default', () => {
			const { getAllByRole } = render(PoiFilterBar, { props: defaultProps });
			const allChip = getAllByRole('radio').find((btn) => btn.textContent?.trim() === 'All');
			expect(allChip).toHaveAttribute('aria-checked', 'true');
		});

		it('renders all 5 category chips', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			const group = getByRole('radiogroup', { name: 'Category' });
			expect(group.querySelectorAll('[role="radio"]')).toHaveLength(5);
		});

		it('renders chip labels from i18n', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radio', { name: 'All' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'WW2 History' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Heritage' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Towns' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Museums' })).toBeInTheDocument();
		});

		it('renders Distance and Popularity sort buttons', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			const sortGroup = getByRole('radiogroup', { name: 'Sort by' });
			expect(sortGroup).toContainElement(
				getByRole('radio', { name: 'Distance' }) as HTMLElement
			);
			expect(sortGroup).toContainElement(
				getByRole('radio', { name: 'Popularity' }) as HTMLElement
			);
		});

		it('sort defaults to Distance', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radio', { name: 'Distance' })).toHaveAttribute(
				'aria-checked',
				'true'
			);
		});
	});

	describe('category selection', () => {
		it('clicking a chip makes it active (aria-checked=true)', async () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			await fireEvent.click(getByRole('radio', { name: 'WW2 History' }));
			expect(getByRole('radio', { name: 'WW2 History' })).toHaveAttribute('aria-checked', 'true');
		});

		it('previously active chip becomes inactive on new selection', async () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			await fireEvent.click(getByRole('radio', { name: 'Heritage' }));
			expect(getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'false');
		});

		it('only one category chip active at a time', async () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			await fireEvent.click(getByRole('radio', { name: 'Towns' }));
			const group = getByRole('radiogroup', { name: 'Category' });
			const checked = group.querySelectorAll('[role="radio"][aria-checked="true"]');
			expect(checked).toHaveLength(1);
		});
	});

	describe('sort selection', () => {
		it('clicking Popularity flips aria-checked to that button', async () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			await fireEvent.click(getByRole('radio', { name: 'Popularity' }));
			expect(getByRole('radio', { name: 'Popularity' })).toHaveAttribute(
				'aria-checked',
				'true'
			);
			expect(getByRole('radio', { name: 'Distance' })).toHaveAttribute(
				'aria-checked',
				'false'
			);
		});
	});

	describe('initial state', () => {
		it('honours selectedCategory prop', () => {
			const { getByRole } = render(PoiFilterBar, {
				props: { ...defaultProps, selectedCategory: 'museums' as const }
			});
			expect(getByRole('radio', { name: 'Museums' })).toHaveAttribute('aria-checked', 'true');
			expect(getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'false');
		});

		it('honours sortBy prop', () => {
			const { getByRole } = render(PoiFilterBar, {
				props: { ...defaultProps, sortBy: 'popularity' as const }
			});
			expect(getByRole('radio', { name: 'Popularity' })).toHaveAttribute(
				'aria-checked',
				'true'
			);
		});
	});

	describe('accessibility', () => {
		it('chip group has radiogroup role with aria-label', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radiogroup', { name: 'Category' })).toBeInTheDocument();
		});

		it('sort group has accessible label', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radiogroup', { name: 'Sort by' })).toBeInTheDocument();
		});
	});
});
