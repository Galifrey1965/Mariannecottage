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

	const mondayStart = $derived(lang === 'fr' || lang === 'de');

	let currentMonth = $state(new Date());
	let selectedStart: Date | null = $state(null);
	let selectedEnd: Date | null = $state(null);
	let hoveredDate: Date | null = $state(null);

	const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	const toISODate = (date: Date) => date.toISOString().split('T')[0];
	const isAvailable = (date: Date) => availability[toISODate(date)] !== false;
	const isPast = (date: Date) => date < minDate;

	/** Check if every date in the range [a, b] is available */
	const isRangeAvailable = (a: Date, b: Date): boolean => {
		const start = a < b ? a : b;
		const end = a < b ? b : a;
		const d = new Date(start);
		while (d <= end) {
			if (!isAvailable(d) || isPast(d)) return false;
			d.setDate(d.getDate() + 1);
		}
		return true;
	};

	const nightsBetween = (a: Date, b: Date) =>
		Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));

	/** The effective end for display — either confirmed end or hover preview */
	const displayEnd: Date | null = $derived(selectedEnd ?? (selectedStart && hoveredDate && !isPast(hoveredDate) && isAvailable(hoveredDate) ? hoveredDate : null));

	const isInRange = (date: Date) => {
		if (!selectedStart || !displayEnd) return false;
		const time = date.getTime();
		const lo = Math.min((selectedStart as Date).getTime(), (displayEnd as Date).getTime());
		const hi = Math.max((selectedStart as Date).getTime(), (displayEnd as Date).getTime());
		return time >= lo && time <= hi;
	};

	const isStart = (date: Date) => selectedStart && toISODate(date) === toISODate(selectedStart);
	const isEnd = (date: Date) => displayEnd && toISODate(date) === toISODate(displayEnd as Date);
	const isHoverPreview = $derived(!selectedEnd && selectedStart && hoveredDate);

	const selectDate = (date: Date) => {
		if (isPast(date) || !isAvailable(date)) return;

		// No start yet — set it
		if (!selectedStart) {
			selectedStart = date;
			selectedEnd = null;
			return;
		}

		// Already have a confirmed range — restart
		if (selectedEnd) {
			selectedStart = date;
			selectedEnd = null;
			return;
		}

		// Have start, picking end — order them and validate range
		let s = selectedStart;
		let e = date;
		if (e < s) { const tmp = s; s = e; e = tmp; }

		if (!isRangeAvailable(s, e)) return; // block if unavailable dates in range

		selectedStart = s;
		selectedEnd = e;
		if (onDateRangeSelect) onDateRangeSelect(s, e);
	};

	const prevMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1); };
	const nextMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1); };
	export const goToToday = () => { currentMonth = new Date(); };

	const days = $derived.by(() => {
		const result: (Date | null)[] = [];
		let firstDay = getFirstDayOfMonth(currentMonth);
		if (mondayStart) firstDay = (firstDay + 6) % 7;
		const daysCount = daysInMonth(currentMonth);
		for (let i = 0; i < firstDay; i++) result.push(null);
		for (let i = 1; i <= daysCount; i++) result.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
		return result;
	});

	const monthName = $derived(formatDate(lang, currentMonth, { month: 'long', year: 'numeric' }));

	const previewNights = $derived(
		selectedStart && displayEnd ? nightsBetween(selectedStart, displayEnd) : 0
	);

	const previewValid = $derived(
		selectedStart && displayEnd ? isRangeAvailable(
			selectedStart < displayEnd ? selectedStart : displayEnd,
			selectedStart < displayEnd ? displayEnd : selectedStart
		) : true
	);

	function dayClass(date: Date): string {
		if (isPast(date)) return 'day past';
		if (!isAvailable(date)) return 'day unavailable';
		if (isStart(date) || isEnd(date)) return 'day selected-endpoint';
		if (isInRange(date) && !previewValid) return 'day preview-invalid';
		if (isInRange(date) && isHoverPreview) return 'day hover-range';
		if (isInRange(date)) return 'day selected-range';
		return 'day available';
	}
</script>

<div class="calendar" onmouseleave={() => hoveredDate = null}>
	<div class="cal-header">
		<button onclick={prevMonth} class="nav-btn" aria-label={t(messages, 'calendar.prev_month')}>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
		</button>
		<h2 class="month-title">{monthName}</h2>
		<button onclick={nextMonth} class="nav-btn" aria-label={t(messages, 'calendar.next_month')}>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
		</button>
	</div>

	{#if selectedStart && !selectedEnd}
		<div class="hint">{t(messages, 'calendar.select_checkout')}</div>
	{/if}

	<div class="weekdays">
		{#each mondayStart
			? [t(messages, 'calendar.mon'), t(messages, 'calendar.tue'), t(messages, 'calendar.wed'), t(messages, 'calendar.thu'), t(messages, 'calendar.fri'), t(messages, 'calendar.sat'), t(messages, 'calendar.sun')]
			: [t(messages, 'calendar.sun'), t(messages, 'calendar.mon'), t(messages, 'calendar.tue'), t(messages, 'calendar.wed'), t(messages, 'calendar.thu'), t(messages, 'calendar.fri'), t(messages, 'calendar.sat')]
		as day}
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
					onmouseenter={() => hoveredDate = date}
					disabled={isPast(date) || !isAvailable(date)}
					class={dayClass(date)}
					aria-label={date.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' })}
					aria-selected={isInRange(date)}
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

	{#if selectedStart && displayEnd && previewNights > 0}
		<div class="selection-info" class:preview={isHoverPreview} class:invalid={!previewValid} role="status" aria-live="polite">
			<strong>{formatDate(lang, selectedStart, { month: 'short', day: 'numeric' })} → {formatDate(lang, displayEnd as Date, { month: 'short', day: 'numeric' })}</strong>
			<span class="night-count">
				{previewNights} {previewNights > 1 ? t(messages, 'book.nights') : t(messages, 'book.night')}
			</span>
		</div>
	{/if}
</div>

<style>
	.calendar { width: 100%; background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; box-shadow: var(--md-elevation-shadow-1); }
	.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
	.nav-btn { display: inline-flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer; color: var(--color-brown); transition: background 0.2s ease; }
	.nav-btn:hover { background: var(--color-cream-dark); }
	.nav-btn:active { background: color-mix(in srgb, var(--color-sage) 20%, transparent); }
	.month-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; margin: 0; }

	.hint { text-align: center; font-size: 0.8rem; color: var(--color-sage); font-weight: 500; margin-bottom: 0.75rem; animation: fadeIn 0.2s ease; }

	.weekdays, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
	.weekdays { margin-bottom: 1rem; }
	.weekday { text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); padding: 0.5rem 0; }

	.day {
		aspect-ratio: 1; border-radius: var(--md-shape-corner-small); font-size: 0.875rem; font-weight: 500;
		border: none; cursor: pointer; transition: all 0.15s ease;
	}
	.day.available { background: var(--md-sys-color-surface-container-lowest); color: var(--color-text); }
	.day.available:hover { background: var(--color-cream-dark); }
	.day.unavailable { background: var(--md-sys-color-error); color: var(--md-sys-color-on-error); cursor: not-allowed; }
	.day.past { color: var(--color-text-muted); opacity: 0.3; cursor: not-allowed; background: transparent; }
	.day.selected-endpoint { background: var(--color-sage); color: var(--md-sys-color-on-primary); font-weight: 700; }
	.day.selected-range { background: color-mix(in srgb, var(--color-sage) 25%, transparent); color: var(--color-text); }
	.day.hover-range { background: color-mix(in srgb, var(--color-sage) 12%, transparent); color: var(--color-text); }
	.day.preview-invalid { background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); color: var(--color-text-muted); }

	.legend { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-cream-dark); display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; }
	.legend-swatch { width: 1rem; height: 1rem; border-radius: 4px; }
	.legend-swatch.available { background: var(--md-sys-color-surface-container-lowest); border: 1px solid var(--color-cream-dark); }
	.legend-swatch.unavailable { background: var(--md-sys-color-error); }
	.legend-swatch.past { background: var(--color-disabled); opacity: 0.3; }

	.selection-info {
		margin-top: 1.5rem; padding: 0.75rem 1rem; background: color-mix(in srgb, var(--color-sage) 15%, transparent);
		border-radius: var(--md-shape-corner-small); font-size: 0.875rem; color: var(--color-text);
		display: flex; justify-content: space-between; align-items: center;
	}
	.selection-info.preview { opacity: 0.7; }
	.selection-info.invalid { background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); color: var(--md-sys-color-error); }
	.night-count { font-weight: 600; color: var(--color-sage); }
	.selection-info.invalid .night-count { color: var(--md-sys-color-error); }

	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
