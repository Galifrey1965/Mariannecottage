// E-01: admin list for contact-form enquiries.
//
// Newest first, filtered by status, paginated. Follows the /admin/audit-log
// pattern: filters live in the URL so a view is linkable and a status change
// can just invalidate the load.

import type { PageServerLoad } from './$types';
import { listEnquiriesAdmin, getEnquiryCounts, type EnquiryStatus } from '$lib/server/supabase';

const PAGE_SIZE = 25;

const VALID_FILTERS = ['new', 'replied', 'archived', 'spam', 'all'] as const;
type EnquiryFilter = (typeof VALID_FILTERS)[number];

// 'new' is the default view because it is the actionable one — this page is an
// inbox, not an archive browser. The header counts stop anything sitting
// unnoticed outside the current filter.
const DEFAULT_FILTER: EnquiryFilter = 'new';

function emptyResult(status: EnquiryFilter) {
	return {
		enquiries: [],
		page: 0,
		pageSize: PAGE_SIZE,
		total: 0,
		status,
		newCount: 0,
		spamCount: 0,
		unnotifiedCount: 0
	};
}

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return emptyResult(DEFAULT_FILTER);
	}

	const requested = (url.searchParams.get('status') ?? '').trim();
	const status: EnquiryFilter = (VALID_FILTERS as readonly string[]).includes(requested)
		? (requested as EnquiryFilter)
		: DEFAULT_FILTER;
	const page = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);

	try {
		const [{ enquiries, total }, counts] = await Promise.all([
			listEnquiriesAdmin({
				status: status === 'all' ? 'all' : (status as EnquiryStatus),
				page,
				pageSize: PAGE_SIZE
			}),
			getEnquiryCounts()
		]);

		return {
			enquiries,
			page,
			pageSize: PAGE_SIZE,
			total,
			status,
			...counts
		};
	} catch (error) {
		// Same posture as the other admin lists: log and render an empty table
		// rather than throwing a 500 at someone who just wanted to read their post.
		console.error('[admin/enquiries] query failed:', error);
		return emptyResult(status);
	}
};
