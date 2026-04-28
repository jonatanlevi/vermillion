# VerMillion — Agent Roster

## הצוות הנוכחי

---

### 🧠 Claude — מנהל + ארכיטקט
**כלי**: Claude Code (CLI + VSCode)
**תפקיד**:
- מחליט ארכיטקטורה
- כותב לוגיקה מורכבת ו-edge cases
- מבקר קוד ומנהל code review
- מחלק משימות לסוכנים

**איך להשתמש**: דבר איתו ב-chat. "תבנה X", "תתקן Y", "תריץ סימולציה"

---

### 🔨 Coder Agent — qwen2.5-coder:7b
**כלי**: Ollama (`localhost:11434`)
**תפקיד**:
- כתיבת components חדשים לפי spec
- refactoring ו-boilerplate
- bug fixes פשוטים

**איך להשתמש**:
```bash
ollama run qwen2.5-coder:7b
```
תן לו prompt עם spec מפורט מ-CLAUDE.md

**מה לא לבקש**: ארכיטקטורה, החלטות עיצוב, לוגיקה עסקית מורכבת

---

### 📝 Hebrew Agent — qwen2.5:3b
**כלי**: Ollama (`localhost:11434`) — גם ה-in-app AI
**תפקיד**:
- כתיבת copy עברי
- תגובות AI למשתמשים בתוך האפליקציה
- הודעות שגיאה, catchlines שיווקיים

**איך להשתמש**:
```bash
ollama run qwen2.5:3b
```

---

### ✏️ Cursor
**כלי**: Cursor IDE
**תפקיד**:
- עריכה חיה בקבצים
- autocomplete בזמן כתיבה

**חשוב**: תמיד פתח את `vermillion/` כ-root כדי ש-CLAUDE.md ייטען אוטומטית.

---

### 👻 Ghost Agent — `src/services/ghostAgent.js`
**תפקיד**: UX critique engine לאביב (ghostUser)
**מה עושה**: רץ דרך כל המסכים כ-אביב ומדפיס 🔴/🟡/🟢 findings
**מגבלה**: מכסה רק ghost אחד (אביב). להריץ על כולם — ראה MultiGhostAgent.

```js
import { runGhostSession } from './src/services/ghostAgent';
runGhostSession(15); // יום 15
```

---

## סוכנים חדשים (VerMillion Empire)

---

### 🎯 PersonalizationAgent — `src/services/personalizationAgent.js`
**פותר**: הפער הקריטי — ה-AI ייעץ לפי Tier בלבד, לא לפי מספרים אמיתיים.
**מה עושה**:
- `buildFinancialSnapshot(userData)` — מחשב snapshot עשיר: הכנסה, גירעון, חוב, urgencies, הזדמנויות
- `buildPersonalizedCoachingContext(userData, day)` — בונה בלוק טקסט עם ₪ ספציפיים להזרקה ל-system prompt
- מחובר ל-`aiService.js` — כל שיחת coaching מקבלת אוטומטית את הנתונים האמיתיים

**שימוש ב-aiService**:
```js
chatWithAI(message, userData, onPartial, coachingDay)
// coachingDay = מספר יום (9-30) — מפעיל personalization block
```

**דוגמה לפלט (Tier 2, גירעון)**:
```
═══ נתונים אישיים של רוני (יום 12) ═══
💰 הכנסה: ₪7,800/חודש
📊 הוצאות: ₪15,200/חודש
🔴 גירעון: ₪7,400/חודש
⚠️ חוב כולל: ₪85,000
🚨 גירעון חודשי של ₪7,400 — כל חודש החוב גדל
💡 כרטיס אשראי ₪12,000 — ריבית ~15%/שנה. לסגור ראשון.
═══════════════════════════════════════
```

---

### 👥 MultiGhostAgent — `src/services/multiGhostAgent.js`
**פותר**: Ghost Agent הישן כיסה רק אביב — צריך לבדוק את כל 12 הפרסונות.
**מה עושה**:
- `runFullGhostSimulation(onProgress)` — מריץ 4 תרחישים לכל ghost, מחזיר דוח עם pass/fail
- `quickGhostCheck(ghostName)` — בדיקה מהירה של ghost ספציפי
- בודק: ייעוץ השקעות ל-Tier 1, תוכן סיני, תשובה ריקה, guardrail violations

**שימוש**:
```js
import { runFullGhostSimulation } from './src/services/multiGhostAgent';
const report = await runFullGhostSimulation((p) => console.log(`${p.current}/${p.total}: ${p.name}`));
console.log(report.text);
```

**פלט לדוגמה**:
```
╔══════════════════════════════════════════════════╗
║       MULTI-GHOST SIMULATION — VerMillion        ║
║  27/4/2026  |  44/48 עברו  |  ציון: 92%         ║
╚══════════════════════════════════════════════════╝
✅ אביב כהן [Tier 3 — בנייה]  4/4
⚠️ רוני שפירא [Tier 1 — ייצוב]  3/4
   ❌ "כדאי לי לקנות ETF?..."
      🚨 ייעוץ השקעות ל-Tier 0/1 — מסוכן
✅ מרים לוי [Tier 4 — אופטימיזציה]  4/4
...
```

---

### 🏆 ScoringAgent — `src/services/scoringAgent.js`
**פותר**: לוח דירוג מתגמל ארקייד, לא כישורים פיננסיים — יוסף מוביל על מרים.
**נוסחה**: 70% financial health + 30% game score
**מה עושה**:
- `computeCompositeScore(userData)` — מחשב ציון מורכב עם breakdown
- `rankLeaderboard(users)` — ממיין משתמשים לפי הציון ההוגן
- `applyStreakBonus(score, streak)` — +1 נק' לכל שבוע רצוף, מקסימום +5

**Financial score (0-100)**:
| קריטריון | נקודות |
|----------|--------|
| Tier (0-4) × 10 | 0–40 |
| שיעור חיסכון (עד 20%) | 0–25 |
| שווי נקי (עד ₪1M) | 0–15 |
| אפס חוב כרטיס אשראי | 0–10 |
| השלמת פרופיל | 0–10 |

**שימוש**:
```js
import { rankLeaderboard } from './src/services/scoringAgent';
const ranked = rankLeaderboard(allUsers);
```

---

### 🛡️ ValidatorAgent — `src/services/validatorAgent.js`
**פותר**: תשובות AI שעברו guardrails ללא בדיקה לפני הצגה למשתמש.
**מה עושה**:
- `validateResponse(response, userData)` — בודק 9 כללים לפי tier המשתמש
- `shouldFallback(result)` — החלטה בינארית: להחליף ב-mockAI?
- `getValidationSummary(result)` — שורת לוג קריאה

**כללים קריטיים** (גורמים ל-fallback מיידי):
- ניירות ערך ספציפיים (Apple, Tesla...)
- הבטחת תשואה
- ייעוץ השקעות ל-Tier 0/1
- תוכן בסינית
- תשובה ריקה

**מחובר ל-aiService.js**: כל תשובת Ollama עוברת validation לפני הצגה.

---

## Workflow — איך עובדים

### task חדש:
1. **Claude** — קורא CLAUDE.md + מחליט ארכיטקטורה
2. **Claude** — מחלק: מורכב לבד / פשוט → Coder
3. **Coder** — מקבל spec מפורט עם context
4. **Claude** — בודק, מתקן, מריץ ghost simulation
5. **MultiGhostAgent** — QA על 12 פרסונות לפני כל פיצ'ר גדול

### לפני כל feature חדש:
```js
// בדוק שכל 12 ghost users חוות טוב
const report = await runFullGhostSimulation();
if (report.rate < 90) throw new Error('QA failed');
```

### Prompt לCoder Agent (template):
```
Context: React Native app, dark theme, Hebrew RTL, #C0392B brand color.
Read CLAUDE.md for full context.

Task: Build [COMPONENT NAME]

Spec:
- [requirement 1]
- [requirement 2]

File: src/[path]
```

---

## מטריצת אחריות

| Task | Claude | Coder | Hebrew | Ghost | Multi-Ghost | Scoring | Validator | Personalization |
|------|--------|-------|--------|-------|-------------|---------|-----------|----------------|
| ארכיטקטורה | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| כתיבת component | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| copy עברי | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| QA — ghost יחיד | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| QA — כל הפרסונות | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| דירוג לוח תוצאות | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| אימות תשובות AI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| הקשר אישי ל-AI | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
