# VerMillion — TASKS.md
> Backlog חי. עדכן אחרי כל task שמסתיים.
> עדיפות: 🔴 קריטי | 🟡 חשוב | 🟢 שיפור

---

## 🔴 קריטי — חייב לעבוד לפני Demo

- [x] **Games — Budget Battle** — החלקה על הוצאות שמור/קצץ עם PanResponder
- [x] **Games — Financial Quiz** — 12 שאלות מותאמות tier, הסבר אחרי כל תשובה
- [x] **ChallengeScreen — Premium gate** — paywall לmissing + attempts display + safe area
- [ ] **SafeArea fix** — החלף `paddingTop: 60` ב-`useSafeAreaInsets()` בכל הscreens
- [x] **Duplicate cleanup** — מחק `src/services/ai/` ✅
- [x] **Connect aiPrompts + aiKnowledge** — aiService משתמש ב-buildSystemPrompt המלא עם few-shots + guardrails + knowledge base ✅

---

## 🟡 חשוב — UX / Flow

- [ ] **Settings Screen** — שפה, notifications, logout, subscription management
- [ ] **Onboarding flow test** — עבור Splash→Register→Avatar→Subscription→Home מהתחלה
- [ ] **Free user flow** — בדוק שהpaywall עובד נכון ב-3 נקודות (Home, AICoach, Challenge)
- [ ] **ProfileReveal** — בדוק שgeneration עובד עם mockUser day 8
- [ ] **DailyCoaching** — בדוק days 9-30 עם כל 4 tiers
- [ ] **Score multiplier** — בדוק שdeviation calculation נכון
- [ ] **Streak display** — בדוק שmissed days שוברים streak

---

## 🟢 שיפורים — Quality & Polish

- [ ] **Font**: הכנס Heebo (Google Fonts) לכל הטקסטים העבריים
- [ ] **Animations**: הוסף micro-animations לbuttons + card reveals
- [ ] **Haptics**: `expo-haptics` בפעולות חשובות (send message, complete task)
- [ ] **Error boundaries**: wrap screens בerror boundaries
- [ ] **Loading states**: skeleton screens במקום spinners ריקים
- [ ] **Empty states**: תמונות/copy לscreens ריקים (leaderboard ריק, no messages)

---

## 🔵 Future — Backend & Production

- [ ] **Supabase** — auth + database + realtime leaderboard
- [ ] **RevenueCat** — subscription management iOS + Android
- [ ] **Push notifications** — daily reminder, streak alert
- [ ] **Analytics** — Mixpanel/PostHog לfunnel analysis
- [ ] **App Store** — prepare screenshots, metadata
- [ ] **Privacy Policy** — חובה לApp Store

---

## ✅ הושלם

- [x] Time engine (timeEngine.js) — currentDay, phase, deviation, multiplier
- [x] Financial tier system (financialTier.js) — 4 tiers
- [x] Mock AI fallback (mockAI.js) — keyword-based Hebrew responses
- [x] Daily questions rewrite — 7 days lifestyle + financial
- [x] computeFinancialMetrics — income, expenses, debt, netWorth, savingsRate
- [x] HomeScreen — dynamic based on currentDay + phase + subscription
- [x] AICoachScreen — Ollama status, error bubbles, streaming
- [x] Ollama fix — localhost:11434
- [x] Chinese hallucination guard — regex + fallback
- [x] ProfileRevealScreen
- [x] DailyCoachingScreen
- [x] SubscriptionScreen
- [x] PREMIUM_FEATURES + canUseFeature() in mock/data.js
- [x] CLAUDE.md — project DNA
- [x] TASKS.md — backlog חי
- [x] AGENTS.md — roles + workflow
- [x] scripts/coder.ps1 — coder agent launcher (qwen2.5-coder:7b)
- [x] scripts/hebrew.ps1 — Hebrew content agent (qwen2.5:3b)
- [x] scripts/task.ps1 — one-shot task runner
