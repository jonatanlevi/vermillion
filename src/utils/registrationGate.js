/**
 * Full product onboarding (legal details + avatar + model screen) finishes only when
 * `onboarding_complete` is set true — currently in ModelDownloadScreen before MainTabs.
 * CompleteProfile only saves name + marks profile; it must NOT set onboarding_complete true.
 */
export function isRegistrationComplete(profile) {
  if (!profile || profile.onboarding_complete !== true) return false;
  const name = typeof profile.name === 'string' ? profile.name.trim() : '';
  return name.length >= 2;
}

/**
 * Where to send a signed-in user who is not yet allowed into MainTabs.
 * - Name missing → CompleteProfile (legal form).
 * - Name present but funnel not finished → continue avatar flow.
 */
export function getAuthLandingRoute(profile) {
  if (isRegistrationComplete(profile)) return 'MainTabs';
  const name = typeof profile?.name === 'string' ? profile.name.trim() : '';
  if (name.length >= 2) return 'AvatarAppearance';
  return 'CompleteProfile';
}
