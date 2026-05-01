-- Migration: add sharing support to passage_completions
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).

ALTER TABLE passage_completions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Optional: index to efficiently fetch all public completions later
CREATE INDEX IF NOT EXISTS passage_completions_is_public_idx
  ON passage_completions (is_public)
  WHERE is_public = true;

-- RLS: allow anyone to read public completions
CREATE POLICY "Public completions are readable by anyone"
  ON passage_completions
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);
