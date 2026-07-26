// Admin status transitions for enquiries.
//
// PATCH → move one enquiry between statuses, by body.id
//
// There is no POST (enquiries arrive from /api/contact) and no DELETE:
// retention is a disclosed 24-month clock on /legal, enforced by
// purgeOldEnquiries in the daily sweep. Letting an admin delete rows early
// would put a second, undocumented deletion path next to the disclosed one —
// 'archived' is the way to get something out of the inbox.

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getEnquiry,
	updateEnquiryStatus,
	logAdminEvent,
	type EnquiryStatus
} from '$lib/server/supabase';

// Explicit state machine, mirroring the /api/admin/bookings posture: an
// unlisted transition is a 409 rather than a silent no-op, so a stale tab
// cannot quietly undo someone else's work.
//
// spam → new is the false-positive rescue. It matters that it lands on 'new'
// and not 'replied': a rescued row has admin_notified_at IS NULL, which makes
// it eligible for the E-02 retry sweep, so rescuing also gets the notification
// out that the spam classifier suppressed.
const ALLOWED_TRANSITIONS: Record<EnquiryStatus, EnquiryStatus[]> = {
	new: ['replied', 'archived'],
	replied: ['archived', 'new'],
	archived: ['new'],
	spam: ['new']
};

const VALID_STATUSES = Object.keys(ALLOWED_TRANSITIONS) as EnquiryStatus[];

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();

	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const status = body.status ? String(body.status) : '';
	if (!VALID_STATUSES.includes(status as EnquiryStatus)) {
		return json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
	}
	const next = status as EnquiryStatus;

	const existing = await getEnquiry(id);
	if (!existing) return json({ error: 'Enquiry not found' }, { status: 404 });

	if (existing.status === next) {
		return json({ success: true, enquiry: existing });
	}

	if (!ALLOWED_TRANSITIONS[existing.status].includes(next)) {
		return json(
			{ error: `Cannot move an enquiry from ${existing.status} to ${next}` },
			{ status: 409 }
		);
	}

	const enquiry = await updateEnquiryStatus(id, next);
	await logAdminEvent({
		user_id: locals.user.id,
		action: 'enquiry.status_change',
		target_type: 'enquiry',
		target_id: id,
		metadata: {
			from: existing.status,
			to: next,
			// Worth recording on a rescue: it says the classifier was wrong, and
			// which rule got it wrong.
			spam_reason: existing.spam_reason,
			was_notified: Boolean(existing.admin_notified_at)
		}
	});

	return json({ success: true, enquiry });
};
