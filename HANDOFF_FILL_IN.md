# מה להשלים ולשמור — סביבה, Netlify, Supabase

השתמש ברשימה הזו, מלא מה שחסר, שמור קבצים. **אל תעלה ל-Git את `.env`** (רק `.env.example` בלי סודות).

---

## אתר production (Netlify)

כתובת לדוגמה (האתר שלך): **https://eclectic-kringle-5c83ec.netlify.app**

ב-Netlify → האתר → **Site configuration → Environment variables** חייבים להיות מוגדרים **לפני Build** את ארבעת משתני ה־`EXPO_PUBLIC_*` (הערכים זהים ל־`.env` המקומי). Expo טוען אותם בזמן `expo export`; בלי זה האפליקציה נבנית בלי Supabase/Ollama.

אחרי עדכון משתנים: **Deploys → Trigger deploy → Clear cache and deploy site** (מומלץ פעם אחת).

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

## 2) Netlify (חובה — אותם מפתחות כמו ב-`.env`)

ב-[Netlify](https://app.netlify.com/teams/jonatanlevi/projects) → האתר (למשל `eclectic-kringle-5c83ec`) → **Site configuration** → **Environment variables**.

בלי ארבעת השורות האלה ה-build של Web לא יכלול את Supabase/Ollama; הקוד משחזר מידע גם ל-localStorage כשרימוט נכשל — אבל OAuth ו-Ollama עדיין דורשים את המפתחות.

הוסף או עדכן:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- `EXPO_PUBLIC_OLLAMA_BASE_URL`

ב-Supabase → **Authentication → URL Configuration → Redirect URLs** הוסף:

`https://eclectic-kringle-5c83ec.netlify.app/**`

אחרי שינוי משתנים ב-Netlify: **Deploys** → **Trigger deploy** (עדיף **Clear cache and deploy** פעם אחת).

---

## 3) Supabase (Dashboard)

- **Authentication → Providers → Anonymous** — אם רוצים סנכרון ענן למשתמשי אורח; אחרת האפליקציה יכולה לעבוד במצב מקומי.
- **Authentication → URL Configuration**  
  - **Site URL**: לפחות `https://eclectic-kringle-5c83ec.netlify.app` (או הדומיין הסופי שלך).  
  - **Redirect URLs**: אותה כתובת, wildcard בסגנון `https://eclectic-kringle-5c83ec.netlify.app/**`, וגם `http://localhost:8081` לפיתוח.
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
