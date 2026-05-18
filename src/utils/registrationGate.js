/**
 * `profile_intake_complete` — נקבע רק ב־CompleteProfileScreen אחרי מילוי פרטי ההרשמה שלנו.
 * `terms_accepted_at` — RegulationsConsentScreen אחרי בניית האווטאר.
 * `onboarding_complete` — ModelDownloadScreen לפני MainTabs.
 */
export function isTermsAccepted(profile) {
  if (!profile) return false;
  if (profile.terms_accepted_at) return true;
  return readLocalTermsAccepted(profile.id) === true;
}

export function isRegistrationComplete(profile) {
  if (!profile) return false;
  const intakeDone =
    profile.profile_intake_complete === true ||
    (profile.profile_intake_complete == null && readLocalIntakeCompletion(profile.id) === true);
  if (!intakeDone) return false;
  if (!isTermsAccepted(profile)) return false;
  const onboardingDone =
    profile.onboarding_complete === true ||
    (profile.onboarding_complete == null && readLocalOnboardingComplete(profile.id) === true);
  return onboardingDone;
}

/**
 * איפה לשלוח משתמש מחובר שלא ב־MainTabs עדיין.
 */
function hasSavedAvatar(profile) {
  const style = profile?.avatar_style;
  if (!style) return false;
  if (typeof style === 'object' && style.seed) return true;
  try {
    const parsed = typeof style === 'string' ? JSON.parse(style) : style;
    return !!parsed?.seed;
  } catch {
    return false;
  }
}

export function getAuthLandingRoute(profile) {
  if (!profile) return 'CompleteProfile';

  const intakeDone =
    profile.profile_intake_complete === true ||
    (profile.profile_intake_complete == null && readLocalIntakeCompletion(profile.id) === true);

  if (!intakeDone) return 'CompleteProfile';

  const onboardingDone =
    profile.onboarding_complete === true ||
    (profile.onboarding_complete == null && readLocalOnboardingComplete(profile.id) === true);

  // Users who completed onboarding before RegulationsConsent was added go directly to MainTabs.
  if (onboardingDone) return 'MainTabs';

  if (!isTermsAccepted(profile)) return 'RegulationsConsent';

  return hasSavedAvatar(profile) ? 'ModelDownload' : 'AvatarAppearance';
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

function readLocalTermsAccepted(userId) {
  if (!userId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`@vermillion/terms_accepted/${userId}`) === '1';
  } catch {
    return false;
  }
}

export function markLocalTermsAccepted(userId) {
  if (!userId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`@vermillion/terms_accepted/${userId}`, '1');
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
