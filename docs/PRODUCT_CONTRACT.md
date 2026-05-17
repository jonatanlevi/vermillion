# VerMillion — חוזה מוצר ותקן מערכת (מקור אמת)

> עדכון: 2026-05-19  
> לעיון משפטי: **`LEGAL_SYSTEM_SPEC_HE.md`**  
> Supabase: **`SUPABASE_SETUP_CHECKLIST_HE.md`**

---

## 0. ימי שישי ושבת — "הסוד"

| יום | טווח (שעון מכשיר) | DNA יומי | DNA אתגר |
|-----|-------------------|----------|----------|
| שישי | 00:01 – 15:30 | לא | בחירה **פעם אחת** → נעול לצמיתות |
| שבת | 21:00 – 23:59 | לא | בחירה **פעם אחת** → נעול לצמיתות |
| ראשון | — | חוזר ל-DNA יומי | — |

מקור קוד: `src/constants/stampChallenge.js` = `supabase/functions/_shared/windows.ts`

---

## 1. שלוש שכבות DNA (לא משתנות)

| סוג | מתי נקבע | שדות DB | נעילה |
|-----|----------|---------|--------|
| **יומי** | הרשמה | `committed_hour`, `committed_minute` | טריגר + אפליקציה |
| **שישי** | שישי ראשון (בטווח) | `friday_target_hour/minute` | טריגר + אפליקציה |
| **שבת** | שבת ראשונה (בטווח) | `saturday_target_hour/minute` | טריגר + אפליקציה |

---

## 2. זמן ו-Timezone

- **אין** שעון ישראל גלובלי.
- חתימה: `client_timezone` מהמכשיר ברגע הלחיצה.
- יום בשבוע + שעה: `Intl` / `getLocalTimeParts` — לא `toLocaleString`+`Date(string)`.

---

## 3. Anti-Cheat

```
משחק → game-complete (JWT + APP_SECRET + duration) → token
     → stamp (חלון + DNA + token burn) → daily_stamps
```

### game-complete

JWT, APP_SECRET, `GAME_MIN_MS`, session ≤30 דק׳, `duration_ms` ≤ קיר, upsert `game_sessions`.

### stamp

`WINDOW_CLOSED`, `CHALLENGE_TIME_REQUIRED`, ניקוד בשרת, שריפת token אטומית, rollback על כשל.

### לקוח — אסור

חתימה מוצלחת מקומית על כשל; stamp בלי token; `profile.timezone` לחלון (רק מכשיר).

---

## 4. מיגרציות SQL (סדר)

| קובץ | תוכן |
|------|------|
| `schema.sql` | בסיס (פעם אחת) |
| `20260516_game_sessions.sql` | tokens |
| `20260517_commitment_dna_time.sql` | DNA יומי |
| `20260518_challenge_target_time.sql` | יעד שישי/שבת |
| `20260519_commitment_immutability.sql` | **נעילת DNA** |

---

## 5. קבצים

| תחום | נתיב |
|------|------|
| לקוח | `storage.js`, `stampWindow.js`, `GamesScreen.js`, `stampChallenge.js` |
| שרת | `game-complete/`, `stamp/`, `_shared/time.ts`, `_shared/windows.ts` |
| חוזים Cursor | `.cursor/rules/vermillion-*.mdc` |

---

## 6. שגיאות (עברית)

`GAME_TOKEN_REQUIRED`, `WINDOW_CLOSED`, `CHALLENGE_TIME_REQUIRED`, `DNA_LOCKED`, `FRIDAY_DNA_LOCKED`, `SATURDAY_DNA_LOCKED`, `GAME_TOO_FAST`, `INVALID_TOKEN`

מיפוי: `src/utils/stampWindow.js` → `stampErrorMessage`
