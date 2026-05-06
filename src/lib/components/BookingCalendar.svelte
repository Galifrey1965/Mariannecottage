<script lang="ts">
	import { t, formatDate } from '$lib/i18n';
	import type { Messages, Locale } from '$lib/i18n';

	export interface BookingDayInfo {
		id: string;
		status: string;
		source?: string;
		// Position of this date within its booking's date range — used by the
		// admin calendar to visually group multi-night stays (rounded outer
		// edges, square inner edges) so the cells read as one reservation.
		position?: 'single' | 'first' | 'middle' | 'last';
	}

	interface Props {
		messages: Messages;
		lang: Locale;
		availability?: Record<string, boolean>;
		testBlockedDates?: string[];
		onDateRangeSelect?: (checkIn: Date, checkOut: Date) => void;
		minDate?: Date;
		maxDate?: Date;
		// Admin "navigate" mode — clicking a day fires onDayClick(bookingId, date)
		// instead of starting a range selection. Day cells render with status colours.
		bookingByDate?: Record<string, BookingDayInfo>;
		onDayClick?: (bookingId: string | null, date: Date) => void;
		showLegend?: boolean;
		// When true, prev-month navigation is disabled once the visible month
		// reaches minDate's month — the public booking calendar uses this so
		// guests can't navigate into months that are entirely in the past.
		disablePastMonths?: boolean;
		// Minimum stay in nights. Default 1 keeps the admin/availability
		// behaviour where a single-night block is fine; the public /book page
		// passes the policy value (currently 2). Ranges shorter than this are
		// shown as invalid (preview-invalid) and the date-range callback never
		// fires.
		minNights?: number;
		// Fired when the guest clicks an "orphan" day — a day that is itself
		// free but has no run of `minNights` consecutive available days
		// containing it. Such days can't be booked online (the minimum-stay
		// rule blocks them) but the cottage is technically free, so we
		// surface them as a "contact us" affordance rather than hiding them.
		// Only emitted in non-click-mode (the public booking flow); the
		// admin calendar opts out by leaving this undefined.
		onOrphanClick?: (date: Date) => void;
	}

	let {
		messages,
		lang,
		availability = {},
		testBlockedDates = [],
		onDateRangeSelect,
		minDate = new Date(),
		maxDate,
		bookingByDate = {},
		onDayClick,
		showLegend = true,
		disablePastMonths = false,
		minNights = 1,
		onOrphanClick
	}: Props = $props();

	const isClickMode = $derived(onDayClick !== undefined);

	const testBlockedSet = $derived(new Set(testBlockedDates));
	const isTestBlocked = (date: Date) => testBlockedSet.has(toISODate(date));

	const mondayStart = $derived(lang === 'fr' || lang === 'de');

	let currentMonth = $state(new Date());
	let selectedStart: Date | null = $state(null);
	let selectedEnd: Date | null = $state(null);
	let hoveredDate: Date | null = $state(null);

	const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	const toISODate = (date: Date) => {
		// Local-time components — using toISOString() shifts the date by a day
		// for any non-UTC viewer (e.g. BST in summer), which broke availability
		// and booking lookups when the cell's local-midnight Date crosses UTC.
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	};
	const isAvailable = (date: Date) => availability[toISODate(date)] !== false;
	const isPast = (date: Date) => date < minDate;
	const isAfterMax = (date: Date) => maxDate !== undefined && date > maxDate;
	// A date is "free" (selectable for a booking) when it's not past, not past
	// the configured max (e.g. last covered rate-plan day), the availability
	// map says it's open, and no test fixture is blocking it. Used by the
	// orphan detector to count contiguous bookable runs.
	const isFree = (date: Date) =>
		!isPast(date) && !isAfterMax(date) && isAvailable(date) && !testBlockedSet.has(toISODate(date));

	// Orphan day: a free day where no run of `minNights` consecutive free
	// days containing it exists, so the minimum-stay rule blocks every
	// possible range that touches it. Surfaced as "contact us" rather than
	// hidden, per Mark's product call (2026-05-06): a free day sandwiched
	// between bookings is still free, just not bookable through the form.
	const isOrphan = (date: Date): boolean => {
		if (minNights <= 1) return false;
		if (!isFree(date)) return false;
		// Walk left and right counting consecutive free days, capped at
		// minNights-1 in each direction (we only need to know whether the
		// total run reaches minNights — if it does, this day is fine).
		// setDate() is used in preference to ms arithmetic so DST transitions
		// and month-end rollovers don't produce off-by-one date errors.
		let run = 1;
		for (let k = 1; k < minNights; k++) {
			const left = new Date(date);
			left.setDate(left.getDate() - k);
			if (!isFree(left)) break;
			run++;
			if (run >= minNights) return false;
		}
		for (let k = 1; k < minNights; k++) {
			const right = new Date(date);
			right.setDate(right.getDate() + k);
			if (!isFree(right)) break;
			run++;
			if (run >= minNights) return false;
		}
		return true;
	};

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
		if (onDayClick) {
			if (isPast(date)) return;
			const info = bookingByDate[toISODate(date)];
			onDayClick(info?.id ?? null, date);
			return;
		}
		// `isFree` covers all three barriers (past / availability=false / in
		// the test-blocked set). The test-blocked check is what stops a
		// guest selecting a date that's available in the `availability`
		// table but actually held by a source='test' booking — without it
		// the click goes through and the API throws DATES_TAKEN.
		if (!isFree(date)) return;

		// Orphan day → can't form a valid minimum-stay range. Hand off to
		// the parent so it can show "contact us" affordance, then bail
		// without touching the in-progress selection.
		if (isOrphan(date)) {
			if (onOrphanClick) onOrphanClick(date);
			return;
		}

		// No start yet — set it
		if (!selectedStart) {
			selectedStart = date;
			selectedEnd = null;
			return;
		}

		// Re-clicking the start date with no end yet → deselect. Without this,
		// a guest who picks a start where the surrounding availability can't
		// form a valid range is stuck (can't undo, can't extend).
		if (!selectedEnd && toISODate(selectedStart) === toISODate(date)) {
			selectedStart = null;
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

		// Same-date second click. With a 1-night minimum we auto-promote to a
		// 1-night stay (checkout = checkin + 1) for convenience. With a 2+-night
		// minimum that shortcut is misleading (the user'd think they booked 1
		// night), so we just leave the start set and wait for the user to click
		// an actual checkout.
		if (toISODate(s) === toISODate(e)) {
			if (minNights > 1) return;
			e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1);
			if (!isAvailable(e)) return; // next day unavailable — can't form a 1-night stay
		}

		if (!isRangeAvailable(s, e)) return; // block if unavailable dates in range
		if (nightsBetween(s, e) < minNights) return; // below the minimum stay

		selectedStart = s;
		selectedEnd = e;
		if (onDateRangeSelect) onDateRangeSelect(s, e);
	};

	const prevMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1); };
	const nextMonth = () => { currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1); };
	export const goToToday = () => { currentMonth = new Date(); };

	const days = $derived.by(() => {
		const result: Date[] = [];
		let firstDay = getFirstDayOfMonth(currentMonth);
		if (mondayStart) firstDay = (firstDay + 6) % 7;
		const daysCount = daysInMonth(currentMonth);

		// Tail of previous month — fills the leading offset
		for (let i = firstDay; i > 0; i--) {
			result.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1 - i));
		}
		// Current month
		for (let i = 1; i <= daysCount; i++) {
			result.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
		}
		// Head of next month — pad to a full week so booking ranges spanning
		// month boundaries stay visually connected
		const remainder = result.length % 7;
		if (remainder > 0) {
			const need = 7 - remainder;
			for (let i = 1; i <= need; i++) {
				result.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i));
			}
		}
		return result;
	});

	const isOutsideMonth = (date: Date) =>
		date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear();

	const canGoPrev = $derived.by(() => {
		if (!disablePastMonths) return true;
		const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
		const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
		return currentMonthStart > minMonthStart;
	});

	const canGoNext = $derived.by(() => {
		if (!maxDate) return true;
		const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
		const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
		return currentMonthStart < maxMonthStart;
	});

	const monthName = $derived(formatDate(lang, currentMonth, { month: 'long', year: 'numeric' }));

	const previewNights = $derived(
		selectedStart && displayEnd ? nightsBetween(selectedStart, displayEnd) : 0
	);

	const previewValid = $derived.by(() => {
		// Cast after the truthy guard — the derived value's narrowing inside
		// a closure isn't reliable in Svelte 5 ($derived signals a value of
		// `Date | null` but TS doesn't always carry the narrowing through to
		// inline comparisons). Locals + explicit casts keep the comparison
		// well-typed.
		if (!selectedStart || !displayEnd) return true;
		const start = selectedStart as Date;
		const end = displayEnd as Date;
		const s = start < end ? start : end;
		const e = start < end ? end : start;
		if (!isRangeAvailable(s, e)) return false;
		// Range below the configured minimum stay is also "invalid preview"
		// — the hover state turns red so the guest sees the rule before
		// committing the click.
		if (nightsBetween(s, e) < minNights) return false;
		return true;
	});

	function dayClass(date: Date): string {
		const outside = isOutsideMonth(date) ? ' outside' : '';
		if (isPast(date) || isAfterMax(date)) return 'day past' + outside;
		if (isClickMode) {
			const info = bookingByDate[toISODate(date)];
			if (info) {
				const pos = info.position ?? 'single';
				let cls: string;
				if (info.source === 'booking_com') cls = 'booked-imported';
				else if (info.source === 'admin_block') cls = 'booked-admin-block';
				else if (info.source === 'test') cls = 'booked-test';
				else if (info.status === 'cancelled' || info.status === 'expired' || info.status === 'refunded' || info.status === 'refunded_overbooked' || info.status === 'payment_failed') cls = 'booked-cancelled';
				else if (info.status === 'pending' || info.status === 'pending_payment') cls = 'booked-pending';
				else if (info.status === 'confirmed') cls = 'booked-confirmed';
				else cls = 'booked-other';
				return `day ${cls} pos-${pos}${outside}`;
			}
			return 'day available' + outside;
		}
		// Test-blocked takes precedence — even if the availability table
		// hasn't been written for this date (the test fixture seeds bookings
		// directly without touching availability), we want the orange
		// striped style and a non-clickable cell.
		if (isTestBlocked(date)) return 'day test-blocked' + outside;
		if (!isAvailable(date)) return 'day unavailable' + outside;
		if (isStart(date) || isEnd(date)) return 'day selected-endpoint' + outside;
		if (isInRange(date) && !previewValid) return 'day preview-invalid' + outside;
		if (isInRange(date) && isHoverPreview) return 'day hover-range' + outside;
		if (isInRange(date)) return 'day selected-range' + outside;
		// Orphan must outrank "available" so the guest sees the by-arrangement
		// styling rather than mistaking it for a clickable start date.
		if (isOrphan(date)) return 'day orphan' + outside;
		return 'day available' + outside;
	}
</script>

<div class="calendar" onmouseleave={() => hoveredDate = null}>
	<div class="cal-header">
		<button onclick={prevMonth} class="nav-btn" aria-label={t(messages, 'calendar.prev_month')} disabled={!canGoPrev}>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
		</button>
		<h2 class="month-title">{monthName}</h2>
		<button onclick={nextMonth} class="nav-btn" aria-label={t(messages, 'calendar.next_month')} disabled={!canGoNext}>
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
			<button
				onclick={() => selectDate(date)}
				onmouseenter={() => hoveredDate = date}
				disabled={isPast(date) || (!isClickMode && (isOutsideMonth(date) || !isFree(date)))}
				class={dayClass(date)}
				aria-label={date.toLocaleDateString(lang, { weekday: 'long', month: 'long', day: 'numeric' })}
				aria-selected={isInRange(date)}
			>
				{date.getDate()}
			</button>
		{/each}
	</div>

	{#if showLegend}
		<div class="legend">
			<div class="legend-item"><div class="legend-swatch available"></div><span>{t(messages, 'calendar.available')}</span></div>
			<div class="legend-item"><div class="legend-swatch unavailable"></div><span>{t(messages, 'calendar.unavailable')}</span></div>
			{#if testBlockedDates.length > 0}
				<div class="legend-item"><div class="legend-swatch test-blocked"></div><span>{t(messages, 'calendar.test_blocked')}</span></div>
			{/if}
		</div>
	{/if}

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
	.calendar { width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box; background: var(--color-cream); border-radius: var(--md-shape-corner-medium); padding: 1.5rem; box-shadow: var(--md-elevation-shadow-1); font-family: 'Source Sans 3', sans-serif; }
	.cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.5rem; }
	.nav-btn { display: inline-flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; padding: 0; border-radius: 50%; border: none; background: transparent; cursor: pointer; color: var(--color-brown); transition: background 0.2s ease; }
	.nav-btn:hover { background: var(--color-cream-dark); }
	.nav-btn:active { background: color-mix(in srgb, var(--color-sage) 20%, transparent); }
	.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
	.nav-btn:disabled:hover { background: transparent; }
	.month-title { font-family: 'Lora', serif; font-size: 1.375rem; font-weight: 600; margin: 0; }

	.hint { text-align: center; font-size: 0.8rem; color: var(--color-sage); font-weight: 500; margin-bottom: 0.75rem; animation: fadeIn 0.2s ease; }

	.weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; }
	.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.25rem; }
	.weekdays { margin-bottom: 1rem; }
	.weekday { text-align: center; font-size: 0.78rem; font-weight: 600; color: var(--color-text-muted); padding: 0.5rem 0; letter-spacing: 0.05em; text-transform: uppercase; }

	.day {
		aspect-ratio: 1; min-height: 44px; border-radius: 50%; font-size: 1.05rem; font-weight: 500;
		border: none; cursor: pointer; transition: all 0.15s ease;
	}
	.day.available { background: var(--md-sys-color-surface-container-lowest); color: var(--color-text); }
	.day.available:hover { background: var(--color-cream-dark); }

	/* Orphan day — free but blocked from online booking by the minimum-stay
	   rule. Subtle warm-stripe pattern so guests see something different
	   from a normal available day; clicking opens the parent's
	   "contact us" affordance rather than starting a range selection. */
	.day.orphan {
		background: repeating-linear-gradient(135deg,
			var(--md-sys-color-surface-container-lowest) 0 5px,
			var(--color-cream-dark) 5px 10px);
		color: var(--color-brown, #8b6f47);
		cursor: help;
		font-weight: 500;
	}
	.day.orphan:hover { filter: brightness(0.95); }
	.day.unavailable { background: transparent; color: var(--color-text-muted); opacity: 0.3; cursor: default; }
	.day.test-blocked {
		background: repeating-linear-gradient(45deg, #f5b942, #f5b942 4px, #e89c1c 4px, #e89c1c 8px);
		color: #4a3300;
		cursor: not-allowed;
	}
	.day.past { color: var(--color-text-muted); opacity: 0.3; cursor: default; background: transparent; }
	/* Outside-month days — preview from prev/next month for visual continuity
	   on bookings spanning month boundaries. Dimmed but clickable in admin
	   click-mode (so the admin can edit a tile right at the edge of the grid
	   without flipping months); the disabled attribute on the button is what
	   actually gates clicks in non-click-mode. */
	.day.outside { opacity: 0.35; }
	.day.outside:disabled { cursor: default; }
	.day.outside.available { color: var(--color-text-muted); background: transparent; }
	.day.selected-endpoint { background: var(--color-sage); color: var(--md-sys-color-on-primary); font-weight: 700; box-shadow: 0 2px 8px color-mix(in srgb, var(--color-sage) 40%, transparent); }
	.day.selected-range { background: color-mix(in srgb, var(--color-sage) 25%, transparent); color: var(--color-text); }
	.day.hover-range { background: color-mix(in srgb, var(--color-sage) 12%, transparent); color: var(--color-text); }
	.day.preview-invalid { background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); color: var(--color-text-muted); }

	/* Admin click-mode statuses */
	.day.booked-confirmed { background: var(--color-sage); color: white; cursor: pointer; font-weight: 600; }
	.day.booked-confirmed:hover { filter: brightness(1.1); }
	.day.booked-pending { background: #fff4d6; color: #8a5a00; cursor: pointer; border: 2px dashed #f5b942; box-sizing: border-box; }
	.day.booked-pending:hover { filter: brightness(0.97); }
	.day.booked-cancelled { background: var(--color-cream-dark); color: var(--color-text-muted); cursor: pointer; opacity: 0.6; text-decoration: line-through; }
	.day.booked-cancelled:hover { opacity: 0.85; }
	.day.booked-test {
		background: repeating-linear-gradient(45deg, #f5b942, #f5b942 4px, #e89c1c 4px, #e89c1c 8px);
		color: #4a3300; cursor: pointer; font-weight: 600;
	}
	.day.booked-test:hover { filter: brightness(1.05); }
	.day.booked-imported {
		background: repeating-linear-gradient(45deg, #4a90c2, #4a90c2 4px, #2e5d80 4px, #2e5d80 8px);
		color: white; cursor: pointer; font-weight: 600;
	}
	.day.booked-imported:hover { filter: brightness(1.1); }
	.day.booked-admin-block {
		background: var(--color-brown, #6b5642);
		color: white; cursor: pointer; font-weight: 600;
	}
	.day.booked-admin-block:hover { filter: brightness(1.15); }
	.day.booked-other { background: var(--color-cream-dark); color: var(--color-text); cursor: pointer; }

	/* Multi-night grouping — rounded outer edges, square inner edges, so a
	   contiguous range reads as one reservation rather than three loose dots.
	   pos-single keeps the default circle. */
	.day.pos-first  { border-radius: 50% 0 0 50%; }
	.day.pos-middle { border-radius: 0; }
	.day.pos-last   { border-radius: 0 50% 50% 0; }
	.day.pos-single { border-radius: 50%; }

	.legend { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--color-cream-dark); display: flex; flex-direction: row; flex-wrap: wrap; gap: 0.75rem 1.5rem; font-size: 0.75rem; overflow-wrap: anywhere; }
	.legend-item { display: flex; align-items: center; gap: 0.5rem; }
	.legend-swatch { width: 1rem; height: 1rem; border-radius: 4px; }
	.legend-swatch.available { background: var(--md-sys-color-surface-container-lowest); border: 1px solid var(--color-cream-dark); }
	.legend-swatch.unavailable { background: var(--color-disabled); opacity: 0.3; }
	.legend-swatch.past { background: var(--color-disabled); opacity: 0.3; }
	.legend-swatch.test-blocked { background: repeating-linear-gradient(45deg, #f5b942, #f5b942 3px, #e89c1c 3px, #e89c1c 6px); }

	.selection-info {
		margin-top: 1.5rem; padding: 0.75rem 1rem; background: color-mix(in srgb, var(--color-sage) 15%, transparent);
		border-radius: var(--md-shape-corner-small); font-size: 0.875rem; color: var(--color-text);
		display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;
	}
	.selection-info.preview { opacity: 0.7; }
	.selection-info.invalid { background: color-mix(in srgb, var(--md-sys-color-error) 10%, transparent); color: var(--md-sys-color-error); }
	.night-count { font-weight: 600; color: var(--color-sage); }
	.selection-info.invalid .night-count { color: var(--md-sys-color-error); }

	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
