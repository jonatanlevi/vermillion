# זיכרון עבודה — VerMillion (`million`)

עודכן: 2026-04-28 — עותק זהה ל־`../WORK_STATE.md` בשורש התיקייה `million`.

**השלמת env / Netlify / Supabase:** ראה `HANDOFF_FILL_IN.md` ו־`.env.example`.

## איפה הקוד

| נתיב | תיאור |
|------|--------|
| `million/vermillion/` | ריפו Git + אפליקציית Expo (מקור האמת) |
| `million/WORK_STATE.md` | מקור — מצב עבודה ללא גישה ל-chat |

## הרצה מקומית

```bash
cd vermillion
npm install   # אם צריך
npx expo start
```

אפשר `w` לדפדפן, או סריקת QR ל-Expo Go. אם פורט 8081 תפוס: `npx expo start --web --port 8082` ואז דפדפן ב־`http://localhost:8082`.

## Git

- ענף: `main` (תחת `vermillion/`)
- רימוט: לפי `git remote -v` בפרויקט

## מה כבר טופל לאחרונה (סיכום טכני)

- **ניווט אורח**: מסכי `CompleteProfile` → `MainTabs` וכו' נוספו ל-stack של לא-מחובר; קישור הרשמה ב-Welcome; Splash קורא `getSession()` מיד.
- **Supabase**: `getOrCreateUser` עם גיבוי **משתמש מקומי** (`local_*`) + שמירת נתונים ב-AsyncStorage/localStorage כשאין סשן אנונימי או env חסר.
- **VerMillion צ'אט**: שגיאת "לא הצלחתי להתחבר" באונבורדינג — לרוב הייתה שמירה ל-Supabase; עכשיו יש fallback מקומי; לוג `console.error` בשגיאות שליחה.
- **מודלי Ollama (4)**: ב-`src/config.js` — `qwen2.5:3b`, `qwen2.5-coder:7b`, `qwen2.5:7b`, `llama3.2:3b` ממופים לצוות הסוכנים; מסך הגדרות מציג את הרשימה.

## משתני סביבה חשובים (`.env` ב-`vermillion/`)

- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OLLAMA_BASE_URL` (מנהרה / מקומי)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (אם OAuth)

## פתוח / מומלץ להמשך

- להריץ `supabase/schema.sql` ב-SQL Editor אם עדיין לא (טבלאות + RLS).
- ב-Supabase: להפעיל **Anonymous** אם רוצים סנכרון ענן (אופציונלי — יש מצב מקומי).
- ב-Netlify: לוודא אותם `EXPO_PUBLIC_*` כמו ב-`.env` המקומי.
- ב-Ollama על השרת: `ollama pull` לכל ארבעת המודלים לפי `config.js`.

## קישורים מהירים בקוד

- `src/config.js` — URL Ollama + מודלים
- `src/services/supabase.js` — סשן + משתמש מקומי
- `src/services/storage.js` — Supabase + מצב offline
- `src/navigation/AppNavigator.js` — stacks מחובר / אורח

## עדכון בדיקות Ghost

- משתמשי בדיקות עם מזהה ghost_* מסומנים לוקאליים בלבד ב-src/services/supabase.js.
- נתוני Ghost לא אמורים להיכתב ל-Supabase.

