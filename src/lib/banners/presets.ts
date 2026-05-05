// Shared definitions for banner icons and palettes — referenced by both
// the public renderer and the admin form, so the two can't drift.

import type { SiteBannerIcon, SiteBannerPalette } from '$lib/server/supabase';

export interface PaletteDef {
	bg: string;
	fg: string;
	border: string;
	label: string;
}

// Order here is the order shown in the admin dropdown.
export const PALETTES: Record<SiteBannerPalette, PaletteDef> = {
	sage:        { bg: '#e9f0e6', fg: '#324a2c', border: '#b9cdaf', label: 'Sage' },
	cream:       { bg: '#f6f1e6', fg: '#5a4a2e', border: '#d8c9a4', label: 'Cream' },
	sky:         { bg: '#e7f1fb', fg: '#1d4d80', border: '#bcd5ee', label: 'Sky' },
	amber:       { bg: '#fff4d6', fg: '#6b4a00', border: '#e8c97a', label: 'Amber' },
	mint:        { bg: '#e6f5ea', fg: '#205c34', border: '#b8dec5', label: 'Mint' },
	terracotta:  { bg: '#f7e9d6', fg: '#7a3a1d', border: '#e0bf94', label: 'Terracotta' },
	lavender:    { bg: '#efe5f5', fg: '#4a2e6b', border: '#cdb6dd', label: 'Lavender' },
	coral:       { bg: '#fde2e6', fg: '#7a1c2c', border: '#f0b3bf', label: 'Coral' },
	ocean:       { bg: '#dceaf2', fg: '#0e3a55', border: '#a4c5d6', label: 'Ocean' },
	crimson:     { bg: '#f3d4d4', fg: '#660f1a', border: '#cf8b8b', label: 'Crimson' },
	charcoal:    { bg: '#2b2b2f', fg: '#f3f3f3', border: '#4a4a52', label: 'Charcoal' },
	ukraine:     { bg: '#fff4c2', fg: '#00347a', border: '#005bbb', label: 'Ukraine 🇺🇦' }
};

export const PALETTE_NAMES = Object.keys(PALETTES) as SiteBannerPalette[];

export const ICON_LABELS: Record<SiteBannerIcon, string> = {
	info:      'Info',
	alert:     'Alert',
	megaphone: 'Megaphone',
	gift:      'Gift',
	percent:   'Percent (discount)',
	star:      'Star',
	sparkles:  'Sparkles',
	heart:     'Heart',
	snowflake: 'Snowflake',
	party:     'Party popper',
	ghost:     'Ghost',
	flag:      'Flag',
	sun:       'Sun',
	moon:      'Moon',
	bell:      'Bell',
	check:     'Check',
	flame:     'Flame',
	flower:    'Flower (poppy)'
};

export const ICON_NAMES = Object.keys(ICON_LABELS) as SiteBannerIcon[];

// Lucide-style 24x24 icon paths. Each value is the inner SVG markup
// (paths/circles/lines) — caller wraps in <svg viewBox="0 0 24 24">.
// Sourced from lucide.dev (MIT). Add new icons by pasting their inner
// SVG here and adding to ICON_LABELS above.
export const ICON_PATHS: Record<SiteBannerIcon, string> = {
	info:      '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
	alert:     '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
	megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
	gift:      '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
	percent:   '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
	star:      '<polygon points="12 2 15 8.5 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 9 8.5 12 2"/>',
	sparkles:  '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4"/><path d="M17 5h4"/><path d="M5 17v4"/><path d="M3 19h4"/>',
	heart:     '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
	snowflake: '<line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
	party:     '<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-1.4.6c-.84.3-1.4 1.1-1.4 2v.4c0 .9-.6 1.6-1.5 1.6h-.4c-.86 0-1.62.66-1.76 1.5L15 21"/><path d="m11 13 1.5-1.5 6 6L17 19l-6-6z"/>',
	ghost:     '<path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>',
	flag:      '<path d="M4 22V4a1 1 0 0 1 .4-.8 6 6 0 0 1 7.2 0 6 6 0 0 0 7.2 0 1 1 0 0 1 1.6.8v9.4a1 1 0 0 1-.4.8 6 6 0 0 1-7.2 0 6 6 0 0 0-7.2 0"/>',
	sun:       '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
	moon:      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
	bell:      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
	check:     '<path d="M20 6 9 17l-5-5"/>',
	flame:     '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.5-.5-2-1.5-3-2-2-2-4-2-4s-2 1-2 3.5c0 1 0 1 .5 3z"/><path d="M12 2s5 4 5 9a5 5 0 0 1-10 0c0-3 2-6 2-6"/>',
	flower:    '<path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5"/><path d="M7.5 12a4.5 4.5 0 1 1 4.5 4.5"/><path d="M12 7.5a4.5 4.5 0 1 0-4.5 4.5"/><path d="M16.5 12a4.5 4.5 0 1 0-4.5 4.5"/><circle cx="12" cy="12" r="2"/><path d="M12 16.5V21"/><path d="m8 21 4-3 4 3"/>'
};
