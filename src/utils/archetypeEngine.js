export const ARCHETYPES = {
  warrior: {
    id: 'warrior',
    name: 'THE WARRIOR',
    hebrewName: 'הלוחם',
    emoji: '⚔️',
    color: '#C0392B',
    description: 'אתה לוחם. החוב הוא האויב ולא תנוח עד שתנצח אותו. הVerMillion שלך יהיה היועץ הישיר שלא ייתן לך להתפשר.',
  },
  sage: {
    id: 'sage',
    name: 'THE SAGE',
    hebrewName: 'החכם',
    emoji: '🧠',
    color: '#8E44AD',
    description: 'אתה מחושב ואסטרטגי. כל החלטה פיננסית שלך מבוססת נתונים. הVerMillion שלך יעמיק את הידע הפיננסי שלך.',
  },
  royal: {
    id: 'royal',
    name: 'THE ROYAL',
    hebrewName: 'המלך',
    emoji: '👑',
    color: '#D4AF37',
    description: 'אתה מנהל ממלכה. יש לך בסיס חזק ואתה יודע לנהל. הVerMillion שלך ישמור ויגדיל את מה שבנית.',
  },
  grinder: {
    id: 'grinder',
    name: 'THE GRINDER',
    hebrewName: 'הכורש',
    emoji: '🏃',
    color: '#E67E22',
    description: 'אתה עובד קשה ולא עוצר. האנרגיה שלך היא הנכס הגדול ביותר. הVerMillion שלך יהפוך את הכוח שלך לעושר.',
  },
  builder: {
    id: 'builder',
    name: 'THE BUILDER',
    hebrewName: 'הבונה',
    emoji: '🌱',
    color: '#27AE60',
    description: 'אתה בתחילת הדרך אבל הכיוון ברור. כל שקל שחוסך היום הוא בסיס למחר. הVerMillion שלך ילווה אותך צעד אחרי צעד.',
  },
};

export const ARCHETYPE_LIST = Object.values(ARCHETYPES);

// Maps AvatarAppearanceScreen style → archetype
const STYLE_MAP = {
  warrior: 'warrior',
  sage:    'sage',
  royal:   'royal',
  street:  'grinder',
  money:   'grinder',
  freedom: 'sage',
  growth:  'builder',
};

export function classifyArchetype(appearance, tone, financial) {
  // Primary: appearance.style from AvatarAppearanceScreen
  if (appearance?.style && STYLE_MAP[appearance.style]) {
    return STYLE_MAP[appearance.style];
  }

  // Secondary: tone.goal_focus
  if (tone?.goal_focus === 'growth')  return 'builder';
  if (tone?.goal_focus === 'freedom') return 'sage';
  if (tone?.goal_focus === 'money')   return 'grinder';

  // Tertiary: financial data (if available)
  if (financial) {
    const income    = financial.totalIncome || 0;
    const surplus   = financial.monthlySurplus ?? (income - (financial.totalExpenses || 0));
    const totalDebt = (financial.creditDebt || 0) + (financial.loansTotal || 0) + (financial.overdraft || 0);
    const savings   = financial.savingsRate ?? (income > 0 ? (surplus / income) * 100 : 0);

    if (totalDebt > income * 4 || (income > 0 && surplus < 0)) return 'warrior';
    if (income > 20000 && savings >= 25) return 'royal';
    if (savings >= 20)  return 'sage';
    if (income > 15000) return 'grinder';
  }

  return 'builder';
}
