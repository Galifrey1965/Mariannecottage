-- Migration: 2026-05-05-08-remembrance-events.sql
-- Purpose:
--   Add a `flower` icon (doubles as poppy for remembrance) and seed five
--   more recurring banners targeted at this specific cottage's audience:
--
--     Jan 27 — Holocaust Memorial Day
--     May  8 — VE Day / Fête de la Victoire 1945
--     Jun 5-7 — D-Day Anniversary (multi-day, especially relevant for
--                a cottage in Couvains, Normandy that hosts veterans)
--     Jun 21 — Fête de la Musique (French national music festival)
--     Nov 11 — Remembrance Day / Armistice / Volkstrauertag (poppy)
--
--   Tone for memorial banners is reverent — D-Day, Remembrance, and
--   Holocaust Memorial Day are not "Happy" greetings.
--
-- Date: 2026-05-05
-- Author: Rob

-- 1. Extend the icon CHECK constraint to allow 'flower'.
ALTER TABLE site_banners DROP CONSTRAINT IF EXISTS site_banners_icon_check;
ALTER TABLE site_banners
  ADD CONSTRAINT site_banners_icon_check
  CHECK (icon IS NULL OR icon IN (
    'info', 'alert', 'megaphone', 'gift', 'percent', 'star', 'sparkles',
    'heart', 'snowflake', 'party', 'ghost', 'flag', 'sun', 'moon',
    'bell', 'check', 'flame', 'flower'
  ));

-- 2. Banners. All recurring; Paris-anchored midnight bounds.

-- Jan 27 — Holocaust Memorial Day
INSERT INTO site_banners (
  icon, palette, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT NULL, 'charcoal',
  'Holocaust Memorial Day — remembering the victims and survivors.',
  'Journée internationale de commémoration de l''Holocauste — en mémoire des victimes et des survivants.',
  'Internationaler Holocaust-Gedenktag — wir gedenken der Opfer und Überlebenden.',
  TRUE, 22,
  '2027-01-27 00:00:00+01', '2027-01-28 00:00:00+01',
  'none', 'burst-idle', ARRAY['en','fr','de']::TEXT[], TRUE
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en LIKE 'Holocaust Memorial Day%');

-- May 8 — VE Day / Fête de la Victoire / Tag der Befreiung
INSERT INTO site_banners (
  icon, palette, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT 'star', 'sage',
  'VE Day — marking the end of the Second World War in Europe, 8 May 1945.',
  'Fête de la Victoire — fin de la Seconde Guerre mondiale en Europe, 8 mai 1945.',
  'Tag der Befreiung — Ende des Zweiten Weltkriegs in Europa, 8. Mai 1945.',
  TRUE, 23,
  '2026-05-08 00:00:00+02', '2026-05-09 00:00:00+02',
  'none', 'burst-idle', ARRAY['en','fr','de']::TEXT[], TRUE
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en LIKE 'VE Day%');

-- Jun 5-7 — D-Day Anniversary (Normandy)
INSERT INTO site_banners (
  icon, palette, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT 'flag', 'ocean',
  'D-Day Anniversary — remembering the heroes of 6 June 1944, here in Normandy.',
  'Anniversaire du Débarquement — en mémoire des héros du 6 juin 1944, ici en Normandie.',
  'Jahrestag der Landung in der Normandie — wir gedenken der Gefallenen vom 6. Juni 1944.',
  TRUE, 24,
  '2026-06-05 00:00:00+02', '2026-06-08 00:00:00+02',
  'none', 'burst-idle', ARRAY['en','fr','de']::TEXT[], TRUE
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en LIKE 'D-Day Anniversary%');

-- Jun 21 — Fête de la Musique
INSERT INTO site_banners (
  icon, palette, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT 'party', 'terracotta',
  'Fête de la Musique — France''s national celebration of music. Concerts in every town!',
  'Bonne Fête de la Musique! Concerts gratuits dans toute la France.',
  'Fête de la Musique — Frankreichs landesweites Musikfest mit Konzerten in jeder Stadt.',
  TRUE, 25,
  '2026-06-21 00:00:00+02', '2026-06-22 00:00:00+02',
  'confetti', 'burst-idle', ARRAY['en','fr','de']::TEXT[], TRUE
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en LIKE 'Fête de la Musique%');

-- Nov 11 — Remembrance Day / Armistice / Volkstrauertag (poppy)
INSERT INTO site_banners (
  icon, palette, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT 'flower', 'crimson',
  'Remembrance Day — lest we forget the fallen of both World Wars.',
  'Jour de l''Armistice — en mémoire des morts pour la France.',
  'Volkstrauertag — wir gedenken der Gefallenen beider Weltkriege.',
  TRUE, 26,
  '2026-11-11 00:00:00+01', '2026-11-12 00:00:00+01',
  'none', 'burst-idle', ARRAY['en','fr','de']::TEXT[], TRUE
WHERE NOT EXISTS (SELECT 1 FROM site_banners WHERE message_en LIKE 'Remembrance Day%');

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-08-remembrance-events.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
