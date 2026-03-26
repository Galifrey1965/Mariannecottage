export interface IcalEvent {
	start: string; // YYYY-MM-DD
	end: string;   // YYYY-MM-DD (exclusive)
}

/**
 * Parse an iCal (.ics) string and return VEVENT date ranges.
 * Supports both DATE and DATE-TIME DTSTART/DTEND formats.
 */
export function parseIcal(icsContent: string): IcalEvent[] {
	const events: IcalEvent[] = [];
	const lines = icsContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

	let inEvent = false;
	let start = '';
	let end = '';

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed === 'BEGIN:VEVENT') {
			inEvent = true;
			start = '';
			end = '';
		} else if (trimmed === 'END:VEVENT') {
			if (inEvent && start && end) {
				events.push({ start, end });
			}
			inEvent = false;
		} else if (inEvent) {
			if (trimmed.startsWith('DTSTART')) {
				start = extractDate(trimmed);
			} else if (trimmed.startsWith('DTEND')) {
				end = extractDate(trimmed);
			}
		}
	}

	return events;
}

/** Extract YYYY-MM-DD from a DTSTART/DTEND line value */
function extractDate(line: string): string {
	const value = line.split(':').slice(1).join(':').trim();
	// DATE format: YYYYMMDD
	if (/^\d{8}$/.test(value)) {
		return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
	}
	// DATE-TIME format: YYYYMMDDTHHMMSSZ
	if (/^\d{8}T\d{6}Z?$/.test(value)) {
		const d = value.slice(0, 8);
		return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
	}
	return value;
}

/**
 * Expand iCal events into a sorted, deduplicated list of blocked date strings.
 * End date is exclusive (iCal convention).
 */
export function getBlockedDates(events: IcalEvent[]): string[] {
	const set = new Set<string>();

	for (const event of events) {
		const current = new Date(event.start + 'T00:00:00Z');
		const endDate = new Date(event.end + 'T00:00:00Z');

		while (current < endDate) {
			set.add(current.toISOString().slice(0, 10));
			current.setUTCDate(current.getUTCDate() + 1);
		}
	}

	return Array.from(set).sort();
}
