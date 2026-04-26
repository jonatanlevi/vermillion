export const TIERS = {
  0: {
    tier: 0,
    label: 'עיוור',
    emoji: '🔍',
    color: '#555',
    description: 'הפרופיל שלך לא מספיק מלא כדי לייעץ בדיוק.',
    focus_hebrew: 'השלם את השאלון',
    firstStep: 'ענה על שאלות השאלון כדי לקבל יעוץ מדויק.',
  },
  1: {
    tier: 1,
    label: 'ייצוב',
    emoji: '🚨',
    color: '#E74C3C',
    description: 'יש גירעון חודשי או חובות כבדים. הצעד הראשון הוא לעצור את הדימום.',
    focus_hebrew: 'עצור גירעון, אל תוסיף חוב',
    firstStep: 'זהה את ההוצאה הגדולה ביותר שניתנת לקיצוץ מיידי.',
  },
  2: {
    tier: 2,
    label: 'שרידות',
    emoji: '⚡',
    color: '#F39C12',
    description: 'עודף קטן — הכסף כמעט מספיק. צריך לפרוץ את תקרת החיסכון.',
    focus_hebrew: 'פרצות הוצאות, ₪1 ראשון לחיסכון',
    firstStep: 'הגדר העברה אוטומטית של ₪200 לחיסכון ביום המשכורת.',
  },
  3: {
    tier: 3,
    label: 'בנייה',
    emoji: '🏗️',
    color: '#3498DB',
    description: 'יש עודף ויכולת חיסכון. הגיע הזמן לבנות נכסים ולהגן על ההכנסה.',
    focus_hebrew: 'קרן חירום → פנסיה → השקעה ראשונה',
    firstStep: 'בדוק אם יש לך 3 חודשי הוצאות בקרן חירום נזילה.',
  },
  4: {
    tier: 4,
    label: 'אופטימיזציה',
    emoji: '🚀',
    color: '#27AE60',
    description: 'עודף טוב ויש השקעות. המטרה: מינוף, יעילות מס ובניית זרמי הכנסה.',
    focus_hebrew: 'תיק השקעות, מינוף, יעילות מס',
    firstStep: 'בדוק אם מנצל קרן השתלמות מלאה ו-IRA אישי.',
  },
};

export function classifyTier(metrics, completion) {
  if (completion < 40) return TIERS[0];

  const { monthlySurplus, totalDebt, totalIncome, savingsRate } = metrics;

  if (totalIncome === 0) return TIERS[0];
  if (totalDebt > totalIncome * 6 || monthlySurplus < 0) return TIERS[1];
  if (savingsRate < 5) return TIERS[2];
  if (savingsRate < 20) return TIERS[3];
  return TIERS[4];
}
