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
//
// Season model (2026-05-07): a date is bookable iff it falls inside at
// least one active season. Gaps between seasons = closed (the cottage's
// yearly Nov–Mar shutdown is expressed as an absence of seasons there,
// not an explicit "closed" record). On overlap (e.g. Ascension Weekend
// Peak overlay on top of High Season), smallest-span wins — supports
// both premium AND discount overlays without a priority field.

import type { Season } from '$lib/server/supabase';

export interface BookingWindow {
	from: string;
	to: string;
	nights: number;
	/**
	 * Floor price for advertising — 1-guest nightly × minNights. This is
	 * the absolute minimum a guest could pay if they took the shortest
	 * possible stay in this window with one person. The card shows
	 * "From €X" using this; the actual total adjusts up as the guest
	 * picks a longer stay or larger party. Null if no season covers.
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
	/** Active seasons, used to (a) gate which dates are bookable and
	 *  (b) price each window. */
	seasons: Season[];
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

// Smallest-span wins on overlap; tie-break newest created_at.
export function findSeason(seasons: Season[], dateISO: string): Season | null {
	const matches = seasons.filter(
		(s) => s.is_active && s.start_date <= dateISO && s.end_date >= dateISO
	);
	if (matches.length === 0) return null;
	const span = (s: Season) =>
		new Date(s.end_date).getTime() - new Date(s.start_date).getTime();
	matches.sort((a, b) => {
		const ds = span(a) - span(b);
		if (ds !== 0) return ds;
		return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
	});
	return matches[0];
}

export function computeBookableWindows(input: WindowsInput): BookingWindow[] {
	const {
		availability,
		checkoutOnlyDates,
		seasons,
		earliestCheckIn,
		latestCheckIn,
		minNights
	} = input;

	const checkoutSet = new Set(checkoutOnlyDates);
	// A date is "free" for windowing iff:
	//   - not blocked in availability,
	//   - not the check-in of an existing booking (those are checkout-only),
	//   - AND covered by at least one active season (gap = closed).
	const isFree = (iso: string) =>
		availability[iso] !== false &&
		!checkoutSet.has(iso) &&
		findSeason(seasons, iso) !== null;

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
			const season = findSeason(seasons, fromISO);
			const nightly = season ? Number(season.rate_per_night) : null;
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
