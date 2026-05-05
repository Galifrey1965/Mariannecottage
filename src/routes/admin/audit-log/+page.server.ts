import type { PageServerLoad } from './$types';
import { adminClient } from '$lib/server/supabase';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return {
			events: [],
			profilesById: {} as Record<string, { display_name: string; role: string }>,
			page: 0,
			pageSize: PAGE_SIZE,
			total: 0,
			actionPrefix: '',
			fromDate: '',
			toDate: ''
		};
	}

	const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
	const actionPrefix = (url.searchParams.get('action') ?? '').trim();
	const fromDate = (url.searchParams.get('from') ?? '').trim();
	const toDate = (url.searchParams.get('to') ?? '').trim();

	let q = adminClient
		.from('agent_events')
		.select('id, user_id, action, target_type, target_id, metadata, created_at', { count: 'exact' })
		.order('created_at', { ascending: false });

	if (actionPrefix) {
		q = q.ilike('action', `${actionPrefix}%`);
	}
	if (fromDate) {
		q = q.gte('created_at', `${fromDate}T00:00:00Z`);
	}
	if (toDate) {
		q = q.lte('created_at', `${toDate}T23:59:59Z`);
	}

	const start = page * PAGE_SIZE;
	q = q.range(start, start + PAGE_SIZE - 1);

	const { data, error, count } = await q;
	if (error) {
		console.error('[admin/audit-log] query failed:', error);
		return {
			events: [],
			profilesById: {},
			page,
			pageSize: PAGE_SIZE,
			total: 0,
			actionPrefix,
			fromDate,
			toDate
		};
	}

	const userIds = Array.from(
		new Set((data ?? []).map((r) => r.user_id).filter((id): id is string => Boolean(id)))
	);
	const profilesById: Record<string, { display_name: string; role: string }> = {};
	if (userIds.length > 0) {
		const { data: profiles } = await adminClient
			.from('user_profiles')
			.select('user_id, display_name, role')
			.in('user_id', userIds);
		for (const p of profiles ?? []) {
			profilesById[p.user_id as string] = {
				display_name: p.display_name as string,
				role: p.role as string
			};
		}
	}

	return {
		events: data ?? [],
		profilesById,
		page,
		pageSize: PAGE_SIZE,
		total: count ?? 0,
		actionPrefix,
		fromDate,
		toDate
	};
};
