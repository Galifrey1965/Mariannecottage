-- Migration: 2026-05-05-06-banner-recurring-and-ukraine.sql
-- Purpose:
--   1. Add `is_recurring` to site_banners. When TRUE, the RLS visibility
--      check ignores the YEAR on starts_at/ends_at and only compares
--      month-day-hour-minute, so a banner like "Christmas Dec 20-26"
--      auto-fires every December without yearly admin maintenance.
--      Wraparound is handled (e.g. NYE Dec 31 → Jan 2).
--      All comparisons anchor to Europe/Paris — the cottage's timezone.
--
--   2. Mark all 12 seeded seasonal banners as recurring. Their stored
--      starts_at/ends_at month-days already encode the correct
--      anniversaries, so this is a behaviour-only change.
--
--   3. Insert a "Standing with Ukraine" banner — always-on, all locales,
--      no effect. Type = announcement. Mark can edit/disable as he wishes.
--
-- Date: 2026-05-05
-- Author: Rob

-- 1. New column.
ALTER TABLE site_banners
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark the 12 seasonal banners as recurring.
UPDATE site_banners
   SET is_recurring = TRUE
 WHERE type = 'seasonal'
   AND is_recurring = FALSE;

-- 3. RLS policy — recreate with branching for recurring vs one-off.
DROP POLICY IF EXISTS "anyone_can_view_active_site_banners" ON site_banners;

CREATE POLICY "anyone_can_view_active_site_banners"
  ON site_banners FOR SELECT USING (
    enabled = TRUE
    AND (
      -- One-off: simple absolute date window.
      (
        NOT is_recurring
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at   IS NULL OR ends_at   >  NOW())
      )
      OR
      -- Recurring: compare month-day-time (Paris-local) to handle every
      -- year. If either bound is null, treat as always-on.
      (
        is_recurring
        AND (
          starts_at IS NULL
          OR ends_at IS NULL
          OR (
            CASE
              WHEN to_char(starts_at AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                 <= to_char(ends_at   AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI') THEN
                -- Same calendar year (e.g. Dec 20 → Dec 26).
                    to_char(NOW()      AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                 >= to_char(starts_at AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                AND to_char(NOW()      AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                  < to_char(ends_at   AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
              ELSE
                -- Wrap (e.g. Dec 31 → Jan 2).
                    to_char(NOW()      AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                 >= to_char(starts_at AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                 OR to_char(NOW()      AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
                  < to_char(ends_at   AT TIME ZONE 'Europe/Paris', 'MM-DD HH24:MI')
            END
          )
        )
      )
    )
  );

-- 4. Standing-with-Ukraine banner.
INSERT INTO site_banners (
  type, message_en, message_fr, message_de,
  enabled, display_order, starts_at, ends_at,
  effect, effect_intensity, locales, is_recurring
)
SELECT
  'announcement',
  '🇺🇦 We stand with Ukraine — wishing peace to all those affected by the war.',
  '🇺🇦 Nous soutenons l''Ukraine — paix à toutes les personnes touchées par la guerre.',
  '🇺🇦 Wir stehen an der Seite der Ukraine — Frieden allen, die vom Krieg betroffen sind.',
  TRUE, 5,
  NULL, NULL,
  'none', 'burst-idle',
  ARRAY['en','fr','de']::TEXT[],
  FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM site_banners
  WHERE message_en LIKE '%stand with Ukraine%'
);

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-05-06-banner-recurring-and-ukraine.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
