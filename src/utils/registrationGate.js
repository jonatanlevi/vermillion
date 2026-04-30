/**
 * Main app (tabs) only after the user finished CompleteProfileScreen:
 * DB flag + name we persist from the form (ignore Google-only metadata).
 */
export function isRegistrationComplete(profile) {
  if (!profile || profile.onboarding_complete !== true) return false;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  return name.length >= 2;
}
