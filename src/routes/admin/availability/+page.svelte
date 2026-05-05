<script lang="ts">
	import type { PageData } from './$types';
	import BookingCalendar, { type BookingDayInfo } from '$lib/components/BookingCalendar.svelte';
	import enMessages from '../../../../messages/en.json';

	let { data }: { data: PageData } = $props();

	type AvailabilityBooking = {
		id: string;
		check_in_date: string;
		check_out_date: string;
		status: string;
		source: string;
		guest_name: string | null;
		booking_reference: string | null;
	};
	type BlockedRow = { date: string; synced_from: string | null; synced_at: string | null };

	let bookings = $state<AvailabilityBooking[]>(data.bookings as AvailabilityBooking[]);
	const blockedAvailability: BlockedRow[] = (data.blockedAvailability ?? []) as BlockedRow[];

	let busy = $state(false);
	let lastError = $state<string | null>(null);
	let lastInfo = $state<string | null>(null);
	let tooltipText = $state<string | null>(null);

	function isNextDay(a: string, b: string): boolean {
		const da = new Date(a + 'T00:00:00Z');
		da.setUTCDate(da.getUTCDate() + 1);
		return da.toISOString().slice(0, 10) === b;
	}

	function rankStatus(s: string): number {
		if (s === 'confirmed') return 3;
		if (s === 'pending' || s === 'pending_payment') return 2;
		return 1;
	}

	const bookingByDate = $derived.by(() => {
		const out: Record<string, BookingDayInfo> = {};
		for (const b of bookings) {
			const start = new Date(b.check_in_date + 'T00:00:00Z');
			const end = new Date(b.check_out_date + 'T00:00:00Z');
			const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
			const d = new Date(start);
			let i = 0;
			while (d < end) {
				const iso = d.toISOString().slice(0, 10);
				const existing = out[iso];
				const position: BookingDayInfo['position'] =
					total === 1 ? 'single' : i === 0 ? 'first' : i === total - 1 ? 'last' : 'middle';
				if (!existing || rankStatus(b.status) > rankStatus(existing.status)) {
					out[iso] = { id: b.id, status: b.status, source: b.source, position };
				}
				d.setUTCDate(d.getUTCDate() + 1);
				i++;
			}
		}
		const taken = new Set(Object.keys(out));
		const sorted = blockedAvailability.map((r) => r.date).filter((d) => !taken.has(d)).sort();
		let runStart = -1;
		for (let i = 0; i <= sorted.length; i++) {
			const d = sorted[i];
			const prev = sorted[i - 1];
			const isBreak = i === sorted.length || (prev && !isNextDay(prev, d));
			if (isBreak && runStart >= 0) {
				const len = i - runStart;
				for (let j = 0; j < len; j++) {
					const date = sorted[runStart + j];
					const position: BookingDayInfo['position'] =
						len === 1 ? 'single' : j === 0 ? 'first' : j === len - 1 ? 'last' : 'middle';
					out[date] = { id: `imported:${date}`, status: 'confirmed', source: 'booking_com', position };
				}
				runStart = -1;
			}
			if (i < sorted.length && runStart < 0) runStart = i;
		}
		return out;
	});

	function findBookingById(id: string): AvailabilityBooking | undefined {
		return bookings.find((b) => b.id === id);
	}

	function formatDate(iso: string): string {
		return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	async function createBlock(dateISO: string) {
		busy = true;
		lastError = null;
		lastInfo = null;
		try {
			const res = await fetch('/api/admin/availability', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: dateISO })
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				lastError = payload?.error ?? `Failed to block ${dateISO}`;
				return;
			}
			bookings = [
				...bookings,
				{
					id: payload.id,
					check_in_date: dateISO,
					check_out_date: nextDayISO(dateISO),
					status: 'confirmed',
					source: 'admin_block',
					guest_name: 'Cottage blocked',
					booking_reference: payload.booking_reference ?? null
				}
			];
			lastInfo = `Blocked ${formatDate(dateISO)}.`;
		} finally {
			busy = false;
		}
	}

	async function deleteBlock(id: string, dateISO: string) {
		busy = true;
		lastError = null;
		lastInfo = null;
		try {
			const res = await fetch('/api/admin/availability', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				lastError = payload?.error ?? `Failed to remove block on ${dateISO}`;
				return;
			}
			bookings = bookings.filter((b) => b.id !== id);
			lastInfo = `Removed block on ${formatDate(dateISO)}.`;
		} finally {
			busy = false;
		}
	}

	function nextDayISO(iso: string): string {
		const d = new Date(iso + 'T00:00:00Z');
		d.setUTCDate(d.getUTCDate() + 1);
		return d.toISOString().slice(0, 10);
	}

	function handleDayClick(bookingId: string | null, date: Date) {
		if (busy) return;
		const iso = toLocalISO(date);
		tooltipText = null;
		if (!bookingId) {
			void createBlock(iso);
			return;
		}
		if (bookingId.startsWith('imported:')) {
			tooltipText = `${formatDate(iso)} — synced from Booking.com (manage on BC)`;
			return;
		}
		const booking = findBookingById(bookingId);
		if (!booking) return;
		if (booking.source === 'admin_block') {
			void deleteBlock(booking.id, iso);
			return;
		}
		const guest = booking.guest_name ?? 'Guest';
		tooltipText = `${guest} — ${formatDate(booking.check_in_date)} → ${formatDate(booking.check_out_date)} (${booking.source})`;
	}

	function toLocalISO(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}
</script>

<section class="page">
	<header class="page-head">
		<div>
			<h1>Availability</h1>
			<p class="lede">
				Click a free date to block it. Click your own block to release it. Blocks flow out via the
				iCal feed so Booking.com / Airbnb pick them up automatically.
			</p>
		</div>
	</header>

	{#if lastError}
		<div class="banner banner-error" role="alert">{lastError}</div>
	{/if}
	{#if lastInfo}
		<div class="banner banner-info" role="status">{lastInfo}</div>
	{/if}
	{#if tooltipText}
		<div class="banner banner-tip" role="status">{tooltipText}</div>
	{/if}

	<div class="cal-wrap" class:busy>
		<BookingCalendar
			messages={enMessages as never}
			lang="en"
			bookingByDate={bookingByDate}
			onDayClick={handleDayClick}
			minDate={new Date('1970-01-01')}
			showLegend={false}
		/>
	</div>

	<div class="legend">
		<span class="lk free"></span><span>Free</span>
		<span class="lk admin-block"></span><span>Your block (click to release)</span>
		<span class="lk confirmed"></span><span>Confirmed booking</span>
		<span class="lk pending"></span><span>Pending booking</span>
		<span class="lk imported"></span><span>Booking.com</span>
	</div>
</section>

<style>
	.page { display: flex; flex-direction: column; gap: 1.25rem; }
	.page-head h1 { margin: 0 0 0.25rem; font-family: 'Lora', serif; font-size: 1.6rem; color: var(--color-brown); }
	.page-head .lede { margin: 0; color: var(--color-text-muted); font-size: 0.95rem; max-width: 60ch; }

	.banner { padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.9rem; }
	.banner-error { background: color-mix(in srgb, var(--md-sys-color-error) 12%, transparent); color: var(--md-sys-color-error); }
	.banner-info { background: color-mix(in srgb, var(--color-sage) 14%, transparent); color: var(--color-text); }
	.banner-tip { background: var(--color-cream-dark); color: var(--color-text); }

	.cal-wrap { max-width: 720px; }
	.cal-wrap.busy { pointer-events: none; opacity: 0.7; }

	.legend { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.25rem; font-size: 0.8rem; color: var(--color-text-muted); }
	.legend .lk { display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 4px; margin-right: 0.4rem; vertical-align: middle; }
	.legend .lk.free { background: var(--md-sys-color-surface-container-lowest); border: 1px solid var(--color-cream-dark); }
	.legend .lk.admin-block { background: var(--color-brown, #6b5642); }
	.legend .lk.confirmed { background: var(--color-sage); }
	.legend .lk.pending { background: #fff4d6; border: 2px dashed #f5b942; box-sizing: border-box; }
	.legend .lk.imported { background: repeating-linear-gradient(45deg, #4a90c2, #4a90c2 3px, #2e5d80 3px, #2e5d80 6px); }
</style>
