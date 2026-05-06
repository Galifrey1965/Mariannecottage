<script lang="ts">
	import type { Booking, CancellationPolicySchedule } from '$lib/server/supabase';
	import type { PageData } from './$types';
	import BookingCalendar, { type BookingDayInfo } from '$lib/components/BookingCalendar.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import { isFlagCode } from '$lib/flags/flags';
	import enMessages from '../../../messages/en.json';

	let { data }: { data: PageData } = $props();

	let pageBookings = $state<Booking[]>([]);
	let calendarBookings = $state<Booking[]>([]);
	let totalBookings = $state(0);
	let loading = $state(false);
	let calendarLoading = $state(false);
	let statusFilter = $state('all');
	let searchQuery = $state('');
	let viewMode = $state<'list' | 'calendar'>('list');

	// Server-side pagination — page size matches /admin/audit-log conventions.
	const PAGE_SIZE = 10;
	let currentPage = $state(0);

	// Aggregate stats fetched independently of the paged table so the dashboard
	// cards reflect totals across the whole bookings table, not just the visible page.
	type BookingStats = {
		totalCount: number;
		confirmedCount: number;
		pendingCount: number;
		upcomingCount: number;
		bcActiveCount: number;
		totalRevenue: number;
		bcActiveDates: string[];
	};
	let stats = $state<BookingStats>({
		totalCount: 0,
		confirmedCount: 0,
		pendingCount: 0,
		upcomingCount: 0,
		bcActiveCount: 0,
		totalRevenue: 0,
		bcActiveDates: []
	});

	// Edit form for Booking.com imports — Mark fills in details from BC's
	// reservation email (BC's iCal feed never contains guest PII).
	let importEdits = $state<Partial<Booking>>({});
	let importSaving = $state(false);
	let importSaveError = $state('');

	type BlockedRow = { date: string; synced_from: string | null; synced_at: string | null };
	const blockedAvailability: BlockedRow[] = (data.blockedAvailability ?? []) as BlockedRow[];

	const isImportedBooking = (b: Booking | null) => Boolean(b && b.source === 'booking_com');

	function nextDayISO(iso: string): string {
		const d = new Date(iso + 'T00:00:00Z');
		d.setUTCDate(d.getUTCDate() + 1);
		return d.toISOString().slice(0, 10);
	}

	function syntheticImportedBooking(row: BlockedRow): Booking {
		return {
			id: `imported:${row.date}`,
			created_at: row.synced_at ?? new Date().toISOString(),
			updated_at: row.synced_at ?? new Date().toISOString(),
			guest_name: 'Booking.com guest',
			guest_email: '',
			guest_phone: undefined,
			guest_country: undefined,
			num_guests: 0,
			check_in_date: row.date,
			check_out_date: nextDayISO(row.date),
			num_nights: 1,
			special_requests: undefined,
			nightly_rate: 0,
			subtotal: 0,
			tax: 0,
			total_cost: 0,
			status: 'confirmed',
			booking_reference: `BC-${row.date}`,
			source: 'booking_com'
		} as Booking;
	}
	let searchTimeout: ReturnType<typeof setTimeout>;

	let selectedBooking = $state<Booking | null>(null);
	let editingNotes = $state(false);
	let notesValue = $state('');
	let updatingStatus = $state(false);

	// PR 4 admin slice — cancel & refund flow
	interface CancelPreview {
		booking: {
			id: string;
			booking_reference: string;
			guest_name: string;
			check_in_date: string;
			check_out_date: string;
			total_cost: number;
			status: string;
			payment_intent_id?: string;
		};
		quote: {
			days_before_check_in: number;
			refund_pct: number;
			refund_amount: number;
			absorbed_fee_estimate: number;
			policy_name: string;
			matched_window: CancellationPolicySchedule | null;
		};
		policy: { id: string; name: string; description?: string; schedule: CancellationPolicySchedule[] };
		can_refund: boolean;
	}
	let cancelPreview = $state<CancelPreview | null>(null);
	let cancelLoading = $state(false);
	let cancelExecuting = $state(false);
	let cancelReason = $state('');
	let cancelChoice = $state<'auto' | 'none'>('auto');
	let cancelError = $state('');
	let absorbedFeeTotal = $state(data.absorbedFeeTotal ?? 0);
	let absorbedFeeRefundCount = $state(data.absorbedFeeRefundCount ?? 0);

	// Guest magic-link helper — admin can copy/paste or send-by-email when a
	// guest needs the cancel URL (e.g. they reach out via WhatsApp).
	let cancelLinkUrl = $state<string | null>(null);
	let cancelLinkLoading = $state(false);
	let cancelLinkCopied = $state(false);
	let cancelLinkError = $state<string | null>(null);

	// Per-booking transient state for "resend email" buttons in the detail
	// panel — keyed by which kind is in flight so the spinner shows on the
	// right button only.
	let resending = $state<'confirmation' | 'cancellation' | null>(null);
	let resendError = $state<string | null>(null);
	let resendOk = $state<'confirmation' | 'cancellation' | null>(null);

	async function resendEmail(b: Booking, type: 'confirmation' | 'cancellation') {
		resending = type;
		resendError = null;
		resendOk = null;
		try {
			const res = await fetch('/api/admin/bookings/resend-email', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: b.id, type })
			});
			const result = await res.json().catch(() => ({}));
			if (!res.ok || !result.success) {
				resendError = result?.error || `Resend failed (${res.status})`;
				return;
			}
			resendOk = type;
			setTimeout(() => {
				if (resendOk === type) resendOk = null;
			}, 3500);
		} catch (err) {
			resendError = err instanceof Error ? err.message : 'Network error';
		} finally {
			resending = null;
		}
	}

	async function fetchBookings(opts: { withStats?: boolean } = {}) {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'all') params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			params.set('page', String(currentPage));
			params.set('pageSize', String(PAGE_SIZE));
			if (opts.withStats) params.set('stats', '1');
			const res = await fetch(`/api/admin/bookings?${params}`);
			const result = await res.json();
			pageBookings = result.bookings || [];
			totalBookings = result.total || 0;
			if (result.stats) stats = result.stats;
		} catch {
			pageBookings = [];
		} finally {
			loading = false;
		}
	}

	async function fetchCalendarBookings() {
		calendarLoading = true;
		try {
			const res = await fetch('/api/admin/bookings?mode=all');
			const result = await res.json();
			calendarBookings = result.bookings || [];
		} catch {
			calendarBookings = [];
		} finally {
			calendarLoading = false;
		}
	}

	async function refetchAll() {
		await Promise.all([fetchBookings({ withStats: true }), fetchCalendarBookings()]);
	}

	async function updateBookingStatus(id: string, status: string) {
		updatingStatus = true;
		try {
			const res = await fetch('/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, status })
			});
			const result = await res.json();
			if (result.success) {
				await refetchAll();
				if (selectedBooking?.id === id) selectedBooking = result.booking;
			}
		} finally {
			updatingStatus = false;
		}
	}

	async function saveNotes(id: string) {
		try {
			const res = await fetch('/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id, admin_notes: notesValue })
			});
			const result = await res.json();
			if (result.success) {
				editingNotes = false;
				await fetchBookings();
				if (selectedBooking?.id === id) selectedBooking = result.booking;
			}
		} catch { /* ignore */ }
	}

	function onSearchInput() {
		clearTimeout(searchTimeout);
		// Don't fire a request for a single character — too noisy and rarely useful.
		// Empty string is allowed (clears the filter).
		const q = searchQuery.trim();
		if (q.length === 1) return;
		searchTimeout = setTimeout(() => {
			currentPage = 0;
			void fetchBookings();
		}, 300);
	}

	function setStatusFilter(s: string) {
		if (statusFilter === s) return;
		statusFilter = s;
		currentPage = 0;
	}

	function selectBooking(b: Booking) {
		selectedBooking = b;
		editingNotes = false;
		notesValue = b.admin_notes || '';
		// Pre-populate the import edit form when opening a BC reservation panel.
		importEdits = b.source === 'booking_com'
			? {
				guest_name: b.guest_name === 'Booking.com guest' ? '' : b.guest_name,
				guest_email: b.guest_email ?? '',
				guest_phone: b.guest_phone ?? '',
				num_guests: b.num_guests ?? 2,
				total_cost: b.total_cost ?? 0,
				external_ref: b.external_ref ?? ''
			}
			: {};
		importSaveError = '';
	}

	async function saveImportEdits() {
		if (!selectedBooking) return;
		importSaving = true;
		importSaveError = '';
		try {
			const payload: Record<string, unknown> = { id: selectedBooking.id };
			for (const [k, v] of Object.entries(importEdits)) {
				if (v === '' && (k === 'guest_email' || k === 'guest_phone' || k === 'external_ref')) {
					payload[k] = null;
				} else {
					payload[k] = v;
				}
			}
			const res = await fetch('/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				importSaveError = result.error || `Save failed (${res.status})`;
				return;
			}
			selectedBooking = result.booking;
			await refetchAll();
		} catch (err) {
			importSaveError = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			importSaving = false;
		}
	}

	function closeDetail() {
		selectedBooking = null;
		editingNotes = false;
	}

	const CANCELLABLE = new Set(['pending', 'pending_payment', 'confirmed']);
	const CANCELLED_RESEND_STATUSES = new Set(['cancelled', 'refunded', 'refunded_overbooked']);
	const canCancel = (b: Booking) => CANCELLABLE.has(b.status);

	// Phase 2 state-machine awareness for the detail panel.
	const TERMINAL = new Set(['cancelled', 'refunded', 'refunded_overbooked', 'expired', 'payment_failed']);
	const isTerminalStatus = (s: string) => TERMINAL.has(s);
	function terminalStatusHint(status: string): string {
		switch (status) {
			case 'cancelled': return 'Cancelled — booking is finalised. The Stripe charge.refunded webhook will move this to refunded once the refund clears.';
			case 'refunded': return 'Refunded — finalised by Stripe webhook.';
			case 'refunded_overbooked': return 'Refunded (overbooked) — late-success race; refund issued automatically.';
			case 'expired': return 'Expired by TTL sweep — soft-reserve window elapsed without payment.';
			case 'payment_failed': return 'Payment failed — admin-set or explicit abandon.';
			default: return 'Finalised.';
		}
	}
	function statusBadgeClass(status: string): string {
		switch (status) {
			case 'pending':
			case 'pending_payment':
				return 'pending';
			case 'confirmed':
				return 'confirmed';
			default:
				return 'cancelled';
		}
	}

	async function openCancelDialog(b: Booking) {
		cancelLoading = true;
		cancelError = '';
		cancelReason = '';
		cancelChoice = 'auto';
		try {
			const res = await fetch(`/api/admin/bookings/cancel?id=${encodeURIComponent(b.id)}`);
			if (!res.ok) {
				cancelError = `Could not load preview (${res.status})`;
				cancelPreview = null;
				return;
			}
			cancelPreview = await res.json();
			// Default the radio to whichever option is actually available.
			if (cancelPreview && !cancelPreview.can_refund) cancelChoice = 'none';
		} finally {
			cancelLoading = false;
		}
	}

	function closeCancelDialog() {
		cancelPreview = null;
		cancelError = '';
		cancelExecuting = false;
	}

	async function executeCancel() {
		if (!cancelPreview) return;
		cancelExecuting = true;
		cancelError = '';
		try {
			const res = await fetch('/api/admin/bookings/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: cancelPreview.booking.id,
					refund: cancelChoice,
					reason: cancelReason.trim() || undefined
				})
			});
			const payload = await res.json();
			if (!res.ok) {
				cancelError = payload.error || `Failed (${res.status})`;
				return;
			}
			// Refresh list + the dashboard absorbed-fee total.
			await Promise.all([refetchAll(), refreshAbsorbedFeeTotal()]);
			if (selectedBooking?.id === cancelPreview.booking.id && payload.booking) {
				selectedBooking = payload.booking;
			}
			closeCancelDialog();
		} catch (err) {
			cancelError = err instanceof Error ? err.message : 'unknown error';
		} finally {
			cancelExecuting = false;
		}
	}

	async function fetchGuestCancelLink(b: Booking) {
		cancelLinkLoading = true;
		cancelLinkCopied = false;
		cancelLinkError = null;
		cancelLinkUrl = null;
		try {
			const res = await fetch(`/api/admin/bookings/cancel-link?id=${encodeURIComponent(b.id)}`);
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				cancelLinkError = payload.error || `Failed (${res.status})`;
				return;
			}
			if (!payload.url) {
				cancelLinkError = 'Server did not return a URL.';
				return;
			}
			cancelLinkUrl = payload.url;
		} catch (err) {
			cancelLinkError = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			cancelLinkLoading = false;
		}
	}

	async function copyCancelLink() {
		if (!cancelLinkUrl) return;
		try {
			await navigator.clipboard.writeText(cancelLinkUrl);
			cancelLinkCopied = true;
			setTimeout(() => (cancelLinkCopied = false), 2000);
		} catch {
			// Clipboard API failed — leave the URL visible so the admin can select-and-copy manually.
		}
	}

	function closeCancelLinkDialog() {
		cancelLinkUrl = null;
		cancelLinkCopied = false;
		cancelLinkError = null;
	}

	async function refreshAbsorbedFeeTotal() {
		// invalidateAll would re-run the server load; cheaper to recompute via the
		// admin agent_events feed, but for simplicity we re-fetch via SvelteKit.
		try {
			const res = await fetch('/admin/__data.json');
			if (res.ok) {
				// The page-data endpoint returns wrapped shape; just trigger a soft
				// reload of the section that needs it. Pragmatic fallback: bump
				// from the in-memory total by the just-issued absorbed fee.
				if (cancelPreview && cancelChoice === 'auto') {
					absorbedFeeTotal = Math.round((absorbedFeeTotal + cancelPreview.quote.absorbed_fee_estimate) * 100) / 100;
					absorbedFeeRefundCount += 1;
				}
			}
		} catch {
			// Non-fatal — list refresh below still happens.
		}
	}

	// Mount: fetch the table page, the aggregate stats, and the unpaged calendar
	// set in one go. Subsequent filter/page changes refetch the table only.
	let initialLoadDone = false;
	$effect(() => {
		statusFilter; currentPage;
		if (!initialLoadDone) {
			initialLoadDone = true;
			void refetchAll();
		} else {
			void fetchBookings();
		}
	});


	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	const formatCurrency = (n: number) =>
		new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(n);
	const formatRelative = (iso: string) => {
		const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (days < 0) return `${Math.abs(days)}d ago`;
		if (days === 0) return 'Today';
		if (days === 1) return 'Tomorrow';
		return `in ${days}d`;
	};

	// Stats cards reflect totals across the whole bookings table — independent of
	// the current page or status filter. BC pending-promotion is computed from
	// the dates the server reports as covered by active BC bookings.
	const bcPendingPromotionRuns = $derived.by(() => {
		const realDates = new Set(stats.bcActiveDates);
		const sorted = blockedAvailability.map((r) => r.date).filter((d) => !realDates.has(d)).sort();
		let runs = 0;
		for (let i = 0; i < sorted.length; i++) {
			if (i === 0 || !isNextDay(sorted[i - 1], sorted[i])) runs++;
		}
		return runs;
	});

	function sourceChipLabel(source?: string): string | null {
		if (!source || source === 'web') return null;
		if (source === 'test') return 'TEST';
		if (source === 'admin') return 'ADMIN';
		if (source === 'booking_com') return 'BOOKING.COM';
		return source.toUpperCase();
	}

	function sourceFullLabel(source?: string): string {
		if (!source) return 'Unknown';
		if (source === 'web') return 'Direct (website)';
		if (source === 'admin') return 'Admin-created';
		if (source === 'booking_com') return 'Booking.com';
		if (source === 'test') return 'Developer test fixture';
		return source;
	}

	// Calendar mode — flatten the unpaged calendar set into a date → BookingDayInfo
	// map so the BookingCalendar can colour cells by status and route clicks back
	// through selectBooking() to open the existing detail panel.
	const adminBookingByDate = $derived.by(() => {
		const out: Record<string, BookingDayInfo> = {};
		for (const b of calendarBookings) {
			const start = new Date(b.check_in_date + 'T00:00:00Z');
			const end = new Date(b.check_out_date + 'T00:00:00Z');
			const totalNights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
			const d = new Date(start);
			let i = 0;
			while (d < end) {
				const iso = d.toISOString().slice(0, 10);
				const existing = out[iso];
				const position: BookingDayInfo['position'] =
					totalNights === 1 ? 'single' :
					i === 0 ? 'first' :
					i === totalNights - 1 ? 'last' : 'middle';
				// confirmed > pending > anything else when two bookings collide on the same date
				if (!existing || rankStatus(b.status) > rankStatus(existing.status)) {
					out[iso] = { id: b.id, status: b.status, source: b.source, position };
				}
				d.setUTCDate(d.getUTCDate() + 1);
				i++;
			}
		}
		// Overlay OTA-imported availability blocks for dates not yet promoted to
		// a real bookings row. Detect contiguous runs so single-night vs multi-
		// night blocks render with the right grouping.
		const sorted = blockedAvailability
			.map((r) => r.date)
			.filter((d) => !out[d])
			.sort();
		let runStart = -1;
		for (let i = 0; i <= sorted.length; i++) {
			const d = sorted[i];
			const prev = sorted[i - 1];
			const isBreak = i === sorted.length || (prev && !isNextDay(prev, d));
			if (isBreak && runStart >= 0) {
				const runLen = i - runStart;
				for (let j = 0; j < runLen; j++) {
					const date = sorted[runStart + j];
					const position: BookingDayInfo['position'] =
						runLen === 1 ? 'single' :
						j === 0 ? 'first' :
						j === runLen - 1 ? 'last' : 'middle';
					out[date] = { id: `imported:${date}`, status: 'confirmed', source: 'booking_com', position };
				}
				runStart = -1;
			}
			if (i < sorted.length && runStart < 0) runStart = i;
		}
		return out;
	});

	function isNextDay(a: string, b: string): boolean {
		const da = new Date(a + 'T00:00:00Z');
		da.setUTCDate(da.getUTCDate() + 1);
		return da.toISOString().slice(0, 10) === b;
	}

	function rankStatus(s: string): number {
		if (s === 'confirmed') return 3;
		if (s === 'pending' || s === 'pending_payment') return 2;
		if (s === 'cancelled' || s === 'expired' || s === 'refunded' || s === 'refunded_overbooked' || s === 'payment_failed') return 0;
		return 1;
	}

	function handleAdminDayClick(bookingId: string | null, date: Date) {
		if (!bookingId) {
			openBlockPanel(toLocalISO(date));
			return;
		}
		if (bookingId.startsWith('imported:')) {
			const isoFromId = bookingId.slice('imported:'.length);
			const row = blockedAvailability.find(r => r.date === isoFromId) ?? { date: isoFromId, synced_from: null, synced_at: null };
			selectBooking(syntheticImportedBooking(row));
			return;
		}
		const b = calendarBookings.find(x => x.id === bookingId)
			?? pageBookings.find(x => x.id === bookingId);
		if (b) selectBooking(b);
	}

	function toLocalISO(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	// Block-this-day side panel — opens when the admin clicks an empty
	// (unbooked, unblocked) day in calendar mode. Replaces the standalone
	// /admin/availability page; same POST /api/admin/availability endpoint
	// behind the scenes, now with optional admin_notes capture.
	let blockingDay = $state<{ dateISO: string; notes: string; saving: boolean; error: string } | null>(null);

	function openBlockPanel(dateISO: string) {
		blockingDay = { dateISO, notes: '', saving: false, error: '' };
	}

	function closeBlockPanel() {
		blockingDay = null;
	}

	async function submitBlock() {
		if (!blockingDay) return;
		blockingDay.saving = true;
		blockingDay.error = '';
		try {
			const res = await fetch('/api/admin/availability', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: blockingDay.dateISO, admin_notes: blockingDay.notes.trim() })
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				blockingDay.error = payload?.error ?? `Failed to block ${blockingDay.dateISO}`;
				return;
			}
			await refetchAll();
			closeBlockPanel();
		} catch (err) {
			if (blockingDay) blockingDay.error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			if (blockingDay) blockingDay.saving = false;
		}
	}

	// Release a manual admin_block — different from the cancel/refund flow
	// because there's no Stripe charge to refund. Calls the dedicated DELETE
	// endpoint on /api/admin/availability so audit logging stays distinct
	// (action=availability.block.delete vs admin.cancel).
	// Hard-delete a terminal-state booking (cancelled / expired / refunded /
	// refunded_overbooked / payment_failed). Frees the availability rows the
	// booking owned. Active bookings have to be cancelled first — the
	// /api/admin/bookings DELETE endpoint enforces that and returns 409
	// otherwise. Audit logged as 'booking.delete'.
	let deletingBooking = $state(false);
	async function deleteBooking(b: Booking) {
		const ref = b.booking_reference ?? b.id.slice(0, 8);
		if (!confirm(
			`Permanently delete booking ${ref}?\n\n` +
			`This removes the booking row and frees its dates on the calendar. ` +
			`Use this for test fixtures or finalised cancellations you no longer ` +
			`need in the admin list. The audit log entry stays.`
		)) return;
		deletingBooking = true;
		try {
			const res = await fetch('/api/admin/bookings', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: b.id })
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok || !payload.success) {
				alert(payload?.error || `Delete failed (${res.status})`);
				return;
			}
			selectedBooking = null;
			await refetchAll();
		} finally {
			deletingBooking = false;
		}
	}

	let releasingBlock = $state(false);
	async function releaseBlock(b: Booking) {
		if (!confirm('Release this admin block?\n\nThe date will become available again on the website and on the iCal feed to OTAs.')) return;
		releasingBlock = true;
		try {
			const res = await fetch('/api/admin/availability', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: b.id })
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				alert(payload?.error || `Failed to release block (${res.status})`);
				return;
			}
			selectedBooking = null;
			await refetchAll();
		} finally {
			releasingBlock = false;
		}
	}

	const isAdminBlock = $derived(selectedBooking?.source === 'admin_block');

	const isPendingSyncBooking = (b: Booking | null) =>
		Boolean(b && typeof b.id === 'string' && b.id.startsWith('imported:'));

	let cancellingBcBlock = $state(false);
	async function cancelBcBlock(b: Booking) {
		if (!confirm('Cancel this Booking.com block locally?\n\n' +
			'• The dates will be freed on our calendar (and our outbound iCal feed).\n' +
			'• The reservation on Booking.com is NOT cancelled — you must do that in the BC extranet separately if needed.\n' +
			'• Future iCal syncs will leave this booking alone (sticky cancellation).')) return;
		cancellingBcBlock = true;
		try {
			const res = await fetch('/api/admin/bookings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: b.id, status: 'cancelled' })
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				alert(result.error || `Cancel failed (${res.status})`);
				return;
			}
			selectedBooking = result.booking;
			await refetchAll();
		} finally {
			cancellingBcBlock = false;
		}
	}

	let bcSyncing = $state(false);
	let bcSyncMessage = $state('');
	// We surface the last-sync timestamp so the admin can decide whether to
	// bother clicking the manual sync. Reactive via $state so the manual
	// sync updates it without a full reload.
	let lastBcSyncAt = $state<string | null>(data.lastBcSyncAt ?? null);

	function formatRelativeTime(iso: string | null): string {
		if (!iso) return 'never';
		const ms = Date.now() - new Date(iso).getTime();
		if (ms < 0) return 'just now';
		const min = Math.round(ms / 60_000);
		if (min < 1) return 'just now';
		if (min < 60) return `${min} min ago`;
		const hr = Math.round(min / 60);
		if (hr < 24) return `${hr}h ago`;
		const day = Math.round(hr / 24);
		return `${day}d ago`;
	}

	async function triggerBcSync() {
		bcSyncing = true;
		bcSyncMessage = '';
		try {
			const res = await fetch('/api/admin/sync-bc', { method: 'POST' });
			const result = await res.json();
			if (!res.ok) {
				bcSyncMessage = result.error || `Failed (${res.status})`;
				return;
			}
			bcSyncMessage = `Synced ${result.inserted ?? 0} new, ${result.updated ?? 0} updated, ${result.cancelled ?? 0} cancelled.`;
			lastBcSyncAt = new Date().toISOString();
			await refetchAll();
		} catch (err) {
			bcSyncMessage = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			bcSyncing = false;
			setTimeout(() => { bcSyncMessage = ''; }, 6000);
		}
	}

	function setStatusShortcut(s: string) {
		setStatusFilter(statusFilter === s ? 'all' : s);
	}

	const lastPage = $derived(Math.max(0, Math.ceil(totalBookings / PAGE_SIZE) - 1));
	const pageRangeStart = $derived(totalBookings === 0 ? 0 : currentPage * PAGE_SIZE + 1);
	const pageRangeEnd = $derived(Math.min(totalBookings, (currentPage + 1) * PAGE_SIZE));

	function gotoPage(p: number) {
		const clamped = Math.max(0, Math.min(p, lastPage));
		if (clamped === currentPage) return;
		currentPage = clamped;
	}
</script>

<div class="dashboard">
	<div class="dashboard-header">
		<div>
			<h2 class="page-title">Bookings</h2>
			<p class="page-subtitle">{stats.totalCount} total bookings</p>
		</div>
	</div>

		<div class="filters">
			<div class="view-toggle" role="tablist" aria-label="View mode">
				<button onclick={() => viewMode = 'list'} class="filter-btn" class:active={viewMode === 'list'} role="tab" aria-selected={viewMode === 'list'}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
					List
				</button>
				<button onclick={() => viewMode = 'calendar'} class="filter-btn" class:active={viewMode === 'calendar'} role="tab" aria-selected={viewMode === 'calendar'}>
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
					Calendar
				</button>
			</div>
			<div class="search-wrapper">
				<input type="text" bind:value={searchQuery} oninput={onSearchInput} placeholder="Search by name, email, or reference (≥2 chars)..." class="form-input" />
			</div>
			<div class="status-filters">
				{#each ['all', 'pending', 'confirmed', 'cancelled'] as s}
					<button onclick={() => setStatusFilter(s)} class="filter-btn" class:active={statusFilter === s}>{s}</button>
				{/each}
			</div>
		</div>

		<div class="stats-grid">
			<div class="stat-card">
				<p class="stat-label">Revenue</p>
				<p class="stat-value" style="color: var(--color-sage);">{formatCurrency(stats.totalRevenue)}</p>
			</div>
			<button class="stat-card stat-card--clickable" class:active={statusFilter === 'confirmed'} onclick={() => setStatusShortcut('confirmed')} title="Filter to confirmed">
				<p class="stat-label">Confirmed</p>
				<p class="stat-value" style="color: var(--color-success-text);">{stats.confirmedCount}</p>
			</button>
			<button class="stat-card stat-card--clickable" class:active={statusFilter === 'pending'} onclick={() => setStatusShortcut('pending')} title="Filter to pending">
				<p class="stat-label">Pending</p>
				<p class="stat-value" style="color: var(--color-warning-text);">{stats.pendingCount}</p>
			</button>
			<div class="stat-card">
				<p class="stat-label">Upcoming</p>
				<p class="stat-value" style="color: var(--color-info-text);">{stats.upcomingCount}</p>
			</div>
			<div class="stat-card">
				<p class="stat-label">Refund fees absorbed</p>
				<p class="stat-value" style="color: var(--color-error-text);">{formatCurrency(absorbedFeeTotal)}</p>
				<p class="sub-text">{absorbedFeeRefundCount} refund{absorbedFeeRefundCount === 1 ? '' : 's'} · ~1.5% + €0.25 est.</p>
			</div>
			<div class="stat-card stat-card--bc">
				<p class="stat-label"><span class="bc-logo">B.</span> Booking.com</p>
				<p class="stat-value" style="color: #003580;">
					{stats.bcActiveCount}{#if bcPendingPromotionRuns > 0}<span class="bc-pending-badge">+{bcPendingPromotionRuns}</span>{/if}
				</p>
				<p class="sub-text">
					{stats.bcActiveCount === 1 ? '1 active reservation' : `${stats.bcActiveCount} active reservations`}{#if bcPendingPromotionRuns > 0} · {bcPendingPromotionRuns} pending sync{/if}
				</p>
				<div class="bc-sync-actions">
					<button onclick={triggerBcSync} disabled={bcSyncing} class="bc-sync-btn" title="Pull the latest Booking.com iCal feed now">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align: -2px; margin-right: 0.25rem;"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
						{bcSyncing ? 'Syncing…' : 'Sync now'}
					</button>
					<span class="bc-sync-meta">
						Last synced {formatRelativeTime(lastBcSyncAt)}
					</span>
				</div>
				{#if bcSyncMessage}
					<p class="bc-sync-msg">{bcSyncMessage}</p>
				{/if}
			</div>
		</div>

		{#if viewMode === 'calendar'}
			<div class="calendar-container">
				<BookingCalendar
					messages={enMessages as never}
					lang="en"
					bookingByDate={adminBookingByDate}
					onDayClick={handleAdminDayClick}
					minDate={new Date('1970-01-01')}
					showLegend={false}
				/>
				<div class="admin-cal-legend">
					<span class="lk confirmed"></span><span>Confirmed</span>
					<span class="lk pending"></span><span>Pending</span>
					<span class="lk imported"></span><span>Booking.com</span>
					<span class="lk test"></span><span>Test</span>
					<span class="lk cancelled"></span><span>Cancelled / past</span>
					<span class="hint">Click any coloured day to open the booking.</span>
				</div>
			</div>
		{:else}
		<div class="table-container">
			{#if loading}
				<div class="empty-state">Loading...</div>
			{:else if pageBookings.length === 0}
				<div class="empty-state">No bookings found</div>
			{:else}
				<div class="desktop-table">
					<table>
						<thead>
							<tr>
								<th>Reference</th>
								<th>Guest</th>
								<th>Check-in</th>
								<th>Nights</th>
								<th>Guests</th>
								<th>Total</th>
								<th>Status</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each pageBookings as booking}
								<tr onclick={() => selectBooking(booking)}>
									<td class="mono">
										{booking.booking_reference}
										{#if sourceChipLabel(booking.source)}
											<span class="source-chip {booking.source}">{sourceChipLabel(booking.source)}</span>
										{/if}
									</td>
									<td>
										<div class="guest-cell">
											{#if isFlagCode(booking.guest_country)}
												<Flag code={booking.guest_country} height="0.95rem" label={booking.guest_country} />
											{/if}
											<div>
												<p class="guest-name">{booking.guest_name}</p>
												<p class="guest-email">{booking.guest_email}</p>
											</div>
										</div>
									</td>
									<td>
										<p>{formatDate(booking.check_in_date)}</p>
										<p class="sub-text">{formatRelative(booking.check_in_date)}</p>
									</td>
									<td>{booking.num_nights}</td>
									<td>{booking.num_guests}</td>
									<td class="bold">{formatCurrency(booking.total_cost)}</td>
									<td><span class="status-badge {booking.status}">{booking.status}</span></td>
									<td class="arrow">→</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<div class="mobile-cards">
					{#each pageBookings as booking}
						<button onclick={() => selectBooking(booking)} class="mobile-card">
							<div class="mobile-card-top">
								<div>
									<p class="guest-name">
										{#if isFlagCode(booking.guest_country)}<Flag code={booking.guest_country} height="0.9rem" label={booking.guest_country} />{' '}{/if}
										{booking.guest_name}
									</p>
									<p class="mono sub-text">
										{booking.booking_reference}
										{#if sourceChipLabel(booking.source)}
											<span class="source-chip {booking.source}">{sourceChipLabel(booking.source)}</span>
										{/if}
									</p>
								</div>
								<span class="status-badge {booking.status}">{booking.status}</span>
							</div>
							<div class="mobile-card-bottom">
								<span>{formatDate(booking.check_in_date)} · {booking.num_nights}n · {booking.num_guests}g</span>
								<span class="bold">{formatCurrency(booking.total_cost)}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
			{#if totalBookings > 0}
				<nav class="pager" aria-label="Bookings pagination">
					<button
						type="button"
						class="link-btn"
						disabled={currentPage === 0 || loading}
						onclick={() => gotoPage(currentPage - 1)}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
						Prev
					</button>
					<span class="page-info">
						{pageRangeStart}–{pageRangeEnd} of {totalBookings}
						· Page {currentPage + 1} of {lastPage + 1}
					</span>
					<button
						type="button"
						class="link-btn"
						disabled={currentPage >= lastPage || loading}
						onclick={() => gotoPage(currentPage + 1)}
					>
						Next
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
					</button>
				</nav>
			{/if}
		</div>
		{/if}
	</div>

	{#if cancelLinkUrl || cancelLinkError}
		<div class="overlay cancel-overlay">
			<button onclick={closeCancelLinkDialog} class="overlay-backdrop" aria-label="Close"></button>
			<div class="cancel-dialog">
				<div class="detail-content">
					<div class="detail-header">
						<div>
							<h3 class="detail-title">Guest cancel link</h3>
							<p class="sub-text">Share with the guest if they'd like to cancel the booking themselves.</p>
						</div>
						<button onclick={closeCancelLinkDialog} class="close-btn">✕</button>
					</div>
					{#if cancelLinkError}
						<p class="cancel-error">{cancelLinkError}</p>
					{:else if cancelLinkUrl}
						<div class="detail-section">
							<input type="text" readonly value={cancelLinkUrl} class="form-input" onclick={(e) => (e.currentTarget as HTMLInputElement).select()} />
						</div>
					{/if}
					<div class="cancel-actions">
						<button onclick={closeCancelLinkDialog} class="btn-outline">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							Done
						</button>
						{#if cancelLinkUrl && selectedBooking}
							<button
								onclick={() => resendEmail(selectedBooking!, 'confirmation')}
								disabled={resending !== null || selectedBooking.status !== 'confirmed'}
								class="btn-outline"
								title={selectedBooking.status === 'confirmed'
									? 'Email the booking confirmation (which contains the cancel link) to the guest'
									: 'Email send is only available for confirmed bookings'}
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
								{resending === 'confirmation' ? 'Sending…' : resendOk === 'confirmation' ? 'Sent ✓' : 'Send by email'}
							</button>
						{/if}
						{#if cancelLinkUrl}
							<button onclick={copyCancelLink} class="btn-primary">
								<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
								{cancelLinkCopied ? 'Copied!' : 'Copy to clipboard'}
							</button>
						{/if}
					</div>
					{#if resendError}
						<p class="cancel-error" role="alert" style="margin-top: 0.75rem;">{resendError}</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if cancelPreview}
		<div class="overlay cancel-overlay">
			<button onclick={closeCancelDialog} class="overlay-backdrop" aria-label="Close"></button>
			<div class="cancel-dialog">
				<div class="detail-content">
					<div class="detail-header">
						<div>
							<p class="mono sub-text" style="color: var(--color-sage);">{cancelPreview.booking.booking_reference}</p>
							<h3 class="detail-title">Cancel & Refund</h3>
						</div>
						<button onclick={closeCancelDialog} class="close-btn" disabled={cancelExecuting}>✕</button>
					</div>

					<div class="detail-section">
						<p>{cancelPreview.booking.guest_name} · {formatDate(cancelPreview.booking.check_in_date)} → {formatDate(cancelPreview.booking.check_out_date)}</p>
						<p class="sub-text">{cancelPreview.quote.days_before_check_in} days before check-in · policy: {cancelPreview.quote.policy_name}</p>
					</div>

					<hr />

					<div class="detail-section">
						<h4 class="section-title">Refund preview</h4>
						<div class="pricing-rows">
							<div class="pricing-row">
								<span>Booking total</span>
								<span>{formatCurrency(cancelPreview.booking.total_cost)}</span>
							</div>
							<div class="pricing-row">
								<span>Refund ({cancelPreview.quote.refund_pct}%)</span>
								<span style="color: var(--color-success-text); font-weight: 600;">{formatCurrency(cancelPreview.quote.refund_amount)}</span>
							</div>
							<div class="pricing-row">
								<span>Stripe fee absorbed (est.)</span>
								<span style="color: var(--color-error-text);">~{formatCurrency(cancelPreview.quote.absorbed_fee_estimate)}</span>
							</div>
						</div>

						{#if !cancelPreview.can_refund}
							<p class="note-box" style="margin-top: 0.75rem;">
								{#if !cancelPreview.booking.payment_intent_id}
									No payment_intent_id on this booking — likely a manual / legacy entry. Only "cancel without refund" is available.
								{:else if cancelPreview.booking.status !== 'confirmed'}
									Booking is in <strong>{cancelPreview.booking.status}</strong>; refund flow only applies to confirmed bookings. Stripe-side payment_failed / pending rows are released by the TTL sweep.
								{:else if cancelPreview.quote.refund_amount === 0}
									Refund window has closed — refund is €0 per the {cancelPreview.quote.policy_name} policy.
								{/if}
							</p>
						{/if}
					</div>

					<div class="detail-section">
						<h4 class="section-title">Action</h4>
						<label class="cancel-radio">
							<input
								type="radio"
								name="cancel-choice"
								value="auto"
								bind:group={cancelChoice}
								disabled={!cancelPreview.can_refund || cancelExecuting}
							/>
							<span>Issue Stripe refund of <strong>{formatCurrency(cancelPreview.quote.refund_amount)}</strong> + cancel</span>
						</label>
						<label class="cancel-radio">
							<input
								type="radio"
								name="cancel-choice"
								value="none"
								bind:group={cancelChoice}
								disabled={cancelExecuting}
							/>
							<span>Cancel without refund</span>
						</label>
					</div>

					<div class="detail-section">
						<label for="cancel-reason" class="detail-label">Reason (admin notes)</label>
						<textarea
							id="cancel-reason"
							bind:value={cancelReason}
							class="form-input"
							rows="2"
							placeholder="Optional — why this booking is being cancelled"
							disabled={cancelExecuting}
						></textarea>
					</div>

					{#if cancelError}
						<p class="cancel-error">{cancelError}</p>
					{/if}

					<div class="cancel-actions">
						<button onclick={closeCancelDialog} class="btn-outline" disabled={cancelExecuting}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							Cancel
						</button>
						<button
							onclick={executeCancel}
							class="btn-primary"
							disabled={cancelExecuting || (cancelChoice === 'auto' && !cancelPreview.can_refund)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
							{cancelExecuting ? 'Processing…' : (cancelChoice === 'auto' ? `Refund ${formatCurrency(cancelPreview.quote.refund_amount)} & cancel` : 'Cancel without refund')}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if blockingDay}
		<div class="overlay cancel-overlay">
			<button
				onclick={closeBlockPanel}
				class="overlay-backdrop"
				aria-label="Close"
				disabled={blockingDay.saving}
			></button>
			<div class="cancel-dialog">
				<div class="detail-content">
					<div class="detail-header">
						<div>
							<p class="mono sub-text" style="color: var(--color-sage);">{formatDate(blockingDay.dateISO)}</p>
							<h3 class="detail-title">Block this day</h3>
							<p class="sub-text" style="margin-top: 0.25rem;">
								Marks the date as unavailable on the website and on the iCal feed
								to OTAs (Booking.com, Airbnb).
							</p>
						</div>
						<button onclick={closeBlockPanel} class="close-btn" disabled={blockingDay.saving}>✕</button>
					</div>

					<div class="detail-section">
						<label for="block-notes" class="detail-label">Notes (optional)</label>
						<textarea
							id="block-notes"
							bind:value={blockingDay.notes}
							class="form-input"
							rows="3"
							placeholder="e.g. Owner stay, maintenance, family booking"
							disabled={blockingDay.saving}
						></textarea>
					</div>

					{#if blockingDay.error}
						<p class="cancel-error">{blockingDay.error}</p>
					{/if}

					<div class="cancel-actions">
						<button onclick={closeBlockPanel} class="btn-outline" disabled={blockingDay.saving}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
							Cancel
						</button>
						<button onclick={submitBlock} class="btn-primary" disabled={blockingDay.saving}>
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
							{blockingDay.saving ? 'Blocking…' : 'Block this day'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if selectedBooking}
		<div class="overlay">
			<button onclick={closeDetail} class="overlay-backdrop" aria-label="Close"></button>
			<div class="detail-panel">
				<div class="detail-content">
					<div class="detail-header">
						<div>
							<p class="mono sub-text" style="color: var(--color-sage);">
								{selectedBooking.booking_reference}
								{#if sourceChipLabel(selectedBooking.source)}
									<span class="source-chip {selectedBooking.source}">{sourceChipLabel(selectedBooking.source)}</span>
								{/if}
							</p>
							<h3 class="detail-title">{selectedBooking.guest_name}</h3>
						</div>
						<button onclick={closeDetail} class="close-btn">✕</button>
					</div>

					<div class="detail-section">
						<p class="detail-label">Source</p>
						<p>
							{sourceFullLabel(selectedBooking.source)}
							{#if sourceChipLabel(selectedBooking.source)}
								<span class="source-chip {selectedBooking.source}">{sourceChipLabel(selectedBooking.source)}</span>
							{/if}
						</p>
					</div>

					<div class="detail-section">
						<p class="detail-label">Status</p>
						<div class="status-line">
							<span class="status-badge {statusBadgeClass(selectedBooking.status)}">{selectedBooking.status.replace(/_/g, ' ')}</span>
						</div>
						{#if isTerminalStatus(selectedBooking.status)}
							<p class="sub-text" style="margin-top: 0.5rem;">{terminalStatusHint(selectedBooking.status)}</p>
							{#if selectedBooking.source !== 'booking_com'}
								<div class="status-buttons" style="margin-top: 0.75rem;">
									<button
										onclick={() => deleteBooking(selectedBooking!)}
										disabled={deletingBooking}
										class="status-toggle cancelled"
										title="Permanently remove this booking row and free its dates"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
										{deletingBooking ? 'Deleting…' : 'Delete booking'}
									</button>
								</div>
							{/if}
						{:else if isAdminBlock}
							<div class="status-buttons" style="margin-top: 0.5rem;">
								<button
									onclick={() => releaseBlock(selectedBooking!)}
									disabled={releasingBlock}
									class="status-toggle cancelled"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
									{releasingBlock ? 'Releasing…' : 'Release block'}
								</button>
							</div>
							<p class="sub-text" style="margin-top: 0.5rem;">
								Manual block — no Stripe charge, no guest. Releasing frees the date on the
								site and on the iCal feed to Booking.com / Airbnb.
							</p>
						{:else if !isImportedBooking(selectedBooking)}
							<div class="status-buttons" style="margin-top: 0.5rem;">
								{#if selectedBooking.status === 'pending'}
									<button
										onclick={() => updateBookingStatus(selectedBooking!.id, 'confirmed')}
										disabled={updatingStatus}
										class="status-toggle confirmed"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
										confirm
									</button>
								{/if}
								<button
									onclick={() => openCancelDialog(selectedBooking!)}
									disabled={updatingStatus || cancelLoading || !canCancel(selectedBooking!)}
									class="status-toggle cancelled"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
									cancel &amp; refund
								</button>
								<button
									onclick={() => fetchGuestCancelLink(selectedBooking!)}
									disabled={cancelLinkLoading || !canCancel(selectedBooking!)}
									class="status-toggle"
									title="Mint a magic-link the guest can use to self-cancel"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
									{cancelLinkLoading ? '…' : 'guest cancel link'}
								</button>
								{#if selectedBooking.status === 'confirmed'}
									<button
										onclick={() => resendEmail(selectedBooking!, 'confirmation')}
										disabled={resending !== null}
										class="status-toggle"
										title="Re-send the confirmation email to the guest (includes their cancel link)"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
										{resending === 'confirmation' ? 'sending…' : resendOk === 'confirmation' ? 'sent ✓' : 'resend confirmation'}
									</button>
								{/if}
								{#if CANCELLED_RESEND_STATUSES.has(selectedBooking.status)}
									<button
										onclick={() => resendEmail(selectedBooking!, 'cancellation')}
										disabled={resending !== null}
										class="status-toggle"
										title="Re-send the cancellation email to the guest"
									>
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
										{resending === 'cancellation' ? 'sending…' : resendOk === 'cancellation' ? 'sent ✓' : 'resend cancellation'}
									</button>
								{/if}
							</div>
							{#if resendError}
								<p class="sub-text" style="margin-top: 0.5rem; color: var(--md-sys-color-error);" role="alert">{resendError}</p>
							{/if}
							{#if selectedBooking.status === 'pending_payment'}
								<p class="sub-text" style="margin-top: 0.5rem;">In checkout — confirmation arrives via Stripe webhook; TTL sweep releases stale rows.</p>
							{/if}
						{/if}
					</div>

					<hr />

					{#if !isImportedBooking(selectedBooking) && !isAdminBlock}
					<div class="detail-section">
						<h4 class="section-title">Guest Details</h4>
						<div class="detail-grid">
							<div>
								<p class="detail-label">Email</p>
								<a href="mailto:{selectedBooking.guest_email}">{selectedBooking.guest_email}</a>
							</div>
							{#if selectedBooking.guest_phone}
								<div>
									<p class="detail-label">Phone</p>
									<a href="tel:{selectedBooking.guest_phone}">{selectedBooking.guest_phone}</a>
								</div>
							{/if}
							{#if selectedBooking.guest_country}
								<div>
									<p class="detail-label">Country</p>
									<p class="country-line">
										{#if isFlagCode(selectedBooking.guest_country)}
											<Flag code={selectedBooking.guest_country} height="1rem" label={selectedBooking.guest_country} />
										{/if}
										{selectedBooking.guest_country}
									</p>
								</div>
							{/if}
							<div>
								<p class="detail-label">Guests</p>
								<p>{selectedBooking.num_guests}</p>
							</div>
						</div>
					</div>

					<hr />
					{/if}

					<div class="detail-section">
						<h4 class="section-title">Stay Details</h4>
						<div class="detail-grid">
							<div>
								<p class="detail-label">Check-in</p>
								<p>{formatDate(selectedBooking.check_in_date)}</p>
								<p class="sub-text">{formatRelative(selectedBooking.check_in_date)}</p>
							</div>
							<div>
								<p class="detail-label">Check-out</p>
								<p>{formatDate(selectedBooking.check_out_date)}</p>
							</div>
							<div>
								<p class="detail-label">Duration</p>
								<p>{selectedBooking.num_nights} nights</p>
							</div>
							{#if isImportedBooking(selectedBooking)}
								<div>
									<p class="detail-label">Last synced</p>
									<p>{formatDate(selectedBooking.updated_at)}</p>
								</div>
							{:else}
								<div>
									<p class="detail-label">Booked</p>
									<p>{formatDate(selectedBooking.created_at)}</p>
								</div>
							{/if}
						</div>
					</div>

					{#if isImportedBooking(selectedBooking) && (selectedBooking.ical_uid || selectedBooking.ical_summary)}
						<hr />
						<div class="detail-section">
							<h4 class="section-title">iCal metadata</h4>
							<div class="detail-grid">
								{#if selectedBooking.ical_uid}
									<div style="grid-column: 1 / -1;">
										<p class="detail-label">UID</p>
										<p class="mono" style="word-break: break-all; font-size: 0.75rem;">{selectedBooking.ical_uid}</p>
									</div>
								{/if}
								{#if selectedBooking.ical_summary}
									<div style="grid-column: 1 / -1;">
										<p class="detail-label">Summary</p>
										<p style="font-size: 0.875rem;">{selectedBooking.ical_summary}</p>
									</div>
								{/if}
							</div>
						</div>
					{/if}

					{#if isImportedBooking(selectedBooking)}
						<hr />
						<div class="detail-section">
							<h4 class="section-title">Reservation details (from BC email)</h4>
							{#if isPendingSyncBooking(selectedBooking)}
								<p class="note-box" style="background: var(--color-warning-bg); color: var(--color-warning-text);">
									iCal sync hasn't promoted this date to a full reservation yet —
									press <strong>Sync BC</strong> at the top, then re-open the booking to enrich it.
								</p>
							{/if}
							<div class="form-fields-grid">
								<div>
									<label class="detail-label" for="bc-guest-name">Guest name</label>
									<input id="bc-guest-name" type="text" bind:value={importEdits.guest_name} class="form-input" placeholder="From BC reservation email" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
								<div>
									<label class="detail-label" for="bc-external-ref">BC reservation #</label>
									<input id="bc-external-ref" type="text" bind:value={importEdits.external_ref} class="form-input" placeholder="e.g. 4321567890" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
								<div>
									<label class="detail-label" for="bc-guest-email">Guest email</label>
									<input id="bc-guest-email" type="email" bind:value={importEdits.guest_email} class="form-input" placeholder="proxy@guest.booking.com (or real)" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
								<div>
									<label class="detail-label" for="bc-guest-phone">Guest phone</label>
									<input id="bc-guest-phone" type="tel" bind:value={importEdits.guest_phone} class="form-input" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
								<div>
									<label class="detail-label" for="bc-num-guests">Guests</label>
									<input id="bc-num-guests" type="number" min="1" max="4" bind:value={importEdits.num_guests} class="form-input" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
								<div>
									<label class="detail-label" for="bc-total">Total (EUR)</label>
									<input id="bc-total" type="number" min="0" step="0.01" bind:value={importEdits.total_cost} class="form-input" disabled={isPendingSyncBooking(selectedBooking)} />
								</div>
							</div>
							{#if importSaveError}
								<p class="cancel-error">{importSaveError}</p>
							{/if}
							<div class="notes-actions">
								<button onclick={saveImportEdits} disabled={importSaving || isPendingSyncBooking(selectedBooking)} class="btn-primary btn-sm">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
									{importSaving ? 'Saving…' : 'Save details'}
								</button>
								{#if selectedBooking.status !== 'cancelled' && !isPendingSyncBooking(selectedBooking)}
									<button onclick={() => cancelBcBlock(selectedBooking!)} disabled={cancellingBcBlock} class="btn-outline btn-sm" style="color: var(--color-error-text); border-color: var(--color-error-text);">
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
										{cancellingBcBlock ? 'Cancelling…' : 'Cancel block locally'}
									</button>
								{/if}
							</div>
						</div>
					{/if}

					{#if !isImportedBooking(selectedBooking)}
					<hr />

					<div class="detail-section">
						<h4 class="section-title">Pricing</h4>
						<div class="pricing-rows">
							<div class="pricing-row">
								<span>€{selectedBooking.nightly_rate} × {selectedBooking.num_nights} nights</span>
								<span>{formatCurrency(selectedBooking.subtotal)}</span>
							</div>
							<div class="pricing-row">
								<span>Tax (10%)</span>
								<span>{formatCurrency(selectedBooking.tax)}</span>
							</div>
							<div class="pricing-row total">
								<span>Total</span>
								<span style="color: var(--color-sage);">{formatCurrency(selectedBooking.total_cost)}</span>
							</div>
						</div>
					</div>

					{#if selectedBooking.special_requests}
						<div class="detail-section">
							<h4 class="section-title">Special Requests</h4>
							<p class="note-box">{selectedBooking.special_requests}</p>
						</div>
					{/if}
					{/if}

					<hr />

					<div class="detail-section">
						<div class="notes-header">
							<h4 class="section-title">Admin Notes</h4>
							{#if !editingNotes && !isPendingSyncBooking(selectedBooking)}
								<button onclick={() => { editingNotes = true; notesValue = selectedBooking?.admin_notes || ''; }} class="link-btn">
									{#if selectedBooking.admin_notes}
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
										Edit
									{:else}
										<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
										Add note
									{/if}
								</button>
							{/if}
						</div>
						{#if editingNotes}
							<textarea bind:value={notesValue} class="form-input" rows="3" placeholder="Internal notes about this booking..."></textarea>
							<div class="notes-actions">
								<button onclick={() => editingNotes = false} class="btn-outline btn-sm">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
									Cancel
								</button>
								<button onclick={() => saveNotes(selectedBooking!.id)} class="btn-primary btn-sm">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
									Save
								</button>
							</div>
						{:else if selectedBooking.admin_notes}
							<p class="note-box">{selectedBooking.admin_notes}</p>
						{:else}
							<p class="sub-text" style="font-style: italic;">No notes</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

<style>
	/* Form elements */
	.form-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; }
	.form-input {
		width: 100%; padding: 0.625rem 1rem; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; font-family: inherit; font-size: 0.875rem;
		color: var(--color-text); background: var(--color-bg); outline: none;
		transition: border-color 0.2s ease; box-sizing: border-box; margin-bottom: 1rem;
	}
	.form-input:focus { border-color: var(--color-sage); box-shadow: 0 0 0 2px rgba(107,143,113,0.2); }

	/* Buttons */
	.btn-primary {
		display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
		padding: 0.75rem 1.5rem; background: var(--color-sage); color: white;
		font-weight: 600; border: none; border-radius: 8px; cursor: pointer;
		transition: background-color 0.2s ease;
	}
	.btn-primary:hover { background: var(--color-sage-hover); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-outline {
		display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
		padding: 0.5rem 1rem; background: transparent; border: 1px solid var(--color-cream-dark);
		border-radius: 8px; color: var(--color-text-muted); cursor: pointer; font-size: 0.875rem;
	}
	.btn-outline:hover { background: var(--color-cream); }
	.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
	.full-width { width: 100%; }
	.link-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; color: var(--color-sage); font-size: 0.75rem; cursor: pointer; }
	.link-btn:hover { text-decoration: underline; }
	.link-btn:disabled { opacity: 0.4; cursor: not-allowed; text-decoration: none; }

	/* Bookings table pager — mirrors /admin/audit-log conventions */
	.pager { display: flex; align-items: center; justify-content: center; gap: 1.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--color-cream-dark); }
	.pager .link-btn { font-size: 0.875rem; }
	.page-info { color: var(--color-text-muted); font-size: 0.8rem; }

	/* Dashboard */
	.dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
	.dashboard-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 1rem; }
	.page-title { font-family: 'Lora', serif; font-size: 1.75rem; margin: 0; }
	.page-subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0.25rem 0 0; }

	/* Filters */
	.filters { display: flex; flex-direction: column; gap: 0.75rem; }
	@media (min-width: 600px) { .filters { flex-direction: row; } }
	.search-wrapper { flex: 1; }
	.search-wrapper .form-input { margin-bottom: 0; }
	.status-filters { display: flex; gap: 0.25rem; background: var(--color-bg); border-radius: 8px; border: 1px solid var(--color-cream-dark); padding: 0.25rem; }
	.filter-btn {
		display: inline-flex; align-items: center; gap: 0.35rem;
		padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: 6px; border: none;
		background: transparent; cursor: pointer; text-transform: capitalize; color: var(--color-text-muted);
	}
	.filter-btn.active { background: var(--color-sage); color: white; font-weight: 500; }

	/* Stats */
	.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
	@media (min-width: 600px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
	.stat-card { background: var(--color-bg); border-radius: 12px; padding: 1rem; border: 1px solid var(--color-cream-dark); }
	.stat-label { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
	.stat-value { font-size: 1.5rem; font-weight: 700; margin: 0.25rem 0 0; }

	/* Table */
	.table-container { background: var(--color-bg); border-radius: 16px; border: 1px solid var(--color-cream-dark); overflow: hidden; }
	.empty-state { padding: 3rem; text-align: center; color: var(--color-text-muted); }
	.desktop-table { display: none; overflow-x: auto; }
	@media (min-width: 840px) { .desktop-table { display: block; } }
	table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
	thead tr { border-bottom: 1px solid var(--color-cream-dark); background: var(--color-sage); }
	th { text-align: left; padding: 0.75rem 1rem; font-weight: 600; color: white; letter-spacing: 0.02em; }
	tbody tr { border-bottom: 1px solid var(--color-cream-dark); cursor: pointer; transition: background 0.15s ease; }
	tbody tr:hover { background: var(--color-cream); }
	td { padding: 0.75rem 1rem; }
	.mono { font-family: monospace; font-size: 0.75rem; color: var(--color-sage); }
	.bold { font-weight: 600; }
	.sub-text { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
	.guest-cell { display: flex; align-items: center; gap: 0.5rem; }
	.guest-name { font-weight: 500; margin: 0; }
	.guest-email { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
	.arrow { text-align: right; color: var(--color-text-muted); }

	/* Status badges */
	.status-badge { display: inline-block; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; text-transform: capitalize; }
	.status-badge.pending { background: var(--color-warning-bg); color: var(--color-warning-text); }
	.status-badge.confirmed { background: var(--color-success-bg); color: var(--color-success-text); }
	.status-badge.cancelled { background: var(--color-error-bg); color: var(--color-error-text); }

	/* Source chip — distinguishes test/admin/imported bookings from default 'web' */
	.source-chip {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.45rem;
		border-radius: 4px;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		vertical-align: middle;
	}
	.source-chip.test { background: #fff4d6; color: #8a5a00; border: 1px solid #f5b942; }
	.source-chip.admin { background: #e0ecff; color: #1d4ed8; border: 1px solid #93b8f0; }
	.source-chip.booking_com { background: #003580; color: white; border: 1px solid #003580; }

	/* Booking.com stat card */
	.stat-card--bc { display: flex; flex-direction: column; gap: 0.4rem; }
	.stat-card--bc .stat-label { display: inline-flex; align-items: center; gap: 0.4rem; }
	.bc-logo {
		display: inline-flex; align-items: center; justify-content: center;
		width: 1.1rem; height: 1.1rem; border-radius: 50%;
		background: #003580; color: white; font-weight: 800; font-size: 0.65rem;
		font-family: 'Lora', serif;
	}
	.bc-sync-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.25rem; }
	.bc-sync-btn {
		display: inline-flex; align-items: center; gap: 0.4rem;
		padding: 0.35rem 0.75rem; border-radius: 6px; border: none; cursor: pointer;
		background: #003580; color: white; font-weight: 600; font-size: 0.8rem;
		transition: background 0.15s ease;
	}
	.bc-sync-btn:hover:not(:disabled) { background: #002e6b; }
	.bc-sync-btn:disabled { opacity: 0.6; cursor: not-allowed; }
	.bc-sync-meta { font-size: 0.7rem; color: var(--color-text-muted); }
	.bc-pending-badge {
		display: inline-block; margin-left: 0.4rem;
		font-size: 0.7rem; font-weight: 700; vertical-align: middle;
		padding: 0.1rem 0.45rem; border-radius: 9999px;
		background: #fff4d6; color: #8a5a00; border: 1px solid #f5b942;
	}
	.bc-sync-msg { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }

	.form-fields-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}
	@media (max-width: 599px) { .form-fields-grid { grid-template-columns: 1fr; } }
	.form-fields-grid .form-input { margin-bottom: 0; }

	/* Clickable stat cards (status filter shortcut) */
	button.stat-card { font: inherit; text-align: left; cursor: pointer; }
	.stat-card--clickable { transition: background 0.15s ease, border-color 0.15s ease; }
	.stat-card--clickable:hover { background: var(--color-cream); }
	.stat-card--clickable.active { border-color: var(--color-sage); box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-sage) 20%, transparent); }

	/* Calendar view */
	.view-toggle { display: flex; gap: 0.25rem; background: var(--color-bg); border-radius: 8px; border: 1px solid var(--color-cream-dark); padding: 0.25rem; }
	.calendar-container { display: flex; flex-direction: column; gap: 0.75rem; }
	.admin-cal-legend {
		display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 1rem;
		padding: 0.75rem 1rem; background: var(--color-bg);
		border: 1px solid var(--color-cream-dark); border-radius: 12px;
		font-size: 0.75rem; color: var(--color-text-muted);
	}
	.admin-cal-legend .lk { width: 0.9rem; height: 0.9rem; border-radius: 4px; display: inline-block; }
	.admin-cal-legend .lk.confirmed { background: var(--color-sage); }
	.admin-cal-legend .lk.pending { background: #fff4d6; border: 2px dashed #f5b942; box-sizing: border-box; }
	.admin-cal-legend .lk.imported { background: repeating-linear-gradient(45deg, #4a90c2, #4a90c2 3px, #2e5d80 3px, #2e5d80 6px); }
	.admin-cal-legend .lk.test { background: repeating-linear-gradient(45deg, #f5b942, #f5b942 3px, #e89c1c 3px, #e89c1c 6px); }
	.admin-cal-legend .lk.cancelled { background: var(--color-cream-dark); opacity: 0.6; }
	.admin-cal-legend .hint { margin-left: auto; font-style: italic; }

	/* Mobile cards */
	.mobile-cards { display: block; }
	@media (min-width: 840px) { .mobile-cards { display: none; } }
	.mobile-card { width: 100%; text-align: left; padding: 1rem; border: none; background: transparent; border-bottom: 1px solid var(--color-cream-dark); cursor: pointer; }
	.mobile-card:hover { background: var(--color-cream); }
	.mobile-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
	.mobile-card-bottom { display: flex; justify-content: space-between; font-size: 0.875rem; color: var(--color-text-muted); }

	/* Detail panel */
	.overlay { position: fixed; inset: 0; z-index: 50; display: flex; justify-content: flex-end; }
	.overlay-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.3); border: none; cursor: pointer; }
	.detail-panel { position: relative; width: 100%; max-width: 32rem; background: var(--color-bg); box-shadow: -4px 0 24px rgba(0,0,0,0.1); overflow-y: auto; }
	.detail-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
	.detail-header { display: flex; justify-content: space-between; align-items: flex-start; }
	.detail-title { font-family: 'Lora', serif; font-size: 1.5rem; margin: 0.25rem 0 0; }
	.close-btn { padding: 0.5rem; border-radius: 50%; border: none; background: transparent; cursor: pointer; color: var(--color-text-muted); font-size: 1.25rem; }
	.close-btn:hover { background: var(--color-cream); }
	hr { border: none; border-top: 1px solid var(--color-cream-dark); margin: 0; }

	.detail-section { display: flex; flex-direction: column; gap: 0.5rem; }
	.detail-label { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
	.section-title { font-size: 0.875rem; font-weight: 600; margin: 0; }
	.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; font-size: 0.875rem; }
	.detail-grid p { margin: 0; }
	.detail-grid a { color: var(--color-sage); }

	.status-line { display: flex; align-items: center; gap: 0.5rem; }
	.status-buttons { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.status-toggle {
		display: inline-flex; align-items: center; gap: 0.35rem;
		padding: 0.375rem 0.75rem; font-size: 0.875rem; border-radius: 9999px;
		text-transform: capitalize; cursor: pointer; transition: all 0.15s ease;
		border: 1px solid var(--color-cream-dark); background: transparent; color: var(--color-text-muted);
	}
	.status-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
	.status-toggle.active.pending { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-text); font-weight: 600; }
	.status-toggle.active.confirmed { background: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-text); font-weight: 600; }
	.status-toggle.active.cancelled { background: var(--color-error-bg); color: var(--color-error-text); border-color: var(--color-error-text); font-weight: 600; }

	.pricing-rows { font-size: 0.875rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.pricing-row { display: flex; justify-content: space-between; color: var(--color-text-muted); }
	.pricing-row.total { font-weight: 600; color: var(--color-text); padding-top: 0.5rem; border-top: 1px solid var(--color-cream-dark); }

	.note-box { font-size: 0.875rem; color: var(--color-text-muted); background: var(--color-cream); padding: 0.75rem; border-radius: 8px; margin: 0; }
	.notes-header { display: flex; justify-content: space-between; align-items: center; }
	.notes-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

	/* Cancel & Refund dialog (PR 4 admin slice) */
	.cancel-overlay { z-index: 60; align-items: center; justify-content: center; }
	.cancel-dialog { position: relative; width: min(32rem, 100%); max-height: 90vh; overflow-y: auto; background: var(--color-bg); border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.2); margin: 1rem; }
	.cancel-radio { display: flex; gap: 0.5rem; align-items: flex-start; padding: 0.5rem 0; cursor: pointer; font-size: 0.875rem; }
	.cancel-radio input[type="radio"] { margin-top: 0.2rem; cursor: pointer; }
	.cancel-radio input[type="radio"]:disabled { cursor: not-allowed; }
	.cancel-error { color: var(--color-error-text); background: var(--color-error-bg); padding: 0.625rem 0.75rem; border-radius: 8px; font-size: 0.875rem; margin: 0; }
	.cancel-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
</style>
