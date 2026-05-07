-- Add frequency_root column to vocabulary_ledger
-- This stores how many times a root appears in the Quran (from QF API morphology data)
ALTER TABLE vocabulary_ledger
  ADD COLUMN IF NOT EXISTS frequency_root INTEGER DEFAULT 0;
