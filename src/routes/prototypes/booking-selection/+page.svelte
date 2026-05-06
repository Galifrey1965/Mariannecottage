<script lang="ts">
	import BookingCalendar from '$lib/components/BookingCalendar.svelte';
	import enMessages from '../../../../messages/en.json';

	type DayState = 'free' | 'booked' | 'checkout-only';

	// Pinned "today" so the prototype always shows the same scenario,
	// regardless of when it's opened. The mock bookings are anchored to
	// this date.
	const TODAY = new Date('2026-05-06');
	const HORIZON_DAYS = 90;

	// Mock bookings — designed to exercise the interesting cases:
	//   F: 9–11 May  → creates an orphan day at 11 May (free, but trapped
	//                  between F and G with no 2-night run possible)
	//   G: 12–14 May → checkout-only at 12, free at 14 (G's checkout morn)
	//   H: 16–18 May
	//   I: 18–22 May → same-day turnover with H (a guest can leave 18 morn
	//                  while I checks in 18 afternoon)
	//   J: 25–27 May
	//   K: 5–7 Jun   → mirrors the real BC booking on production data
	const mockBookings = [
		{ from: '2026-05-09', to: '2026-05-11', label: 'Booking F' },
		{ from: '2026-05-12', to: '2026-05-14', label: 'Booking G' },
		{ from: '2026-05-16', to: '2026-05-18', label: 'Booking H' },
		{ from: '2026-05-18', to: '2026-05-22', label: 'Booking I (same-day turnover)' },
		{ from: '2026-05-25', to: '2026-05-27', label: 'Booking J' },
		{ from: '2026-06-05', to: '2026-06-07', label: 'Booking K (BC)' }
	];

	const MIN_NIGHTS = 2;

	function toISO(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function fromISO(iso: string): Date {
		const [y, m, d] = iso.split('-').map(Number);
		return new Date(y, m - 1, d);
	}

	function addDays(d: Date, n: number): Date {
		const out = new Date(d);
		out.setDate(out.getDate() + n);
		return out;
	}

	function nightsBetween(aISO: string, bISO: string): number {
		const a = fromISO(aISO).getTime();
		const b = fromISO(bISO).getTime();
		return Math.round((b - a) / (1000 * 60 * 60 * 24));
	}

	function fmtShort(iso: string): string {
		return fromISO(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
	function fmtLong(iso: string): string {
		return fromISO(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' });
	}

	// Day state lookup — returns 'free' | 'booked' | 'checkout-only'.
	// Computed lazily but cached for the whole horizon so each variant
	// can read it cheaply.
	const stateMap: Record<string, DayState> = {};
	for (let i = 0; i <= HORIZON_DAYS; i++) {
		stateMap[toISO(addDays(TODAY, i))] = 'free';
	}
	for (const b of mockBookings) {
		const start = fromISO(b.from);
		const end = fromISO(b.to);
		for (let d = new Date(start); d < end; d = addDays(d, 1)) {
			const iso = toISO(d);
			if (iso in stateMap) stateMap[iso] = 'booked';
		}
		// First day of the booking is the check-in afternoon → checkout-only
		// for a *new* booking ending that morning. Overrides 'booked' for
		// display purposes; logically the cottage is still occupied, just
		// from midday onwards.
		if (b.from in stateMap) stateMap[b.from] = 'checkout-only';
	}

	function getState(iso: string): DayState {
		return stateMap[iso] ?? 'free';
	}

	// "free" excludes 'booked' AND 'checkout-only' — same constraint the
	// real calendar uses for start/middle of a range.
	function isFreeISO(iso: string): boolean {
		return getState(iso) === 'free';
	}

	// A run of bookable nights starting at this date — counts consecutive
	// 'free' days. The day *after* the last free night can be 'free' or
	// 'checkout-only' (we leave that morning either way), so a run of N
	// free days yields up to N possible nights of stay.
	function freeRunLength(startISO: string): number {
		let run = 0;
		let cur = startISO;
		while (cur in stateMap && getState(cur) === 'free') {
			run++;
			cur = toISO(addDays(fromISO(cur), 1));
		}
		return run;
	}

	// Can a stay of `nights` start on this date? Needs `nights` consecutive
	// free days starting here.
	function canStartStay(startISO: string, nights: number): boolean {
		return freeRunLength(startISO) >= nights;
	}

	// Build a list of all bookable windows ≥ MIN_NIGHTS — used by V2 and
	// also for "next openings" hints elsewhere.
	type Window = { from: string; to: string; nights: number };
	function computeWindows(): Window[] {
		const out: Window[] = [];
		const dates = Object.keys(stateMap).sort();
		let i = 0;
		while (i < dates.length) {
			if (getState(dates[i]) === 'free') {
				let j = i;
				while (j < dates.length && getState(dates[j]) === 'free') j++;
				const runStart = dates[i];
				const runEndExclusive = j < dates.length ? dates[j] : toISO(addDays(fromISO(dates[j - 1]), 1));
				// runEndExclusive is the first day after the run. If that
				// day is 'checkout-only', it's a valid checkout target — a
				// new guest leaves that morning. If it's 'booked' (middle
				// of an existing booking), the runEndExclusive itself is
				// the final checkout target, but the night before it was
				// already reserved... actually if the day after the free
				// run is 'booked', the run ends at runEndExclusive - 1
				// inclusive and the only valid checkout for the new range
				// is runEndExclusive iff it's a check-in (= checkout-only).
				// Simpler: a window's checkout = runEndExclusive when it's
				// either past-the-end or a checkout-only day; otherwise
				// the run effectively can't reach that final morning.
				const lastFree = dates[j - 1];
				const dayAfterRun = j < dates.length ? dates[j] : toISO(addDays(fromISO(lastFree), 1));
				const dayAfterState = j < dates.length ? getState(dayAfterRun) : 'free';
				const checkoutISO =
					dayAfterState === 'free' || dayAfterState === 'checkout-only'
						? dayAfterRun
						: toISO(addDays(fromISO(lastFree), 1));
				const nights = nightsBetween(runStart, checkoutISO);
				if (nights >= MIN_NIGHTS) {
					out.push({ from: runStart, to: checkoutISO, nights });
				}
				i = j;
			} else {
				i++;
			}
		}
		return out;
	}

	const allWindows = computeWindows();

	// Shared "current selection" panel — every variant writes here when the
	// guest commits a range. Keeps the page one-glance comparable.
	type Selection = { from: string; to: string; nights: number; source: string } | null;
	let currentSelection = $state<Selection>(null);
	function commit(from: string, to: string, source: string) {
		currentSelection = { from, to, nights: nightsBetween(from, to), source };
	}
	function resetSelection() {
		currentSelection = null;
	}

	// === V1: Current calendar baseline ===
	const v1Availability = $derived.by(() => {
		const m: Record<string, boolean> = {};
		for (const iso of Object.keys(stateMap)) {
			m[iso] = getState(iso) === 'free';
		}
		return m;
	});
	const v1CheckoutOnly = Object.keys(stateMap).filter((iso) => getState(iso) === 'checkout-only');
	function v1Pick(start: Date, end: Date) {
		commit(toISO(start), toISO(end), 'V1 — Current calendar');
	}

	// === V2: Available-windows list ===
	let v2ExpandedIdx = $state<number | null>(null);
	let v2RefineFrom = $state<string>('');
	let v2RefineTo = $state<string>('');
	function v2Open(idx: number) {
		v2ExpandedIdx = idx;
		v2RefineFrom = allWindows[idx].from;
		v2RefineTo = allWindows[idx].to;
	}
	function v2Close() {
		v2ExpandedIdx = null;
	}
	function v2CommitWindow(idx: number) {
		const w = allWindows[idx];
		commit(w.from, w.to, 'V2 — Available windows (full window)');
	}
	function v2CommitRefined() {
		if (v2ExpandedIdx === null) return;
		const w = allWindows[v2ExpandedIdx];
		// Clamp the refined picks to the window
		const from = v2RefineFrom < w.from ? w.from : v2RefineFrom;
		const to = v2RefineTo > w.to ? w.to : v2RefineTo;
		const n = nightsBetween(from, to);
		if (n < MIN_NIGHTS) return;
		commit(from, to, 'V2 — Available windows (shortened)');
		v2ExpandedIdx = null;
	}

	// === V3: Two-step arrival → departure ===
	let v3Step = $state<1 | 2>(1);
	let v3Arrival = $state<string | null>(null);
	let v3Month = $state(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
	function v3PickArrival(iso: string) {
		v3Arrival = iso;
		v3Step = 2;
	}
	function v3PickDeparture(iso: string) {
		if (!v3Arrival) return;
		commit(v3Arrival, iso, 'V3 — Two-step arrival → departure');
		v3Step = 1;
		v3Arrival = null;
	}
	function v3Back() {
		v3Arrival = null;
		v3Step = 1;
	}
	// Valid arrivals for step 1 — any date that has ≥ MIN_NIGHTS free run.
	function v3IsValidArrival(iso: string): boolean {
		return canStartStay(iso, MIN_NIGHTS);
	}
	// Valid departures for step 2 — given chosen arrival, valid departures
	// are arrival + MIN_NIGHTS through arrival + freeRun, plus the day
	// right after the run if it's checkout-only-or-free (= same-day
	// turnover or end-of-data).
	function v3IsValidDeparture(iso: string): boolean {
		if (!v3Arrival) return false;
		const n = nightsBetween(v3Arrival, iso);
		if (n < MIN_NIGHTS) return false;
		const run = freeRunLength(v3Arrival);
		// Last possible checkout = arrival + run
		const lastCheckout = toISO(addDays(fromISO(v3Arrival), run));
		return iso <= lastCheckout && iso > v3Arrival;
	}

	// === V4: Date fields + availability strip ===
	let v4From = $state<string>('');
	let v4To = $state<string>('');
	const v4Error = $derived.by(() => {
		if (!v4From || !v4To) return '';
		if (v4From >= v4To) return 'Check-out must be after check-in.';
		const n = nightsBetween(v4From, v4To);
		if (n < MIN_NIGHTS) return `Minimum stay is ${MIN_NIGHTS} nights.`;
		// Walk every night in [from, to)
		let cur = v4From;
		while (cur < v4To) {
			if (!isFreeISO(cur)) {
				return `The night of ${fmtShort(cur)} isn't available.`;
			}
			cur = toISO(addDays(fromISO(cur), 1));
		}
		return '';
	});
	const v4Valid = $derived(!!v4From && !!v4To && !v4Error);
	function v4Confirm() {
		if (!v4Valid) return;
		commit(v4From, v4To, 'V4 — Date fields + strip');
	}
	const horizonDates: string[] = (() => {
		const out: string[] = [];
		for (let i = 0; i < HORIZON_DAYS; i++) out.push(toISO(addDays(TODAY, i)));
		return out;
	})();
	const minDateAttr = toISO(TODAY);
	const maxDateAttr = toISO(addDays(TODAY, HORIZON_DAYS));

	// === V5: Length-then-when ===
	let v5Nights = $state(MIN_NIGHTS);
	let v5Month = $state(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
	function v5IsValidStart(iso: string): boolean {
		return canStartStay(iso, v5Nights);
	}
	function v5Pick(startISO: string) {
		const endISO = toISO(addDays(fromISO(startISO), v5Nights));
		commit(startISO, endISO, `V5 — Length-then-when (${v5Nights} nights)`);
	}

	// === V6: Snap-bar (owner's idea) ===
	let v6Nights = $state(MIN_NIGHTS);
	let v6Month = $state(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
	let v6Hover = $state<string | null>(null);
	function v6Fits(startISO: string, n: number): boolean {
		// Bar fits if all n cells under the bar (starting at startISO) are
		// free. Same rule as canStartStay — the cell *after* the bar can be
		// any state (we leave that morning). What changes vs V5: the
		// emphasis is the bar visual, not just highlighting valid start
		// cells.
		return canStartStay(startISO, n);
	}
	function v6BarCells(startISO: string, n: number): string[] {
		const cells: string[] = [];
		for (let i = 0; i < n; i++) {
			cells.push(toISO(addDays(fromISO(startISO), i)));
		}
		return cells;
	}
	function v6Pick(startISO: string) {
		if (!v6Fits(startISO, v6Nights)) return;
		const endISO = toISO(addDays(fromISO(startISO), v6Nights));
		commit(startISO, endISO, `V6 — Snap-bar (${v6Nights} nights)`);
	}

	// Calendar grid helper — produces the dates for a given month, padded
	// to whole weeks. Reused by V3, V5, V6 so all three render the same
	// grid layout.
	function monthGrid(monthDate: Date): { iso: string; outside: boolean }[] {
		const y = monthDate.getFullYear();
		const m = monthDate.getMonth();
		const firstWeekday = new Date(y, m, 1).getDay(); // Sun = 0
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const result: { iso: string; outside: boolean }[] = [];
		// Lead pad
		for (let i = firstWeekday; i > 0; i--) {
			result.push({ iso: toISO(new Date(y, m, 1 - i)), outside: true });
		}
		// In-month
		for (let d = 1; d <= daysInMonth; d++) {
			result.push({ iso: toISO(new Date(y, m, d)), outside: false });
		}
		// Trailing pad
		while (result.length % 7 !== 0) {
			const last = fromISO(result[result.length - 1].iso);
			result.push({ iso: toISO(addDays(last, 1)), outside: true });
		}
		return result;
	}
	function monthLabel(d: Date): string {
		return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
	}
	function shiftMonth(current: Date, delta: number): Date {
		return new Date(current.getFullYear(), current.getMonth() + delta, 1);
	}
</script>

<svelte:head>
	<title>Booking selection prototypes — Marianne Cottage</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
	<header class="intro">
		<h1>Booking selection prototypes</h1>
		<p class="lede">
			Six ways to pick dates for the cottage. All variants share the same mock availability
			(real-feeling mix of bookings and gaps). Click around — none of these commit a real
			booking. <strong>"Today" is pinned to {fmtLong(toISO(TODAY))}</strong> so the scenarios are
			stable across visits.
		</p>

		<div class="mock-bookings">
			<h2>Mock bookings used by every variant</h2>
			<ul>
				{#each mockBookings as b}
					<li>
						<span class="b-label">{b.label}</span> — check-in {fmtShort(b.from)}, check-out {fmtShort(
							b.to
						)} <span class="b-nights">({nightsBetween(b.from, b.to)} nights)</span>
					</li>
				{/each}
			</ul>
			<p class="hint">
				Notable cases this exercises: 11 May is an <em>orphan</em> (free, but trapped — no
				2-night run possible). 18 May is a <em>same-day turnover</em> (Booking H out / Booking I
				in). 14 May → 16 May is a tight 2-night gap.
			</p>
		</div>

		<div class="result" class:active={currentSelection !== null}>
			<h2>Current selection</h2>
			{#if currentSelection}
				<p class="result-line">
					<strong>{fmtLong(currentSelection.from)} → {fmtLong(currentSelection.to)}</strong>
					<span class="result-nights">{currentSelection.nights} nights</span>
				</p>
				<p class="result-source">via {currentSelection.source}</p>
				<button onclick={resetSelection} class="reset-btn">Clear selection</button>
			{:else}
				<p class="result-empty">Pick dates in any variant below to see the result here.</p>
			{/if}
		</div>

		<nav class="anchors" aria-label="Variant nav">
			<a href="#v1">1. Current calendar</a>
			<a href="#v2">2. Available windows</a>
			<a href="#v3">3. Two-step</a>
			<a href="#v4">4. Date fields + strip</a>
			<a href="#v5">5. Length-first</a>
			<a href="#v6">6. Snap-bar</a>
		</nav>
	</header>

	<!-- =========================================================== -->
	<!-- V1 — Current calendar baseline -->
	<!-- =========================================================== -->
	<section id="v1" class="variant">
		<h2 class="v-title">1 · Current calendar (baseline)</h2>
		<p class="v-desc">
			What we have today. Range-pick on a month grid; checkout-only days half-shaded; orphan
			days striped. Included so you can A/B against the alternatives below.
		</p>
		<div class="v-stage">
			<BookingCalendar
				messages={enMessages}
				lang="en"
				availability={v1Availability}
				checkoutOnlyDates={v1CheckoutOnly}
				onDateRangeSelect={v1Pick}
				minDate={TODAY}
				minNights={MIN_NIGHTS}
				disablePastMonths
			/>
		</div>
	</section>

	<!-- =========================================================== -->
	<!-- V2 — Available windows list -->
	<!-- =========================================================== -->
	<section id="v2" class="variant">
		<h2 class="v-title">2 · Available windows list</h2>
		<p class="v-desc">
			Pre-computed list of every bookable run of {MIN_NIGHTS}+ nights. Click a card to book the
			full window in one tap, or "Shorten" to pick a sub-range. <strong>Strength:</strong> zero
			ambiguity, zero dead-ends, easiest to scan for "when can I come?".
		</p>
		<div class="v-stage">
			<div class="windows">
				{#each allWindows as w, idx}
					<div class="window-card" class:expanded={v2ExpandedIdx === idx}>
						<div class="window-summary">
							<div class="window-dates">
								<strong>{fmtShort(w.from)} → {fmtShort(w.to)}</strong>
								<span class="window-nights">{w.nights} nights available</span>
							</div>
							<div class="window-actions">
								<button class="btn" onclick={() => v2CommitWindow(idx)}>Book all {w.nights}</button>
								<button class="btn-outline" onclick={() => (v2ExpandedIdx === idx ? v2Close() : v2Open(idx))}>
									{v2ExpandedIdx === idx ? 'Cancel' : 'Shorten…'}
								</button>
							</div>
						</div>
						{#if v2ExpandedIdx === idx}
							<div class="window-refine">
								<div class="refine-fields">
									<label>
										Check-in
										<input
											type="date"
											bind:value={v2RefineFrom}
											min={w.from}
											max={toISO(addDays(fromISO(w.to), -MIN_NIGHTS))}
										/>
									</label>
									<label>
										Check-out
										<input
											type="date"
											bind:value={v2RefineTo}
											min={toISO(addDays(fromISO(v2RefineFrom || w.from), MIN_NIGHTS))}
											max={w.to}
										/>
									</label>
								</div>
								<button class="btn" onclick={v2CommitRefined}>Confirm shortened range</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- =========================================================== -->
	<!-- V3 — Two-step arrival → departure -->
	<!-- =========================================================== -->
	<section id="v3" class="variant">
		<h2 class="v-title">3 · Two-step (arrival → departure)</h2>
		<p class="v-desc">
			Calendar 1 only highlights valid arrivals (dates with ≥ {MIN_NIGHTS} free nights starting
			there). Pick one, then calendar 2 only highlights valid departures given that arrival.
			<strong>Strength:</strong> matches how a phone call goes — when do you want to arrive? When
			to leave? No invalid-range states ever shown.
		</p>
		<div class="v-stage">
			<div class="step-banner">
				<span class:active={v3Step === 1}>Step 1 · Pick arrival</span>
				<span class="sep">→</span>
				<span class:active={v3Step === 2}>Step 2 · Pick departure</span>
				{#if v3Step === 2}
					<button class="step-back" onclick={v3Back}>← Back</button>
				{/if}
			</div>
			<div class="cal-nav">
				<button class="nav-btn" onclick={() => (v3Month = shiftMonth(v3Month, -1))}>‹</button>
				<span class="cal-month">{monthLabel(v3Month)}</span>
				<button class="nav-btn" onclick={() => (v3Month = shiftMonth(v3Month, 1))}>›</button>
			</div>
			<div class="grid">
				{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as d}
					<div class="grid-head">{d}</div>
				{/each}
				{#each monthGrid(v3Month) as cell}
					{@const valid = v3Step === 1 ? v3IsValidArrival(cell.iso) : v3IsValidDeparture(cell.iso)}
					{@const isPast = cell.iso < toISO(TODAY)}
					{@const isArrival = v3Step === 2 && cell.iso === v3Arrival}
					<button
						class="cell"
						class:outside={cell.outside}
						class:disabled={!valid || isPast}
						class:valid
						class:arrival={isArrival}
						disabled={!valid || isPast}
						onclick={() =>
							v3Step === 1 ? v3PickArrival(cell.iso) : v3PickDeparture(cell.iso)}
					>
						{fromISO(cell.iso).getDate()}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- =========================================================== -->
	<!-- V4 — Date fields + availability strip -->
	<!-- =========================================================== -->
	<section id="v4" class="variant">
		<h2 class="v-title">4 · Date fields + availability strip</h2>
		<p class="v-desc">
			Native date inputs (work great with screen readers and keyboards) plus a 90-day
			horizontal strip below for at-a-glance availability scanning.
			<strong>Strength:</strong> most accessible; familiar pattern from airline sites.
		</p>
		<div class="v-stage">
			<div class="date-row">
				<label>
					Check-in
					<input
						type="date"
						bind:value={v4From}
						min={minDateAttr}
						max={maxDateAttr}
					/>
				</label>
				<label>
					Check-out
					<input
						type="date"
						bind:value={v4To}
						min={v4From || minDateAttr}
						max={maxDateAttr}
					/>
				</label>
				<button class="btn" disabled={!v4Valid} onclick={v4Confirm}>Confirm</button>
			</div>
			{#if v4Error}
				<p class="error">{v4Error}</p>
			{/if}
			<div class="strip-wrap">
				<div class="strip">
					{#each horizonDates as iso}
						{@const st = getState(iso)}
						<button
							class="strip-cell"
							class:strip-free={st === 'free'}
							class:strip-booked={st === 'booked'}
							class:strip-checkout={st === 'checkout-only'}
							onclick={() => {
								if (!v4From) v4From = iso;
								else if (!v4To && iso > v4From) v4To = iso;
								else {
									v4From = iso;
									v4To = '';
								}
							}}
							title={`${fmtShort(iso)} — ${st}`}
						>
						</button>
					{/each}
				</div>
				<div class="strip-legend">
					<span><i class="dot strip-free"></i> Free</span>
					<span><i class="dot strip-checkout"></i> Check-out morning only</span>
					<span><i class="dot strip-booked"></i> Booked</span>
				</div>
			</div>
		</div>
	</section>

	<!-- =========================================================== -->
	<!-- V5 — Length-then-when -->
	<!-- =========================================================== -->
	<section id="v5" class="variant">
		<h2 class="v-title">5 · Length-then-when</h2>
		<p class="v-desc">
			Pick the number of nights first, then the calendar lights up only the days where a stay
			of that length will fit. Single click commits.
			<strong>Strength:</strong> reduces the decision space dramatically — guests with a fixed
			length of stay just see "click any green dot".
		</p>
		<div class="v-stage">
			<div class="stepper-row">
				<span>How many nights?</span>
				<div class="stepper">
					<button onclick={() => (v5Nights = Math.max(MIN_NIGHTS, v5Nights - 1))}>−</button>
					<span class="stepper-val">{v5Nights}</span>
					<button onclick={() => (v5Nights = Math.min(14, v5Nights + 1))}>+</button>
				</div>
			</div>
			<div class="cal-nav">
				<button class="nav-btn" onclick={() => (v5Month = shiftMonth(v5Month, -1))}>‹</button>
				<span class="cal-month">{monthLabel(v5Month)}</span>
				<button class="nav-btn" onclick={() => (v5Month = shiftMonth(v5Month, 1))}>›</button>
			</div>
			<div class="grid">
				{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as d}
					<div class="grid-head">{d}</div>
				{/each}
				{#each monthGrid(v5Month) as cell}
					{@const valid = v5IsValidStart(cell.iso)}
					{@const isPast = cell.iso < toISO(TODAY)}
					<button
						class="cell"
						class:outside={cell.outside}
						class:disabled={!valid || isPast}
						class:valid
						disabled={!valid || isPast}
						onclick={() => v5Pick(cell.iso)}
					>
						{fromISO(cell.iso).getDate()}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- =========================================================== -->
	<!-- V6 — Snap-bar (owner's idea) -->
	<!-- =========================================================== -->
	<section id="v6" class="variant">
		<h2 class="v-title">6 · Snap-bar</h2>
		<p class="v-desc">
			Pick the number of nights, then a tactile bar of that many cells follows the cursor across
			the grid. Green when the bar fits a free run; faded when it doesn't. Click commits.
			<strong>Strength:</strong> makes the "2 nights looks like <em>this</em>" constraint visible
			and physical — closest to the Tetris-style intuition you described.
		</p>
		<div class="v-stage">
			<div class="stepper-row">
				<span>How many nights?</span>
				<div class="stepper">
					<button onclick={() => (v6Nights = Math.max(MIN_NIGHTS, v6Nights - 1))}>−</button>
					<span class="stepper-val">{v6Nights}</span>
					<button onclick={() => (v6Nights = Math.min(14, v6Nights + 1))}>+</button>
				</div>
			</div>
			<div class="cal-nav">
				<button class="nav-btn" onclick={() => (v6Month = shiftMonth(v6Month, -1))}>‹</button>
				<span class="cal-month">{monthLabel(v6Month)}</span>
				<button class="nav-btn" onclick={() => (v6Month = shiftMonth(v6Month, 1))}>›</button>
			</div>
			<div
				class="grid"
				onmouseleave={() => (v6Hover = null)}
			>
				{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as d}
					<div class="grid-head">{d}</div>
				{/each}
				{#each monthGrid(v6Month) as cell}
					{@const isPast = cell.iso < toISO(TODAY)}
					{@const st = getState(cell.iso)}
					{@const inBar = v6Hover !== null && v6BarCells(v6Hover, v6Nights).includes(cell.iso)}
					{@const barFits = v6Hover !== null && v6Fits(v6Hover, v6Nights)}
					<button
						class="cell snap-cell"
						class:outside={cell.outside}
						class:past={isPast}
						class:state-free={st === 'free'}
						class:state-booked={st === 'booked'}
						class:state-checkout={st === 'checkout-only'}
						class:bar-fits={inBar && barFits}
						class:bar-misses={inBar && !barFits}
						disabled={isPast}
						onmouseenter={() => (v6Hover = cell.iso)}
						onfocus={() => (v6Hover = cell.iso)}
						onclick={() => v6Pick(cell.iso)}
					>
						{fromISO(cell.iso).getDate()}
					</button>
				{/each}
			</div>
			<p class="snap-hint">
				Hover any cell to position the {v6Nights}-night bar. Cells turn green when the bar
				fits, soft red when it overlaps a booking. The day after the bar is your check-out
				morning — same-day turnover with an existing check-in is fine.
			</p>
		</div>
	</section>
</div>

<style>
	.page { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 6rem; font-family: 'Source Sans 3', system-ui, sans-serif; color: var(--color-text, #2b2b2b); }
	h1 { font-family: 'Lora', serif; font-size: 2.25rem; font-weight: 600; margin: 0 0 0.5rem; }
	h2 { font-family: 'Lora', serif; font-weight: 600; margin: 0 0 0.5rem; }
	.lede { font-size: 1rem; line-height: 1.55; color: var(--color-text-muted, #555); max-width: 70ch; }

	.mock-bookings { margin: 1.5rem 0; padding: 1rem 1.25rem; background: var(--color-cream, #f5f0e6); border-radius: 12px; }
	.mock-bookings h2 { font-size: 1rem; margin: 0 0 0.5rem; }
	.mock-bookings ul { margin: 0; padding-left: 1.2rem; font-size: 0.875rem; line-height: 1.6; }
	.mock-bookings .b-label { font-weight: 600; }
	.mock-bookings .b-nights { color: var(--color-text-muted, #777); }
	.mock-bookings .hint { font-size: 0.85rem; color: var(--color-text-muted, #555); margin: 0.75rem 0 0; }

	.result {
		margin: 1.5rem 0;
		padding: 1.25rem;
		background: var(--md-sys-color-surface-container-lowest, #fff);
		border: 1px dashed var(--color-cream-dark, #d8ccb6);
		border-radius: 12px;
		transition: border-color 0.2s, background 0.2s;
	}
	.result.active { border-style: solid; border-color: var(--color-sage, #7a8a6f); background: color-mix(in srgb, var(--color-sage, #7a8a6f) 6%, white); }
	.result h2 { font-size: 1rem; margin: 0 0 0.5rem; }
	.result-line { margin: 0; font-size: 1.05rem; }
	.result-nights { margin-left: 0.5rem; padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--color-sage, #7a8a6f); color: white; font-size: 0.8rem; font-weight: 600; }
	.result-source { margin: 0.4rem 0 0.75rem; font-size: 0.8rem; color: var(--color-text-muted, #777); }
	.result-empty { margin: 0; font-size: 0.875rem; color: var(--color-text-muted, #777); }
	.reset-btn { background: transparent; border: 1px solid var(--color-cream-dark, #d8ccb6); padding: 0.4rem 0.85rem; border-radius: 999px; font-size: 0.8rem; cursor: pointer; }

	.anchors { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1.5rem 0 0; padding: 0.75rem 0; border-top: 1px solid var(--color-cream-dark, #d8ccb6); border-bottom: 1px solid var(--color-cream-dark, #d8ccb6); position: sticky; top: 0; background: white; z-index: 10; }
	.anchors a { padding: 0.3rem 0.7rem; font-size: 0.85rem; border-radius: 999px; background: var(--color-cream, #f5f0e6); color: var(--color-text, #2b2b2b); text-decoration: none; }
	.anchors a:hover { background: var(--color-cream-dark, #d8ccb6); }

	.variant { padding: 2.5rem 0 1rem; border-bottom: 1px solid var(--color-cream-dark, #d8ccb6); }
	.variant:last-of-type { border-bottom: none; }
	.v-title { font-size: 1.4rem; margin: 0 0 0.5rem; }
	.v-desc { margin: 0 0 1.25rem; font-size: 0.92rem; line-height: 1.55; color: var(--color-text-muted, #555); max-width: 75ch; }
	.v-stage { padding: 1rem; background: white; border: 1px solid var(--color-cream-dark, #d8ccb6); border-radius: 12px; }

	/* === Common calendar grid (V3, V5, V6) === */
	.cal-nav { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0 1rem; }
	.cal-month { font-family: 'Lora', serif; font-weight: 600; font-size: 1.1rem; }
	.nav-btn { width: 2.25rem; height: 2.25rem; border-radius: 50%; border: none; background: var(--color-cream, #f5f0e6); cursor: pointer; font-size: 1.1rem; }
	.nav-btn:hover { background: var(--color-cream-dark, #d8ccb6); }
	.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
	.grid-head { text-align: center; font-size: 0.7rem; font-weight: 600; color: var(--color-text-muted, #777); text-transform: uppercase; padding: 0.4rem 0; }
	.cell { aspect-ratio: 1; min-height: 42px; border-radius: 50%; border: none; background: var(--md-sys-color-surface-container-lowest, #fff); color: var(--color-text, #2b2b2b); cursor: pointer; font-size: 0.95rem; font-weight: 500; transition: background 0.12s, transform 0.06s; }
	.cell:hover:not(:disabled) { background: var(--color-cream, #f5f0e6); }
	.cell.outside { opacity: 0.45; }
	.cell.disabled, .cell:disabled { cursor: default; opacity: 0.25; background: transparent; }
	.cell.valid { background: color-mix(in srgb, var(--color-sage, #7a8a6f) 25%, white); }
	.cell.valid:hover { background: var(--color-sage, #7a8a6f); color: white; }
	.cell.arrival { background: var(--color-sage, #7a8a6f); color: white; box-shadow: 0 2px 6px color-mix(in srgb, var(--color-sage, #7a8a6f) 40%, transparent); }

	.step-banner { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--color-text-muted, #777); }
	.step-banner .active { color: var(--color-sage, #7a8a6f); font-weight: 600; }
	.step-banner .sep { opacity: 0.4; }
	.step-back { margin-left: auto; background: transparent; border: 1px solid var(--color-cream-dark, #d8ccb6); padding: 0.3rem 0.7rem; border-radius: 999px; font-size: 0.8rem; cursor: pointer; }

	/* === V2 windows === */
	.windows { display: grid; gap: 0.75rem; grid-template-columns: 1fr; }
	@media (min-width: 700px) { .windows { grid-template-columns: 1fr 1fr; } }
	.window-card { padding: 1rem 1.1rem; border: 1px solid var(--color-cream-dark, #d8ccb6); border-radius: 12px; background: white; transition: border-color 0.15s, box-shadow 0.15s; }
	.window-card.expanded { border-color: var(--color-sage, #7a8a6f); box-shadow: 0 4px 14px color-mix(in srgb, var(--color-sage, #7a8a6f) 14%, transparent); }
	.window-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	.window-dates strong { font-size: 1.05rem; }
	.window-nights { display: block; font-size: 0.82rem; color: var(--color-text-muted, #777); }
	.window-actions { display: flex; gap: 0.5rem; }
	.btn { background: var(--color-sage, #7a8a6f); color: white; border: none; padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
	.btn:disabled { opacity: 0.45; cursor: default; }
	.btn-outline { background: transparent; color: var(--color-sage, #7a8a6f); border: 1px solid var(--color-sage, #7a8a6f); padding: 0.5rem 1rem; border-radius: 999px; font-size: 0.85rem; cursor: pointer; }
	.window-refine { margin-top: 0.85rem; padding-top: 0.85rem; border-top: 1px dashed var(--color-cream-dark, #d8ccb6); }
	.refine-fields { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
	.refine-fields label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.82rem; }
	.refine-fields input { padding: 0.45rem; border: 1px solid var(--color-cream-dark, #d8ccb6); border-radius: 6px; font-size: 0.9rem; }

	/* === V4 strip === */
	.date-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; margin-bottom: 0.75rem; }
	.date-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.85rem; }
	.date-row input { padding: 0.55rem 0.75rem; border: 1px solid var(--color-cream-dark, #d8ccb6); border-radius: 8px; font-size: 0.95rem; }
	.error { margin: 0.25rem 0 0.75rem; padding: 0.5rem 0.75rem; background: color-mix(in srgb, #b43c3c 12%, transparent); color: #842525; border-radius: 6px; font-size: 0.85rem; }
	.strip-wrap { margin-top: 1rem; }
	.strip { display: grid; grid-template-columns: repeat(45, 1fr); gap: 2px; }
	.strip-cell { aspect-ratio: 1; min-height: 14px; border-radius: 3px; border: none; cursor: pointer; padding: 0; }
	.strip-cell.strip-free { background: color-mix(in srgb, var(--color-sage, #7a8a6f) 28%, white); }
	.strip-cell.strip-free:hover { background: var(--color-sage, #7a8a6f); }
	.strip-cell.strip-booked { background: color-mix(in srgb, #b43c3c 22%, white); cursor: default; }
	.strip-cell.strip-checkout { background: linear-gradient(90deg, color-mix(in srgb, var(--color-sage, #7a8a6f) 28%, white) 0 50%, color-mix(in srgb, #b43c3c 22%, white) 50% 100%); }
	.strip-legend { display: flex; gap: 1rem; margin-top: 0.6rem; font-size: 0.75rem; color: var(--color-text-muted, #777); }
	.strip-legend .dot { display: inline-block; width: 0.85rem; height: 0.85rem; border-radius: 3px; vertical-align: -2px; margin-right: 0.3rem; }
	.strip-legend .dot.strip-free { background: color-mix(in srgb, var(--color-sage, #7a8a6f) 28%, white); }
	.strip-legend .dot.strip-booked { background: color-mix(in srgb, #b43c3c 22%, white); }
	.strip-legend .dot.strip-checkout { background: linear-gradient(90deg, color-mix(in srgb, var(--color-sage, #7a8a6f) 28%, white) 0 50%, color-mix(in srgb, #b43c3c 22%, white) 50% 100%); }

	/* === Stepper (V5, V6) === */
	.stepper-row { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem; font-size: 0.95rem; }
	.stepper { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.4rem; border: 1px solid var(--color-cream-dark, #d8ccb6); border-radius: 999px; }
	.stepper button { width: 1.85rem; height: 1.85rem; border-radius: 50%; border: none; background: var(--color-cream, #f5f0e6); cursor: pointer; font-size: 1.1rem; line-height: 1; }
	.stepper button:hover { background: var(--color-cream-dark, #d8ccb6); }
	.stepper-val { min-width: 1.3rem; text-align: center; font-weight: 700; }

	/* === V6 snap-bar === */
	.snap-cell { background: var(--md-sys-color-surface-container-lowest, #fff); }
	.snap-cell.state-free { background: var(--md-sys-color-surface-container-lowest, #fff); }
	.snap-cell.state-booked { background: color-mix(in srgb, #b43c3c 18%, white); color: #842525; opacity: 0.85; cursor: default; }
	.snap-cell.state-checkout { background: linear-gradient(90deg, var(--md-sys-color-surface-container-lowest, #fff) 0 50%, color-mix(in srgb, var(--color-sage, #7a8a6f) 35%, white) 50% 100%); }
	.snap-cell.past { opacity: 0.25; cursor: default; }
	.snap-cell.bar-fits { background: var(--color-sage, #7a8a6f) !important; color: white !important; transform: scale(1.04); box-shadow: 0 2px 8px color-mix(in srgb, var(--color-sage, #7a8a6f) 35%, transparent); }
	.snap-cell.bar-misses { background: color-mix(in srgb, #b43c3c 35%, white) !important; color: #5c1818 !important; }
	.snap-hint { margin: 0.85rem 0 0; font-size: 0.85rem; color: var(--color-text-muted, #777); line-height: 1.5; }
</style>
