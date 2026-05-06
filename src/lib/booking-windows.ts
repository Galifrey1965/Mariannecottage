// Compute the list of bookable date windows from raw availability + check-in
// data. A "window" is a contiguous run of free nights ≥ minNights, with a
// valid check-out morning at the end (either past the horizon, or the
// check-in date of an existing booking — same-day turnover).
//
// The shape mirrors what the public /book page needs to render: each window
// has a from/to ISO pair, night count, and an optional pre-computed price
// floor (cheapest guest tier × nights) so cards can render "from €X" without
// further round-trips. Pure / no Supabase coupling so it's unit-testable
// and reusable from a future homepage teaser.

import type { RatePlan } from '$lib/server/supabase';

export interface BookingWindow {
	from: string;
	to: string;
	nights: number;
	/**
	 * Floor price for advertising — 1-guest nightly × minNights. This is
	 * the absolute minimum a guest could pay if they took the shortest
	 * possible stay in this window with one person. The card shows
	 * "From €X" using this; the actual total adjusts up as the guest
	 * picks a longer stay or larger party. Null if no rate plan covers.
	 */
	floorPrice: number | null;
	/**
	 * Per-night rate for the cheapest guest tier (1 guest) — same source
	 * as floorPrice. Lets the refine UI compute live totals as the guest
	 * shortens the range.
	 */
	nightlyFromPrice: number | null;
}

export interface WindowsInput {
	/** Map of ISO-date → available (true/false). Missing keys default to true. */
	availability: Record<string, boolean>;
	/** ISO check-in dates of active bookings — same set surfaced as
	 *  `checkoutOnlyDates` to the calendar. */
	checkoutOnlyDates: string[];
	/** Active rate plans, used to price each window. */
	ratePlans: RatePlan[];
	/** Earliest selectable check-in date (= getEarliestCheckInDate()). */
	earliestCheckIn: Date;
	/** Latest selectable check-in date. */
	latestCheckIn: Date;
	/** Minimum nights per stay. */
	minNights: number;
}

function toISODate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
	const out = new Date(d);
	out.setDate(out.getDate() + n);
	return out;
}

function nightsBetween(aISO: string, bISO: string): number {
	const a = new Date(aISO + 'T00:00:00Z').getTime();
	const b = new Date(bISO + 'T00:00:00Z').getTime();
	return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function findRatePlan(plans: RatePlan[], dateISO: string): RatePlan | null {
	const matches = plans.filter(
		(p) => p.is_active && p.valid_from <= dateISO && p.valid_until >= dateISO
	);
	if (matches.length === 0) return null;
	// Highest rate wins on overlap — same tie-break as /book/+page.svelte.
	matches.sort((a, b) => Number(b.rate_per_night) - Number(a.rate_per_night));
	return matches[0];
}

export function computeBookableWindows(input: WindowsInput): BookingWindow[] {
	const {
		availability,
		checkoutOnlyDates,
		ratePlans,
		earliestCheckIn,
		latestCheckIn,
		minNights
	} = input;

	const checkoutSet = new Set(checkoutOnlyDates);
	const isFree = (iso: string) =>
		availability[iso] !== false && !checkoutSet.has(iso);

	const out: BookingWindow[] = [];

	// Walk one day at a time, building maximal runs of free days. The first
	// non-free day after a run is the window's check-out morning — that day
	// must itself be `checkout-only` (next booking's check-in) or past the
	// last selectable date for the run to count, otherwise our checkout
	// would land on a date someone else is occupying.
	let cursor = new Date(earliestCheckIn);
	const horizonExclusive = addDays(latestCheckIn, 1);

	while (cursor < horizonExclusive) {
		const cursorISO = toISODate(cursor);
		if (!isFree(cursorISO)) {
			cursor = addDays(cursor, 1);
			continue;
		}

		// Found the start of a free run — extend it.
		const runStart = new Date(cursor);
		while (cursor < horizonExclusive && isFree(toISODate(cursor))) {
			cursor = addDays(cursor, 1);
		}
		// `cursor` now points at the first non-free day after the run, or
		// past the horizon. Either way, that's our checkout morning.
		const checkoutISO = toISODate(cursor);
		const fromISO = toISODate(runStart);
		const nights = nightsBetween(fromISO, checkoutISO);

		if (nights >= minNights) {
			const plan = findRatePlan(ratePlans, fromISO);
			const nightly = plan ? Number(plan.rate_per_night) : null;
			out.push({
				from: fromISO,
				to: checkoutISO,
				nights,
				nightlyFromPrice: nightly,
				floorPrice: nightly !== null ? Math.round(nightly * minNights * 100) / 100 : null
			});
		}
	}

	return out;
}
