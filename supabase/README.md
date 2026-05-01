# Supabase Setup

Project: `eevmgafxfghygdaucqad.supabase.co`

## 1. הפעל את הפרויקט אם הוא paused

ה-Supabase מקפיא פרויקטים בחבילה החינמית אחרי 7 ימים ללא פעילות.
לך ל-[Supabase Dashboard](https://supabase.com/dashboard) → vermillion → **Resume project**.

## 2. הרץ את הסכמה

1. לחץ על **SQL Editor** בסיידבר השמאלי
2. לחץ **New query**
3. העתק את כל התוכן של [`schema.sql`](./schema.sql)
4. הדבק לעורך
5. לחץ **Run** (Ctrl/Cmd + Enter)

הסקריפט יוצר 9 טבלאות עם RLS:

| טבלה | תוכן |
|---|---|
| `profiles` | פרופיל בסיסי, מקושר ל-`auth.users` |
| `onboarding_answers` | תשובות יומיות (1–7) — עם unique constraint על user+day+question |
| `financial_data` | blob של כל הנתונים הפיננסיים |
| `onboarding_state` | אילו ימים הושלמו, daily_answers |
| `chat_history` | היסטוריית הצ'אט עם VerMillion |
| `commitment` | שעת ה-commitment + streak |
| `game_scores` | ציוני משחקים אישיים |
| `game_log` | per-day game stamps (לוח דיוק) |
| `daily_logs` | coaching ימים 9–30 |

הסקריפט גם מתקין trigger שיוצר `profiles` אוטומטית כשמשתמש חדש נרשם.

## 3. הגדרת Google OAuth

### ב-Google Cloud Console

[Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)

1. בחר את ה-OAuth 2.0 Client ID שלך (או צור חדש מסוג "Web application")
2. ב-**Authorized redirect URIs** הוסף:
   ```
   https://eevmgafxfghygdaucqad.supabase.co/auth/v1/callback
   ```
3. שמור
4. העתק את **Client ID** ו-**Client Secret**

### ב-Supabase Dashboard

1. **Authentication** → **Providers** → **Google**
2. **Enabled**: On
3. הדבק את **Client ID** ו-**Client Secret** מ-Google
4. **Save**

### URL Configuration

**Authentication** → **URL Configuration**:
- **Site URL**: `vermillion://`
- **Redirect URLs** (אחד בכל שורה):
  ```
  vermillion://**
  http://localhost:8081
  http://localhost:19006
  https://YOUR-NETLIFY-DOMAIN.netlify.app/**
  ```
  (החלף `YOUR-NETLIFY-DOMAIN` אחרי שתפרוס ל-Netlify)

## 4. פריסת Edge Function — stamp (Anti-Cheat)

הפונקציה `supabase/functions/stamp/index.ts` מחשבת ניקוד בצד השרת.
הלקוח **לא** שולח ms_diff — השרת קורא את שעת ה-commitment מה-DB ומחשב לבד.

### פריסה
```bash
# חד-פעמי: התקן CLI + קשר לפרויקט
npm install -g supabase
supabase login
supabase link --project-ref eevmgafxfghygdaucqad

# פרוס את הפונקציה
supabase functions deploy stamp
```

### RLS — חסום INSERT ישיר מהלקוח
הרץ ב-SQL Editor:
```sql
drop policy if exists "insert own stamps" on public.daily_stamps;
```
(כבר כלול ב-schema.sql המעודכן — הרץ רק אם הטבלה כבר קיימת)

## 5. אימות שהכל עובד

הרץ את האפליקציה (`npm start`), לחץ "המשך עם Google", צריך להיפתח דפדפן Google,
לבחור חשבון, ולחזור לאפליקציה כשאתה מחובר.

אם משהו לא עובד — בדוק את ה-logs ב-**Authentication** → **Logs**.
