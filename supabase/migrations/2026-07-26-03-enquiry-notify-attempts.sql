-- Migration: 2026-07-26-03-enquiry-notify-attempts.sql
-- Issue: E-02 — retry sweep for un-notified enquiries
-- Purpose:
--   When the notification email for an enquiry fails, the row survives but the
--   send is never retried. The retry sweep needs somewhere to record how many
--   times it has already tried, so a permanently-bad row (dead sender domain,
--   revoked API key, a genuinely unroutable ADMIN_NOTIFY_EMAIL) stops being
--   re-attempted every single day forever.
--
--   notify_attempts        — total notification attempts for this row,
--                            including the first one from /api/contact.
--                            The sweep stops selecting a row at 5.
--   last_notify_attempt_at — when the most recent attempt happened. Not used
--                            as a predicate; it is there so a human reading
--                            the row can tell a long-dead failure from one
--                            that is still being actively retried.
--
--   Both default sensibly for the rows that already exist: notify_attempts
--   starts at 0, which means the backlog gets a full allowance of retries
--   rather than being written off by the migration.
--
--   The existing partial index enquiries_unnotified_idx (status = 'new' AND
--   admin_notified_at IS NULL) still serves the sweep's query — notify_attempts
--   filters a handful of already-narrowed rows, so it is not worth widening the
--   index for it.
--
--   GDPR: neither column is a new category of personal data. They describe our
--   own sending behaviour, not the visitor, so legal.gdpr_processing_* needs no
--   change and the 24-month retention clock in purgeOldEnquiries still governs
--   deletion (it keys on created_at, which is untouched).
--
-- Date: 2026-07-26
-- Author: Rob

-- Idempotent: IF NOT EXISTS on both columns.

ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS notify_attempts        INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_notify_attempt_at TIMESTAMPTZ;

COMMENT ON COLUMN enquiries.notify_attempts IS
  'Total admin-notification attempts including the first from /api/contact. The retry sweep gives up at 5.';
COMMENT ON COLUMN enquiries.last_notify_attempt_at IS
  'Timestamp of the most recent notification attempt. Diagnostic only — not a sweep predicate.';

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-07-26-03-enquiry-notify-attempts.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
