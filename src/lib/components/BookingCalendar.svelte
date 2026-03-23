<script lang="ts">
	import { t, formatDate } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	interface Props {
		messages: Messages;
		lang: Locale;
		availability?: Record<string, boolean>;
		onDateRangeSelect?: (checkIn: Date, checkOut: Date) => void;
		minDate?: Date;
		maxDate?: Date;
	}

	let { messages, lang, availability = {}, onDateRangeSelect, minDate = new Date(), maxDate }: Props = $props();

	let currentMonth = $state(new Date());
	let selectedStart: Date | null = $state(null);
	let selectedEnd: Date | null = $state(null);

	const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	const toISODate = (date: Date) => date.toISOString().split('T')[0];
	const isAvailable = (date: Date) => availability[toISODate(date)] !== false;
	const isPast = (date: Date) => date < minDate;

	const isSelected = (date: Date) => {
		if (!selectedStart) return false;
		const time = date.getTime();
		return time >= selectedStart.getTime() && time <= (selectedEnd ? selectedEnd.getTime() : selectedStart.getTime());
	};

	const isStart = (date: Date) => selectedStart && toISODate(date) === toISODate(selectedStart);
	const isEnd = (date: Date) => selectedEnd && toISODate(date) === toISODate(selectedEnd);

	const selectDate = (date: Date) => {
		if (isPast(date) || !isAvailable(date)) return;
		if (!selectedStart) { selectedStart = date; }
		else if (!selectedEnd) {
			if (date < selectedStart) { selectedEnd = selectedStart; selectedStart = date; }
			else { selectedEnd = date; }
			if (onDateRangeSelect) onDateRangeSelect(selectedStart, selectedEnd);
		} else { selectedStart = date; selectedEnd = null; }
	};

	const prevMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1); };
	const nextMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1); };

	const getDays = () => {
		const days: (Date | null)[] = [];
		const firstDay = getFirstDayOfMonth(currentMonth);
		const daysCount = daysInMonth(currentMonth);
		for (let i = 0; i < firstDay; i++) days.push(null);
		for (let i = 1; i <= daysCount; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
		return days;
	};

	const monthName = formatDate(lang, currentMonth, { month: 'long', year: 'numeric' });
	const days = $derived(getDays());

	function dayClass(date: Date): string {
		if (isPast(date)) return 'day past';
		if (!isAvailable(date)) return 'day unavailable';
		if (isStart(date) || isEnd(date)) return 'day selected-endpoint';
		if (isSelected(date)) return 'day selected-range';
		return 'day available';
	}
</script>

<div class="calendar">
	<div class="cal-header">
		<button onclick={prevMonth} class="nav-btn" aria-label={t(messages, 'calendar.prev_month')}>‹</button>
		<h2 class="month-title">{monthName}</h2>
		<button onclick={nextMonth} class="nav-btn" aria-label={t(messages, 'calendar.next_month')}>›</button>
	</div>

	<div class="weekdays">
		{#each [t(messages, 'calendar.sun'), t(messages, 'calendar.mon'), t(messages, 'calendar.tue'), t(messages, 'calendar.wed'), t(messages, 'calendar.thu'), t(messages, 'calendar.fri'), t(messages, 'calendar.sat')] as day}
			<div class="weekday">{day}</div>
		{/each}
	</div>

	<div class="days-grid">
		{#each days as date}
			{#if date === null}
				<div></div>
			{:else}
				<button
					onclick={() => selectDate(date)}
					disabled={isPast(date) || !isAvailable(date)}
					class={dayClass(date)}
					aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
					aria-selected={isSelected(date)}
				>
					{date.getDate()}
				</button>
			{/if}
		{/each}
	</div>

	<div class="legend">
		<div class="legend-item"><div class="legend-swatch available"></div><span>{t(messages, 'calendar.available')}</span></div>
		<div class="legend-item"><div class="legend-swatch unavailable"></div><span>{t(messages, 'calendar.unavailable')}</span></div>
		<div class="legend-item"><div class="legend-swatch past"></div><span>{t(messages, 'calendar.past_date')}</span></div>
	</div>

	{#if selectedStart && selectedEnd}
		<div class="selection-info" role="status" aria-live="polite">
			<strong>{t(messages, 'calendar.selected')}:</strong> {formatDate(lang, selectedStart, { month: 'short', day: 'numeric' })} → {formatDate(lang, selectedEnd, { month: 'short', day: 'numeric' })}
		</div>
	{/if}
</div>

<style>
	.calendar { width: 100%; background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; box-shadow: var(--md-elevation-shadow-1); }
	.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
	.nav-btn { padding: 0.5rem; border-radius: 50%; border: none; background: transparent; cursor: pointer; font-size: 1.25rem; transition: background 0.2s ease; }
	.nav-btn:hover { background: var(--color-cream-dark); }
	.month-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; margin: 0; }

	.weekdays, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
	.weekdays { margin-bottom: 1rem; }
	.weekday { text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); padding: 0.5rem 0; }

	.day {
		aspect-ratio: 1; border-radius: var(--md-shape-corner-small); font-size: 0.875rem; font-weight: 500;
		border: none; cursor: pointer; transition: all 0.2s ease;
	}
	.day.available { background: var(--md-sys-color-surface-container-lowest); color: var(--color-text); }
	.day.available:hover { background: var(--color-cream-dark); }
	.day.unavailable { background: var(--md-sys-color-error); color: var(--md-sys-color-on-error); cursor: not-allowed; }
	.day.past { color: var(--color-text-muted); opacity: 0.3; cursor: not-allowed; background: transparent; }
	.day.selected-endpoint { background: var(--color-sage); color: var(--md-sys-color-on-primary); font-weight: 700; }
	.day.selected-range { background: color-mix(in srgb, var(--color-sage) 20%, transparent); color: var(--color-text); }

	.legend { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-cream-dark); display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; }
	.legend-swatch { width: 1rem; height: 1rem; border-radius: 4px; }
	.legend-swatch.available { background: var(--md-sys-color-surface-container-lowest); border: 1px solid var(--color-cream-dark); }
	.legend-swatch.unavailable { background: var(--md-sys-color-error); }
	.legend-swatch.past { background: var(--color-disabled); opacity: 0.3; }

	.selection-info { margin-top: 1.5rem; padding: 1rem; background: color-mix(in srgb, var(--color-sage) 15%, transparent); border-radius: var(--md-shape-corner-small); font-size: 0.875rem; color: var(--color-text); }
</style>
