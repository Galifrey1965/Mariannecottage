-- Migration: 2026-07-26-01-enquiries.sql
-- Purpose:
--   Persist website contact-form enquiries. Until now /api/contact emailed the
--   enquiry and stored nothing, so any Brevo failure destroyed the message —
--   which is exactly what happened on 2026-07-24 when Brevo's IP allow-list
--   blocked the send from a fresh Lambda egress IP. The row is now the system
--   of record; the email is a notification.
--
--   Service-role only: this table holds visitor PII (name, email, free text).
--   RLS is enabled with NO policies, so anon/authenticated see nothing even if
--   a future grant slips in. Writes/reads go through adminClient, which
--   bypasses RLS.
--
--   Retention: rows are deleted 24 months after submission by the daily
--   /api/sweep-pending run (purgeOldEnquiries). Disclosed on /legal via
--   legal.gdpr_processing_enquiry.
--
-- Date: 2026-07-26
-- Author: Rob

CREATE TABLE IF NOT EXISTS enquiries (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name              TEXT        NOT NULL,
  email             TEXT        NOT NULL,
  message           TEXT        NOT NULL,
  locale            TEXT        NOT NULL DEFAULT 'en',
  status            TEXT        NOT NULL DEFAULT 'new'
                                CHECK (status IN ('new', 'spam', 'replied', 'archived')),
  spam_reason       TEXT,
  admin_notified_at TIMESTAMPTZ,
  ack_sent_at       TIMESTAMPTZ,
  notify_error      TEXT
);

-- Newest-first listing for the (future) admin view.
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx
  ON enquiries (created_at DESC);

-- Partial index for the (future) retry sweep: genuine enquiries Mark was
-- never told about.
CREATE INDEX IF NOT EXISTS enquiries_unnotified_idx
  ON enquiries (created_at)
  WHERE status = 'new' AND admin_notified_at IS NULL;

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Deliberately no policies. Defence in depth against the pre-2026-10-30
-- Supabase default that auto-exposed new public tables to the Data API.
REVOKE ALL ON enquiries FROM anon, authenticated;

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-07-26-01-enquiries.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
