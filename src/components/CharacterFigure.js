import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const THEMES = {
  dark:     { bg: ['#06061A', '#000'], accent: '#7B68EE', glow: '#7B68EE', light: '#9B88FF' },
  gold:     { bg: ['#120E00', '#000'], accent: '#FFD700', glow: '#FFD700', light: '#FFE94D' },
  fire:     { bg: ['#140500', '#000'], accent: '#C0392B', glow: '#FF4500', light: '#FF6B35' },
  colorful: { bg: ['#001209', '#000'], accent: '#00C853', glow: '#00E676', light: '#69F0AE' },
};

export const ARCHETYPES = {
  warrior: { title: 'THE WARRIOR',  subtitle: 'לוחם ללא פחד'  },
  sage:    { title: 'THE SAGE',     subtitle: 'חכמה ועמקות'    },
  royal:   { title: 'THE ORACLE',   subtitle: 'שליטה ומנהיגות' },
  street:  { title: 'THE ENFORCER', subtitle: 'עוצמה ואש'      },
};

const BODY_CONFIG = {
  warrior: { shoulderW: '88%', cloakH: 110, capeW: '94%', headSize: 72 },
  sage:    { shoulderW: '76%', cloakH: 100, capeW: '80%', headSize: 68 },
  royal:   { shoulderW: '82%', cloakH: 120, capeW: '90%', headSize: 70 },
  street:  { shoulderW: '80%', cloakH: 105, capeW: '85%', headSize: 70 },
};

export default function CharacterFigure({ theme, styleKey, scale = 1 }) {
  const cfg = BODY_CONFIG[styleKey] || BODY_CONFIG.sage;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] });
  const headSz = cfg.headSize * scale;

  return (
    <View style={[fig.root, { transform: [{ scale }] }]}>
      {/* Sky light */}
      <View style={[fig.skyLight, { backgroundColor: theme.light }]} />

      <View style={fig.figureWrap}>
        {/* Halo */}
        <Animated.View style={[fig.halo, { backgroundColor: theme.glow, opacity: glowOp }]} />

        {/* HEAD */}
        <View style={[fig.head, {
          width: headSz, height: headSz, borderRadius: headSz / 2,
          borderColor: theme.accent + 'AA', shadowColor: theme.glow,
        }]}>
          <View style={[fig.faceHighlight, { backgroundColor: theme.light + '22' }]} />
          <View style={fig.eyes}>
            <View style={[fig.eye, { backgroundColor: theme.accent, shadowColor: theme.glow }]} />
            <View style={[fig.eye, { backgroundColor: theme.accent, shadowColor: theme.glow }]} />
          </View>
        </View>

        {/* NECK */}
        <View style={[fig.neck, { backgroundColor: theme.accent + '18' }]} />

        {/* SHOULDERS */}
        <View style={[fig.shoulders, { width: cfg.shoulderW, backgroundColor: theme.accent + '22', borderColor: theme.accent + '44' }]}>
          <View style={[fig.epaulette, fig.epauletteL, { backgroundColor: theme.accent + '55', borderColor: theme.accent }]} />
          <View style={[fig.epaulette, fig.epauletteR, { backgroundColor: theme.accent + '55', borderColor: theme.accent }]} />
        </View>

        {/* CHEST */}
        <View style={[fig.chest, { backgroundColor: theme.accent + '18', borderColor: theme.accent + '33' }]}>
          <View style={[fig.emblem, { borderColor: theme.accent + '88', backgroundColor: theme.accent + '22' }]} />
          <View style={[fig.armorLine, { backgroundColor: theme.accent + '55' }]} />
        </View>

        {/* CAPE */}
        <View style={[fig.cape, { height: cfg.cloakH, width: cfg.capeW, backgroundColor: theme.accent + '0E' }]}>
          <View style={[fig.capeCenter, { backgroundColor: theme.accent + '18' }]} />
        </View>

        {/* MIST */}
        <View style={[fig.mist,      { backgroundColor: theme.glow + '18' }]} />
        <View style={[fig.mistInner, { backgroundColor: theme.glow + '0C' }]} />
      </View>

      {/* Side accent lines */}
      <View style={[fig.accentLine, fig.accentLineL, { backgroundColor: theme.accent }]} />
      <View style={[fig.accentLine, fig.accentLineR, { backgroundColor: theme.accent }]} />
    </View>
  );
}

const fig = StyleSheet.create({
  root: { width: '100%', flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 16, paddingBottom: 8 },
  skyLight: { position: 'absolute', top: 0, width: 60, height: 90, opacity: 0.18, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  figureWrap: { alignItems: 'center', justifyContent: 'flex-start' },
  halo: { position: 'absolute', top: -10, width: 100, height: 100, borderRadius: 50, opacity: 0.2 },
  head: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1A1A1A', borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 14, elevation: 10,
    marginBottom: 4, overflow: 'hidden',
  },
  faceHighlight: { position: 'absolute', top: 6, left: '20%', width: '60%', height: '45%', borderRadius: 20 },
  eyes: { flexDirection: 'row', gap: 14, marginTop: 4 },
  eye: { width: 9, height: 5, borderRadius: 3, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 4 },
  neck: { width: 18, height: 10, borderRadius: 3 },
  shoulders: { height: 28, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', position: 'relative', marginTop: 2 },
  epaulette: { position: 'absolute', width: 14, height: 20, borderRadius: 4, borderWidth: 1, top: -10 },
  epauletteL: { left: 8 },
  epauletteR: { right: 8 },
  chest: { width: '68%', height: 52, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 4, gap: 6 },
  emblem: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  armorLine: { width: '55%', height: 1, borderRadius: 1 },
  cape: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginTop: 2, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 6, overflow: 'hidden' },
  capeCenter: { width: '45%', flex: 1, borderRadius: 10 },
  mist: { width: '120%', height: 22, borderRadius: 30, marginTop: 4 },
  mistInner: { width: '80%', height: 14, borderRadius: 20, marginTop: -8 },
  accentLine: { position: 'absolute', width: 1.5, height: 40, top: '20%', opacity: 0.4, borderRadius: 1 },
  accentLineL: { left: 12 },
  accentLineR: { right: 12 },
});
