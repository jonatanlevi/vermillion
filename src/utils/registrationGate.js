/**
 * `profile_intake_complete` — נקבע רק ב־CompleteProfileScreen אחרי מילוי פרטי ההרשמה שלנו.
 * Google OAuth לא מסמן את זה; שם מ־Google לא מדלג על הטופס.
 *
 * `onboarding_complete` — נקבע רק ב־ModelDownloadScreen לפני MainTabs (סיום כל המסלול).
 */
export function isRegistrationComplete(profile) {
  if (!profile) return false;
  const intakeDone =
    profile.profile_intake_complete === true ||
    (profile.profile_intake_complete == null && readLocalIntakeCompletion(profile.id) === true);
  if (!intakeDone) return false;
  const onboardingDone =
    profile.onboarding_complete === true ||
    (profile.onboarding_complete == null && readLocalOnboardingComplete(profile.id) === true);
  return onboardingDone;
}

/**
 * איפה לשלוח משתמש מחובר שלא ב־MainTabs עדיין.
 */
export function getAuthLandingRoute(profile) {
  if (isRegistrationComplete(profile)) return 'MainTabs';
  const intakeDone =
    profile?.profile_intake_complete === true ||
    (profile?.profile_intake_complete == null && readLocalIntakeCompletion(profile?.id) === true);
  if (intakeDone) return 'AvatarAppearance';
  return 'CompleteProfile';
}

// ─── localStorage helpers (web-only; graceful no-op on native) ───

function readLocalIntakeCompletion(userId) {
  if (!userId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`@vermillion/intake_complete/${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markLocalProfileIntakeComplete(userId) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`@vermillion/intake_complete/${userId}`, '1');
  } catch {}
}

function readLocalOnboardingComplete(userId) {
  if (!userId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`@vermillion/onboarding_complete/${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markLocalOnboardingComplete(userId) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`@vermillion/onboarding_complete/${userId}`, '1');
  } catch {}
}

// ─── Avatar equipment system ───────────────────────────────────

export const EQUIPMENT_MILESTONES = [
  { id: 'aura',  vCoins: 100,   name: 'אורה',  emoji: '✨' },
  { id: 'cape',  vCoins: 1000,  name: 'גלימה', emoji: '🦸' },
  { id: 'halo',  vCoins: 5000,  name: 'הילה',  emoji: '😇' },
  { id: 'crown', vCoins: 20000, name: 'כתר',   emoji: '👑' },
];

export function getUnlockedEquipment(vCoins) {
  return EQUIPMENT_MILESTONES
    .filter(m => (vCoins || 0) >= m.vCoins)
    .map(m => m.id);
}

const STORE_OVERRIDES = {
  glasses:    { accessories: 'prescription01' },
  sunglasses: { accessories: 'sunglasses' },
  beard:      { facialHair: 'beardMedium' },
  hat:        { top: 'hat' },
  gold_hoodie: { clothesColor: 'f5c518' },
};

export function getEffectiveOverrides(baseOverrides, purchasedItems) {
  const merged = { ...(baseOverrides || {}) };
  (purchasedItems || []).forEach(id => {
    Object.assign(merged, STORE_OVERRIDES[id] || {});
  });
  return merged;
}
