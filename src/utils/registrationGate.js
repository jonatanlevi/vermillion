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
    readLocalIntakeCompletion(profile.id) === true;
  if (!intakeDone) return false;
  if (profile.onboarding_complete !== true) return false;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  return name.length >= 2;
}

/**
 * איפה לשלוח משתמש מחובר שלא ב־MainTabs עדיין.
 */
export function getAuthLandingRoute(profile) {
  if (isRegistrationComplete(profile)) return 'MainTabs';
  const intakeDone =
    profile?.profile_intake_complete === true ||
    readLocalIntakeCompletion(profile?.id) === true;
  if (intakeDone) return 'AvatarAppearance';
  return 'CompleteProfile';
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
  } catch {
    // ignore local storage errors (private mode / quota)
  }
}
