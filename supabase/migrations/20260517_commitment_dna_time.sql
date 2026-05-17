-- DNA אישי: שעה קבועה מיום ההרשמה (לא תלוי timezone)
-- בחתימה: השוואה לשעון המקומי של המשתמש ברגע הלחיצה (profiles.timezone / client_timezone)

ALTER TABLE public.commitment
  ADD COLUMN IF NOT EXISTS committed_hour   int CHECK (committed_hour >= 0 AND committed_hour < 24),
  ADD COLUMN IF NOT EXISTS committed_minute int CHECK (committed_minute >= 0 AND committed_minute < 60);

-- מילוי לאחור מ-committed_at (שעון מקומי בזמן השמירה — רק לרשומות ישנות)
UPDATE public.commitment
SET
  committed_hour   = EXTRACT(HOUR FROM committed_at AT TIME ZONE 'UTC')::int,
  committed_minute = EXTRACT(MINUTE FROM committed_at AT TIME ZONE 'UTC')::int
WHERE committed_at IS NOT NULL
  AND committed_hour IS NULL;
