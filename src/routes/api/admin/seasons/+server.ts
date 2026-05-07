import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listSeasonsAdmin,
	createSeason,
	updateSeason,
	archiveSeason,
	logAdminEvent,
	type SeasonInput,
	type SeasonKind
} from '$lib/server/supabase';

const VALID_KINDS: readonly SeasonKind[] = ['low', 'high', 'peak'] as const;

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

function validateInput(input: Partial<SeasonInput>): string | null {
	if (input.name !== undefined && !String(input.name).trim()) return 'name required';
	if (input.kind !== undefined && !VALID_KINDS.includes(input.kind)) {
		return `kind must be one of ${VALID_KINDS.join(', ')}`;
	}
	const rates: Array<keyof SeasonInput> = [
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
	if (input.start_date && input.end_date) {
		if (new Date(input.end_date) < new Date(input.start_date)) {
			return 'end_date must be on or after start_date';
		}
	}
	return null;
}

function coerceInput(body: Record<string, unknown>): Partial<SeasonInput> {
	const out: Partial<SeasonInput> = {};
	if (body.name !== undefined) out.name = String(body.name).trim();
	if (body.description !== undefined)
		out.description = body.description === null ? null : String(body.description);
	if (body.kind !== undefined) out.kind = body.kind as SeasonKind;
	if (body.rate_per_night !== undefined) out.rate_per_night = Number(body.rate_per_night);
	if (body.rate_2_guests !== undefined) out.rate_2_guests = Number(body.rate_2_guests);
	if (body.rate_3_guests !== undefined) out.rate_3_guests = Number(body.rate_3_guests);
	if (body.rate_4_guests !== undefined) out.rate_4_guests = Number(body.rate_4_guests);
	if (body.start_date !== undefined) out.start_date = String(body.start_date);
	if (body.end_date !== undefined) out.end_date = String(body.end_date);
	if (body.is_active !== undefined) out.is_active = Boolean(body.is_active);
	return out;
}

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) return unauthorized();
	const includeInactive = url.searchParams.get('include_inactive') !== 'false';
	const seasons = await listSeasonsAdmin(includeInactive);
	return json({ seasons });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const input = coerceInput(body);

	const requiredFields: Array<keyof SeasonInput> = [
		'name',
		'kind',
		'rate_per_night',
		'rate_2_guests',
		'rate_3_guests',
		'rate_4_guests',
		'start_date',
		'end_date'
	];
	for (const f of requiredFields) {
		if (input[f] === undefined) return json({ error: `Missing field: ${f}` }, { status: 400 });
	}

	const err = validateInput(input);
	if (err) return json({ error: err }, { status: 400 });

	// Anything created via this endpoint is admin-reviewed by definition,
	// so the "review pending" badge is suppressed for it.
	const season = await createSeason({ ...(input as SeasonInput), reviewed_by_admin: true });

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'season.create',
		target_type: 'season',
		target_id: season.id,
		metadata: {
			name: season.name,
			kind: season.kind,
			start_date: season.start_date,
			end_date: season.end_date
		}
	});

	return json({ success: true, season });
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

	// Editing a row counts as the admin review — flip the flag so the
	// "review pending" banner clears.
	const season = await updateSeason(id, { ...input, reviewed_by_admin: true });

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'season.update',
		target_type: 'season',
		target_id: id,
		metadata: { fields: Object.keys(input) }
	});

	return json({ success: true, season });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const season = await archiveSeason(id);

	await logAdminEvent({
		user_id: locals.user.id,
		action: 'season.archive',
		target_type: 'season',
		target_id: id,
		metadata: { name: season.name }
	});

	return json({ success: true, season });
};
