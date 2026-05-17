-- Add ai_memory column to profiles
-- Stores accumulated AI insights about the user across sessions
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_memory JSONB DEFAULT '{"insights":[],"sessionCount":0}'::jsonb;
