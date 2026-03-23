// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

vi.mock('$app/stores', () => ({
	page: writable({ url: new URL('http://localhost/book'), params: {} })
}));

const { default: BookingCalendar } = await import('./BookingCalendar.svelte');

const messages = {
	calendar: {
		prev_month: 'Previous month',
		next_month: 'Next month',
		sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
		available: 'Available', unavailable: 'Unavailable', past_date: 'Past',
		selected: 'Selected', select_checkout: 'Select checkout date'
	},
	book: { night: 'night', nights: 'nights' }
};

describe('BookingCalendar', () => {
	it('renders month name', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		const title = container.querySelector('.month-title');
		expect(title).toBeInTheDocument();
		expect(title?.textContent).toBeTruthy();
	});

	it('renders weekday headers', () => {
		const { getAllByText } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		expect(getAllByText('Sun')).toHaveLength(1);
		expect(getAllByText('Mon')).toHaveLength(1);
	});

	it('shows Monday-first for French locale', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'fr' }
		});
		const weekdays = container.querySelectorAll('.weekday');
		expect(weekdays[0]?.textContent).toBe('Mon');
	});

	it('shows Monday-first for German locale', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'de' }
		});
		const weekdays = container.querySelectorAll('.weekday');
		expect(weekdays[0]?.textContent).toBe('Mon');
	});

	it('shows Sunday-first for English locale', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		const weekdays = container.querySelectorAll('.weekday');
		expect(weekdays[0]?.textContent).toBe('Sun');
	});

	it('navigates to next month on click', async () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		const title = container.querySelector('.month-title');
		const initialMonth = title?.textContent;

		const nextBtn = container.querySelectorAll('.nav-btn')[1] as HTMLElement;
		await fireEvent.click(nextBtn);

		expect(title?.textContent).not.toBe(initialMonth);
	});

	it('navigates to previous month on click', async () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		const title = container.querySelector('.month-title');
		const initialMonth = title?.textContent;

		const prevBtn = container.querySelectorAll('.nav-btn')[0] as HTMLElement;
		await fireEvent.click(prevBtn);

		expect(title?.textContent).not.toBe(initialMonth);
	});

	it('renders day buttons in the grid', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en' }
		});
		const days = container.querySelectorAll('.day');
		expect(days.length).toBeGreaterThan(20); // any month has 28+
	});

	it('marks past dates as disabled', () => {
		const { container } = render(BookingCalendar, {
			props: { messages, lang: 'en', minDate: new Date() }
		});
		const pastDays = container.querySelectorAll('.day.past');
		// Should have some past days if we're not on the 1st
		const today = new Date().getDate();
		if (today > 1) {
			expect(pastDays.length).toBeGreaterThan(0);
		}
	});

	it('fires onDateRangeSelect when two dates clicked', async () => {
		const handler = vi.fn();
		// Use a future month to avoid past-date issues
		const futureDate = new Date();
		futureDate.setMonth(futureDate.getMonth() + 1);
		futureDate.setDate(1);

		const { container } = render(BookingCalendar, {
			props: {
				messages,
				lang: 'en',
				onDateRangeSelect: handler,
				minDate: new Date('2020-01-01') // allow all dates
			}
		});

		// Navigate to next month to get all-available dates
		const nextBtn = container.querySelectorAll('.nav-btn')[1] as HTMLElement;
		await fireEvent.click(nextBtn);

		const availableDays = container.querySelectorAll('.day.available:not([disabled])');
		if (availableDays.length >= 2) {
			await fireEvent.click(availableDays[0] as HTMLElement);
			await fireEvent.click(availableDays[2] as HTMLElement);
			expect(handler).toHaveBeenCalledTimes(1);
		}
	});
});
