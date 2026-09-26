-- ─────────────────────────────────────────────────────────────
-- AI Money Mentor V2 — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- (supabase.com → your project → SQL Editor → New query → paste → Run)
-- ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES (extends auth.users automatically on signup) ──
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email          TEXT,
  display_name   TEXT DEFAULT 'Money Student',
  avatar_initial TEXT DEFAULT 'M',
  current_level  INTEGER DEFAULT 1,
  total_xp       INTEGER DEFAULT 0,
  streak_days    INTEGER DEFAULT 0,
  last_active    DATE DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── SAVINGS GOALS ──
CREATE TABLE IF NOT EXISTS goals (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title                TEXT NOT NULL,
  goal_type            TEXT NOT NULL,   -- house | vacation | wedding | baby | college | emergency | retirement | car | custom
  icon                 TEXT DEFAULT '🎯',
  color                TEXT DEFAULT '#1a5c35',
  target_amount        DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount       DECIMAL(12,2) DEFAULT 0,
  monthly_contribution DECIMAL(10,2),
  target_date          DATE,
  notes                TEXT,
  notification_days    INTEGER[] DEFAULT '{30,7,1}',
  is_completed         BOOLEAN DEFAULT FALSE,
  is_active            BOOLEAN DEFAULT TRUE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUIZ RESULTS ──
CREATE TABLE IF NOT EXISTS quiz_results (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  section_key    TEXT NOT NULL,
  question_idx   INTEGER DEFAULT 0,
  correct        BOOLEAN NOT NULL,
  xp_earned      INTEGER DEFAULT 0,
  attempt_number INTEGER DEFAULT 1,
  completed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── MODULE PROGRESS ──
CREATE TABLE IF NOT EXISTS module_progress (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  module_name  TEXT NOT NULL,
  section_key  TEXT NOT NULL,
  status       TEXT DEFAULT 'available',  -- locked | available | in_progress | completed | mastered
  best_score   INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, module_name)
);

-- ── USER SAVED LINKS ──
CREATE TABLE IF NOT EXISTS user_links (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  category    TEXT DEFAULT 'other',   -- thrift | coupon | credit_union | savings | food | education | government | calculator | other
  notes       TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY ──
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_links    ENABLE ROW LEVEL SECURITY;

-- Each user can only read/write their own rows
CREATE POLICY "own_profile"  ON profiles       FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_goals"    ON goals          FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_quizzes"  ON quiz_results   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_modules"  ON module_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_links"    ON user_links     FOR ALL USING (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, avatar_initial)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── INCREMENT XP & AUTO-CALCULATE LEVEL ──
CREATE OR REPLACE FUNCTION increment_xp(uid UUID, amount INT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET total_xp = COALESCE(total_xp, 0) + amount,
      current_level = CASE
        WHEN (COALESCE(total_xp, 0) + amount) >= 4000 THEN 6
        WHEN (COALESCE(total_xp, 0) + amount) >= 2000 THEN 5
        WHEN (COALESCE(total_xp, 0) + amount) >= 1000 THEN 4
        WHEN (COALESCE(total_xp, 0) + amount) >= 500  THEN 3
        WHEN (COALESCE(total_xp, 0) + amount) >= 200  THEN 2
        ELSE 1
      END,
      last_active = CURRENT_DATE,
      updated_at = NOW()
  WHERE id = uid;
END;
$$;

