<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Messages } from '$lib/i18n';

	interface Props {
		messages: Messages;
		lang?: string;
		availability?: Record<string, boolean>;
		onDateRangeSelect?: (checkIn: Date, checkOut: Date) => void;
		minDate?: Date;
		maxDate?: Date;
	}

	let { messages, lang = 'en', availability = {}, onDateRangeSelect, minDate = new Date(), maxDate }: Props = $props();

	const mondayStart = $derived(lang === 'fr' || lang === 'de');

	let currentMonth = $state(new Date());
	let selectedStart: Date | null = $state(null);
	let selectedEnd: Date | null = $state(null);
	let hoveredDate: Date | null = $state(null);

	const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	const formatDate = (date: Date) => date.toISOString().split('T')[0];
	const isAvailable = (date: Date) => availability[formatDate(date)] !== false;
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

	const isStart = (date: Date) => selectedStart && formatDate(date) === formatDate(selectedStart);
	const isEnd = (date: Date) => displayEnd && formatDate(date) === formatDate(displayEnd as Date);
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

	const monthName = $derived(currentMonth.toLocaleDateString(lang, { month: 'long', year: 'numeric' }));

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
		<button onclick={prevMonth} class="nav-btn" aria-label={t(messages, 'calendar.prev_month')}>‹</button>
		<h2 class="month-title">{monthName}</h2>
		<button onclick={nextMonth} class="nav-btn" aria-label={t(messages, 'calendar.next_month')}>›</button>
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
		<div class="selection-info" class:preview={isHoverPreview} class:invalid={!previewValid}>
			<strong>{selectedStart.toLocaleDateString(lang, { month: 'short', day: 'numeric' })} → {(displayEnd as Date).toLocaleDateString(lang, { month: 'short', day: 'numeric' })}</strong>
			<span class="night-count">
				{previewNights} {previewNights > 1 ? t(messages, 'book.nights') : t(messages, 'book.night')}
			</span>
		</div>
	{/if}
</div>

<style>
	.calendar { width: 100%; background: var(--color-cream); border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
	.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
	.nav-btn { padding: 0.5rem; border-radius: 50%; border: none; background: transparent; cursor: pointer; font-size: 1.25rem; transition: background 0.2s ease; }
	.nav-btn:hover { background: var(--color-cream-dark); }
	.month-title { font-family: 'Lora', serif; font-size: 1.25rem; font-weight: 600; margin: 0; }

	.hint { text-align: center; font-size: 0.8rem; color: var(--color-sage); font-weight: 500; margin-bottom: 0.75rem; animation: fadeIn 0.2s ease; }

	.weekdays, .days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
	.weekdays { margin-bottom: 1rem; }
	.weekday { text-align: center; font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); padding: 0.5rem 0; }

	.day {
		aspect-ratio: 1; border-radius: 8px; font-size: 0.875rem; font-weight: 500;
		border: none; cursor: pointer; transition: all 0.15s ease;
	}
	.day.available { background: white; color: var(--color-text); }
	.day.available:hover { background: var(--color-cream-dark); }
	.day.unavailable { background: #c4554e; color: white; cursor: not-allowed; }
	.day.past { color: var(--color-text-muted); opacity: 0.3; cursor: not-allowed; background: transparent; }
	.day.selected-endpoint { background: var(--color-sage); color: white; font-weight: 700; }
	.day.selected-range { background: rgba(107,143,113,0.25); color: var(--color-text); }
	.day.hover-range { background: rgba(107,143,113,0.12); color: var(--color-text); }
	.day.preview-invalid { background: rgba(196,85,78,0.1); color: var(--color-text-muted); }

	.legend { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-cream-dark); display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.75rem; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; }
	.legend-swatch { width: 1rem; height: 1rem; border-radius: 4px; }
	.legend-swatch.available { background: white; border: 1px solid var(--color-cream-dark); }
	.legend-swatch.unavailable { background: #c4554e; }
	.legend-swatch.past { background: #9ca3af; opacity: 0.3; }

	.selection-info {
		margin-top: 1.5rem; padding: 0.75rem 1rem; background: rgba(107,143,113,0.15);
		border-radius: 8px; font-size: 0.875rem; color: var(--color-text);
		display: flex; justify-content: space-between; align-items: center;
	}
	.selection-info.preview { opacity: 0.7; }
	.selection-info.invalid { background: rgba(196,85,78,0.1); color: #c4554e; }
	.night-count { font-weight: 600; color: var(--color-sage); }
	.selection-info.invalid .night-count { color: #c4554e; }

	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
