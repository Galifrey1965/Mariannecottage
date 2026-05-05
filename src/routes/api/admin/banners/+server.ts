// Admin CRUD for site_banners.
//
// GET    → list all (including disabled, including outside date window)
// POST   → create
// PATCH  → update by body.id
// DELETE → delete by body.id

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	listSiteBannersAdmin,
	createSiteBanner,
	updateSiteBanner,
	deleteSiteBanner,
	logAdminEvent,
	type SiteBannerInput,
	type SiteBannerEffect,
	type SiteBannerEffectIntensity,
	type SiteBannerLocale,
	type SiteBannerIcon,
	type SiteBannerPalette
} from '$lib/server/supabase';

const VALID_EFFECTS: SiteBannerEffect[] = ['none', 'fireworks', 'snow', 'sparkles', 'hearts', 'confetti'];
const VALID_INTENSITIES: SiteBannerEffectIntensity[] = ['continuous', 'burst-idle', 'load-only'];
const VALID_LOCALES: SiteBannerLocale[] = ['en', 'fr', 'de'];
const VALID_ICONS: SiteBannerIcon[] = [
	'info', 'alert', 'megaphone', 'gift', 'percent', 'star', 'sparkles',
	'heart', 'snowflake', 'party', 'ghost', 'flag', 'sun', 'moon',
	'bell', 'check', 'flame'
];
const VALID_PALETTES: SiteBannerPalette[] = [
	'sage', 'cream', 'sky', 'amber', 'mint', 'terracotta',
	'lavender', 'coral', 'ocean', 'crimson', 'charcoal', 'ukraine'
];

function unauthorized() {
	return json({ error: 'Unauthorized' }, { status: 401 });
}

function validate(input: Partial<SiteBannerInput>, isCreate: boolean): string | null {
	if (isCreate || input.message_en !== undefined) {
		if (typeof input.message_en !== 'string' || !input.message_en.trim()) {
			return 'message_en required';
		}
	}
	if (input.icon !== undefined && input.icon !== null) {
		if (!VALID_ICONS.includes(input.icon)) {
			return `icon must be null or one of: ${VALID_ICONS.join(', ')}`;
		}
	}
	if (input.palette !== undefined) {
		if (!VALID_PALETTES.includes(input.palette)) {
			return `palette must be one of: ${VALID_PALETTES.join(', ')}`;
		}
	}
	if (input.starts_at && input.ends_at) {
		if (new Date(input.ends_at) <= new Date(input.starts_at)) {
			return 'ends_at must be after starts_at';
		}
	}
	if (input.display_order !== undefined) {
		if (!Number.isInteger(Number(input.display_order))) {
			return 'display_order must be an integer';
		}
	}
	if (input.effect !== undefined) {
		if (!VALID_EFFECTS.includes(input.effect)) {
			return `effect must be one of: ${VALID_EFFECTS.join(', ')}`;
		}
	}
	if (input.effect_intensity !== undefined) {
		if (!VALID_INTENSITIES.includes(input.effect_intensity)) {
			return `effect_intensity must be one of: ${VALID_INTENSITIES.join(', ')}`;
		}
	}
	if (input.locales !== undefined) {
		if (!Array.isArray(input.locales) || input.locales.length === 0) {
			return 'locales must be a non-empty array';
		}
		for (const loc of input.locales) {
			if (!VALID_LOCALES.includes(loc)) {
				return `locales contains invalid value: ${loc}`;
			}
		}
	}
	return null;
}

function coerce(body: Record<string, unknown>): Partial<SiteBannerInput> {
	const out: Partial<SiteBannerInput> = {};
	if (body.icon !== undefined) {
		out.icon = body.icon === null || body.icon === '' ? null : (body.icon as SiteBannerIcon);
	}
	if (body.palette !== undefined) out.palette = body.palette as SiteBannerPalette;
	if (body.message_en !== undefined) out.message_en = String(body.message_en);
	if (body.message_fr !== undefined) {
		out.message_fr = body.message_fr === null ? null : String(body.message_fr) || null;
	}
	if (body.message_de !== undefined) {
		out.message_de = body.message_de === null ? null : String(body.message_de) || null;
	}
	if (body.enabled !== undefined) out.enabled = Boolean(body.enabled);
	if (body.display_order !== undefined) out.display_order = Number(body.display_order);
	if (body.starts_at !== undefined) {
		out.starts_at = body.starts_at ? String(body.starts_at) : null;
	}
	if (body.ends_at !== undefined) {
		out.ends_at = body.ends_at ? String(body.ends_at) : null;
	}
	if (body.effect !== undefined) out.effect = body.effect as SiteBannerEffect;
	if (body.effect_intensity !== undefined) out.effect_intensity = body.effect_intensity as SiteBannerEffectIntensity;
	if (body.locales !== undefined && Array.isArray(body.locales)) {
		out.locales = body.locales.map((l) => String(l)) as SiteBannerLocale[];
	}
	if (body.is_recurring !== undefined) out.is_recurring = Boolean(body.is_recurring);
	return out;
}

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return unauthorized();
	const banners = await listSiteBannersAdmin();
	return json({ banners });
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const input = coerce(body);
	const err = validate(input, true);
	if (err) return json({ error: err }, { status: 400 });

	const banner = await createSiteBanner(input as SiteBannerInput);
	await logAdminEvent({
		user_id: locals.user.id,
		action: 'site_banner.create',
		target_type: 'site_banner',
		target_id: banner.id,
		metadata: { icon: banner.icon, palette: banner.palette, enabled: banner.enabled }
	});
	return json({ success: true, banner });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json()) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	const input = coerce(body);
	const err = validate(input, false);
	if (err) return json({ error: err }, { status: 400 });

	const banner = await updateSiteBanner(id, input);
	await logAdminEvent({
		user_id: locals.user.id,
		action: 'site_banner.update',
		target_type: 'site_banner',
		target_id: id,
		metadata: { fields: Object.keys(input) }
	});
	return json({ success: true, banner });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return unauthorized();
	const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const id = body.id ? String(body.id) : '';
	if (!id) return json({ error: 'Missing id' }, { status: 400 });

	await deleteSiteBanner(id);
	await logAdminEvent({
		user_id: locals.user.id,
		action: 'site_banner.delete',
		target_type: 'site_banner',
		target_id: id,
		metadata: {}
	});
	return json({ success: true });
};
