/**
 * `profile_intake_complete` — נקבע רק ב־CompleteProfileScreen אחרי מילוי פרטי ההרשמה שלנו.
 * Google OAuth לא מסמן את זה; שם מ־Google לא מדלג על הטופס.
 *
 * `onboarding_complete` — נקבע רק ב־ModelDownloadScreen לפני MainTabs (סיום כל המסלול).
 */
export function isRegistrationComplete(profile) {
  if (!profile) return false;
  if (profile.profile_intake_complete !== true) return false;
  if (profile.onboarding_complete !== true) return false;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  return name.length >= 2;
}

/**
 * איפה לשלוח משתמש מחובר שלא ב־MainTabs עדיין.
 */
export function getAuthLandingRoute(profile) {
  if (isRegistrationComplete(profile)) return 'MainTabs';
  if (profile?.profile_intake_complete === true) return 'AvatarAppearance';
  return 'CompleteProfile';
}
