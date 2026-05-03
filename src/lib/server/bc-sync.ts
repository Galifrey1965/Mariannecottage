// S-01: pure helpers for Booking.com availability sync.
//
// `diffBcAvailability` produces the upsert/free lists needed to keep the
// `availability` table aligned with the latest iCal feed:
//   - dates currently in the BC feed → upsert as available=false (block)
//   - rows previously blocked by BC but no longer in the feed → set available=true
//     (stale block clearing — fixes S-01)
//   - manually-set rows (synced_from='manual') are never touched

export interface BcAvailabilityRow {
	date: string;
	available: boolean;
}

export interface BcSyncDiff {
	toBlock: string[];
	toFree: string[];
}

export function diffBcAvailability(
	currentBlocked: string[],
	existingBcRows: BcAvailabilityRow[],
	todayISO: string
): BcSyncDiff {
	const blockedSet = new Set<string>();
	for (const d of currentBlocked) {
		if (d >= todayISO) blockedSet.add(d);
	}

	const toFree: string[] = [];
	for (const row of existingBcRows) {
		if (row.date < todayISO) continue;
		if (row.available) continue;
		if (blockedSet.has(row.date)) continue;
		toFree.push(row.date);
	}

	return {
		toBlock: [...blockedSet],
		toFree
	};
}

export function todayISO(now: Date = new Date()): string {
	return now.toISOString().slice(0, 10);
}
