-- Migration: 2026-05-03-03-tax-settings.sql
-- Issue: B-04 — French taxe de séjour not modelled
-- Purpose: Replace the inline 10% "tax" with the real French taxe de séjour:
--          a per-person, per-night fixed amount. Mark confirmed €0.68/person/night
--          for the cottage's commune (2026-05-02). Stored in an admin-editable
--          single-row table so Mark can update without redeploy.
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

CREATE TABLE IF NOT EXISTS tax_settings (
  id INT PRIMARY KEY DEFAULT 1,
  taxe_de_sejour_per_person_per_night DECIMAL(10,4) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,
  CONSTRAINT tax_settings_singleton CHECK (id = 1)
);

INSERT INTO tax_settings (id, taxe_de_sejour_per_person_per_night)
VALUES (1, 0.68)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_can_view_tax_settings" ON tax_settings;
CREATE POLICY "anyone_can_view_tax_settings" ON tax_settings
  FOR SELECT
  USING (true);

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-03-tax-settings.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
