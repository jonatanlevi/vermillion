-- שעת חתימה שהמשתמש בוחר בתוך חלון שישי/שבת (בטווח המותר)

ALTER TABLE public.commitment
  ADD COLUMN IF NOT EXISTS friday_target_hour   int CHECK (friday_target_hour >= 0 AND friday_target_hour < 24),
  ADD COLUMN IF NOT EXISTS friday_target_minute int CHECK (friday_target_minute >= 0 AND friday_target_minute < 60),
  ADD COLUMN IF NOT EXISTS saturday_target_hour   int CHECK (saturday_target_hour >= 0 AND saturday_target_hour < 24),
  ADD COLUMN IF NOT EXISTS saturday_target_minute int CHECK (saturday_target_minute >= 0 AND saturday_target_minute < 60);
