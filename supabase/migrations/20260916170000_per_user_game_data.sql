/*
  StudyQuest — Per-user game data + RLS hardening.

  This migration upgrades the original single-tenant tables without copying
  anonymous/global data into an authenticated account. Existing legacy rows
  are intentionally left unowned and become inaccessible to authenticated
  users after RLS is tightened.
*/

-- Add ownership columns to the historical game tables.
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.streak_days ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.app_state ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS xp_earned integer NOT NULL DEFAULT 0;

-- User-scoped uniqueness. app_state keeps id=1 as the per-user singleton.
-- The historical app_state table used id as a global primary key; remove that
-- constraint so each authenticated user can own their own id=1 row.
ALTER TABLE public.app_state DROP CONSTRAINT IF EXISTS app_state_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS subjects_user_id_id_key ON public.subjects(user_id, id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS streak_days_user_day_key ON public.streak_days(user_id, day_of_week) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS app_state_user_id_id_key ON public.app_state(user_id, id) WHERE user_id IS NOT NULL;

-- Never allow negative client-provided progress/session values.
ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_duration_nonnegative;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_duration_nonnegative CHECK (duration_minutes >= 0 AND duration_minutes <= 720);
ALTER TABLE public.study_sessions DROP CONSTRAINT IF EXISTS study_sessions_xp_range;
ALTER TABLE public.study_sessions ADD CONSTRAINT study_sessions_xp_range CHECK (xp_earned >= 0 AND xp_earned <= 500);
ALTER TABLE public.streak_days DROP CONSTRAINT IF EXISTS streak_days_count_nonnegative;
ALTER TABLE public.streak_days ADD CONSTRAINT streak_days_count_nonnegative CHECK (day_of_week BETWEEN 0 AND 6);
ALTER TABLE public.app_state DROP CONSTRAINT IF EXISTS app_state_values_nonnegative;
ALTER TABLE public.app_state ADD CONSTRAINT app_state_values_nonnegative CHECK (coins >= 0 AND gems >= 0 AND pet_level >= 1 AND pet_xp >= 0 AND pet_xp_max > 0);

-- Prevent cross-user subject references from being smuggled into sessions/app state.
CREATE OR REPLACE FUNCTION public.validate_user_subject_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subject_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = NEW.subject_id AND s.user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Subject does not belong to this user.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_validate_session_subject_owner ON public.study_sessions;
CREATE TRIGGER tr_validate_session_subject_owner
BEFORE INSERT OR UPDATE ON public.study_sessions
FOR EACH ROW EXECUTE FUNCTION public.validate_user_subject_reference();

CREATE OR REPLACE FUNCTION public.validate_user_active_subject()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active_subject_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = NEW.active_subject_id AND s.user_id = NEW.user_id) THEN
      RAISE EXCEPTION 'Active subject does not belong to this user.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_validate_app_state_subject_owner ON public.app_state;
CREATE TRIGGER tr_validate_app_state_subject_owner
BEFORE INSERT OR UPDATE ON public.app_state
FOR EACH ROW EXECUTE FUNCTION public.validate_user_active_subject();

-- Replace permissive legacy policies with authenticated, owner-only policies.
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_subjects ON public.subjects;
DROP POLICY IF EXISTS anon_insert_subjects ON public.subjects;
DROP POLICY IF EXISTS anon_update_subjects ON public.subjects;
DROP POLICY IF EXISTS anon_delete_subjects ON public.subjects;
DROP POLICY IF EXISTS "Users can view own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;
CREATE POLICY "Users can view own subjects" ON public.subjects FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subjects" ON public.subjects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subjects" ON public.subjects FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS anon_select_sessions ON public.study_sessions;
DROP POLICY IF EXISTS anon_insert_sessions ON public.study_sessions;
DROP POLICY IF EXISTS anon_update_sessions ON public.study_sessions;
DROP POLICY IF EXISTS anon_delete_sessions ON public.study_sessions;
DROP POLICY IF EXISTS "Users can view own study sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can insert own study sessions" ON public.study_sessions;
CREATE POLICY "Users can view own study sessions" ON public.study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS anon_select_streaks ON public.streak_days;
DROP POLICY IF EXISTS anon_insert_streaks ON public.streak_days;
DROP POLICY IF EXISTS anon_update_streaks ON public.streak_days;
DROP POLICY IF EXISTS anon_delete_streaks ON public.streak_days;
DROP POLICY IF EXISTS "Users can view own streaks" ON public.streak_days;
DROP POLICY IF EXISTS "Users can insert own streaks" ON public.streak_days;
DROP POLICY IF EXISTS "Users can update own streaks" ON public.streak_days;
CREATE POLICY "Users can view own streaks" ON public.streak_days FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.streak_days FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.streak_days FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS anon_select_appstate ON public.app_state;
DROP POLICY IF EXISTS anon_insert_appstate ON public.app_state;
DROP POLICY IF EXISTS anon_update_appstate ON public.app_state;
DROP POLICY IF EXISTS anon_delete_appstate ON public.app_state;
CREATE POLICY "Users can view own app state" ON public.app_state FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own app state" ON public.app_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND id = 1);
CREATE POLICY "Users can update own app state" ON public.app_state FOR UPDATE TO authenticated USING (auth.uid() = user_id AND id = 1) WITH CHECK (auth.uid() = user_id AND id = 1);

-- Client cannot directly rewrite server-authoritative profile progression.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_study_date date;

CREATE OR REPLACE FUNCTION public.prevent_profile_progression_direct_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (OLD.total_xp IS DISTINCT FROM NEW.total_xp
       OR OLD.level IS DISTINCT FROM NEW.level
       OR OLD.current_streak IS DISTINCT FROM NEW.current_streak
       OR OLD.longest_streak IS DISTINCT FROM NEW.longest_streak
       OR OLD.last_study_date IS DISTINCT FROM NEW.last_study_date) THEN
    RAISE EXCEPTION 'Progression fields are server-authoritative.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_profile_progression_direct_update ON public.profiles;
CREATE TRIGGER tr_prevent_profile_progression_direct_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_progression_direct_update();

-- Cap client-supplied session XP. This is a defensive limit, not the final
-- reward authority; verified rewards should be moved to a trusted RPC later.
CREATE OR REPLACE FUNCTION public.sanitize_study_session()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.duration_minutes < 0 THEN NEW.duration_minutes := 0; END IF;
  IF NEW.duration_minutes > 720 THEN NEW.duration_minutes := 720; END IF;
  IF NEW.xp_earned < 0 THEN NEW.xp_earned := 0; END IF;
  IF NEW.xp_earned > 500 THEN NEW.xp_earned := 500; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_sanitize_study_session ON public.study_sessions;
CREATE TRIGGER tr_sanitize_study_session BEFORE INSERT OR UPDATE ON public.study_sessions FOR EACH ROW EXECUTE FUNCTION public.sanitize_study_session();
