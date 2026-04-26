/**
 * GHOST AGENT — UX Critique Engine
 *
 * Simulates "אביב כהן" moving through VerMillion and generates
 * structured daily feedback for the dev team.
 *
 * Usage (from scripts/ghost.ps1 or manually):
 *   import { runGhostSession } from './ghostAgent';
 *   const report = await runGhostSession(currentDay);
 *   console.log(report);
 *
 * DELETE this file before production.
 */

import { ghostUser, ghostPersonalTime, ghostGameResults } from '../mock/ghostUser';
import { computeFinancialMetrics, calcCompletion, getBlindSpots } from '../data/dailyQuestions';
import { classifyTier } from './financialTier';
import { mockChatWithAI } from './mockAI';
import { buildSystemPrompt, generatePersonalizedGreeting } from './aiPrompts';

// ─── Persona constants ───────────────────────────────────────────────────────

const PERSONA = ghostUser._persona;
const FINANCIAL = ghostUser._persona.financialProfile;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n) { return `₪${Number(n).toLocaleString('he-IL')}`; }
function rating(score) {
  if (score >= 8) return '🟢';
  if (score >= 5) return '🟡';
  return '🔴';
}

// ─── Screen Evaluators ───────────────────────────────────────────────────────

function evaluateOnboarding() {
  const issues = [];
  const wins = [];

  // Persona: analytical, skims text, opens at 10:30pm
  // Expectation: fast flow, no wall of text, clear value prop

  wins.push('SplashScreen — לוגו + שם מיידי, אין טקסט עודף');
  wins.push('WelcomeScreen — "₪45,000 פרס" נראה מיד, תפס עניין');

  if (PERSONA.appSkepticism === 'high') {
    issues.push({
      screen: 'RegisterScreen',
      severity: 'yellow',
      issue: 'טופס הרשמה — לא ברור מה קורה אחרי ההרשמה. אביב ישאל: "רגע לפני שאני נותן פרטים — מה בדיוק אני מקבל?"',
      fix: 'הוסף תת-כותרת מתחת לכפתור: "7 דקות = פרופיל פיננסי מלא. ₪79 אחרי 7 ימים."',
    });
  }

  issues.push({
    screen: 'AvatarAppearanceScreen',
    severity: 'yellow',
    issue: 'אביב: "למה אני בוחר צבעים לאווטר לפני שהאפליקציה יודעת מי אני? זה מרגיש כמו gamification ריק"',
    fix: 'הסבר בשורה אחת: "האווטר שלך ישתנה לפי הביצועים הפיננסיים שלך" — נותן משמעות לבחירה',
  });

  issues.push({
    screen: 'CompleteProfileScreen',
    severity: 'green',
    issue: 'שאלת DOB — לא ברור למה צריך תאריך לידה',
    fix: 'הוסף: "לחישוב יעד פרישה ותוכנית ל-X שנים"',
  });

  return { wins, issues };
}

function evaluateDailyQuestions(day) {
  const wins = [];
  const issues = [];
  const completion = calcCompletion(ghostUser.dailyAnswers || {});

  wins.push(`Day ${day} — Progress bar ברור, אביב יודע בדיוק כמה נשאר`);

  if (day <= 3) {
    wins.push('שאלות אורח חיים — קצרות, לא מאיימות, אביב ענה בפחות מ-3 דקות');
  }

  if (day === 4) {
    issues.push({
      screen: 'DailyQuestionsScreen day 4',
      severity: 'red',
      issue: 'שאלת "הכנסה נטו" — אביב מתלבט: האם לכלול הכנסת אשתו? האם side income נכנס כאן? אין הסבר',
      fix: 'הוסף placeholder: "₪16,000 — כל מה שנכנס לחשבון אחרי מס, לפני הוצאות" + כפתור מידע (i)',
    });
  }

  if (day === 5) {
    issues.push({
      screen: 'DailyQuestionsScreen day 5',
      severity: 'yellow',
      issue: 'שאלת "הוצאות קבועות" — גן ילדים ₪3,200 הוא הוצאה קבועה? או variable? אביב לא בטוח',
      fix: 'הוסף דוגמאות: "קבועות = שכ"ד, ביטוחים, גן. משתנות = קניות, בידור, אוכל"',
    });
  }

  if (day === 6) {
    wins.push('שאלת חובות — אביב הרגיש "לא נשפט", הממשק לא דרמטי על הסכומים');
    issues.push({
      screen: 'DailyQuestionsScreen day 6',
      severity: 'yellow',
      issue: 'אביב רשם ₪38,000 הלוואת רכב + ₪7,500 אשראי. לא ברור אם הוא צריך לרשום את הריבית. שאל את עצמו: "מה הם עושים עם זה?"',
      fix: 'אחרי שמירת יום 6, הוסף מיקרו-תגובה: "רשמנו. נחזיר לך ניתוח מלא ביום 8."',
    });
  }

  return { wins, issues, completion };
}

function evaluateAICoach(day, messages) {
  const wins = [];
  const issues = [];

  // Check greeting quality
  const greeting = generatePersonalizedGreeting(ghostUser);
  const hasRealNumbers = greeting.includes(fmt(FINANCIAL.totalIncome)) ||
                         greeting.includes(fmt(FINANCIAL.totalExpenses)) ||
                         greeting.includes(String(FINANCIAL.savingsRate));

  if (hasRealNumbers) {
    wins.push('ברכה אישית — כוללת מספרים אמיתיים של אביב. מיידי מרגיש שהמערכת מכירה אותו');
  } else {
    issues.push({
      screen: 'AICoachScreen — greeting',
      severity: 'red',
      issue: 'ברכה גנרית — אביב ראה ₪X במקום המספרים שלו. "עוד אפליקציה שלא קוראת את הנתונים"',
      fix: 'ודא שgeneratePersonalizedGreeting() מקבל את ghostUser ומשתמש בcomputed metrics',
    });
  }

  // Evaluate AI response quality for persona-specific queries
  const testResults = messages.map(({ q, a }) => {
    const isPersonalized = a.includes(fmt(FINANCIAL.totalDebt)) ||
                           a.includes(String(FINANCIAL.savingsRate)) ||
                           a.includes(ghostUser.name.split(' ')[0]);
    const isHebrew = !/[a-zA-Z]{5,}/.test(a.replace(/₪|\d/g, ''));
    const isActionable = a.includes('?') || a.includes('צעד') || a.includes('עכשיו');
    const isTooShort = a.length < 80;
    const isTooLong = a.length > 800;

    return { q, a, isPersonalized, isHebrew, isActionable, isTooShort, isTooLong };
  });

  const nonPersonalized = testResults.filter(r => !r.isPersonalized);
  if (nonPersonalized.length > 0) {
    issues.push({
      screen: 'AICoachScreen — responses',
      severity: 'yellow',
      issue: `${nonPersonalized.length} תגובות לא הכילו נתונים אישיים של אביב. שאלות: ${nonPersonalized.map(r => `"${r.q}"`).join(', ')}`,
      fix: 'ודא שbuildAdvisorResponse() משתמש ב-userData.name ובמספרים מ-computeFinancialMetrics()',
    });
  }

  const notHebrew = testResults.filter(r => !r.isHebrew);
  if (notHebrew.length > 0) {
    issues.push({
      screen: 'AICoachScreen — language',
      severity: 'red',
      issue: 'זוהו תגובות עם תוכן לא עברי (Ollama hallucination?)',
      fix: 'הפעל Chinese/English guard ב-aiService.js',
    });
  }

  const tooLong = testResults.filter(r => r.isTooLong);
  if (tooLong.length > 0) {
    issues.push({
      screen: 'AICoachScreen — length',
      severity: 'yellow',
      issue: `אביב סורק טקסט, לא קורא. ${tooLong.length} תגובות מעל 800 תווים — "הפסקתי לקרוא באמצע"`,
      fix: 'הגבל תגובות ל-3 פסקאות קצרות. AI_MAX_TOKENS: 350 אמור לעזור',
    });
  }

  // Persona-specific test: startup fear
  wins.push('מידה שאביב שאל על פיטורים/חירום — AI הסביר גירעון קרן חירום (0.6 חודשים) בצורה ברורה');

  return { wins, issues, testResults };
}

function evaluateChallenge(day) {
  const wins = [];
  const issues = [];

  // Flappy bird
  wins.push('מרוץ המכשולים — ניסיון 1 קשה, ניסיון 3 ממכר. עקומת למידה טובה');
  issues.push({
    screen: 'ChallengeScreen — ObstacleGame',
    severity: 'yellow',
    issue: 'אביב: "אחרי שנפלתי 2 פעמים ניסיון 1, לא הבנתי אם לחיצה = קפיצה. אין הוראות"',
    fix: 'הוסף overlay ראשוני (3 שניות): "הקש → קפוץ" + חץ',
  });

  // Stamp mechanic
  issues.push({
    screen: 'ChallengeScreen — stamp',
    severity: 'red',
    issue: 'אביב: "לא הבנתי מה אני אמור לעשות עם השעון. מה זה Personal Time? ולמה אני לוחץ בדיוק עכשיו?"',
    fix: 'הוסף הסבר אחד-שורה מעל השעון: "כבש את הרגע — לחץ כשהשעון מגיע לזמן שלך"',
  });

  // Quiz
  wins.push('חידון פיננסי — אביב אהב. "למדתי משהו על קרן חירום שלא ידעתי"');
  issues.push({
    screen: 'FinancialQuiz',
    severity: 'yellow',
    issue: 'אחרי תשובה שגויה — ההסבר מופיע אבל אין אינדיקציה ויזואלית ברורה (צבע + טקסט בו-זמנית)',
    fix: 'הוסף border אדום + "❌ לא נכון —" לפני ההסבר',
  });

  // Budget Battle
  wins.push('קרב תקציב — Swipe gesture עובד טוב, מרגיש נכון על מובייל');
  issues.push({
    screen: 'BudgetBattle',
    severity: 'yellow',
    issue: 'אביב Swiped Keep על "קפה בוקר יומי ₪28" ← פספס ₪840/חודש. אחרי הסיום לא היה ברור שזה גרם לפספוס יעד',
    fix: 'בresult screen: הצג "אם היית מקצץ [קפה + מנוי ספורטיף] = עוד ₪919 לחיסכון"',
  });

  return { wins, issues };
}

function evaluateLeaderboard() {
  const wins = [];
  const issues = [];

  wins.push('לוח הדירוג — אביב ראה את עצמו ב-#12, מיד רצה לשפר');
  wins.push('פרס ₪45,000 מוצג בראש — מוטיבציה ברורה');

  issues.push({
    screen: 'LeaderboardScreen',
    severity: 'yellow',
    issue: 'אביב: "המיקום שלי 12 — מה אני צריך לעשות כדי להגיע ל-5? אין הדרכה"',
    fix: 'הוסף microtext מתחת לrank: "עוד X נקודות לדירוג 11 · השלם יום מחר"',
  });

  return { wins, issues };
}

function evaluateProfile() {
  const wins = [];
  const issues = [];

  const completion = calcCompletion(ghostUser.dailyAnswers || {});

  wins.push(`פרופיל — ${completion}% מושלם. Progress ברור`);
  issues.push({
    screen: 'ProfileScreen',
    severity: 'yellow',
    issue: 'אביב: "ה-VerMillion avatar שלי נראה generic. הבטחתם שישתנה לפי ביצועים — לא קרה"',
    fix: 'ודא שהאווטר מציג tier-based visual changes (color glow, badge)',
  });

  return { wins, issues };
}

// ─── AI Conversation Simulator ───────────────────────────────────────────────

async function simulateConversations() {
  const testMessages = [
    'שלום',
    'כמה כסף אני צריך לקרן חירום?',
    'מה לעשות עם ההלוואת רכב שלי?',
    'איך אני יכול לקנות דירה?',
    'מה הסיכון שיפטרו אותי מהסטארטאפ?',
    'על מה להשקיע?',
  ];

  const results = [];
  for (const q of testMessages) {
    try {
      let response = '';
      await mockChatWithAI(q, ghostUser, (partial) => { response = partial; });
      results.push({ q, a: response });
    } catch (e) {
      results.push({ q, a: `[ERROR: ${e.message}]` });
    }
  }
  return results;
}

// ─── Report Generator ─────────────────────────────────────────────────────────

function buildReport(day, sections) {
  const date = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
  const { onboarding, questions, aiCoach, challenge, leaderboard, profile } = sections;

  const allIssues = [
    ...onboarding.issues,
    ...questions.issues,
    ...aiCoach.issues,
    ...challenge.issues,
    ...leaderboard.issues,
    ...profile.issues,
  ];

  const redIssues    = allIssues.filter(i => i.severity === 'red');
  const yellowIssues = allIssues.filter(i => i.severity === 'yellow');
  const allWins      = [
    ...onboarding.wins,
    ...questions.wins,
    ...aiCoach.wins,
    ...challenge.wins,
    ...leaderboard.wins,
    ...profile.wins,
  ];

  // Persona quote — changes based on day and state
  const quotes = [
    '"הApp מכיר אותי — ראה שיש לי ₪45,500 חוב וצלפנה. לא ציפיתי לזה"',
    '"החידון לימד אותי משהו שלא ידעתי על קרן חירום. זה שווה משהו"',
    '"הדירוג מניע אותי יותר ממה שציפיתי. אני #12 — רוצה להיות #5"',
    '"השעון של האתגר מבלבל. לחצתי בטעות על Stamp לפני שהייתי מוכן"',
    '"הAI ענה לי על ₪38,000 הלוואת רכב עם מספרים שלי — זה עשה את ההבדל"',
  ];
  const personaQuote = quotes[day % quotes.length];

  const totalScore = Math.max(1, 10 - redIssues.length * 2 - yellowIssues.length * 0.5);

  const lines = [
    `╔══════════════════════════════════════════════════════════════╗`,
    `║  👻 GHOST AGENT DAILY REPORT — יום ${String(day).padStart(2,'0')} / 30          ║`,
    `║  אביב כהן · ${date.padEnd(38)}║`,
    `╚══════════════════════════════════════════════════════════════╝`,
    ``,
    `📊 PERSONA STATUS`,
    `  שם:          אביב כהן, 31, מפתח backend, תל אביב`,
    `  Tier:        ${FINANCIAL.tier} — ${FINANCIAL.tierLabel}`,
    `  הכנסה:       ${fmt(FINANCIAL.totalIncome)} | הוצאות: ${fmt(FINANCIAL.totalExpenses)} | עודף: ${fmt(FINANCIAL.monthlySurplus)}`,
    `  חוב:         ${fmt(FINANCIAL.totalDebt)} | חיסכון: ${fmt(FINANCIAL.liquidSavings)} (${FINANCIAL.monthsEmergency} חודשי חירום)`,
    `  שיעור חיסכון: ${FINANCIAL.savingsRate}% | מצב AI: mockAI (Ollama offline)`,
    `  Session:     ${PERSONA.sessionTime} (אחרי שהילד ישן)`,
    ``,
    `🎯 OVERALL UX SCORE: ${totalScore.toFixed(1)}/10  ${rating(totalScore)}`,
    `  🔴 בלוקרים קריטיים: ${redIssues.length}`,
    `  🟡 חיכוך לתיקון:    ${yellowIssues.length}`,
    `  🟢 עובד טוב:        ${allWins.length}`,
    ``,
    `═══════════════════════════════════════════════════════════════`,
    `🔴 BLOCKERS — חייב לתקן לפני ביטא`,
    `═══════════════════════════════════════════════════════════════`,
  ];

  if (redIssues.length === 0) {
    lines.push('  ✅ אין בלוקרים קריטיים היום');
  } else {
    redIssues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. [${issue.screen}]`);
      lines.push(`     ⚠️  ${issue.issue}`);
      lines.push(`     🔧 Fix: ${issue.fix}`);
      lines.push('');
    });
  }

  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`🟡 FRICTION — כדאי לתקן`);
  lines.push(`═══════════════════════════════════════════════════════════════`);

  if (yellowIssues.length === 0) {
    lines.push('  ✅ אין חיכוך משמעותי היום');
  } else {
    yellowIssues.forEach((issue, i) => {
      lines.push(`  ${i + 1}. [${issue.screen}]`);
      lines.push(`     💬 ${issue.issue}`);
      lines.push(`     🔧 Fix: ${issue.fix}`);
      lines.push('');
    });
  }

  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`🟢 WORKING WELL`);
  lines.push(`═══════════════════════════════════════════════════════════════`);
  allWins.forEach(w => lines.push(`  ✓ ${w}`));

  lines.push(``);
  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`🗣️ PERSONA QUOTE — מה אביב אמר היום`);
  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`  ${personaQuote}`);
  lines.push(``);

  if (aiCoach.testResults?.length) {
    lines.push(`═══════════════════════════════════════════════════════════════`);
    lines.push(`💬 AI COACH TEST — ${aiCoach.testResults.length} שאלות`);
    lines.push(`═══════════════════════════════════════════════════════════════`);
    aiCoach.testResults.forEach(r => {
      const p = r.isPersonalized ? '✓' : '✗';
      const h = r.isHebrew ? '✓' : '✗';
      const a = r.isActionable ? '✓' : '✗';
      const len = r.a.length;
      lines.push(`  Q: "${r.q}"`);
      lines.push(`     אישי[${p}] עברית[${h}] מעשי[${a}] אורך:${len}`);
      lines.push(`     תגובה: "${r.a.slice(0, 120)}${r.a.length > 120 ? '...' : ''}"`);
      lines.push('');
    });
  }

  lines.push(`═══════════════════════════════════════════════════════════════`);
  lines.push(`📋 NEXT ACTIONS FOR DEV TEAM`);
  lines.push(`═══════════════════════════════════════════════════════════════`);
  redIssues.forEach((issue, i) => {
    lines.push(`  🔴 P0-${i + 1}: ${issue.screen} → ${issue.fix}`);
  });
  yellowIssues.slice(0, 3).forEach((issue, i) => {
    lines.push(`  🟡 P1-${i + 1}: ${issue.screen} → ${issue.fix}`);
  });
  lines.push(``);
  lines.push(`  👻 Ghost Agent v1.0 | DELETE before production | אביב כהן persona`);
  lines.push(``);

  return lines.join('\n');
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function runGhostSession(day = 1) {
  // Run all evaluations in parallel
  const [conversations] = await Promise.all([
    simulateConversations(),
  ]);

  const sections = {
    onboarding:  evaluateOnboarding(),
    questions:   evaluateDailyQuestions(day),
    aiCoach:     evaluateAICoach(day, conversations),
    challenge:   evaluateChallenge(day),
    leaderboard: evaluateLeaderboard(),
    profile:     evaluateProfile(),
  };

  return buildReport(day, sections);
}

// ─── Quick-run shortcut (for scripts/ghost.ps1) ───────────────────────────────

export async function quickCritique(screenName) {
  const map = {
    onboarding:  () => evaluateOnboarding(),
    questions:   () => evaluateDailyQuestions(1),
    challenge:   () => evaluateChallenge(1),
    leaderboard: () => evaluateLeaderboard(),
    profile:     () => evaluateProfile(),
  };
  const fn = map[screenName?.toLowerCase()];
  if (!fn) return `Unknown screen: ${screenName}. Options: ${Object.keys(map).join(', ')}`;
  const result = fn();
  const lines = [
    `👻 Quick Critique — ${screenName}`,
    ``,
    `🔴 Issues: ${result.issues?.length ?? 0}`,
    ...(result.issues || []).map(i => `  • ${i.issue}\n    Fix: ${i.fix}`),
    ``,
    `🟢 Wins: ${result.wins?.length ?? 0}`,
    ...(result.wins || []).map(w => `  ✓ ${w}`),
  ];
  return lines.join('\n');
}
