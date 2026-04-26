# VerMillion — Agent Roles

## הצוות

### 🧠 Claude (מנהל + ארכיטקט)
**כלי**: Claude Code (אתה כרגע)
**תפקיד**:
- מחליט ארכיטקטורה
- כותב לוגיקה מורכבת
- מבקר קוד
- מחלק משימות לagents אחרים
- מאחד תוצאות

**איך להשתמש**: דבר איתו בchat. "תבנה X", "תתקן Y", "תחלק לצוות Z"

---

### 🔨 Coder Agent — qwen2.5-coder:7b
**כלי**: Ollama (localhost:11434)
**תפקיד**:
- כתיבת components חדשים לפי spec
- refactoring
- boilerplate generation
- bug fixes פשוטים

**איך להשתמש**:
```bash
ollama run qwen2.5-coder:7b
```
ואז תן לו prompt עם spec מפורט מ-CLAUDE.md

**מה לא לבקש**: ארכיטקטורה, החלטות עיצוב, לוגיקה עסקית מורכבת

---

### 📝 Hebrew Agent — qwen2.5:3b
**כלי**: Ollama (localhost:11434)
**תפקיד**:
- כתיבת copy עברי
- תרגומים
- הודעות שגיאה
- קאצ'ים שיווקיים

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
- פתיחת קבצים מterminal

**חשוב**: Cursor קורא CLAUDE.md אוטומטית אם הוא ב-root. תמיד פתח את vermillion/ כroot.

---

## Workflow — איך עובדים

### לtask חדש:
1. **Claude** — מקבל בקשה, קורא CLAUDE.md + TASKS.md
2. **Claude** — מחליט: מה מורכב (עושה לבד) vs מה פשוט (מעביר לCoder)
3. **Coder** — מקבל spec מדויק עם context מ-CLAUDE.md
4. **Claude** — בודק תוצאה, מתקן אם צריך
5. **עדכן TASKS.md** — סמן ✅

### Prompt לCoder Agent (template):
```
Context: React Native app, dark theme, Hebrew RTL, #C0392B brand color.
Read CLAUDE.md for full context.

Task: Build [COMPONENT NAME]

Spec:
- [requirement 1]
- [requirement 2]

File: src/[path]
Imports needed: [list]
```

---

## מה כל agent לא עושה

| Task | Claude | Coder | Hebrew |
|------|--------|-------|--------|
| Architecture decisions | ✅ | ❌ | ❌ |
| Complex business logic | ✅ | ❌ | ❌ |
| Boilerplate components | ✅ | ✅ | ❌ |
| Hebrew copy | ✅ | ❌ | ✅ |
| Bug debugging | ✅ | ✅ small | ❌ |
| Design decisions | ✅ | ❌ | ❌ |
