<script lang="ts">
	/**
	 * Material Design 3 Booking Calendar Component
	 * Displays availability and allows date range selection
	 * States: available (green), blocked (red), past (grey), selected (primary)
	 */

	interface Props {
		availability?: Record<string, boolean>; // YYYY-MM-DD -> true/false
		onDateRangeSelect?: (checkIn: Date, checkOut: Date) => void;
		minDate?: Date;
		maxDate?: Date;
	}

	let { availability = {}, onDateRangeSelect, minDate = new Date(), maxDate }: Props = $props();

	let currentMonth = $state(new Date());
	let selectedStart: Date | null = $state(null);
	let selectedEnd: Date | null = $state(null);

	const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

	const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

	const formatDate = (date: Date) => date.toISOString().split('T')[0];

	const isAvailable = (date: Date) => {
		const key = formatDate(date);
		return availability[key] !== false;
	};

	const isPast = (date: Date) => date < minDate;

	const isSelected = (date: Date) => {
		if (!selectedStart) return false;
		const time = date.getTime();
		const startTime = selectedStart.getTime();
		const endTime = selectedEnd ? selectedEnd.getTime() : startTime;
		return time >= startTime && time <= endTime;
	};

	const isStart = (date: Date) => selectedStart && formatDate(date) === formatDate(selectedStart);
	const isEnd = (date: Date) => selectedEnd && formatDate(date) === formatDate(selectedEnd);

	const selectDate = (date: Date) => {
		if (isPast(date) || !isAvailable(date)) return;

		if (!selectedStart) {
			selectedStart = date;
		} else if (!selectedEnd) {
			if (date < selectedStart) {
				selectedEnd = selectedStart;
				selectedStart = date;
			} else {
				selectedEnd = date;
			}
			if (onDateRangeSelect) {
				onDateRangeSelect(selectedStart, selectedEnd);
			}
		} else {
			selectedStart = date;
			selectedEnd = null;
		}
	};

	const prevMonth = () => {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
	};

	const nextMonth = () => {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
	};

	const getDays = () => {
		const days = [];
		const firstDay = getFirstDayOfMonth(currentMonth);
		const daysCount = daysInMonth(currentMonth);

		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		for (let i = 1; i <= daysCount; i++) {
			const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
			days.push(date);
		}

		return days;
	};

	const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	const days = $derived(getDays());
</script>

<div class="w-full bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-shape-corner-large)] p-6 shadow-md">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<button
			onclick={prevMonth}
			class="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
			aria-label="Previous month"
		>
			‹
		</button>
		<h2 class="text-[var(--md-typescale-headline-medium-font-size)] font-[var(--md-typescale-headline-medium-font-weight)] text-[var(--md-sys-color-on-surface)]">
			{monthName}
		</h2>
		<button
			onclick={nextMonth}
			class="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
			aria-label="Next month"
		>
			›
		</button>
	</div>

	<!-- Weekday headers -->
	<div class="grid grid-cols-7 gap-2 mb-4">
		{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
			<div class="text-center text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] py-2">
				{day}
			</div>
		{/each}
	</div>

	<!-- Calendar days -->
	<div class="grid grid-cols-7 gap-2">
		{#each days as date}
			{#if date === null}
				<div></div>
			{:else}
				<button
					onclick={() => selectDate(date)}
					disabled={isPast(date) || !isAvailable(date)}
					class="aspect-square rounded-[var(--md-shape-corner-small)] text-sm font-medium transition-all duration-200 {isPast(date)
						? 'text-[var(--md-sys-color-on-surface-variant)] opacity-30 cursor-not-allowed'
						: !isAvailable(date)
							? 'bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] cursor-not-allowed'
							: isStart(date) || isEnd(date)
								? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
								: isSelected(date)
									? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
									: 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)]'}"
				>
					{date.getDate()}
				</button>
			{/if}
		{/each}
	</div>

	<!-- Legend -->
	<div class="mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)] text-xs space-y-2">
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded bg-[var(--md-sys-color-surface-container-low)]"></div>
			<span class="text-[var(--md-sys-color-on-surface-variant)]">Available</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded bg-[var(--md-sys-color-error)]"></div>
			<span class="text-[var(--md-sys-color-on-surface-variant)]">Unavailable</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded opacity-30 bg-gray-400"></div>
			<span class="text-[var(--md-sys-color-on-surface-variant)]">Past Date</span>
		</div>
	</div>

	{#if selectedStart && selectedEnd}
		<div class="mt-6 p-4 bg-[var(--md-sys-color-primary-container)] rounded-[var(--md-shape-corner-small)] text-sm">
			<p class="text-[var(--md-sys-color-on-primary-container)]">
				<strong>Selected:</strong> {selectedStart.toLocaleDateString()} → {selectedEnd.toLocaleDateString()}
			</p>
		</div>
	{/if}
</div>

<style>
	button:disabled {
		cursor: not-allowed;
	}
</style>
