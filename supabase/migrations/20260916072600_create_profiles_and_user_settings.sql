/*
# StudyQuest — Profiles & User Settings (Phase 1 / Task 3)

Establishes the persistent per-user identity layer on top of Supabase Auth.
This migration is additive and does NOT touch the historical migration
(20260914033723_create_studyquest_tables.sql).

1. New Tables
- `profiles` — one row per auth user (public/user identity data).
- `user_settings` — one row per auth user (application preferences).

2. New Functions / Triggers
- `public.set_updated_at()` — generic `updated_at` maintenance trigger function.
- `public.handle_new_user()` — SECURITY DEFINER function that creates a
  `profiles` and `user_settings` row for each new `auth.users` row.
- `on_auth_user_created` — AFTER INSERT trigger on `auth.users`.

3. Security
- RLS is enabled on both tables.
- Private-by-default: an authenticated user may only access rows where
  `auth.uid()` matches their own id. No `USING (true)` / `WITH CHECK (true)`
  is used for private user data.
- No client INSERT or DELETE policies: initial rows are created by the signup
  trigger, and rows are removed automatically via ON DELETE CASCADE when the
  underlying auth user is deleted.
*/

-- ---------------------------------------------------------------------------
-- Generic updated_at maintenance (reusable; created once)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Table: profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text,
  display_name text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'en',
  country_code text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness for username (only when set).
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- A user may read only their own profile.
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- A user may update only their own profile.
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No INSERT/DELETE policies: rows are created by the signup trigger and
-- removed by ON DELETE CASCADE.

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: user_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ambient_sound text NOT NULL DEFAULT 'none',
  active_subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  theme text NOT NULL DEFAULT 'dark',
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- A user may read only their own settings.
DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
CREATE POLICY "user_settings_select_own" ON public.user_settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- A user may update only their own settings.
DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;
CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No INSERT/DELETE policies: rows are created by the signup trigger and
-- removed by ON DELETE CASCADE.

DROP TRIGGER IF EXISTS set_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER set_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Signup trigger: create one profiles row + one user_settings row per user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Identity comes exclusively from the newly created auth user (NEW.id);
  -- no client-provided value is trusted. ON CONFLICT prevents duplicates.
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();