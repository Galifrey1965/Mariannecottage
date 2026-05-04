import type { PageServerLoad } from './$types';
import { adminClient, getBlockedAvailability, getLastBcSyncAt } from '$lib/server/supabase';

// PR 4 (admin slice): cumulative absorbed-Stripe-fee total for the dashboard
// stat card. Sums metadata->absorbed_fee_estimate across every admin cancel
// that issued a refund. Estimates only — refine to real balance-transaction
// figures once we wire up Stripe BT lookup.

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return { absorbedFeeTotal: 0, absorbedFeeRefundCount: 0, blockedAvailability: [], lastBcSyncAt: null };
	}

	const today = new Date().toISOString().slice(0, 10);
	let blockedAvailability: Awaited<ReturnType<typeof getBlockedAvailability>> = [];
	try {
		blockedAvailability = await getBlockedAvailability(today);
	} catch (err) {
		console.error('[admin/+page.server] blocked availability fetch failed:', err);
	}
	const lastBcSyncAt = await getLastBcSyncAt();

	const { data, error } = await adminClient
		.from('agent_events')
		.select('metadata')
		.eq('action', 'admin_cancel_refund');

	if (error) {
		console.error('[admin/+page.server] absorbed-fee query failed:', error);
		return { absorbedFeeTotal: 0, absorbedFeeRefundCount: 0, blockedAvailability, lastBcSyncAt };
	}

	let total = 0;
	let count = 0;
	for (const row of data ?? []) {
		const metadata = row.metadata as Record<string, unknown> | null;
		const fee = Number(metadata?.absorbed_fee_estimate ?? 0);
		const refunded = Number(metadata?.refund_amount ?? 0);
		if (fee > 0 || refunded > 0) {
			total += fee;
			count += 1;
		}
	}
	return {
		absorbedFeeTotal: Math.round(total * 100) / 100,
		absorbedFeeRefundCount: count,
		blockedAvailability,
		lastBcSyncAt
	};
};
