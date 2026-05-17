-- נעילת DNA: ימי חול / שישי / שבת — לא ניתן לשנות אחרי קביעה ראשונה (גם מעקיפת אפליקציה)

CREATE OR REPLACE FUNCTION public.commitment_immutability_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- DNA יומי (הרשמה)
  IF OLD.committed_hour IS NOT NULL AND (
    NEW.committed_hour IS DISTINCT FROM OLD.committed_hour OR
    NEW.committed_minute IS DISTINCT FROM OLD.committed_minute
  ) THEN
    RAISE EXCEPTION 'DNA_LOCKED' USING ERRCODE = 'check_violation';
  END IF;

  -- DNA שישי (יעד אתגר)
  IF OLD.friday_target_hour IS NOT NULL AND (
    NEW.friday_target_hour IS DISTINCT FROM OLD.friday_target_hour OR
    NEW.friday_target_minute IS DISTINCT FROM OLD.friday_target_minute
  ) THEN
    RAISE EXCEPTION 'FRIDAY_DNA_LOCKED' USING ERRCODE = 'check_violation';
  END IF;

  -- DNA שבת (יעד אתגר)
  IF OLD.saturday_target_hour IS NOT NULL AND (
    NEW.saturday_target_hour IS DISTINCT FROM OLD.saturday_target_hour OR
    NEW.saturday_target_minute IS DISTINCT FROM OLD.saturday_target_minute
  ) THEN
    RAISE EXCEPTION 'SATURDAY_DNA_LOCKED' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS commitment_immutability ON public.commitment;
CREATE TRIGGER commitment_immutability
  BEFORE UPDATE ON public.commitment
  FOR EACH ROW
  EXECUTE PROCEDURE public.commitment_immutability_guard();
