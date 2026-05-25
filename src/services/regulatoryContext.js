/**
 * regulatoryContext.js
 * ─────────────────────
 * Personalized Israeli Regulatory Intent Engine
 *
 * Input:  userData (same shape as aiPrompts.js uses)
 * Output: Compact regulatory snapshot injected into buildSystemPrompt()
 *
 * Why this exists: general financial knowledge (aiKnowledge.js) is the same
 * for everyone. This module maps the user's SPECIFIC profile to the laws that
 * apply to THEM — employment type, income level, age, family, housing, debt.
 *
 * ⚠️ DISCLAIMER (embedded in output): educational only, not licensed advice.
 */

// ── Israeli financial law constants (2025) ─────────────────────────────────
const VAT_THRESHOLD_ANNUAL      = 120_000;   // ₪/year — חובת רישום עוסק מורשה
const BI_SELF_LOWER_RATE        = 9.61;      // % BI on income up to lower ceiling
const BI_SELF_LOWER_CEILING     = 75_972;    // ₪/year (₪6,331/month × 12)
const BI_SELF_HIGHER_RATE       = 16.23;     // % BI above lower ceiling
const PENSION_EMPLOYEE_MIN      = 6;         // % employee mandatory contribution
const PENSION_EMPLOYER_MIN      = 6.5;       // % employer mandatory contribution
const PENSION_SEVERANCE         = 8.33;      // % employer severance contribution
const KEREN_SELF_DEDUCT_MAX     = 18_480;    // ₪/year tax-deductible keren hishtalmut
const KEREN_LOCK_YEARS          = 6;         // years before tax-free withdrawal
const MORTGAGE_FIRST_LTV        = 75;        // % max LTV, first home
const MORTGAGE_SECOND_LTV       = 50;        // % max LTV, second home
const TAX_POINT_VALUE_2025      = 2_904;     // ₪/year per tax credit point (נקודת זיכוי)

// ── Tax brackets 2025 (annual gross ₪) ────────────────────────────────────
const TAX_BRACKETS = [
  { upTo: 84_120,    rate: 10 },
  { upTo: 120_720,   rate: 14 },
  { upTo: 193_800,   rate: 20 },
  { upTo: 269_280,   rate: 31 },
  { upTo: 558_240,   rate: 35 },
  { upTo: 720_720,   rate: 47 },
  { upTo: Infinity,  rate: 50 },
];

function getMarginalRate(annualGross) {
  for (const b of TAX_BRACKETS) {
    if (annualGross <= b.upTo) return b.rate;
  }
  return 50;
}

// ── Normalize employment type (handles both Hebrew and English values) ─────
function normalizeEmploy(raw) {
  if (!raw) return '';
  const r = String(raw).toLowerCase();
  if (/self_employed|עצמאי/.test(r))  return 'self_employed';
  if (/business|עסק/.test(r))         return 'business';
  if (/freelance|פרילנסר/.test(r))    return 'freelance';
  if (/employee|שכיר/.test(r))        return 'employee';
  if (/student|סטודנט/.test(r))       return 'student';
  if (/unemployed|לא עובד/.test(r))   return 'unemployed';
  return r;
}

// ── Normalize housing type (handles both Hebrew and English values) ────────
function normalizeHousing(raw) {
  if (!raw) return '';
  const r = String(raw).toLowerCase();
  if (/rent|שכיר|שכירות/.test(r))     return 'renting';
  if (/owner|own|משכנתא|בעלים/.test(r)) return 'owner';
  if (/parent|הורים/.test(r))         return 'parents';
  return r;
}

// ── Extract unified profile from userData ─────────────────────────────────
function extractProfile(userData) {
  if (!userData) return null;

  const fin  = userData.financialData || {};
  const da   = userData.dailyAnswers  || {};
  const flat = {};

  // merge all daily answer sub-objects (handles both day-keyed and conversational format)
  Object.values(da).forEach(v => {
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(flat, v);
  });

  const employ  = normalizeEmploy(flat.employment_type || fin.employmentType || '');
  const housing = normalizeHousing(flat.housing_type   || fin.housingType    || '');
  const family  = flat.family_status || fin.familyStatus || '';
  const kids    = Number(flat.children_count ?? fin.kids ?? 0);

  const monthlyNet     = Number(fin.netIncome      || flat.net_income      || 0);
  const partnerIncome  = Number(fin.spouseIncome   || flat.partner_income  || 0);
  const creditDebt     = Number(fin.creditDebt     || flat.credit_debt     || 0);
  const loans          = Number(fin.loans          || flat.loans_total     || 0);
  const savings        = Number(fin.savings        || flat.liquid_savings  || 0);

  let age = 0;
  if (userData.dob) {
    const { dobD, dobM, dobY } = userData.dob;
    if (dobD && dobM && dobY) {
      const birth = new Date(Number(dobY), Number(dobM) - 1, Number(dobD));
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
      if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
    }
  }

  return { employ, housing, family, kids, monthlyNet, partnerIncome, creditDebt, loans, savings, age };
}

// ── Main export ────────────────────────────────────────────────────────────
export function buildRegulatoryContext(userData) {
  const p = extractProfile(userData);
  if (!p) return '';

  const hasProfile = p.employ || p.monthlyNet > 0 || p.housing;
  if (!hasProfile) return '';

  const rules = [];

  const isSelfEmployed = /self_employed|business|freelance/.test(p.employ);
  const isEmployee     = p.employ === 'employee';

  // ── 1. Employment-specific obligations ──────────────────────────────────
  if (isSelfEmployed) {
    const annualRevenue = p.monthlyNet * 12 * 1.4; // rough gross estimate (net + ~40% tax+BI overhead)

    if (annualRevenue >= VAT_THRESHOLD_ANNUAL * 0.7) {
      rules.push(
        annualRevenue >= VAT_THRESHOLD_ANNUAL
          ? `מע"מ: חובת רישום כעוסק מורשה (הכנסה מעל ₪${VAT_THRESHOLD_ANNUAL.toLocaleString('he-IL')}/שנה) — הגשת דו"ח רבעוני`
          : `מע"מ: קרוב לסף חובת רישום (₪${VAT_THRESHOLD_ANNUAL.toLocaleString('he-IL')}/שנה) — עקוב אחרי המחזור`,
      );
    }

    rules.push(
      `ביטוח לאומי עצמאי: ${BI_SELF_LOWER_RATE}% עד ₪${(BI_SELF_LOWER_CEILING).toLocaleString('he-IL')}/שנה, ${BI_SELF_HIGHER_RATE}% על יתר — תשלום דו-חודשי`,
    );

    rules.push(
      `פנסיה: לא חובה מעסיק, אך ניכוי מס עד 16.5% מהכנסה — **כל שקל שמפקידים חוסך מס**`,
    );

    rules.push(
      `קרן השתלמות עצמאי: ניכוי מס עד ₪${KEREN_SELF_DEDUCT_MAX.toLocaleString('he-IL')}/שנה — נעולה ${KEREN_LOCK_YEARS} שנים, אחר-כך פטורה ממס רווחי הון`,
    );

    rules.push(
      `מקדמות מס: חובת תשלום רבעוני — אי-תשלום = קנסות + ריבית פיגורים`,
    );

  } else if (isEmployee) {
    rules.push(
      `פנסיה חובה: ${PENSION_EMPLOYEE_MIN}% עובד + ${PENSION_EMPLOYER_MIN}% מעסיק + ${PENSION_SEVERANCE}% פיצויים — אל תוותר על חלק המעסיק`,
    );

    rules.push(
      `פיצויים: זכאות מלאה אחרי שנה אחת — ${PENSION_SEVERANCE}% ממשכורת לכל שנת עבודה (אם פוטרת)`,
    );

    rules.push(
      `קרן השתלמות: עד 2.5% עובד + 7.5% מעסיק — חלק המעסיק פטור ממס, פטור ממס רווחי הון אחרי ${KEREN_LOCK_YEARS} שנים`,
    );

    rules.push(
      `ביטוח לאומי שכיר: ~3.5% עובד + ~7% מעסיק (עד תקרה) — מנוכה אוטומטי`,
    );
  }

  // ── 2. Income → tax bracket hint ────────────────────────────────────────
  if (p.monthlyNet > 0) {
    const annualGrossEst = p.monthlyNet * 12 * (isSelfEmployed ? 1.6 : 1.35);
    const marginal       = getMarginalRate(annualGrossEst);
    const savingPerK     = Math.round(marginal * 10); // ₪ saved per ₪1,000 deposited
    rules.push(
      `מס הכנסה (אומדן): מדרגה שולית ~${marginal}% — כל ₪1,000 לאפיק מוטב-מס חוסכת ~₪${savingPerK} מס`,
    );
  }

  // ── 3. Housing → mortgage LTV rules ─────────────────────────────────────
  if (p.housing === 'renting' || p.housing === 'parents') {
    rules.push(
      `משכנתה (דירה ראשונה): בנק ישראל מגביל ל-${MORTGAGE_FIRST_LTV}% מימון — דורש ${100 - MORTGAGE_FIRST_LTV}% הון עצמי`,
    );
  } else if (p.housing === 'owner') {
    rules.push(
      `משכנתה נוספת: מגבלת בנק ישראל — ${MORTGAGE_SECOND_LTV}% מימון בלבד (50% הון עצמי נדרש)`,
    );
  }

  // ── 4. Age-specific pension and savings rules ────────────────────────────
  if (p.age > 0) {
    if (p.age < 30) {
      rules.push(
        `פנסיה (צעיר): כל שנת הפקדה = עשרות אלפי ₪ נוספים בפרישה — ריבית דריבית עובדת הכי חזק עכשיו`,
      );
    } else if (p.age >= 50 && p.age < 60) {
      rules.push(
        `פנסיה (50+): חלון הזדמנויות אחרון — הגדל הפקדות. כל ₪1,000 נוספים/חודש = ~₪350,000 נוספים בפרישה (7%, 15 שנים)`,
      );
    } else if (p.age >= 60) {
      rules.push(
        `קופת גמל להשקעה: מגיל 60 — ניתן להמיר לקצבה פטורת מס (יתרון עצום)`,
      );
      rules.push(
        `גיל פרישה רשמי: 67 (גבר) / 62-65 (אישה) — תכנן קצבאות בהתאם`,
      );
    }
  }

  // ── 5. Debt-related consumer protection ─────────────────────────────────
  if (p.creditDebt > 5_000) {
    rules.push(
      `חוב אשראי: ריבית כרטיסים ~10-18%/שנה — החזרה = ה"השקעה" הכי בטוחה ורווחית`,
    );
  }

  const totalDebt = p.creditDebt + p.loans;
  if (p.monthlyNet > 0 && totalDebt > p.monthlyNet * 12) {
    rules.push(
      `עומס חוב גבוה: חוק חדלות פירעון 2018 — הליך שיקום פיננסי קיים. פאמונים (1-800-355-350) מסייעים ללא עלות`,
    );
  }

  // ── 6. Family → tax credit points ───────────────────────────────────────
  if (p.kids > 0) {
    const pointsPerChild  = p.kids <= 2 ? 1 : 0.5;  // simplified
    const totalPoints     = p.kids * pointsPerChild;
    const annualCredit    = Math.round(totalPoints * TAX_POINT_VALUE_2025);
    rules.push(
      `נקודות זיכוי: ${p.kids} ילד${p.kids > 1 ? 'ים' : ''} — זיכוי ממס ~₪${annualCredit.toLocaleString('he-IL')}/שנה. ודא שמגיש טופס 101 מעודכן`,
    );
  }

  const isDisvorced = /divorced|גרוש/.test(p.family);
  if (isDisvorced && p.kids > 0) {
    rules.push(
      `גרוש/ה עם ילדים: זכאי/ת לנקודות זיכוי נוספות — בדוק מול פקיד שומה (עשוי לחסוך אלפי ₪)`,
    );
  }

  if (rules.length === 0) return '';

  return `
═══════════════════════════════════════
⚖️ הקשר רגולטורי — חוקים שרלוונטיים ל**משתמש זה**
   ⚠️ חינוכי בלבד — אינו ייעוץ מורשה. למידע מחייב: רו"ח / עו"ד / יועץ מס
═══════════════════════════════════════
${rules.map(r => `• ${r}`).join('\n')}
═══════════════════════════════════════`;
}
