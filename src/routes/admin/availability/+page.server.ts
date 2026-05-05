import type { PageServerLoad } from './$types';
import { adminClient, getBlockedAvailability } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { bookings: [], blockedAvailability: [] };
	}

	const today = new Date().toISOString().slice(0, 10);
	const horizon = new Date();
	horizon.setUTCMonth(horizon.getUTCMonth() + 12);
	const horizonISO = horizon.toISOString().slice(0, 10);

	const { data, error } = await adminClient
		.from('bookings')
		.select('id, check_in_date, check_out_date, status, source, guest_name, booking_reference')
		.in('status', ['pending', 'pending_payment', 'confirmed'])
		.gte('check_out_date', today)
		.lte('check_in_date', horizonISO)
		.order('check_in_date', { ascending: true });

	if (error) {
		console.error('[admin/availability] bookings query failed:', error);
	}

	let blockedAvailability: Awaited<ReturnType<typeof getBlockedAvailability>> = [];
	try {
		blockedAvailability = await getBlockedAvailability(today);
	} catch (err) {
		console.error('[admin/availability] blocked availability fetch failed:', err);
	}

	return {
		bookings: data ?? [],
		blockedAvailability
	};
};
