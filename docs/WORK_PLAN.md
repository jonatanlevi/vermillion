# VerMillion App — תוכנית עבודה

**עודכן:** 18 מאי 2026
**אפליקציה:** `c:\Users\97254\Desktop\million\vermillion`
**Deploy:** https://vermillion-ashen.vercel.app
**Deploy:** `.\deploy.ps1` מתוך תיקיית `vermillion/`

---

## מה האפליקציה

VerMillion — 30 יום אתגר פיננסי עם פרס שבועי.
- מנוי ₪99/חודש (Premium) או חינמי (Free)
- Stamp יומי לפי טיימר DNA אישי
- 31 משחקים פיננסיים
- AI coaching (Groq llama-3.3-70b)
- פרס: ניקוד × דייקנות × משחקים

---

## מערכת ניהול העסק — VerMillion CRM

**בתאריך 2026-05-18 נבנתה מערכת CRM נפרדת לניהול העסק עצמו.**

| נושא | פרטים |
|------|--------|
| נתיב | `c:\Users\97254\Desktop\vermillioncrm` |
| GitHub | https://github.com/jonatanlevi/vermillioncrm |
| Stack | Next.js 15 · Prisma/SQLite · AI (Grok/Claude) |
| גישה | http://localhost:3001 (npm run dev) |
| תוכנית עבודה | `vermillioncrm/docs/WORK_PLAN.md` |

**מה ה-CRM מנהל:**
- משתמשי האפליקציה — סנכרון אוטומטי מ-Supabase (Realtime + ידני)
- מעקב נטישה — משתמשים שמחקו חשבון (`/vermillion/churned`)
- מודול מנכ"ל — צוות, יעדים, נוכחות (`/ceo`)
- קמפיינים × 13 רשתות חברתיות
- כספים, מכירות, WhatsApp, מדיה
- 6 סוכני AI + orchestrator

**עקרון קריטי (ADR-002):**
```
אפליקציה (Supabase) → [יניקה חד-כיוונית] → CRM (Prisma)
```
ה-CRM לא כותב ל-Supabase — רק קורא.

---

## מה בנוי ✅ (נכון ל-2026-05-18)

| רכיב | סטטוס |
|------|--------|
| Auth — Google + Email | ✅ |
| Onboarding 7 ימים (AI chat) | ✅ |
| DNA Timer + Stamp יומי | ✅ |
| 31 משחקים פיננסיים | ✅ |
| AI coaching (Groq) | ✅ |
| פרופיל + Avatar | ✅ |
| מסכי שישי/שבת | ✅ |
| Deploy Vercel | ✅ |
| **CRM לניהול העסק** | ✅ |

---

## לפני השקה ❌ (TODO קריטי)

| נושא | קובץ | פירוט |
|------|------|--------|
| הסר dev pause button | `VerMillionScreen.js` | מחק `devPaused`, `devShowPause`, `devNavTimerRef`, JSX, `devStyles` |
| `DEV_BYPASS_TIMER = false` | `VerMillionScreen.js` שורה 18 | |
| `DEV_NO_QUESTION_LIMIT = false` | `OnboardingChatScreen.js` | |
| תיקון isActive | `GamesScreen.js` | `isActive = isToday \|\| isPast` (לא `!!day`) |
| `terms_accepted_at` | `storage.js` → `PROFILE_DB_COLUMNS` | |
| ANTHROPIC_API_KEY | `.env` + Vercel | לסוכן Claude עתידי |
| ניירת משפטית | `million/docs/` | תנאי שימוש, תקנון תחרות |

---

## פקודות

```powershell
# האפליקציה
.\deploy.ps1              # build + deploy ל-Vercel

# ה-CRM (חלון נפרד)
cd c:\Users\97254\Desktop\vermillioncrm
npm run dev               # http://localhost:3001
```

---

## ריפוזים

| פרויקט | ריפו | הערה |
|--------|------|------|
| האפליקציה | ריפו זה | Expo + React Native |
| CRM | vermillioncrm (ריפו נפרד) | Next.js — לא לערבב |
