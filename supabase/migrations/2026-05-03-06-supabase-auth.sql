-- Migration: 2026-05-03-06-supabase-auth.sql
-- Issue: B-07 / PR 3 — Supabase Auth, per-user accounts
-- Purpose:
--   1) user_profiles — links auth.users to display_name + role
--   2) agent_events — admin audit log (service-role-only writes)
--   3) handle_new_auth_user() trigger — auto-seeds user_profiles when
--      a new auth.users row is created. Reads display_name and role from
--      raw_user_meta_data so invite calls can set both without us hardcoding
--      personal emails in committed SQL.
--
-- Date: 2026-05-03
-- Author: Rob

-- Idempotent.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('owner', 'developer')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON public.user_profiles(role);

CREATE TABLE IF NOT EXISTS public.agent_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_events_user_id_idx   ON public.agent_events(user_id);
CREATE INDEX IF NOT EXISTS agent_events_created_at_idx ON public.agent_events(created_at DESC);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_can_read_own_profile" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- agent_events: no policies — service_role bypasses RLS, all other roles blocked.

-- Trigger: auto-create user_profiles row on auth.users insert.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'role', ''),
      'owner'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO _migrations (filename, applied_at)
VALUES ('2026-05-03-06-supabase-auth.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
