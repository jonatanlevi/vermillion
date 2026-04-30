# VerMillion — TASKS.md (תוכנית עבודה)

> עדכן אחרי כל משימה שמסתיימת.  
> עדיפות: **P0** קריטי לפני בטא | **P1** חשוב | **P2** שיפור

---

## P0 — אימות ובטא (עכשיו)

- [ ] **בדיקת Auth בפרוד** — Google + מייל OTP על `vermillion-ashen.vercel.app`; וידוא Redirect URLs + Email provider ב־Supabase + הרצת SQL ל־`profile_intake_complete`.
- [ ] **בדיקת סדר flow מחייב** — Auth → CompleteProfile → Avatar → ModelDownload → VerMillion → Games → Timer (למשתמש חדש ונקי).
- [ ] **DailyCoaching** — לממש שמירת השלמת יום (`TODO` ב־`DailyCoachingScreen.js`) כדי שלא יאבדו נתונים בריענון.

---

## P1 — UX / מוצר (Ghost + איכות)

- [ ] **Ghost day-08 P0** — ChallengeScreen: שורת הסבר מעל שעון Personal Time; AICoach: ברכה עם `computeFinancialMetrics` (לא גנרית).
- [ ] **SafeArea** — החלפת `paddingTop` קבוע ב־`useSafeAreaInsets()` במסכים שנותרו.
- [ ] **Onboarding regression** — Splash → Welcome → Login/Register → OAuth/OTP → CompleteProfile → Avatar → אפליקציה (רשימת בדיקה ידנית).
- [ ] **Settings** — שפה, התראות (עתידי), logout/delete כבר קיימים חלקית — לאחד ולוודא web.
- [ ] **ProfileReveal** — בדיקה עם נתוני `getOnboardingState` אמיתיים (לא רק mock) ביום 8.
- [ ] **Free vs Premium** — לוודא paywall בשלוש נקודות לפי המפרט הקיים.

---

## P2 — Polish

- [ ] פונט Heebo לעברית.
- [ ] Micro-animations, haptics בפעולות מפתח.
- [ ] Error boundaries; skeleton במקום spinner ריק; empty states.

---

## Backend / עתיד

- [ ] RevenueCat / IAP (`SubscriptionScreen` TODO).
- [ ] Push, Analytics, App Store, Privacy Policy.

---

## הושלם לאחרונה (סמן ואל תמחק — היסטוריה)

- [x] **Auth מחדש** — Google + מייל OTP; guest stack רק Splash/Welcome/Register/Login; ביטול כניסה מזויפת ל־MainTabs.
- [x] **שער רישום** — `registrationGate.js` + Splash + `AppNavigator` מסונכרנים.
- [x] **הקשחת Google ≠ הרשמה** — `profile_intake_complete` נוסף ל־schema ול־gate; שם מגוגל לא מדלג על CompleteProfile.
- [x] **Flow מוצר מחייב** — VerMillion שלב מפורש לפני משחק ראשון, עם CTA ל־Games ולחצן Timer.
- [x] **תיקון email בפרופיל** — `profiles.email` מתמלא ב-upsert מהאפליקציה וב-trigger ב-conflict; CompleteProfile עוצר על שגיאת שמירה.
- [x] **OAuth web** — PKCE ב־`supabase.js`; `loadProfile` עם טיפול בשגיאות.
- [x] **Deploy Vercel** — `deploy.bat` / `deploy.ps1`, `vercel.json`, alias קבוע.
- [x] **סכימת profiles** — `onboarding_complete` + `profile_intake_complete`, טריגר id+email בלבד (ב־`schema.sql`).
- [x] **Games** — Budget Battle, Financial Quiz (פריטים ישנים מ־TASKS המקורי).
- [x] **aiService** — buildSystemPrompt + knowledge (נקי מ־`src/services/ai/` כפול).
