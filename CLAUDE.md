# VerMillion — CLAUDE.md
> קרא את זה לפני כל שינוי. זה ה-DNA של הפרויקט.

## מה זה?
אפליקציית React Native לאימון פיננסי אישי לישראלים.
- ₪79/חודש | ₪749/שנה
- פרס חודשי: ₪45,000 לניצחון ב-30 יום אתגר
- חזון: "יועץ פיננסי אישי לכל אדם בכיס"

---

## Stack
- **React Native 0.81.5** + **Expo SDK 54**
- **Navigation**: @react-navigation/native + bottom-tabs + native-stack
- **AI**: Ollama local (`localhost:11434`) → fallback mockAI
- **Models**: qwen2.5:3b (in-app), qwen2.5-coder:7b (dev agent)
- **State**: useState/useEffect — אין Redux/Zustand עדיין
- **Backend**: אין עדיין — הכל mock data
- **Language**: עברית ראשונה, RTL

---

## Design System

### Colors
```
Background:    #0A0A0A (main), #0F0F0F (tabs), #161616 (inputs)
Surface:       #1A1A1A (cards), #222 (borders)
Primary Red:   #C0392B (brand), #FF4D4D (glow/hover)
Gold:          #D4AF37 (premium/tier 4)
Warning:       #F39C12
Success:       #4CAF50
Text Primary:  #FFFFFF
Text Secondary:#888888
Text Muted:    #444444
```

### Typography
- Hebrew font: system default (Heebo רצוי בעתיד)
- Headers: 20-28px, weight 700-900
- Body: 15px, lineHeight 22
- Small: 11-13px

### Spacing
- Screen padding: 20px horizontal
- Card padding: 16-20px
- Gap between elements: 12-16px
- Safe area top: 60px (hardcoded — TODO: useSafeAreaInsets)

### UI Rules
- **RTL תמיד**: `textAlign: 'right'`, `flexDirection: 'row'` עם items מימין לשמאל
- **Dark theme only** — אין light mode
- **כפתורים**: borderRadius 12-24, minHeight 48px
- **Cards**: borderRadius 16, borderWidth 1, borderColor #1A1A1A
- **Shadows**: elevation 4-8, shadowColor מהצבע של האלמנט

---

## File Structure
```
src/
  components/          # Reusable UI components
    CharacterFigure.js
    VermillionAvatar.js
    ObstacleGame.js
    LanguagePicker.js
  config.js            # Ollama URL + AI model settings
  context/
    LanguageContext.js # i18n, useLanguage() hook
  data/
    dailyQuestions.js  # 7 days Q&A + calcCompletion + computeFinancialMetrics
    coachingContent.js # Days 9-30 coaching plans (22 days × 4 tiers)
  i18n/
    translations.js
  mock/
    data.js            # mockUser, mockLeaderboard, PREMIUM_FEATURES, canUseFeature()
  navigation/
    AppNavigator.js    # Stack + Bottom Tabs
  screens/
    onboarding/        # Splash → Welcome → Register → CompleteProfile → Avatar* → Subscription
    main/              # Home, DailyQuestions, DailyCoaching, ProfileReveal, Challenge, Leaderboard, AICoach, Profile
  services/
    aiService.js       # chatWithAI(), getAIStatus(), buildSystemPrompt()
    mockAI.js          # Keyword-based Hebrew fallback AI
    financialTier.js   # classifyTier() → tier 0-4
    timeEngine.js      # getCurrentDay(), getPhase(), getUserTimeStatus()
    aiPrompts.js       # (לא מחובר עדיין לaiService)
    aiKnowledge.js     # (לא מחובר עדיין לaiService)
    ai/aiPrompts.js    # (כפול — לנקות)
    ai/aiKnowledge.js  # (כפול — לנקות)
```

---

## Core Logic

### 30-Day Flow
```
Day 1-3:   Lifestyle profiling (family, work, habits) — phase: 'lifestyle'
Day 4-7:   Financial profiling (income, expenses, debts) — phase: 'financial'
Day 8:     ProfileReveal — AI generates summary — phase: 'reveal'
Day 9-30:  Daily coaching + challenge — phase: 'coaching'
Day 31+:   Complete — phase: 'complete'
```

### Financial Tiers (classifyTier)
```
Tier 0: עיוור       — completion < 40%
Tier 1: ייצוב       — חוב > הכנסה×6 או גירעון
Tier 2: שרידות      — savingsRate < 5%
Tier 3: בנייה       — savingsRate < 20%
Tier 4: אופטימיזציה — savingsRate ≥ 20%
```

### Subscription
```
subscription: 'premium' | 'free'
Premium only: questionnaire, AI coach, challenge week, leaderboard, profile report
Free gets: 3 AI demo messages, locked previews
Demo mode: set mockUser.subscription = 'premium' in mock/data.js
```

### Testing Different Days
```js
// src/mock/data.js — שנה DAYS_AGO:
const DAYS_AGO = 0   // יום 1 — משתמש חדש
const DAYS_AGO = 6   // יום 7 — יום אחרון שאלון
const DAYS_AGO = 7   // יום 8 — חשיפת פרופיל
const DAYS_AGO = 15  // יום 16 — אמצע אתגר
const DAYS_AGO = 29  // יום 30 — יום אחרון
```

---

## AI System

### Ollama Config (src/config.js)
```js
OLLAMA_BASE_URL: 'http://localhost:11434'
AI_MODEL: 'qwen2.5:3b'
AI_TEMPERATURE: 0.3
AI_MAX_TOKENS: 280
AI_NUM_CTX: 2048
```

### Fallback Chain
```
1. checkOllama() — 2.5s timeout
2. אם online → Ollama stream
3. אם offline → mockChatWithAI()
4. אם תגובה בסינית → mockChatWithAI() (hallucination guard)
```

### System Prompt Rules
- Hebrew ONLY — CRITICAL rule in English at top
- 2-4 paragraphs
- End with one concrete question
- Tier-appropriate advice (no investments for Tier 1)
- Stop tokens: `['User:', 'Human:', '用户:', '请', '您']`

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

## Known Issues (TODO)
- [ ] SafeArea: hardcoded `paddingTop: 60` — צריך `useSafeAreaInsets()`
- [ ] Duplicate files: `src/services/ai/` כפול של `src/services/`
- [ ] `aiPrompts.js` + `aiKnowledge.js` לא מחוברים ל-`aiService.js`
- [ ] Games: Budget Battle + Financial Quiz לא בנויים עדיין
- [ ] Settings screen חסר
- [ ] אין backend — הכל mock
- [ ] אין authentication אמיתי
- [ ] Payment integration (RevenueCat/Stripe) לא בנוי

---

## Conventions
- **No comments** על קוד ברור — רק WHY לא-ברור
- **Hebrew strings** ישירות בקוד — אין i18n מלא עדיין
- **StyleSheet.create** תמיד — לא inline styles
- **mockUser** מ-`src/mock/data.js` — הנתונים הם ground truth
- **No TypeScript** עדיין — plain JS
- **Imports**: relative paths, לא absolute
