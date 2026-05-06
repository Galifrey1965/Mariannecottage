// Booking policy constants — enforced symmetrically on the client (the
// /book calendar UI) and on the server (POST /api/book). Hardcoded for
// now; if Mark ever wants to tune these from the admin without a code
// push we'd lift them into a `booking_policy` settings row and read at
// load time, mirroring the tax_settings pattern.

/** Minimum stay in nights — 1-night stays not allowed. */
export const MIN_NIGHTS = 2;

/** Minimum lead time in hours between "now" and check-in. */
export const MIN_LEAD_HOURS = 48;

/**
 * The earliest acceptable check-in date given a "now" reference.
 *
 * Translates the lead-time hours into a whole-day floor so the rule
 * works against our date-only check-in field. Worst-case interpretation:
 * a guest who books today might in principle arrive at 00:00 on the
 * check-in date, so we add `ceil(MIN_LEAD_HOURS / 24)` whole days to the
 * start of today. With the 48h policy this means "today + 2 days":
 *
 *   booked Mon 10:00 → earliest check-in Wed (≈48h later)
 *   booked Mon 23:59 → earliest check-in Wed (still ≈48h, since worst-
 *                      case Wed 00:00 is only 1 minute under but the
 *                      rule's spirit is "two clear days notice")
 *
 * This is a slightly conservative read of "48 hours" and matches how
 * holiday-cottage availability rules are usually phrased.
 */
export function getEarliestCheckInDate(now: Date = new Date()): Date {
	const daysAhead = Math.ceil(MIN_LEAD_HOURS / 24);
	// Anchor in UTC so the result is identical regardless of the runtime
	// timezone (server-side this is typically already UTC; local dev or
	// CI on a non-UTC host would otherwise produce a ±1 day swing).
	const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	d.setUTCDate(d.getUTCDate() + daysAhead);
	return d;
}

/** Whole-night count between two check-in/-out dates. */
export function nightsBetween(checkInISO: string, checkOutISO: string): number {
	const inMs = new Date(checkInISO + 'T00:00:00Z').getTime();
	const outMs = new Date(checkOutISO + 'T00:00:00Z').getTime();
	return Math.round((outMs - inMs) / (1000 * 60 * 60 * 24));
}

/**
 * Whether two bookings — each [check-in, check-out) — actually conflict.
 *
 * Half-open intervals are intentional: the check-out morning and the next
 * guest's check-in afternoon share a calendar date but never the cottage,
 * so [10, 13) and [13, 16) are *not* a conflict (industry-standard same-
 * day turnover). Mirrors the `date >= check_in AND date < check_out`
 * guard inside `book_dates_atomic`, kept in sync so client-side previews
 * agree with the server's accept/reject decision.
 */
export function rangesOverlap(
	aCheckInISO: string,
	aCheckOutISO: string,
	bCheckInISO: string,
	bCheckOutISO: string
): boolean {
	return aCheckInISO < bCheckOutISO && bCheckInISO < aCheckOutISO;
}
