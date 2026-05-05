-- Migration: 2026-05-05-04-banner-effects.sql
-- Purpose:
--   Extend site_banners with three new fields driving the visual layer:
--
--     effect            — name of an animated overlay rendered behind the
--                         banner (fireworks, snow, sparkles, hearts,
--                         confetti). 'none' = plain banner.
--     effect_intensity  — cadence of the effect:
--                           continuous   — runs constantly
--                           burst-idle   — short bursts then pauses
--                           load-only    — fires once on page load
--                         Ignored when effect = 'none'.
--     locales           — which language audiences see the banner. A French
--                         visitor only sees a banner whose `locales` array
--                         contains 'fr'. Default is all three so existing
--                         rows are unchanged in behaviour.
--
--   Existing seeded banners get the defaults backfilled.
--
-- Date: 2026-05-05
-- Author: Rob

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS effect TEXT NOT NULL DEFAULT 'none'
    CHECK (effect IN ('none', 'fireworks', 'snow', 'sparkles', 'hearts', 'confetti'));

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS effect_intensity TEXT NOT NULL DEFAULT 'burst-idle'
    CHECK (effect_intensity IN ('continuous', 'burst-idle', 'load-only'));

ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS locales TEXT[] NOT NULL DEFAULT ARRAY['en','fr','de']::TEXT[];

-- Anything already in the table predates these columns; the DEFAULTs cover it,
-- but be explicit so future readers understand the data shape.
UPDATE site_banners
   SET locales = ARRAY['en','fr','de']::TEXT[]
 WHERE locales IS NULL OR cardinality(locales) = 0;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-04-banner-effects.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
