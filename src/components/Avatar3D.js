import VermillionAvatar from './VermillionAvatar';

export default function Avatar3D({
  archetype, tier, avatarUrl, userId, seed, equipment = [], overrides = {},
  size, showGlow, accentColor,
}) {
  return (
    <VermillionAvatar
      userId={userId}
      seed={seed}
      equipment={equipment}
      overrides={overrides}
      size={size}
      showGlow={showGlow}
      accentColor={accentColor}
    />
  );
}
