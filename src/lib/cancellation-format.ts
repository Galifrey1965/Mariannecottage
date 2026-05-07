// Render a cancellation policy's schedule as user-facing prose. Used by
// /legal, /book and /book/windows so the published copy follows whatever
// the active policy says, not a static i18n string that drifts when an
// admin edits the policy.

import type { CancellationPolicy } from '$lib/server/supabase';
import { t, type Messages } from '$lib/i18n';

export function formatPolicyScheduleLines(
	policy: CancellationPolicy,
	messages: Messages
): string[] {
	const sorted = [...policy.schedule].sort(
		(a, b) => b.days_before_check_in - a.days_before_check_in
	);
	return sorted.map((row, i) => {
		const prev = sorted[i - 1];
		const outcome =
			row.refund_pct > 0
				? t(messages, 'cancellation.refund_pct', { pct: String(row.refund_pct) })
				: t(messages, 'cancellation.no_refund');
		if (i === 0) {
			return t(messages, 'cancellation.tier_top', {
				days: String(row.days_before_check_in),
				outcome
			});
		}
		if (i === sorted.length - 1) {
			return t(messages, 'cancellation.tier_bottom', {
				days: String(prev.days_before_check_in),
				outcome
			});
		}
		return t(messages, 'cancellation.tier_middle', {
			from: String(row.days_before_check_in),
			to: String(prev.days_before_check_in - 1),
			outcome
		});
	});
}

export function formatPolicySummary(
	policy: CancellationPolicy,
	messages: Messages
): string {
	return formatPolicyScheduleLines(policy, messages).join(' · ');
}
