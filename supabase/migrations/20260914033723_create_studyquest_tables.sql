/*
# StudyQuest — Core Tables (single-tenant, no auth)

1. New Tables
- `subjects` — customizable daily study goals/subjects. Each has a name, icon, color, and default duration (minutes).
- `study_sessions` — log of completed focus sessions. Tracks which subject, duration, and completion timestamp.
- `streak_days` — weekly streak tracking. One row per weekday (0=Sun..6=Sat) with a completed boolean.
- `app_state` — singleton row storing app-level state: currency (coins, gems), pet level, pet name, selected ambient sound, and active subject id.

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on all tables (single-tenant, no sign-in screen).
*/

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'New Subject',
  icon text NOT NULL DEFAULT '📚',
  color text NOT NULL DEFAULT 'cyan',
  duration_minutes int NOT NULL DEFAULT 25,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_subjects" ON subjects;
CREATE POLICY "anon_select_subjects" ON subjects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_subjects" ON subjects;
CREATE POLICY "anon_insert_subjects" ON subjects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_subjects" ON subjects;
CREATE POLICY "anon_update_subjects" ON subjects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_subjects" ON subjects;
CREATE POLICY "anon_delete_subjects" ON subjects FOR DELETE
  TO anon, authenticated USING (true);

-- Study sessions log
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  duration_minutes int NOT NULL DEFAULT 25,
  completed boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON study_sessions;
CREATE POLICY "anon_select_sessions" ON study_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON study_sessions;
CREATE POLICY "anon_insert_sessions" ON study_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON study_sessions;
CREATE POLICY "anon_update_sessions" ON study_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON study_sessions;
CREATE POLICY "anon_delete_sessions" ON study_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Streak days (weekly)
CREATE TABLE IF NOT EXISTS streak_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week int NOT NULL DEFAULT 0,  -- 0=Sunday..6=Saturday
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE streak_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_streaks" ON streak_days;
CREATE POLICY "anon_select_streaks" ON streak_days FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_streaks" ON streak_days;
CREATE POLICY "anon_insert_streaks" ON streak_days FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_streaks" ON streak_days;
CREATE POLICY "anon_update_streaks" ON streak_days FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_streaks" ON streak_days;
CREATE POLICY "anon_delete_streaks" ON streak_days FOR DELETE
  TO anon, authenticated USING (true);

-- App state (singleton)
CREATE TABLE IF NOT EXISTS app_state (
  id int PRIMARY KEY DEFAULT 1,
  coins int NOT NULL DEFAULT 1200,
  gems int NOT NULL DEFAULT 5,
  pet_name text NOT NULL DEFAULT 'Sparky',
  pet_level int NOT NULL DEFAULT 4,
  pet_xp int NOT NULL DEFAULT 0,
  pet_xp_max int NOT NULL DEFAULT 100,
  ambient_sound text NOT NULL DEFAULT 'none',
  active_subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_appstate" ON app_state;
CREATE POLICY "anon_select_appstate" ON app_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_appstate" ON app_state;
CREATE POLICY "anon_insert_appstate" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_appstate" ON app_state;
CREATE POLICY "anon_update_appstate" ON app_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_appstate" ON app_state;
CREATE POLICY "anon_delete_appstate" ON app_state FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default subjects
INSERT INTO subjects (name, icon, color, duration_minutes, position)
VALUES
  ('Mathematics', '📐', 'cyan', 25, 0),
  ('Computer Science', '💻', 'emerald', 30, 1),
  ('Physics', '⚛️', 'amber', 20, 2),
  ('Arabic', '📖', 'rose', 15, 3)
ON CONFLICT DO NOTHING;

-- Seed streak days (0..6)
INSERT INTO streak_days (day_of_week, completed)
SELECT i, false FROM generate_series(0, 6) AS i
ON CONFLICT DO NOTHING;

-- Seed app state singleton
INSERT INTO app_state (id, coins, gems, pet_name, pet_level, pet_xp, pet_xp_max, ambient_sound)
VALUES (1, 1200, 5, 'Sparky', 4, 65, 100, 'none')
ON CONFLICT DO NOTHING;