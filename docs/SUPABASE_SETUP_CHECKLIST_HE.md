# Supabase — רשימת פעולות מסודרת (מנכ"ל / עורך דין / DevOps)

> פרויקט: **vermillion**  
> Project ref: `hegbvrvmgvmmbigfpqax`  
> כניסה: https://supabase.com/dashboard/project/hegbvrvmgvmmbigfpqax

---

## שלב 0 — לפני הכול

| # | איפה בדשבורד | מה לעשות |
|---|--------------|----------|
| 0.1 | דף הבית של הפרויקט | אם מופיע **Paused** → **Restore project** |
| 0.2 | **Project Settings → General** | לוודא שם פרויקט: vermillion |

---

## שלב 1 — SQL Editor (מיגרציות לפי סדר)

**איפה:** סיידבר שמאל → **SQL Editor** → **New query** לכל קובץ.

| סדר | קובץ במחשב | מה נוצר | איך יודעים שהצליח |
|-----|------------|---------|-------------------|
| 1 | `supabase/schema.sql` | טבלאות בסיס, RLS, `daily_stamps`, trigger הרשמה | Success (אם כבר קיים — הודעות "already exists" בסדר) |
| 2 | `supabase/migrations/20260516_game_sessions.sql` | `game_sessions`, `profiles.timezone` | Table Editor → `game_sessions` |
| 3 | `supabase/migrations/20260517_commitment_dna_time.sql` | `committed_hour`, `committed_minute` | Table Editor → `commitment` → העמודות קיימות |
| 4 | `supabase/migrations/20260518_challenge_target_time.sql` | יעד שישי/שבת | `friday_target_*`, `saturday_target_*` ב-`commitment` |
| 5 | `supabase/migrations/20260519_commitment_immutability.sql` | **נעילת DNA** (טריגר) | Success; אין שגיאה אדומה |

### אימות SQL (העתק והרץ ב-SQL Editor)

```sql
-- טבלאות חובה
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','commitment','game_sessions','daily_stamps');

-- עמודות commitment
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commitment'
ORDER BY column_name;

-- טריגר נעילה
SELECT tgname FROM pg_trigger
WHERE tgname = 'commitment_immutability';
```

---

## שלב 2 — Table Editor (בדיקה ויזואלית)

**איפה:** סיידבר → **Table Editor**

| טבלה | מה לבדוק |
|------|----------|
| `profiles` | עמודה `timezone` |
| `commitment` | `committed_hour`, `committed_minute`, `friday_target_*`, `saturday_target_*` |
| `game_sessions` | קיימת; אין שורות ציבוריות מלקוח (נורמלי) |
| `daily_stamps` | קיימת; **Policies** — אין INSERT למשתמש רגיל |

### daily_stamps — Policies

**איפה:** Table Editor → `daily_stamps` → **RLS policies** (או Database → Tables → daily_stamps → Policies)

| Policy מותר | לא מותר |
|-------------|---------|
| SELECT (קריאה) | INSERT מהמשתמש |
| DELETE עצמי (אופציונלי) | UPDATE / INSERT ישיר לחתימה |

אם קיים `insert own stamps` — להריץ:

```sql
DROP POLICY IF EXISTS "insert own stamps" ON public.daily_stamps;
DROP POLICY IF EXISTS "update own stamps" ON public.daily_stamps;
```

---

## שלב 3 — Authentication

**איפה:** סיידבר → **Authentication**

| # | תת-עמוד | מה לבדוק |
|---|---------|----------|
| 3.1 | **Providers → Google** | Enabled + Client ID/Secret |
| 3.2 | **URL Configuration** | Redirect URLs לאפליקציה (Web, Expo, Netlify/Vercel) |
| 3.3 | **Users** | משתמשי בדיקה (אופציונלי) |

---

## שלב 4 — Edge Functions

**איפה:** סיידבר → **Edge Functions**

| פונקציה | חובה | תפקיד |
|---------|------|--------|
| `game-complete` | כן | אימות משחק + Token |
| `stamp` | כן | חתימה + ניקוד + שריפת Token |

**פריסה מהמחשב** (מתיקיית `vermillion`):

```powershell
npx supabase@latest login
npx supabase@latest link --project-ref hegbvrvmgvmmbigfpqax
npx supabase@latest secrets set APP_SECRET=<אותו-ערך-כמו-EXPO_PUBLIC_APP_SECRET>
npx supabase@latest functions deploy game-complete
npx supabase@latest functions deploy stamp
```

או: `.\deploy-edge.ps1`

---

## שלב 5 — Secrets

**איפה:** **Project Settings** (גלגל) → **Edge Functions** → **Secrets**

| שם | חובה |
|----|------|
| `APP_SECRET` | כן — זהה ל-`EXPO_PUBLIC_APP_SECRET` ב-build |

---

## שלב 6 — Logs (בדיקה אחרי משחק)

| # | איפה | מתי |
|---|------|-----|
| 6.1 | Edge Functions → `game-complete` → **Logs** | אחרי סיום משחק |
| 6.2 | Edge Functions → `stamp` → **Logs** | אחרי לחיצת חתום |
| 6.3 | Authentication → **Logs** | בעיות התחברות |

---

## שלב 7 — API (למפתח בלבד)

**איפה:** **Project Settings → API**

- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **אין** לשתף `service_role` בלקוח

---

## סיכום "האם הכול עלה?"

| בדיקה | סטטוס |
|--------|--------|
| 4 מיגרציות + schema (לפי מצב DB) | ☐ |
| `game_sessions` קיימת | ☐ |
| `commitment` עם כל עמודות DNA | ☐ |
| טריגר `commitment_immutability` | ☐ |
| `game-complete` + `stamp` ב-Edge Functions | ☐ |
| `APP_SECRET` ב-Secrets | ☐ |
| Web deploy עם `EXPO_PUBLIC_APP_SECRET` | ☐ |

---

## מסמכים לעורך דין (במאגר)

1. `docs/LEGAL_SYSTEM_SPEC_HE.md` — מפרט מלא  
2. `docs/PRODUCT_CONTRACT.md` — חוזה טכני-מוצרי  
3. `docs/CODE_REVIEW_ANTI_CHEAT.md` — ביקורת ו-QA  
