<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { t } from '$lib/i18n';
	import BookingConfirmed from '$lib/components/BookingConfirmed.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const lang = $derived(data.lang);
	const messages = $derived(data.messages);
	const booking = $derived(data.booking);

	// Webhook race: Stripe redirects user back the instant payment succeeds, but
	// our webhook handler runs asynchronously. Poll the load function until
	// status flips to confirmed (or we give up after ~12s).
	let pollAttempts = $state(0);
	const MAX_POLLS = 6;
	onMount(() => {
		if (booking.status !== 'pending_payment') return;
		const interval = setInterval(async () => {
			pollAttempts += 1;
			await invalidateAll();
			if (booking.status !== 'pending_payment' || pollAttempts >= MAX_POLLS) {
				clearInterval(interval);
			}
		}, 2000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>{t(messages, 'booking_confirm.title')}</title>
</svelte:head>

<section class="page-section">
	<BookingConfirmed {messages} {lang} {booking} />
</section>

<style>
	.page-section { max-width: 48rem; margin: 0 auto; padding: 4rem 1rem; }
	@media (min-width: 600px) { .page-section { padding: 4rem 1.5rem; } }
</style>
