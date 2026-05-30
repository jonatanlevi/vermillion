# VerMillion — Code Brain
> המסמך הזה הוא הזיכרון הטכני של הפרויקט. קרא אותו לפני כל שינוי ארכיטקטורלי או תחילת פיצ'ר חדש.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile | React Native | 0.81.5 |
| Framework | Expo | SDK 54 |
| Navigation | React Navigation | native + bottom-tabs + native-stack |
| Backend | Supabase | Auth, DB, Storage |
| Deploy (web) | Vercel | `https://vermillion-ashen.vercel.app` |
| Local AI | Ollama | `localhost:11434` |
| AI Model (in-app) | qwen2.5:3b | temp 0.3, max_tokens 280 |
| AI Model (dev) | qwen2.5-coder:7b | — |
| Language | JavaScript | No TypeScript yet |

### AI Provider Chain (Runtime Fallback)
```
1. checkOllama() — 2.5s timeout
2. אם online → Ollama streaming
3. אם offline → mockChatWithAI() (keyword-based Hebrew)
4. אם תגובה בסינית → mockChatWithAI() (hallucination guard)
```

### Supabase Tables
- `auth.users` — Supabase native auth (PKCE)
- `profiles` — user data + subscription + tier
- `daily_stamps` — attendance per day
- `onboarding_state` — progress through 30-day flow
- `financial_data` — answers to financial questionnaire

---

## Development Tools

- **Claude Code (CLI)** — AI architect + coding partner (this project)
- **Cursor** — AI-powered IDE for daily development
- **VS Code** — fallback editor
- **`.cursor/rules/`** — always-active rules for Cursor AI

**חשוב:** לא מפנים ל-Stitch, לא מפנים לכלים שהוסרו. Stack = Claude + Cursor בלבד.

---

## Architecture Rules

### 1. RTL First
כל component חדש — `textAlign: 'right'` כברירת מחדל. RTL זה לא feature, זה default.

### 2. StyleSheet.create תמיד
**אסור** inline styles. תמיד `StyleSheet.create({})` — ביצועים + קריאות.

### 3. No Redux / Zustand
State management = `useState` + `useEffect` בלבד. אל תוסיף store מנהל עד שיש כאב אמיתי.

### 4. Mock הוא רק לפיתוח
`mock/data.js` — לסימולציית ghost ובדיקות בלבד. **אסור** להשתמש ב-`mockUser` בקוד production.

### 5. Imports — relative paths בלבד
```js
// ✅ נכון
import { storage } from '../../services/storage';

// ❌ אסור
import { storage } from 'services/storage';
```

### 6. Comments — WHY בלבד
אין comments שמסבירים WHAT. רק אם יש constraint נסתר, workaround, או invariant לא ברור.

### 7. Hebrew Strings — ישירות בקוד
אין i18n מלא עדיין. Hebrew strings ישירות בקוד JavaScript.

### 8. Time/Date — DNA המשתמש
- DNA = שעה מיום ההרשמה של המשתמש הספציפי
- חתימה = שעון מקומי ברגע הלחיצה
- **לא** `Asia/Jerusalem` גלובלי לכולם
- קרא `.cursor/rules/vermillion-time-dna-contract.mdc` לפני כל נגיעה ב-timeEngine

### 9. Anti-Cheat — לא נוגעים בלי לקרוא
לפני כל שינוי ב-`game-complete` / `stamp` / `storage`:
קרא `.cursor/rules/vermillion-anti-cheat.mdc` ו-`docs/CODE_REVIEW_ANTI_CHEAT.md`.

---

## File Structure

```
src/
  components/          # Reusable UI
    CharacterFigure.js
    VermillionAvatar.js
    ObstacleGame.js
    LanguagePicker.js
  config.js            # Ollama URL + AI settings
  context/
    LanguageContext.js # i18n hook
  data/
    dailyQuestions.js  # 7 days Q&A + calcCompletion + computeFinancialMetrics
    coachingContent.js # Days 9-30 plans (22 days × 4 tiers)
  i18n/
    translations.js
  mock/
    data.js            # DEV ONLY — mockUser, mockLeaderboard
  navigation/
    AppNavigator.js    # Stack + Bottom Tabs
  screens/
    onboarding/        # Splash → Welcome → Register → CompleteProfile → Avatar* → Subscription
    main/              # Home, DailyQuestions, DailyCoaching, ProfileReveal, Challenge, Leaderboard, AICoach, Profile
  services/
    aiService.js       # chatWithAI(), getAIStatus(), buildSystemPrompt()
    mockAI.js          # Keyword Hebrew fallback
    financialTier.js   # classifyTier() → tier 0-4
    timeEngine.js      # getCurrentDay(), getPhase(), getUserTimeStatus()
    aiPrompts.js       # TODO: לחבר ל-aiService
    aiKnowledge.js     # TODO: לחבר ל-aiService
    storage.js         # כל persistence: profile, financial, onboarding, stamps
    supabase.js        # Supabase client + PKCE
    agents/            # multi-agent AI system
```

---

## Navigation Map

```
Splash → Welcome → Register → CompleteProfile → AvatarAppearance
       → AvatarTone → AvatarIntro → AvatarReveal → Subscription → MainTabs

MainTabs (bottom):
  Home | Challenge | Leaderboard | AICoach | Profile

Stack modals from Home:
  DailyQuestions, DailyCoaching, ProfileReveal
```

---

## Known TODOs (לא bugs — בכוונה נדחה)

- [ ] SafeArea: `paddingTop: 60` hardcoded → צריך `useSafeAreaInsets()`
- [ ] `aiPrompts.js` + `aiKnowledge.js` לא מחוברים ל-`aiService.js`
- [ ] Payment: RevenueCat/Stripe לא בנוי — `SubscriptionScreen` = UI בלבד
- [ ] Weekly milestones: ימים 7, 14, 21, 25 ב-DailyCoachingScreen
- [ ] Grace days: 2/חודש, streak לא נשבר

---

## Ollama Config (src/config.js)

```js
OLLAMA_BASE_URL: 'http://localhost:11434'
AI_MODEL: 'qwen2.5:3b'
AI_TEMPERATURE: 0.3
AI_MAX_TOKENS: 280
AI_NUM_CTX: 2048
```

## AI System Prompt Rules

- Hebrew ONLY — CRITICAL rule in English at top
- 2-4 paragraphs
- End with one concrete question
- Tier-appropriate: לא המלצות השקעה ל-Tier 1
- Stop tokens: `['User:', 'Human:', '用户:', '请', '您']`

---

## Deployment

```powershell
# Web (Vercel)
.\deploy.ps1

# או
.\deploy.bat
```

URL: `https://vermillion-ashen.vercel.app`
