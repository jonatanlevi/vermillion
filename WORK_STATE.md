# זיכרון עבודה — VerMillion

**עודכן (סריקה מלאה):** 2026-04-30

מקור האמת לקוד: תיקיית `vermillion/` (Git `main`). קובץ מראה ב־`million/WORK_STATE.md` — סיכום מצומצם לשורש `million/`.

---

## פריסה וסביבה

| נושא | מצב |
|------|-----|
| **Production (Web)** | Vercel — `https://vermillion-ashen.vercel.app` |
| **Deploy** | `deploy.bat` → `deploy.ps1` (`expo export --platform web`, `vercel --prod`, alias) |
| **Env מקומי** | `vermillion/.env` (לא ב־Git) — לפי `.env.example` |
| **Netlify** | תיעוד ישן ב־`HANDOFF_FILL_IN.md`; הפרויקט הפעיל ב־Vercel — משתני `EXPO_PUBLIC_*` חייבים להיבנות לתוך ה־export (אותו עיקרון כמו Netlify) |

---

## זרימת לקוח (Auth → אפליקציה)

1. **אורח (guest stack בלבד):** `Splash` → `Welcome` | `Register` | `Login` — **אין** יותר `MainTabs` / `CompleteProfile` באורח (מניעת דילוג על הרשמה).
2. **התחברות:** Google (OAuth + PKCE) **או** מייל (Supabase `signInWithOtp` + `verifyEmailOtp` ב־`LoginScreen`).
3. **אחרי סשן:** `AppNavigator` משתמש ב־`getAuthLandingRoute(profile)` — `CompleteProfile` → `AvatarAppearance` (אם יש שם אבל עדיין לא סיימו מסלול) → **`MainTabs`** רק כש־`onboarding_complete === true` (נקבע ב־**ModelDownload** לפני כניסה לאפליקציה).
4. **שער רישום:** `registrationGate.js` — `onboarding_complete` **לא** נדלק ב־CompleteProfile (רק `false` שם); סיום מלא = שם מהטופס + דגל אחרי מסך המודל.
5. **אחרי CompleteProfile:** אווטאר (`AvatarAppearance` → …) ואז שאר האונבורדינג לפי ניווט קיים; טאב מרכזי **VerMillion**.

**Supabase (חובה לבדיקת מייל):** Authentication → Providers → **Email** מופעל; Redirect URLs כוללים את דומיין ה־Vercel.

---

## Git (אחרונים על `main`)

- `98e9655` — זרימת Google או מייל OTP; הסרת טלפון/מזויף; stack אורח מצומצם.
- `9ff852c` — שער `isRegistrationComplete` (שם + דגל).
- `b687cf5` — PKCE web, Splash, deploy Vercel, `schema` / טריגר פרופיל.
- `719e89f` — ProfileReveal יום 8.

ענף: `main`, עץ עבודה נקי מול `origin/main` (נכון לסריקה).

---

## קבצים מרכזיים

| נתיב | תפקיד |
|------|--------|
| `src/navigation/AppNavigator.js` | מחובר / אורח, `initialRouteName` לפי `getAuthLandingRoute` |
| `src/context/AuthContext.js` | סשן, `loadProfile` עם טיפול ב־`error` |
| `src/services/authService.js` | Google, מייל OTP, `getAuthRedirectUrl` |
| `src/services/supabase.js` | לקוח Supabase, `flowType: 'pkce'`, ghost/local |
| `src/services/storage.js` | פרופיל / onboarding / fallback |
| `src/screens/onboarding/SplashScreen.js` | אותו שער רישום כמו Navigator |
| `supabase/schema.sql` | `profiles` + `onboarding_complete`, טריגר `handle_new_user` (id+email בלבד) |

---

## פתוח ידוע בקוד (TODO ב-src)

- `DailyCoachingScreen.js` — שמירת השלמת יום ל־storage (TODO).
- `SubscriptionScreen.js` — RevenueCat / IAP (TODO).

---

## המלצות תפעול (לא חוסם אם חסר)

- להריץ / לעדכן `supabase/schema.sql` בפרויקט Supabase (עמודת `onboarding_complete` וכו').
- Ollama: `ollama pull` למודלים ב־`src/config.js`.
- דוח Ghost יום 8 — P0 UX (ChallengeScreen הסבר שעון; AICoach ברכה עם מספרים) — ראה `ghost-feedback/` (ב־`.gitignore`).

---

## הרצה מקומית

```bash
cd vermillion
npm install
npx expo start
```

פורט חלופי ל־web: `npx expo start --web --port 8082`

---

## היסטוריית עדכונים קצרה

- **2026-04-29:** ProfileReveal יום 8; `DAYS_AGO` לבדיקה.
- **2026-04-30 (בוקר):** Vercel deploy scripts; PKCE; Splash; סכימה.
- **2026-04-30 (סריקה):** תיעוד מצב מלא — Auth מייל+גוגל, stack אורח, שער רישום, TODOים, Vercel כפרודקשן.
- **2026-04-30 (תיקון מסלול):** `onboarding_complete` רק אחרי **ModelDownload**; `CompleteProfile` שומר `false`; `getAuthLandingRoute` מכוון ל־AvatarAppearance כשיש שם ועדיין לא סיימו — מונע Google → VerMillion בלי אווטאר.
