# Cloudflare Tunnel — Persistent Setup

המנהרה הזמנית (`Quick Tunnel`) שאני הרצתי לך עכשיו (`https://observed-allowed-olympic-punch.trycloudflare.com`) **תיהרס**:

- כשתסגור את Cursor (קצוות ה-Tunnel חיים בתהליך שאני התנעתי)
- כשתאתחל את המחשב
- אחרי כמה שעות (ה-URLs האלה לא יציבים)

כדי שהאפליקציה תעבוד **באמת מכל מקום, 24/7**, צריך להגדיר **Named Tunnel** — URL קבוע שלא משתנה. זה לוקח 5 דקות, חד-פעמי.

---

## אפשרות A — בלי דומיין משלך (הקלה ביותר)

Cloudflare מספק לך URL חינם בצורה `https://<UUID>.cfargotunnel.com`. זה יציב לחלוטין.

### צעדים

```powershell
# 1. התחבר ל-Cloudflare (פותח דפדפן, צריך לאשר את ה-cert)
& "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe" tunnel login

# 2. צור tunnel בשם vermillion-ai
& "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe" tunnel create vermillion-ai

# הפלט יראה כך:
# Created tunnel vermillion-ai with id ABCD-1234-...
# העתק את ה-UUID — הוא ה-URL שלך: https://ABCD-1234-...cfargotunnel.com

# 3. צור קובץ config.yml ב-~/.cloudflared/ (או %USERPROFILE%\.cloudflared\)
# (מסומן בצעד הבא)

# 4. רישום כ-Windows Service (יעלה אוטומטית עם המחשב)
& "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe" service install
```

### תוכן `config.yml`

צור את הקובץ ב-`%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: <UUID-FROM-STEP-2>
credentials-file: C:/Users/97254/.cloudflared/<UUID>.json

ingress:
  - hostname: <UUID>.cfargotunnel.com
    service: http://localhost:11434
  - service: http_status:404
```

### עדכון `.env`

החלף את `EXPO_PUBLIC_OLLAMA_BASE_URL` ל-:
```
EXPO_PUBLIC_OLLAMA_BASE_URL=https://<UUID>.cfargotunnel.com
```

---

## אפשרות B — עם דומיין משלך (יותר מקצועי)

אם יש לך דומיין שמנוהל ב-Cloudflare (למשל `vermillion.com`), אפשר לקבל URL כמו `https://ai.vermillion.com`.

```powershell
& "$env:LOCALAPPDATA\Programs\cloudflared\cloudflared.exe" tunnel route dns vermillion-ai ai.vermillion.com
```

ואז ב-config.yml:
```yaml
ingress:
  - hostname: ai.vermillion.com
    service: http://localhost:11434
```

---

## אבטחה — הוספת Bearer Token (מומלץ!)

ברגע ש-URL פתוח לעולם, **כל אחד עם הכתובת** יכול להשתמש ב-Ollama שלך (משאבי GPU/CPU). מומלץ להוסיף הגנת token.

עדכן את `config.yml`:
```yaml
ingress:
  - hostname: <UUID>.cfargotunnel.com
    service: http://localhost:11434
    originRequest:
      access:
        required: true
        teamName: <your-team>
        audTag: ["..."]
  - service: http_status:404
```

או יותר פשוט — הוסף בדיקת token לקוד:
```js
// ב-src/services/agents/_runAgent.js — הוסף header:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OLLAMA_TOKEN}`,
}
```

ואכלוף את הקריאה ב-Cloudflare Workers שמולה.

---

## מצב נוכחי

כרגע רץ Quick Tunnel:
- **URL זמני**: `https://observed-allowed-olympic-punch.trycloudflare.com`
- **מתי נופל**: כשתסגור את Cursor (התהליך שלי התנעתי)

תמשיך עם זה לבדיקות, ואחר כך הקדש 10 דקות לעבור ל-Named Tunnel + Windows Service לפי המדריך כאן.
