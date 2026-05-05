// PR 4: cancellation_policies admin CRUD.
//
// GET    → list all policies
// POST   → create
// PATCH  → update by id (body.id)
// DELETE → remove by id (body.id) — refuses if any booking references it OR
//          if it's the only is_default row
//
// Spec: documentation/specs/phase-2-direct-booking.md PR 4

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listCancellationPoliciesAdmin,
	createCancellationPolicy,
	updateCancellationPolicy,
	deleteCancellationPolicy,
	countBookingsUsingPolicy,
	logAdminEvent,
	type CancellationPolicyInput
} from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

function validateSchedule(schedule: unknown): string | null {
	if (!Array.isArray(schedule)) return 'schedule must be an array';
	if (schedule.length === 0) return 'schedule must contain at least one window';
	for (const [i, item] of schedule.entries()) {
		if (typeof item !== 'object' || item === null) {
			return `schedule[${i}] must be an object`;
		}
		const row = item as Record<string, unknown>;
		const days = Number(row.days_before_check_in);
		const pct = Number(row.refund_pct);
		if (!Number.isInteger(days) || days < 0) {
			return `schedule[${i}].days_before_check_in must be a non-negative integer`;
		}
		if (!Number.isInteger(pct) || pct < 0 || pct > 100) {
			return `schedule[${i}].refund_pct must be an integer 0-100`;
		}
	}
	return null;
}

function validateInput(input: Partial<CancellationPolicyInput>, isCreate: boolean): string | null {
	if (isCreate || input.name !== undefined) {
		const name = typeof input.name === 'string' ? input.name.trim() : '';
		if (!name) return 'name required';
	}
	if (isCreate || input.schedule !== undefined) {
		const err = validateSchedule(input.schedule);
		if (err) return err;
	}
	return null;
}

function coerceInput(body: Record<string, unknown>): Partial<CancellationPolicyInput> {
	const out: Partial<CancellationPolicyInput> = {};
	if (body.name !== undefined) out.name = String(body.name).trim();
	if (body.description !== undefined) {
		out.description = body.description === null ? null : String(body.description);
	}
	if (body.schedule !== undefined) {
		// Normalise to integers — mirrors validateSchedule's checks.
		out.schedule = Array.isArray(body.schedule)
			? body.schedule.map((row) => ({
					days_before_check_in: Number((row as Record<string, unknown>).days_before_check_in),
					refund_pct: Number((row as Record<string, unknown>).refund_pct)
			  }))
			: (body.schedule as never);
	}
	if (body.is_default !== undefined) out.is_default = Boolean(body.is_default);
	return out;
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return unauthorized();
	const policies = await listCancellationPoliciesAdmin();
	return json({ policies });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const input = coerceInput(body);

	const err = validateInput(input, true);
	if (err) return json({ error: err }, { status: 400 });

	try {
		const policy = await createCancellationPolicy(input as CancellationPolicyInput);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'cancellation_policy.create',
			target_type: 'cancellation_policy',
			target_id: policy.id,
			metadata: { name: policy.name, is_default: policy.is_default }
		});
		return json({ success: true, policy });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'unknown';
		// Likely cause: name unique-violation. 409 surfaces the right semantic.
		return json({ error: message }, { status: 409 });
	}
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const input = coerceInput(body);
	const err = validateInput(input, false);
	if (err) return json({ error: err }, { status: 400 });

	try {
		const policy = await updateCancellationPolicy(id, input);
		await logAdminEvent({
			user_id: locals.user.id,
			action: 'cancellation_policy.update',
			target_type: 'cancellation_policy',
			target_id: id,
			metadata: { fields: Object.keys(input) }
		});
		return json({ success: true, policy });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'unknown';
		return json({ error: message }, { status: 409 });
	}
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	// Snapshot policies are referenced from bookings.cancellation_policy_id
	// indefinitely (audit trail). Refuse delete if any booking points at it —
	// otherwise the FK becomes a dangling reference. Admin can still mark a
	// policy non-default if they want a different one to apply going forward.
	const referenced = await countBookingsUsingPolicy(id);
	if (referenced > 0) {
		return json(
			{
				error: `${referenced} booking${referenced === 1 ? '' : 's'} still reference this policy. Make a different policy the default and leave this one in place for the audit trail.`
			},
			{ status: 409 }
		);
	}

	await deleteCancellationPolicy(id);
	await logAdminEvent({
		user_id: locals.user.id,
		action: 'cancellation_policy.delete',
		target_type: 'cancellation_policy',
		target_id: id,
		metadata: {}
	});

	return json({ success: true });
};
