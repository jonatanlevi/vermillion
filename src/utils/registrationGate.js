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
  // Check Supabase-backed profile first
  const style = profile?.avatar_style;
  if (style && typeof style === 'object' && style.seed) return true;
  try {
    const parsed = typeof style === 'string' ? JSON.parse(style) : style;
    if (parsed?.seed) return true;
  } catch {}
  // Fallback: localStorage backup written by AvatarRevealScreen before the network save
  return readLocalAvatarSeed(profile?.id) === true;
}

export function getAuthLandingRoute(profile) {
  if (!profile) return 'CompleteProfile';

  const intakeDone =
    profile.profile_intake_complete === true ||
    (profile.profile_intake_complete == null && hasSavedAvatar(profile) && readLocalIntakeCompletion(profile.id) === true);

  if (!intakeDone) return 'CompleteProfile';

  const onboardingDone =
    profile.onboarding_complete === true ||
    (profile.onboarding_complete == null && readLocalOnboardingComplete(profile.id) === true);

  // If Supabase says onboarding is done, trust it unconditionally.
  // deleteAccount() already resets this flag before deletion, so stale state after re-registration is handled.
  if (profile.onboarding_complete === true) return 'MainTabs';

  // localStorage fallback — require avatar proof to guard against stale localStorage after account deletion.
  if (onboardingDone && hasSavedAvatar(profile)) return 'MainTabs';

  if (!isTermsAccepted(profile)) return 'RegulationsConsent';

  return hasSavedAvatar(profile) ? 'ModelDownload' : 'AvatarAppearance';
}

// ─── localStorage helpers (web-only; graceful no-op on native) ───

const AVATAR_STYLE_KEY = '@vermillion/avatar_style';

function readLocalAvatarSeed(userId) {
  if (!userId || typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${AVATAR_STYLE_KEY}/${userId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed?.seed;
  } catch {
    return false;
  }
}

export function markLocalAvatarSaved(userId) {
  // No-op here — the actual save is done by saveLocalAvatarStyle in storage.js.
  // This export exists so callers can mark the avatar as saved without importing storage.
  // The read side checks the same key written by storage.saveLocalAvatarStyle.
  void userId;
}

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
