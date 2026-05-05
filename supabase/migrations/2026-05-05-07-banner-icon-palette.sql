-- Migration: 2026-05-05-07-banner-icon-palette.sql
-- Purpose:
--   Replace the `type` column (which conflated icon + colour into a single
--   five-option enum) with two independent fields:
--
--     icon     — nullable. NULL = no icon. Otherwise one of a curated set
--                 of Lucide icon names. Lets Mark pick the right glyph for
--                 each banner (snowflake, ghost, heart, flag, …) without
--                 being constrained to the 5 old types.
--     palette  — colour scheme name. ~12 named presets. Default 'sage'.
--
--   Existing rows are backfilled by mapping their old type → sensible
--   icon + palette pair. Seasonal seeds get bespoke icons (snowflake for
--   Christmas, ghost for Halloween, party for NYE, etc.) so they look
--   right out of the box.
--
--   The Ukraine banner gets icon=NULL (Rob doesn't want a megaphone next
--   to a solidarity message) and palette='ukraine' for blue/yellow.
--
--   After backfill the type column is dropped along with its CHECK.
--
-- Date: 2026-05-05
-- Author: Rob

-- 1. Add new columns. NULL icon = render no glyph.
ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS icon TEXT
    CHECK (icon IS NULL OR icon IN (
      'info', 'alert', 'megaphone', 'gift', 'percent', 'star', 'sparkles',
      'heart', 'snowflake', 'party', 'ghost', 'flag', 'sun', 'moon',
      'bell', 'check', 'flame'
    ));

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS palette TEXT NOT NULL DEFAULT 'sage'
    CHECK (palette IN (
      'sage', 'cream', 'sky', 'amber', 'mint', 'terracotta',
      'lavender', 'coral', 'ocean', 'crimson', 'charcoal', 'ukraine'
    ));

-- 2. Backfill from the old type column.
UPDATE site_banners SET icon = 'info',     palette = 'sky'         WHERE type = 'info';
UPDATE site_banners SET icon = 'alert',    palette = 'amber'       WHERE type = 'construction';
UPDATE site_banners SET icon = 'percent',  palette = 'mint'        WHERE type = 'discount';
UPDATE site_banners SET icon = 'sparkles', palette = 'terracotta'  WHERE type = 'seasonal';
UPDATE site_banners SET icon = 'megaphone',palette = 'lavender'    WHERE type = 'announcement';

-- 3. Per-banner overrides: distinctive icons + palettes for the seeded
--    holidays so they look right without admin tweaking.
UPDATE site_banners SET icon = 'snowflake', palette = 'crimson'
 WHERE message_en LIKE 'Merry Christmas%';

UPDATE site_banners SET icon = 'party',     palette = 'terracotta'
 WHERE message_en LIKE 'Happy New Year%';

UPDATE site_banners SET icon = 'ghost',     palette = 'amber'
 WHERE message_en LIKE 'Happy Halloween%';

UPDATE site_banners SET icon = 'flame',     palette = 'amber'
 WHERE message_en LIKE 'Remember, remember%';

UPDATE site_banners SET icon = 'heart',     palette = 'coral'
 WHERE message_en LIKE 'Happy Valentine%';

UPDATE site_banners SET icon = 'flag',      palette = 'ocean'
 WHERE message_en LIKE 'Bastille Day%';

UPDATE site_banners SET icon = 'flag',      palette = 'mint'
 WHERE message_en LIKE 'Happy St Patrick%';

UPDATE site_banners SET icon = 'flag',      palette = 'sage'
 WHERE message_en LIKE 'Happy St George%';

UPDATE site_banners SET icon = 'flag',      palette = 'ocean'
 WHERE message_en LIKE 'Happy St Andrew%';

UPDATE site_banners SET icon = 'flag',      palette = 'charcoal'
 WHERE message_en LIKE 'Happy German Unity%';

UPDATE site_banners SET icon = 'star',      palette = 'charcoal'
 WHERE message_en LIKE 'Happy Burns Night%';

UPDATE site_banners SET icon = 'sun',       palette = 'coral'
 WHERE message_en LIKE 'Happy Easter%';

-- 4. Ukraine banner: no icon, blue+yellow palette.
UPDATE site_banners SET icon = NULL, palette = 'ukraine'
 WHERE message_en LIKE '%stand with Ukraine%';

-- 5. Drop the type column. CHECK and column go together.
ALTER TABLE site_banners DROP COLUMN IF EXISTS type;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-07-banner-icon-palette.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
