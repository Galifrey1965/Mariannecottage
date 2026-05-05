-- Migration: 2026-05-05-05-seed-seasonal-banners.sql
-- Purpose:
--   Pre-populate site_banners with a year's worth of seasonal greetings —
--   Bastille Day, Halloween, Bonfire Night, Christmas, NYE, Burns Night,
--   Valentine's, St Patrick's, Easter, St George's, St Andrew's, and
--   Tag der Deutschen Einheit.
--
--   Each banner is locale-scoped (Bonfire Night → English visitors only,
--   Bastille Day → French only, Christmas → all three) and date-gated via
--   starts_at / ends_at, so RLS hides them outside their window.
--
--   Dates target the upcoming occurrence as of 2026-05-05 — Mark will need
--   to refresh these annually (or duplicate-and-bump). Effects are picked
--   to suit the holiday: fireworks for celebratory days, snow for
--   Christmas, hearts for Valentine's, etc.
--
--   Idempotent: each INSERT guards on a unique seasonal_marker stored in
--   message_en text — if a row with that exact greeting already exists,
--   the INSERT is skipped. Re-running does nothing.
--
-- Date: 2026-05-05
-- Author: Rob

-- 2026-07-14 — Bastille Day (FR only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Bastille Day — bonne fête nationale!',
  'Joyeuse Fête Nationale! Vive le 14 juillet.',
  NULL,
  TRUE, 10,
  '2026-07-14 00:00:00+02', '2026-07-15 00:00:00+02',
  'fireworks', 'continuous', ARRAY['fr']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Bastille Day — bonne fête nationale!');

-- 2026-10-03 — Tag der Deutschen Einheit (DE only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy German Unity Day!',
  NULL,
  'Frohen Tag der Deutschen Einheit!',
  TRUE, 11,
  '2026-10-03 00:00:00+02', '2026-10-04 00:00:00+02',
  'confetti', 'burst-idle', ARRAY['de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy German Unity Day!');

-- 2026-10-29 → 11-01 — Halloween (all locales)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy Halloween — spookiest greetings from the cottage!',
  'Joyeux Halloween — frissons amicaux depuis le cottage!',
  'Frohes Halloween — schaurig-schöne Grüße aus dem Cottage!',
  TRUE, 12,
  '2026-10-29 00:00:00+01', '2026-11-02 00:00:00+01',
  'sparkles', 'continuous', ARRAY['en','fr','de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy Halloween — spookiest greetings from the cottage!');

-- 2026-11-05 — Bonfire Night (EN only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Remember, remember the 5th of November — happy Bonfire Night!',
  NULL,
  NULL,
  TRUE, 13,
  '2026-11-05 00:00:00+01', '2026-11-06 00:00:00+01',
  'fireworks', 'continuous', ARRAY['en']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Remember, remember the 5th of November — happy Bonfire Night!');

-- 2026-11-30 — St Andrew's Day (EN only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy St Andrew''s Day to all our Scottish friends!',
  NULL,
  NULL,
  TRUE, 14,
  '2026-11-30 00:00:00+01', '2026-12-01 00:00:00+01',
  'sparkles', 'burst-idle', ARRAY['en']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy St Andrew''s Day to all our Scottish friends!');

-- 2026-12-20 → 12-26 — Christmas (all locales)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Merry Christmas from all of us at the cottage — wishing you a peaceful holiday!',
  'Joyeux Noël depuis le cottage — passez de douces fêtes!',
  'Frohe Weihnachten vom Cottage — schöne und besinnliche Feiertage!',
  TRUE, 15,
  '2026-12-20 00:00:00+01', '2026-12-27 00:00:00+01',
  'snow', 'continuous', ARRAY['en','fr','de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Merry Christmas from all of us at the cottage — wishing you a peaceful holiday!');

-- 2026-12-31 → 2027-01-02 — New Year (all locales)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy New Year! Wishing you a wonderful 2027.',
  'Bonne année! Que 2027 vous apporte joie et bonheur.',
  'Frohes neues Jahr! Wir wünschen Ihnen ein wunderbares 2027.',
  TRUE, 16,
  '2026-12-31 00:00:00+01', '2027-01-03 00:00:00+01',
  'fireworks', 'continuous', ARRAY['en','fr','de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy New Year! Wishing you a wonderful 2027.');

-- 2027-01-25 — Burns Night (EN only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy Burns Night — slàinte mhath!',
  NULL,
  NULL,
  TRUE, 17,
  '2027-01-25 00:00:00+01', '2027-01-26 00:00:00+01',
  'none', 'burst-idle', ARRAY['en']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy Burns Night — slàinte mhath!');

-- 2027-02-14 — Valentine's Day (all locales)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy Valentine''s Day from the cottage!',
  'Joyeuse Saint-Valentin depuis le cottage!',
  'Frohen Valentinstag aus dem Cottage!',
  TRUE, 18,
  '2027-02-13 00:00:00+01', '2027-02-15 00:00:00+01',
  'hearts', 'continuous', ARRAY['en','fr','de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy Valentine''s Day from the cottage!');

-- 2027-03-17 — St Patrick's Day (EN only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy St Patrick''s Day — sláinte!',
  NULL,
  NULL,
  TRUE, 19,
  '2027-03-17 00:00:00+01', '2027-03-18 00:00:00+01',
  'confetti', 'continuous', ARRAY['en']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy St Patrick''s Day — sláinte!');

-- 2027-03-26 → 03-29 — Easter (all locales)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy Easter from the cottage — a peaceful weekend to all!',
  'Joyeuses Pâques depuis le cottage — un week-end paisible à tous!',
  'Frohe Ostern vom Cottage — ein erholsames Wochenende!',
  TRUE, 20,
  '2027-03-26 00:00:00+01', '2027-03-30 00:00:00+01',
  'confetti', 'burst-idle', ARRAY['en','fr','de']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy Easter from the cottage — a peaceful weekend to all!');

-- 2027-04-23 — St George's Day (EN only)
INSERT INTO site_banners (type, message_en, message_fr, message_de, enabled, display_order, starts_at, ends_at, effect, effect_intensity, locales)
SELECT 'seasonal',
  'Happy St George''s Day to our English visitors!',
  NULL,
  NULL,
  TRUE, 21,
  '2027-04-23 00:00:00+02', '2027-04-24 00:00:00+02',
  'sparkles', 'burst-idle', ARRAY['en']::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en = 'Happy St George''s Day to our English visitors!');

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-05-seed-seasonal-banners.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
