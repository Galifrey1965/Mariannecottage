-- Migration: 2026-05-03-01-init-migrations-tracking.sql
-- Issue: Phase 1 setup (per migration convention adopted 2026-05-03)
-- Purpose: Create the _migrations table so subsequent migrations can record their application.
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent: re-runnable safely.

CREATE TABLE IF NOT EXISTS _migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_by TEXT
);

-- Record this migration's own application
INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-01-init-migrations-tracking.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
