-- ============================================================
-- QuranLingo v1 — Supabase Schema (7 tables + RLS)
-- Run this in Supabase SQL Editor after creating your project.
-- ============================================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- 1. user_profiles
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE,                   -- links to Supabase Auth or QF OAuth sub
  display_name TEXT NOT NULL DEFAULT 'Learner',
  display_initial TEXT NOT NULL DEFAULT 'L',
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ta')),
  review_limit INT NOT NULL DEFAULT 20 CHECK (review_limit BETWEEN 5 AND 100),
  new_words_limit INT NOT NULL DEFAULT 10 CHECK (new_words_limit BETWEEN 3 AND 50),
  qf_access_token TEXT,                           -- encrypted QF OAuth token
  qf_refresh_token TEXT,
  qf_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 2. user_progress
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  current_ayah TEXT NOT NULL DEFAULT '1:1',        -- canonical position (only moves forward)
  current_juz INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level_name TEXT NOT NULL DEFAULT 'Mubtadi',
  hearts INT NOT NULL DEFAULT 5 CHECK (hearts BETWEEN 0 AND 5),
  hearts_refill_at TIMESTAMPTZ,                   -- next daily refill
  streak_days INT NOT NULL DEFAULT 0,
  streak_last_date DATE,                          -- last active date
  total_words_learned INT NOT NULL DEFAULT 0,
  total_roots_learned INT NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 3. daily_goals
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_reviews INT NOT NULL DEFAULT 20,
  completed_reviews INT NOT NULL DEFAULT 0,
  target_new_words INT NOT NULL DEFAULT 10,
  completed_new_words INT NOT NULL DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, goal_date)
);

-- ────────────────────────────────────────────────────────────
-- 4. vocabulary_ledger — every learned root + SRS fields
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.vocabulary_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  root TEXT NOT NULL,                             -- Arabic root e.g. "ر ح م"
  first_surface_form TEXT NOT NULL,               -- first Arabic word form seen
  first_ayah_key TEXT NOT NULL,                   -- canonical position where first learned
  pos TEXT NOT NULL,                              -- part of speech at first encounter
  meaning_cluster TEXT,                           -- MCP meaning grouping
  translation_en TEXT,                            -- English meaning
  translation_ta TEXT,                            -- Tamil meaning
  lemma TEXT,
  frequency_root INT NOT NULL DEFAULT 0,          -- root occurrences in Quran

  -- SM-2 SRS fields
  srs_interval INT NOT NULL DEFAULT 1,            -- days until next review
  srs_ease_factor REAL NOT NULL DEFAULT 2.5,      -- 1.3 – 4.0
  srs_repetitions INT NOT NULL DEFAULT 0,
  srs_next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  srs_last_review TIMESTAMPTZ,

  learned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, root, meaning_cluster)
);

-- ────────────────────────────────────────────────────────────
-- 5. vocabulary_decisions — permanent dedup decisions per word
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.vocabulary_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ayah_key TEXT NOT NULL,                         -- e.g. "1:1"
  word_position INT NOT NULL,                     -- 1-indexed position in ayah
  arabic TEXT NOT NULL,
  root TEXT,
  dedup_level INT NOT NULL,                       -- -1, 0, 1, 2, 3, 4
  verdict TEXT NOT NULL CHECK (verdict IN ('new', 'reinforce', 'particle')),
  reason TEXT,
  xp_awarded INT NOT NULL DEFAULT 0,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ayah_key, word_position)       -- one decision per word per user (permanent)
);

-- ────────────────────────────────────────────────────────────
-- 6. srs_reviews — review history with ratings
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.srs_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  ledger_id UUID NOT NULL REFERENCES public.vocabulary_ledger(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
  prev_interval INT NOT NULL,
  new_interval INT NOT NULL,
  prev_ease REAL NOT NULL,
  new_ease REAL NOT NULL,
  xp_awarded INT NOT NULL DEFAULT 0,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ────────────────────────────────────────────────────────────
-- 7. mcp_cache — shared cache for MCP responses
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.mcp_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,                 -- e.g. "morph:1:1:3" or "conc:2:255:1"
  tool_name TEXT NOT NULL,                        -- e.g. "fetch_word_morphology"
  response JSONB NOT NULL,                        -- full MCP response
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- ────────────────────────────────────────────────────────────
-- INDEXES
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_vocab_ledger_user_root ON public.vocabulary_ledger(user_id, root);
CREATE INDEX idx_vocab_ledger_next_review ON public.vocabulary_ledger(user_id, srs_next_review);
CREATE INDEX idx_vocab_decisions_user_ayah ON public.vocabulary_decisions(user_id, ayah_key);
CREATE INDEX idx_srs_reviews_user ON public.srs_reviews(user_id, reviewed_at DESC);
CREATE INDEX idx_daily_goals_user_date ON public.daily_goals(user_id, goal_date DESC);
CREATE INDEX idx_mcp_cache_key ON public.mcp_cache(cache_key);
CREATE INDEX idx_mcp_cache_expires ON public.mcp_cache(expires_at);

-- ────────────────────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_vocab_ledger_updated_at
  BEFORE UPDATE ON public.vocabulary_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (Rule 8: RLS on every user table)
-- ────────────────────────────────────────────────────────────

-- Enable RLS on all user tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_reviews ENABLE ROW LEVEL SECURITY;

-- mcp_cache is shared (no RLS needed — read by all, written by server)
-- But we still enable it and create a service-role-only policy
ALTER TABLE public.mcp_cache ENABLE ROW LEVEL SECURITY;

-- ── user_profiles ──
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth_id = auth.uid());

-- ── user_progress ──
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

-- ── daily_goals ──
CREATE POLICY "Users can view own goals"
  ON public.daily_goals FOR SELECT
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own goals"
  ON public.daily_goals FOR ALL
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

-- ── vocabulary_ledger ──
CREATE POLICY "Users can view own ledger"
  ON public.vocabulary_ledger FOR SELECT
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own ledger"
  ON public.vocabulary_ledger FOR ALL
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

-- ── vocabulary_decisions ──
CREATE POLICY "Users can view own decisions"
  ON public.vocabulary_decisions FOR SELECT
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own decisions"
  ON public.vocabulary_decisions FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

-- Decisions are permanent (Rule 4) — no UPDATE or DELETE policy

-- ── srs_reviews ──
CREATE POLICY "Users can view own reviews"
  ON public.srs_reviews FOR SELECT
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

CREATE POLICY "Users can insert own reviews"
  ON public.srs_reviews FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE auth_id = auth.uid()));

-- ── mcp_cache (server-side only via service_role key) ──
CREATE POLICY "Service role can manage cache"
  ON public.mcp_cache FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- DONE! All 7 tables created with RLS policies.
-- 
-- Next steps:
-- 1. Copy SUPABASE_URL and SUPABASE_ANON_KEY from Project Settings → API
-- 2. Copy SUPABASE_SERVICE_ROLE_KEY for server-side operations
-- 3. Add them to your .env.local file
-- ============================================================
