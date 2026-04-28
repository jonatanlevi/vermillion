# מה להשלים ולשמור — סביבה, Netlify, Supabase

השתמש ברשימה הזו, מלא מה שחסר, שמור קבצים. **אל תעלה ל-Git את `.env`** (רק `.env.example` בלי סודות).

---

## 1) קובץ `.env` (מקומי, בתיקיית `vermillion/`)

1. אם אין לך: העתק  
   `copy .env.example .env` (או העתקה ידנית).
2. מלא את ארבעת השורות (לפי הטבלה למטה).
3. שמור את `.env`.
4. אחרי שינוי: הפעל מחדש `npx expo start` (משתני `EXPO_PUBLIC_*` נטענים בבנייה/הרצה).

| משתנה | מאיפה הערך |
|--------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → **Project Settings** → **API** → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | אותו מסך → `anon` **public** key |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | Google Cloud Console → **APIs & Services** → **Credentials** → OAuth Client (Web) |
| `EXPO_PUBLIC_OLLAMA_BASE_URL` | כתובת בסיס ל-Ollama (למשל מנהרה יציבה או `http://IP:11434` לבדיקה ברשת הביתית) |

---

## 2) Netlify (אותם שמות משתנים כמו ב-`.env`)

ב-[Netlify](https://app.netlify.com/teams/jonatanlevi/projects) → בחר את האתר → **Site configuration** → **Environment variables**.

הוסף (או עדכן) **בדיוק** את ארבעת המפתחות:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_OLLAMA_BASE_URL`

אחרי שינוי: **Deploys** → **Trigger deploy** (או דחיפה ל-`main`) כדי שהבנייה תקלוט את הערכים.

---

## 3) Supabase (Dashboard)

- **Authentication → Providers → Anonymous** — אם רוצים סנכרון ענן למשתמשי אורח; אחרת האפליקציה יכולה לעבוד במצב מקומי.
- **Authentication → URL Configuration**  
  - **Site URL**: כתובת ה-production של Netlify, למשל `https://YOUR-SITE.netlify.app`  
  - **Redirect URLs**: הוסף את אותה כתובת + `http://localhost:8081` (ולפי הצורך פורטים נוספים לפיתוח).
- **SQL** — הרץ את `supabase/schema.sql` בעורך ה-SQL אם הטבלאות עדיין לא קיימות.

---

## 4) Google Cloud (אם Google Sign-in)

ב-OAuth Client (Web) → **Authorized redirect URIs** חייב לכלול:

`https://<PROJECT_REF>.supabase.co/auth/v1/callback`

(החלף `<PROJECT_REF>` ב-ref של הפרויקט שלך ב-Supabase.)

---

## 5) Ollama

- בשרת שמריץ Ollama: `ollama pull` לכל ארבעת המודלים המופיעים ב-`src/config.js`.
- כתובת ב-`EXPO_PUBLIC_OLLAMA_BASE_URL` חייבת להיות נגישה **מהדפדפן של המשתמש** (CORS לרוב בסדר עם Ollama; אם לא — לבדוק הגדרות). מנהרת **Quick** של Cloudflare משתנה בכל הפעלה — לייצוב השתמש ב-named tunnel (ראה `scripts/cloudflare-tunnel-setup.md`).

---

## סיכום שמירה

| מקום | מה לשמור |
|------|----------|
| `vermillion/.env` | ערכים אמיתיים — **רק במחשב שלך** |
| Netlify | אותם מפתחות וערכים כמו ב-`.env` |
| Git | רק `.env.example` + קוד; בלי מפתחות |

קובץ מצב כללי: `WORK_STATE.md` (בשורש `million/` ובתוך `vermillion/`).
