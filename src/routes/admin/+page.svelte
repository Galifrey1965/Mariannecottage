<script lang="ts">
	import type { PageData } from './$types';
	import type { Booking } from '$lib/server/supabase';

	let { data }: { data: PageData } = $props();

	// Auth state
	let authed = $state(data.authed);
	let password = $state('');
	let loginError = $state('');
	let loggingIn = $state(false);

	// Dashboard state
	let bookings = $state<Booking[]>([]);
	let totalBookings = $state(0);
	let loading = $state(false);
	let statusFilter = $state('all');
	let searchQuery = $state('');
	let searchTimeout: ReturnType<typeof setTimeout>;

	// Detail panel
	let selectedBooking = $state<Booking | null>(null);
	let editingNotes = $state(false);
	let notesValue = $state('');
	let updatingStatus = $state(false);

	async function login() {
		loggingIn = true;
		loginError = '';
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			});
			const result = await res.json();
			if (result.success) {
				authed = true;
				fetchBookings();
			} else {
				loginError = result.error || 'Login failed';
			}
		} catch {
			loginError = 'Network error';
		} finally {
			loggingIn = false;
		}
	}

	async function logout() {
		await fetch('/api/admin/login', { method: 'DELETE' });
		authed = false;
		password = '';
	}

	async function fetchBookings() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'all') params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);

			const res = await fetch(`/api/admin/bookings?${params}`);
			const result = await res.json();
			bookings = result.bookings || [];
			totalBookings = result.total || 0;
		} catch {
			bookings = [];
		} finally {
			loading = false;
		}
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
				await fetchBookings();
				if (selectedBooking?.id === id) {
					selectedBooking = result.booking;
				}
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
				if (selectedBooking?.id === id) {
					selectedBooking = result.booking;
				}
			}
		} catch { /* ignore */ }
	}

	function onSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => fetchBookings(), 300);
	}

	function selectBooking(b: Booking) {
		selectedBooking = b;
		editingNotes = false;
		notesValue = b.admin_notes || '';
	}

	function closeDetail() {
		selectedBooking = null;
		editingNotes = false;
	}

	// Load bookings on auth
	$effect(() => {
		if (authed) fetchBookings();
	});

	// Refetch on filter change
	$effect(() => {
		if (authed) {
			// Track statusFilter to trigger refetch
			statusFilter;
			fetchBookings();
		}
	});

	const statusColors: Record<string, string> = {
		pending: 'bg-amber-100 text-amber-800',
		confirmed: 'bg-green-100 text-green-800',
		cancelled: 'bg-red-100 text-red-800'
	};

	const countryFlags: Record<string, string> = {
		GB: '🇬🇧', FR: '🇫🇷', DE: '🇩🇪', NL: '🇳🇱', BE: '🇧🇪', US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺'
	};

	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

	const formatCurrency = (n: number) =>
		new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(n);

	const formatRelative = (iso: string) => {
		const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		if (days < 0) return `${Math.abs(days)}d ago`;
		if (days === 0) return 'Today';
		if (days === 1) return 'Tomorrow';
		return `in ${days}d`;
	};

	// Stats
	const confirmedBookings = $derived(bookings.filter(b => b.status === 'confirmed'));
	const pendingBookings = $derived(bookings.filter(b => b.status === 'pending'));
	const totalRevenue = $derived(confirmedBookings.reduce((sum, b) => sum + b.total_cost, 0));
	const upcomingBookings = $derived(bookings.filter(b => new Date(b.check_in_date) > new Date() && b.status !== 'cancelled'));
</script>

{#if !authed}
	<!-- Login -->
	<div class="flex items-center justify-center min-h-[70vh]">
		<div class="w-full max-w-sm bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-large)] p-8 shadow-lg">
			<h2 class="md-headline-medium text-[var(--md-sys-color-on-surface)] mb-6 text-center">Admin Login</h2>

			<form onsubmit={(e) => { e.preventDefault(); login(); }}>
				<label for="password" class="block text-sm font-medium text-[var(--md-sys-color-on-surface)] mb-2">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					class="w-full px-4 py-3 border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] mb-4"
					placeholder="Enter admin password"
					autofocus
				/>

				{#if loginError}
					<p class="text-sm text-[var(--md-sys-color-error)] mb-4">{loginError}</p>
				{/if}

				<button
					type="submit"
					disabled={loggingIn || !password}
					class="w-full px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-semibold rounded-[var(--md-shape-corner-large)] hover:shadow-md transition-all disabled:opacity-50"
				>
					{loggingIn ? 'Signing in...' : 'Sign In'}
				</button>
			</form>
		</div>
	</div>
{:else}
	<!-- Dashboard -->
	<div class="space-y-6">
		<!-- Header row -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h2 class="md-headline-large text-[var(--md-sys-color-on-surface)]">Bookings</h2>
				<p class="text-sm text-[var(--md-sys-color-on-surface-variant)]">{totalBookings} total bookings</p>
			</div>
			<button
				onclick={logout}
				class="self-start px-4 py-2 text-sm border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] rounded-[var(--md-shape-corner-small)] hover:bg-[var(--md-sys-color-surface-container)]"
			>
				Sign Out
			</button>
		</div>

		<!-- Filters -->
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Search -->
			<div class="flex-1">
				<input
					type="text"
					bind:value={searchQuery}
					oninput={onSearchInput}
					placeholder="Search by name, email, or reference..."
					class="w-full px-4 py-2.5 border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
				/>
			</div>

			<!-- Status filter -->
			<div class="flex gap-1 bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-small)] border border-[var(--md-sys-color-outline-variant)] p-1">
				{#each ['all', 'pending', 'confirmed', 'cancelled'] as s}
					<button
						onclick={() => statusFilter = s}
						class="px-3 py-1.5 text-sm rounded-[var(--md-shape-corner-extra-small)] transition-colors capitalize
							{statusFilter === s
								? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-medium'
								: 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'}"
					>
						{s}
					</button>
				{/each}
			</div>
		</div>

		<!-- Stats cards -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-medium)] p-4 border border-[var(--md-sys-color-outline-variant)]">
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Confirmed</p>
				<p class="text-2xl font-bold text-green-700">{confirmedBookings.length}</p>
			</div>
			<div class="bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-medium)] p-4 border border-[var(--md-sys-color-outline-variant)]">
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Pending</p>
				<p class="text-2xl font-bold text-amber-700">{pendingBookings.length}</p>
			</div>
			<div class="bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-medium)] p-4 border border-[var(--md-sys-color-outline-variant)]">
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Revenue</p>
				<p class="text-2xl font-bold text-[var(--md-sys-color-primary)]">{formatCurrency(totalRevenue)}</p>
			</div>
			<div class="bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-medium)] p-4 border border-[var(--md-sys-color-outline-variant)]">
				<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Upcoming</p>
				<p class="text-2xl font-bold text-[var(--md-sys-color-tertiary)]">{upcomingBookings.length}</p>
			</div>
		</div>

		<!-- Bookings table -->
		<div class="bg-[var(--md-sys-color-surface)] rounded-[var(--md-shape-corner-large)] border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
			{#if loading}
				<div class="p-12 text-center text-[var(--md-sys-color-on-surface-variant)]">Loading...</div>
			{:else if bookings.length === 0}
				<div class="p-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
					No bookings found
				</div>
			{:else}
				<!-- Desktop table -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Reference</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Guest</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Check-in</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Nights</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Guests</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Total</th>
								<th class="text-left px-4 py-3 font-medium text-[var(--md-sys-color-on-surface-variant)]">Status</th>
								<th class="px-4 py-3"></th>
							</tr>
						</thead>
						<tbody>
							{#each bookings as booking}
								<tr
									class="border-b border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer transition-colors"
									onclick={() => selectBooking(booking)}
								>
									<td class="px-4 py-3 font-mono text-xs text-[var(--md-sys-color-primary)]">{booking.booking_reference}</td>
									<td class="px-4 py-3">
										<div class="flex items-center gap-2">
											{#if booking.guest_country && countryFlags[booking.guest_country]}
												<span>{countryFlags[booking.guest_country]}</span>
											{/if}
											<div>
												<p class="font-medium text-[var(--md-sys-color-on-surface)]">{booking.guest_name}</p>
												<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">{booking.guest_email}</p>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">
										<p class="text-[var(--md-sys-color-on-surface)]">{formatDate(booking.check_in_date)}</p>
										<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">{formatRelative(booking.check_in_date)}</p>
									</td>
									<td class="px-4 py-3 text-[var(--md-sys-color-on-surface)]">{booking.num_nights}</td>
									<td class="px-4 py-3 text-[var(--md-sys-color-on-surface)]">{booking.num_guests}</td>
									<td class="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">{formatCurrency(booking.total_cost)}</td>
									<td class="px-4 py-3">
										<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {statusColors[booking.status] || ''}">
											{booking.status}
										</span>
									</td>
									<td class="px-4 py-3 text-right">
										<span class="text-[var(--md-sys-color-on-surface-variant)]">→</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile cards -->
				<div class="md:hidden divide-y divide-[var(--md-sys-color-outline-variant)]">
					{#each bookings as booking}
						<button
							onclick={() => selectBooking(booking)}
							class="w-full text-left p-4 hover:bg-[var(--md-sys-color-surface-container-low)] transition-colors"
						>
							<div class="flex justify-between items-start mb-2">
								<div>
									<p class="font-medium text-[var(--md-sys-color-on-surface)]">
										{#if booking.guest_country && countryFlags[booking.guest_country]}
											{countryFlags[booking.guest_country]}
										{/if}
										{booking.guest_name}
									</p>
									<p class="text-xs font-mono text-[var(--md-sys-color-primary)]">{booking.booking_reference}</p>
								</div>
								<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize {statusColors[booking.status] || ''}">
									{booking.status}
								</span>
							</div>
							<div class="flex justify-between text-sm text-[var(--md-sys-color-on-surface-variant)]">
								<span>{formatDate(booking.check_in_date)} · {booking.num_nights}n · {booking.num_guests}g</span>
								<span class="font-medium text-[var(--md-sys-color-on-surface)]">{formatCurrency(booking.total_cost)}</span>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Detail slide-over -->
	{#if selectedBooking}
		<div class="fixed inset-0 z-50 flex justify-end">
			<!-- Backdrop -->
			<button
				onclick={closeDetail}
				class="absolute inset-0 bg-black/30"
				aria-label="Close"
			></button>

			<!-- Panel -->
			<div class="relative w-full max-w-lg bg-[var(--md-sys-color-surface)] shadow-xl overflow-y-auto">
				<div class="p-6 space-y-6">
					<!-- Header -->
					<div class="flex justify-between items-start">
						<div>
							<p class="text-xs font-mono text-[var(--md-sys-color-primary)] mb-1">{selectedBooking.booking_reference}</p>
							<h3 class="md-headline-medium text-[var(--md-sys-color-on-surface)]">{selectedBooking.guest_name}</h3>
						</div>
						<button
							onclick={closeDetail}
							class="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]"
						>
							✕
						</button>
					</div>

					<!-- Status -->
					<div>
						<p class="text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2">Status</p>
						<div class="flex gap-2">
							{#each ['pending', 'confirmed', 'cancelled'] as s}
								<button
									onclick={() => updateBookingStatus(selectedBooking.id, s)}
									disabled={updatingStatus || selectedBooking.status === s}
									class="px-3 py-1.5 text-sm rounded-full capitalize transition-colors
										{selectedBooking.status === s
											? statusColors[s] + ' font-semibold ring-2 ring-offset-1 ring-current'
											: 'border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)]'}
										disabled:opacity-50"
								>
									{s}
								</button>
							{/each}
						</div>
					</div>

					<hr class="border-[var(--md-sys-color-outline-variant)]" />

					<!-- Guest details -->
					<div class="space-y-3">
						<h4 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Guest Details</h4>
						<div class="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Email</p>
								<a href="mailto:{selectedBooking.guest_email}" class="text-[var(--md-sys-color-primary)] hover:underline">{selectedBooking.guest_email}</a>
							</div>
							{#if selectedBooking.guest_phone}
								<div>
									<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Phone</p>
									<a href="tel:{selectedBooking.guest_phone}" class="text-[var(--md-sys-color-primary)] hover:underline">{selectedBooking.guest_phone}</a>
								</div>
							{/if}
							{#if selectedBooking.guest_country}
								<div>
									<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Country</p>
									<p class="text-[var(--md-sys-color-on-surface)]">
										{countryFlags[selectedBooking.guest_country] || ''} {selectedBooking.guest_country}
									</p>
								</div>
							{/if}
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Guests</p>
								<p class="text-[var(--md-sys-color-on-surface)]">{selectedBooking.num_guests}</p>
							</div>
						</div>
					</div>

					<hr class="border-[var(--md-sys-color-outline-variant)]" />

					<!-- Stay details -->
					<div class="space-y-3">
						<h4 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Stay Details</h4>
						<div class="grid grid-cols-2 gap-3 text-sm">
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Check-in</p>
								<p class="text-[var(--md-sys-color-on-surface)]">{formatDate(selectedBooking.check_in_date)}</p>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">{formatRelative(selectedBooking.check_in_date)}</p>
							</div>
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Check-out</p>
								<p class="text-[var(--md-sys-color-on-surface)]">{formatDate(selectedBooking.check_out_date)}</p>
							</div>
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Duration</p>
								<p class="text-[var(--md-sys-color-on-surface)]">{selectedBooking.num_nights} nights</p>
							</div>
							<div>
								<p class="text-xs text-[var(--md-sys-color-on-surface-variant)]">Booked</p>
								<p class="text-[var(--md-sys-color-on-surface)]">{formatDate(selectedBooking.created_at)}</p>
							</div>
						</div>
					</div>

					<hr class="border-[var(--md-sys-color-outline-variant)]" />

					<!-- Pricing -->
					<div class="space-y-2">
						<h4 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Pricing</h4>
						<div class="text-sm space-y-1">
							<div class="flex justify-between text-[var(--md-sys-color-on-surface-variant)]">
								<span>€{selectedBooking.nightly_rate} × {selectedBooking.num_nights} nights</span>
								<span>{formatCurrency(selectedBooking.subtotal)}</span>
							</div>
							<div class="flex justify-between text-[var(--md-sys-color-on-surface-variant)]">
								<span>Tax (10%)</span>
								<span>{formatCurrency(selectedBooking.tax)}</span>
							</div>
							<div class="flex justify-between font-semibold text-[var(--md-sys-color-on-surface)] pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
								<span>Total</span>
								<span class="text-[var(--md-sys-color-primary)]">{formatCurrency(selectedBooking.total_cost)}</span>
							</div>
						</div>
					</div>

					<!-- Special requests -->
					{#if selectedBooking.special_requests}
						<div>
							<h4 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mb-1">Special Requests</h4>
							<p class="text-sm text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-[var(--md-shape-corner-small)]">
								{selectedBooking.special_requests}
							</p>
						</div>
					{/if}

					<hr class="border-[var(--md-sys-color-outline-variant)]" />

					<!-- Admin notes -->
					<div>
						<div class="flex justify-between items-center mb-2">
							<h4 class="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">Admin Notes</h4>
							{#if !editingNotes}
								<button
									onclick={() => { editingNotes = true; notesValue = selectedBooking?.admin_notes || ''; }}
									class="text-xs text-[var(--md-sys-color-primary)] hover:underline"
								>
									{selectedBooking.admin_notes ? 'Edit' : 'Add note'}
								</button>
							{/if}
						</div>

						{#if editingNotes}
							<textarea
								bind:value={notesValue}
								class="w-full px-3 py-2 text-sm border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
								rows="3"
								placeholder="Internal notes about this booking..."
							></textarea>
							<div class="flex gap-2 mt-2">
								<button
									onclick={() => editingNotes = false}
									class="px-3 py-1.5 text-xs border border-[var(--md-sys-color-outline)] rounded-[var(--md-shape-corner-small)] text-[var(--md-sys-color-on-surface-variant)]"
								>
									Cancel
								</button>
								<button
									onclick={() => saveNotes(selectedBooking.id)}
									class="px-3 py-1.5 text-xs bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-[var(--md-shape-corner-small)]"
								>
									Save
								</button>
							</div>
						{:else if selectedBooking.admin_notes}
							<p class="text-sm text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 rounded-[var(--md-shape-corner-small)]">
								{selectedBooking.admin_notes}
							</p>
						{:else}
							<p class="text-sm text-[var(--md-sys-color-on-surface-variant)] italic">No notes</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}
