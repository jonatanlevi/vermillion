# VerMillion — Cursor Handoff
> עדכון: 2026-04-30 | URL: https://vermillion-ashen.vercel.app

---

## ⛔ PROTECTED FILES — קרא לפני כל שינוי

**כל הקבצים האלה עברו שינויים מכוונים. אל תחזיר לגרסה קודמת, אל תמחק state variables, אל תמחק deploy files.**

---

### `src/context/AuthContext.js`
```js
// ✅ חובה: setLoading(true) לפני loadProfile — מונע race condition
if (u) { setLoading(true); loadProfile(u.id); }

// ✅ חובה: signOut עם reload בweb
async function signOut() {
  await supabase.auth.signOut();
  if (Platform.OS === 'web') window.location.reload();
}

// ✅ חובה: deleteAccount עם finally + reload בweb
async function deleteAccount() {
  try { await clearAllData(); ... } finally {
    setUser(null); setProfile(null);
    if (Platform.OS === 'web') window.location.reload();
  }
}

// ✅ חובה: expose deleteAccount, signOut, reloadProfile ב-context value
// ✅ חובה: import { Platform } from 'react-native'
```
- ❌ אל תסיר `setLoading(true)` מ-onAuthStateChange
- ❌ אל תסיר `deleteAccount` מה-context value
- ❌ אל תסיר `finally { setUser(null); setProfile(null) }`
- ❌ אל תסיר `if (Platform.OS === 'web') window.location.reload()` מ-signOut ומ-deleteAccount
- ❌ אל תסיר `import { Platform } from 'react-native'`

---

### `src/navigation/AppNavigator.js`
```js
// ✅ חובה: key לאיפוס stack בlogin/logout
key={user ? 'auth' : 'guest'}

// ✅ חובה: initialRouteName לפי profile?.onboarding_complete (לא name — גוגל ממלא name אוטומטית)
initialRouteName={user ? (profile?.onboarding_complete ? 'MainTabs' : 'CompleteProfile') : 'Splash'}

// ✅ חובה: import profile מ-useAuth
const { user, profile, loading } = useAuth();
```
- ❌ אל תסיר `key` prop מ-Stack.Navigator
- ❌ אל תסיר `profile` מ-destructuring
- ❌ אל תחזיר `initialRouteName="MainTabs"` ללא בדיקת profile

---

### `src/screens/onboarding/CompleteProfileScreen.js`
```js
// ✅ חובה: שמור name (לא רק firstName/lastName)
saveProfile({ name: fullName, firstName, lastName, phone })

// ✅ חובה: עדכן AuthContext אחרי שמירה
await reloadProfile?.();
```
- ❌ אל תשמור רק `firstName` ו-`lastName` — חסר עמודת `name` ב-Supabase
- ❌ אל תסיר את קריאת `reloadProfile()`

---

### `src/screens/main/SettingsScreen.js`
```js
// ✅ חובה: useAuth (לא mockUser)
const { profile, signOut, deleteAccount } = useAuth();

// ✅ חובה: window.confirm לweb
const confirmed = Platform.OS === 'web' ? window.confirm('...') : true;
if (confirmed) signOut(); // או deleteAccount()
```
- ❌ אל תחזיר `import { mockUser }` 
- ❌ אל תחזיר `Alert.alert` (לא עובד בweb)
- ❌ אל תסיר כפתור "מחק חשבון לצמיתות"

---

### `src/screens/profile/ProfileScreen.js`
```js
// ✅ חובה: שם אמיתי מ-AuthContext
const { profile, signOut } = useAuth();
<Text>{profile?.name || 'VerMillion שלך'}</Text>

// ✅ חובה: כפתור logout גלוי (לא צבע #2A2A2A על שחור)
<TouchableOpacity onPress={signOut}>
  <Text style={{ color: '#C0392B' }}>יציאה מהחשבון</Text>
</TouchableOpacity>
```
- ❌ אל תסתיר את כפתור logout עם צבע כהה
- ❌ אל תחזיר "איפוס נתונים (dev)"

---

### `src/screens/main/DailyCoachingScreen.js`
```js
// ✅ חובה: נתונים אמיתיים (לא mockUser)
import { getOnboardingState } from '../../services/storage';
const [userData, setUserData] = useState(null);
getOnboardingState().then(s => { setUserData(s); ... });

// ✅ חובה: Day 18 milestone
{ts.currentDay === 18 && <View style={styles.milestoneCard}>...</View>}
```
- ❌ אל תחזיר `import { mockUser } from '../../mock/data'`
- ❌ אל תסיר את ה-milestone card ליום 18

---

### `src/screens/games/GamesScreen.js`
```js
// ✅ חובה: time picker states
const [showTimePicker, setShowTimePicker] = useState(false);
const [pickedHour, setPickedHour]         = useState(8);
const [pickedMinute, setPickedMinute]     = useState(0);

// ✅ חובה: GlassButton פותח picker (לא commit ישיר)
<GlassButton onPress={() => setShowTimePicker(true)} />

// ✅ חובה: handleCommit מקבל פרמטרים
async function handleCommit(hour, minute) { await saveCommitmentTime(hour, minute); ... }

// ✅ חובה: stamp text
"כבש את הרגע — לחץ כמה שיותר קרוב לשעה שקבעת"
```
- ❌ אל תמחק `showTimePicker`, `pickedHour`, `pickedMinute`
- ❌ אל תחזיר GlassButton שקורא `handleCommit` ישירות

---

### `src/screens/onboarding/AvatarAppearanceScreen.js`
```js
// ✅ חובה: safe area
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
<View style={[styles.container, { paddingTop: insets.top + 16 }]}>

// ✅ חובה: הסבר לאווטר
<Text style={styles.stepExplain}>האווטר שלך ישתנה חזותית לפי הטייר הפיננסי שלך — ביום 8 תראה מי אתה באמת</Text>
```
- ❌ אל תחזיר `paddingTop: 56` hardcoded
- ❌ אל תסיר `stepExplain`

---

### `src/services/storage.js`
```js
// ✅ חובה: פרמטרים לsaveCommitmentTime
export async function saveCommitmentTime(hour, minute) {
  const now = new Date();
  if (hour !== undefined && minute !== undefined) now.setHours(hour, minute, 0, 0);
  ...
}
```
- ❌ אל תחזיר signature ללא פרמטרים

---

### `src/services/mockAI.js`
```js
// ✅ חובה: seedFromUserData לפני turn 1
function seedFromUserData(c, userData) { /* populates income, debt, savings from dailyAnswers */ }
// ✅ חובה: ברכה מותאמת אישית
response = `שלום ${name}. ${income} הכנסה נטו · Tier ${tier}...`
```
- ❌ אל תמחק `seedFromUserData`

---

### `src/data/dailyQuestions.js`
- ✅ `net_income` hint: מבדיל שכיר/עצמאי, לא לכלול בן/בת זוג
- ✅ `fixed_expenses` hint: דוגמאות קונקרטיות (ביטוח, גן, חוגים)
- ✅ `variable_expenses` hint: "ממוצע 3 חודשים אחרונים"
- ❌ אל תקצר hints

---

### קבצי deploy (שורש vermillion/)
- `vercel.json` — חייב `{ "handle": "filesystem" }` לפני redirect
- `deploy.bat` — wrapper ל-deploy.ps1
- `deploy.ps1` — build + copy project files + vercel --prod + alias set
- `.vercel-project.json` — `{"projectId":"prj_EMChAtof80TVOTWhhxKZKRvapkyZ","orgId":"team_QXXnGRaqxbEV9Tt0sueoyaWq"}`
- ❌ אל תמחק אף אחד מהקבצים האלה

---

## ✅ מה הושלם — אל תגע

| תחום | מה עשוי |
|------|---------|
| Auth flow | Google + Email login, redirect לפי profile?.name |
| AppNavigator | key prop + initialRouteName דינמי |
| CompleteProfile | שומר name לSupabase + reloadProfile |
| Settings | signOut + deleteAccount + window.confirm |
| Profile | שם אמיתי + logout גלוי + כפתור הגדרות |
| DailyCoaching | נתונים אמיתיים + Day 18 milestone |
| GamesScreen | Time picker + stamp text |
| AvatarAppearance | Safe area + stepExplain |
| storage.js | saveCommitmentTime(hour, minute) |
| mockAI.js | seedFromUserData + personalized greeting |
| dailyQuestions.js | hints מפורטים |
| Deploy | deploy.ps1 + auto-alias + .vercel-project.json |

---

## 🔧 P1 — עוד צריך

### P1-1 — Weekly milestone banners
קובץ: `src/screens/main/DailyCoachingScreen.js`
כרגע יש רק יום 18. צריך להרחיב:
```js
const MILESTONE_DAYS = {
  7:  { emoji: '🔥', title: 'שבוע ראשון — עברת!',  text: '23 יום נשארו. הרגל נבנה.' },
  14: { emoji: '⚡', title: 'שבועיים!',             text: 'חצית את הדרך. עוד 16 ימים.' },
  18: { emoji: '🏁', title: 'מחצית הדרך — יום 18/30', text: 'עברת את הנקודה הקשה. 12 יום קדימה.' },
  21: { emoji: '💎', title: '3 שבועות — אלוף!',    text: '9 ימים אחרונים. הכסף מחכה.' },
  25: { emoji: '🏆', title: '25 יום — כמעט שם!',   text: '5 ימים בלבד. אל תוותר.' },
};
// החלף את הbloק הנוכחי של יום 18 בבדיקה גנרית:
{MILESTONE_DAYS[ts.currentDay] && (
  <View style={styles.milestoneCard}>
    <Text>{MILESTONE_DAYS[ts.currentDay].emoji} {MILESTONE_DAYS[ts.currentDay].title}</Text>
    <Text>{MILESTONE_DAYS[ts.currentDay].text}</Text>
  </View>
)}
```

### P1-2 — mockAI tier-aware
קובץ: `src/services/mockAI.js`
- Tier 0/1 לא מדברים על השקעות/מניות/קריפטו
```js
const INVESTMENT_KEYWORDS = ['מניות', 'קריפטו', 'ביטקוין', 'תיק השקעות', 'ETF'];
const isInvestmentQ = INVESTMENT_KEYWORDS.some(k => msg.includes(k));
if (tier <= 1 && isInvestmentQ) return 'בשלב הנוכחי נתמקד בייצוב הבסיס. השקעות יגיעו אחרי שנסגור את החובות.';
```

### P1-3 — Grace days (2/חודש)
- `storage.js`: הוסף `graceDaysUsed: 0` ל-commitment payload
- `GamesScreen.js`: אם streak נשבר ויש grace days → הפחת graceDaysUsed במקום לשבור streak
- UI badge: "2 ימי חסד נותרו"

### P1-4 — Leaderboard microtext
קובץ: `src/screens/profile/ProfileScreen.js`
- מתחת לדירוג: "עוד {nextRankDiff} נקודות → #{userRank - 1}"

### P1-5 — CoinRain + StackSavings
קובץ: `src/screens/games/GamesScreen.js`
אם קיימים ב-`src/components/`:
```js
{ key: 'coinrain',     label: 'גשם מטבעות',    emoji: '🪙', color: '#D4AF37' },
{ key: 'stacksavings', label: 'בנה את החיסכון', emoji: '📦', color: '#27AE60' },
```

---

## 🚀 Deploy

```powershell
# מ-vermillion/:
.\deploy.ps1

# URL: https://vermillion-ashen.vercel.app
# Supabase: hegbvrvmgvmmbigfpqax
```

### בדיקת flow מלא:
1. מחק חשבון מ-Settings
2. התחבר עם Google → צריך לעבור ל-CompleteProfile
3. מלא פרטים → AvatarAppearance → ... → MainTabs
4. התנתק → Welcome
5. התחבר שוב → MainTabs ישירות (משתמש חוזר)
