import React, { useRef, useEffect, useState } from 'react';
import { View, Image, Animated, ActivityIndicator } from 'react-native';

const BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

const EQUIP_OVERRIDES = {
  glasses:     { accessories: 'prescription01' },
  sunglasses:  { accessories: 'sunglasses' },
  hat:         { top: 'hat' },
  beard:       { facialHair: 'beardMedium' },
  gold_hoodie: { clothes: 'hoodie', clothesColor: 'f5c518' },
};

export function buildAvatarUrl(userId, equipment = []) {
  const seed = (userId || 'default').slice(-16);
  const params = { seed, backgroundColor: '111111', radius: '50' };
  equipment.forEach(id => Object.assign(params, EQUIP_OVERRIDES[id] || {}));
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${BASE}?${qs}`;
}

export default function VermillionAvatar({
  userId,
  equipment = [],
  size      = 96,
  showGlow  = true,
  accentColor = '#C0392B',
}) {
  const [loaded, setLoaded] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;
  const uri  = buildAvatarUrl(userId, equipment);

  useEffect(() => {
    if (!showGlow) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [showGlow]);

  const glowOp    = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.1] });

  return (
    <View style={{ width: size + 8, height: size + 8, alignItems: 'center', justifyContent: 'center' }}>
      {showGlow && (
        <Animated.View style={{
          position: 'absolute',
          width: size + 10, height: size + 10,
          borderRadius: (size + 10) / 2,
          borderWidth: 1.5,
          borderColor: accentColor,
          opacity: glowOp,
          transform: [{ scale: glowScale }],
        }} />
      )}
      <View style={{
        position: 'absolute',
        width: size + 4, height: size + 4,
        borderRadius: (size + 4) / 2,
        borderWidth: 2,
        borderColor: accentColor + '99',
      }} />
      <View style={{
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: '#111',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {!loaded && <ActivityIndicator size="small" color={accentColor} style={{ position: 'absolute' }} />}
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      </View>
    </View>
  );
}
