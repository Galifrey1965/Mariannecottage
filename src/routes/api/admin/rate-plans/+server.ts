import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listRatePlansAdmin,
	createRatePlan,
	updateRatePlan,
	archiveRatePlan,
	logAdminEvent,
	type RatePlanInput
} from '$lib/server/supabase';

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

function validateInput(input: Partial<RatePlanInput>): string | null {
	if (input.name !== undefined && !String(input.name).trim()) return 'name required';
	const rates: Array<keyof RatePlanInput> = [
		'rate_per_night',
		'rate_2_guests',
		'rate_3_guests',
		'rate_4_guests'
	];
	for (const k of rates) {
		const v = input[k];
		if (v !== undefined) {
			const n = Number(v);
			if (!Number.isFinite(n) || n < 0) return `${k} must be a non-negative number`;
		}
	}
	if (input.valid_from && input.valid_until) {
		if (new Date(input.valid_until) < new Date(input.valid_from)) {
			return 'valid_until must be on or after valid_from';
		}
	}
	return null;
}

function coerceInput(body: Record<string, unknown>): Partial<RatePlanInput> {
	const out: Partial<RatePlanInput> = {};
	if (body.name !== undefined) out.name = String(body.name).trim();
	if (body.description !== undefined)
		out.description = body.description === null ? null : String(body.description);
	if (body.rate_per_night !== undefined) out.rate_per_night = Number(body.rate_per_night);
	if (body.rate_2_guests !== undefined) out.rate_2_guests = Number(body.rate_2_guests);
	if (body.rate_3_guests !== undefined) out.rate_3_guests = Number(body.rate_3_guests);
	if (body.rate_4_guests !== undefined) out.rate_4_guests = Number(body.rate_4_guests);
	if (body.valid_from !== undefined) out.valid_from = String(body.valid_from);
	if (body.valid_until !== undefined) out.valid_until = String(body.valid_until);
	if (body.is_active !== undefined) out.is_active = Boolean(body.is_active);
	return out;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return unauthorized();
	const includeInactive = url.searchParams.get('include_inactive') !== 'false';
	const plans = await listRatePlansAdmin(includeInactive);
	return json({ plans });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const input = coerceInput(body);

	const requiredFields: Array<keyof RatePlanInput> = [
		'name',
		'rate_per_night',
		'rate_2_guests',
		'rate_3_guests',
		'rate_4_guests',
		'valid_from',
		'valid_until'
	];
	for (const f of requiredFields) {
		if (input[f] === undefined) return json({ error: `Missing field: ${f}` }, { status: 400 });
	}

	const err = validateInput(input);
	if (err) return json({ error: err }, { status: 400 });

	const plan = await createRatePlan(input as RatePlanInput);

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'rate_plan.create',
		target_type: 'rate_plan',
		target_id: plan.id,
		metadata: { name: plan.name, valid_from: plan.valid_from, valid_until: plan.valid_until }
	});

	return json({ success: true, plan });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const input = coerceInput(body);
	delete (input as Record<string, unknown>).id;

	const err = validateInput(input);
	if (err) return json({ error: err }, { status: 400 });

	const plan = await updateRatePlan(id, input);

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'rate_plan.update',
		target_type: 'rate_plan',
		target_id: id,
		metadata: { fields: Object.keys(input) }
	});

	return json({ success: true, plan });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const plan = await archiveRatePlan(id);

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'rate_plan.archive',
		target_type: 'rate_plan',
		target_id: id,
		metadata: { name: plan.name }
	});

	return json({ success: true, plan });
};
