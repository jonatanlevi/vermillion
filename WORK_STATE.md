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
3. **אחרי סשן:** `AppNavigator` משתמש ב־`getAuthLandingRoute(profile)` — `CompleteProfile` (אם intake לא הושלם) → `AvatarAppearance` (אם intake הושלם) → **`MainTabs`** רק כש־`onboarding_complete === true`.
4. **שער רישום:** `registrationGate.js` — `profile_intake_complete` נקבע **רק** אחרי טופס ההרשמה שלנו (לא מגוגל), ו־`onboarding_complete` נקבע רק ב־**ModelDownload** לפני כניסה לאפליקציה.
5. **סדר מאולץ במסלול ראשון:** Auth → CompleteProfile → Avatar → ModelDownload → VerMillion (מסך מעבר) → Games → GlassButton Timer.

**Supabase (חובה לבדיקת מייל):** Authentication → Providers → **Email** מופעל; Redirect URLs כוללים את דומיין ה־Vercel.

---

## Git (אחרונים על `main`)

- `0c848d1` — VerMillion מציג שלב מעבר מפורש לפני משחק ראשון (לא קפיצה אוטומטית).
- `5406e08` — אכיפת journey ראשון: VerMillion → Games Timer לפני שאלות יום 1.
- `a2eb0d2` — הקשחת gate: דרישת `profile_intake_complete` לגישה ל־MainTabs.
- `54ed9e6` — הוספת `profile_intake_complete` ל־schema + gate (Google לא מדלג על טופס).

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
| `supabase/schema.sql` | `profiles` + `onboarding_complete` + `profile_intake_complete`, טריגר `handle_new_user` (id+email בלבד) |

---

## פתוח ידוע בקוד (TODO ב-src)

- `DailyCoachingScreen.js` — שמירת השלמת יום ל־storage (TODO).
- `SubscriptionScreen.js` — RevenueCat / IAP (TODO).

---

## המלצות תפעול (לא חוסם אם חסר)

- להריץ / לעדכן `supabase/schema.sql` בפרויקט Supabase (כולל `profile_intake_complete`).
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
- **2026-04-30 (תיקון מסלול):** `onboarding_complete` רק אחרי **ModelDownload**; `CompleteProfile` שומר `onboarding_complete: false` + **`profile_intake_complete: true`** (רק אחרי טופס ההרשמה שלנו — לא מזוהה מגוגל). `getAuthLandingRoute`: MainTabs | AvatarAppearance (אם intake) | CompleteProfile.
- **SQL:** להריץ ב־Supabase אם העמודה חסרה: `alter table public.profiles add column if not exists profile_intake_complete boolean default false;`
- **2026-04-30 (הקשחת flow):** VerMillion לא מדלג אוטומטית; מסך מעבר מפורש למשחק ראשון+Timer כדי לשמור סדר חווייתי.
- **2026-04-30 (תיקון הרשמה):** שמירת email בפרופיל הוקשחה: `ensureProfileExists` עושה upsert `id+email`, trigger `handle_new_user` משלים email גם ב-conflict, ו-`CompleteProfile` לא ממשיך ל-Avatar אם שמירה נכשלה.
