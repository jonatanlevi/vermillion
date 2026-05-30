# VerMillion — Product Brain
> המסמך הזה הוא הזיכרון העסקי של המוצר. קרא אותו לפני כל שינוי ב-UX, תמחור, או brand.

---

## Vision Statement

**"יועץ פיננסי אישי לכל אדם בכיס"**

VerMillion היא אפליקציה לאימון פיננסי אישי לישראלים. היא לא קורס, לא מחשבון — היא מסע יומי של 30 יום שבסיומו המשתמש מבין לראשונה איפה הכסף שלו הולך ואיך לשנות את זה.

---

## Target Audience & Value Proposition

**קהל יעד ראשוני:** ישראלים בגילאי 22-45, עצמאים או שכירים, שמרגישים שהם "עובדים קשה אבל הכסף נגמר". לא עניים ולא עשירים — הביניים שמעולם לא פנה אליהם יועץ אמיתי.

**הבעיה:** ייעוץ פיננסי אמיתי עולה ₪400-800/שעה ומרגיש מנוכר. האפליקציות הקיימות (Mint, PocketGuard) לא מותאמות לישראל (מס, מט"ח, ביטוח לאומי) ולא מלמדות — רק מציגות.

**הערך:** VerMillion עושה **אבחון** ואז **מלווה** — 8 ימים של שאלות + 22 ימים של אימון יומי מותאם לטייר הפיננסי של המשתמש.

**הבדיה:** פרס שבועי דינמי — 50% מ-80% הכנסות נטו מתחלק בין 5 הדייקניים ביותר. זה מייצר engagement אמיתי וחוזר על עצמו.

---

## Brand Identity

### שם
- **VerMillion** בלבד — כתיב קבוע. לא Vermillion, לא vermillion, לא VERMILLION.
- בעברית: "ורמיליון" (רק בהקשר שיחה, לא ב-UI)

### אישיות המותג
- **פרימיום** — לא צ'יפ, לא משחקי
- **ישיר** — אנחנו אומרים מה שאחרים לא אומרים לך
- **חם** — לא בנקאי, לא קר. כמו חבר שהוא גם כלכלן
- **דרמטי במינון** — אדום + זהב, לא קריקטורה

### Tone of Voice
- עברית ישירה, ללא ז'רגון מיותר
- "אתה" לא "אתם"
- לא מתנשא, לא מנסה להיות מגניב

---

## Design System

### פילוסופיה
Premium dark luxury. Stripe-style modern UI. מובייל ראשון.
**רק Dark Mode** — אין light mode, לא מתוכנן.

### Palette
```
Background:    #0A0A0A (main), #0F0F0F (tabs), #161616 (inputs)
Surface:       #1A1A1A (cards), #222222 (borders)
Primary Red:   #C0392B (brand), #FF4D4D (glow/hover)
Gold:          #D4AF37 (premium / tier 4)
Warning:       #F39C12
Success:       #4CAF50
Text Primary:  #FFFFFF
Text Secondary:#888888
Text Muted:    #444444
```

### Typography
- Hebrew: system default (Heebo עתידי)
- Headers: 20-28px, weight 700-900
- Body: 15px, lineHeight 22
- Small: 11-13px

### Spacing
- Screen padding: 20px horizontal
- Card padding: 16-20px
- Element gap: 12-16px
- Safe area top: 60px (TODO: עבור ל-useSafeAreaInsets)

### Component Rules
- RTL תמיד: `textAlign: 'right'`
- כפתורים: borderRadius 12-24, minHeight 48px
- Cards: borderRadius 16, borderWidth 1, borderColor #1A1A1A
- Shadows: elevation 4-8, shadowColor מצבע האלמנט

---

## Pricing Model

### מבנה נוכחי
```
Free:     3 הודעות AI demo, previews נעולים
Premium:  ₪99/חודש — גישה מלאה
```

### מה כולל Premium
- שאלון יומי מלא (30 יום)
- AI Coach ללא הגבלה
- Challenge שבועי + Leaderboard
- Profile Report

### מודל פרס
- כל שבוע: 50% מ-80% הכנסות נטו מחולק ל-5 המשתמשים הדייקניים ביותר
- מוצג בזמן אמת (מתעדכן ככל שנרשמים משתמשים חדשים)
- מייצר FOMO ו-retention אורגני

### מסלולים עתידיים (לא בנויים)
- Basic / Pro / Enterprise
- Flex Credits לשימוש בלתי-מוגבל ב-AI Coach
- API ל-HR / קופות גמל

---

## Core User Journey (30 ימים)

```
יום 1-3:   פרופיל אורח חיים (משפחה, עבודה, הרגלים) — phase: 'lifestyle'
יום 4-7:   פרופיל פיננסי (הכנסות, הוצאות, חובות) — phase: 'financial'
יום 8:     ProfileReveal — AI מייצר סיכום — phase: 'reveal'
יום 9-30:  אימון + אתגר יומי — phase: 'coaching'
יום 31+:   Complete — phase: 'complete'
```

## Financial Tiers
```
Tier 0: עיוור       — completion < 40%
Tier 1: ייצוב       — חוב > הכנסה×6 או גירעון
Tier 2: שרידות      — savingsRate < 5%
Tier 3: בנייה       — savingsRate < 20%
Tier 4: אופטימיזציה — savingsRate ≥ 20%
```
