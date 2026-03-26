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
			const { getAllByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getAllByRole('radio')).toHaveLength(5);
		});

		it('renders chip labels from i18n', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radio', { name: 'All' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'WW2 History' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Heritage' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Towns' })).toBeInTheDocument();
			expect(getByRole('radio', { name: 'Museums' })).toBeInTheDocument();
		});

		it('renders sort dropdown with Distance and Popularity options', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			const select = getByRole('combobox') as HTMLSelectElement;
			const options = Array.from(select.options).map((o) => o.text);
			expect(options).toContain('Distance');
			expect(options).toContain('Popularity');
		});

		it('sort dropdown defaults to distance', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			const select = getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('distance');
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

		it('only one chip active at a time', async () => {
			const { getAllByRole } = render(PoiFilterBar, { props: defaultProps });
			await fireEvent.click(getAllByRole('radio').find((b) => b.textContent?.trim() === 'Towns')!);
			const checked = getAllByRole('radio').filter((b) => b.getAttribute('aria-checked') === 'true');
			expect(checked).toHaveLength(1);
		});
	});

	describe('sort selection', () => {
		it('changing sort select updates the value', async () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			const select = getByRole('combobox') as HTMLSelectElement;
			await fireEvent.change(select, { target: { value: 'popularity' } });
			expect(select.value).toBe('popularity');
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
			const select = getByRole('combobox') as HTMLSelectElement;
			expect(select.value).toBe('popularity');
		});
	});

	describe('accessibility', () => {
		it('chip group has radiogroup role with aria-label', () => {
			const { getByRole } = render(PoiFilterBar, { props: defaultProps });
			expect(getByRole('radiogroup', { name: 'Category' })).toBeInTheDocument();
		});

		it('sort select has accessible label', () => {
			const { getByLabelText } = render(PoiFilterBar, { props: defaultProps });
			expect(getByLabelText('Sort by')).toBeInTheDocument();
		});
	});
});
