import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { THEMES } from './CharacterFigure';

/**
 * VermillionAvatar
 * ─────────────────
 * תמונת הפרופיל של המשתמש — דמות ה-VerMillion בעיגול.
 *
 * Props:
 *   appearance  — { colors, style, body, energy }
 *   size        — קוטר העיגול (default: 96)
 *   showGlow    — glow פועם (default: true)
 */
export default function VermillionAvatar({ appearance = {}, size = 96, showGlow = true }) {
  const theme  = THEMES[appearance.colors] || THEMES.fire;
  const radius = size / 2;

  // scale everything relative to base size of 96
  const sc = size / 96;

  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!showGlow) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOp    = glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.0] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.12] });

  // per-style body color variation
  const bodyAlpha = { warrior: '33', sage: '22', royal: '2A', street: '2E' };
  const alpha = bodyAlpha[appearance.style] || '28';

  return (
    <View style={{ width: size + 6, height: size + 6, alignItems: 'center', justifyContent: 'center' }}>

      {/* Outer glow pulse ring */}
      {showGlow && (
        <Animated.View style={{
          position: 'absolute',
          width: size + 8, height: size + 8,
          borderRadius: (size + 8) / 2,
          borderWidth: 1.5,
          borderColor: theme.accent,
          opacity: glowOp,
          transform: [{ scale: glowScale }],
        }} />
      )}

      {/* Solid accent border */}
      <View style={{
        position: 'absolute',
        width: size + 4, height: size + 4,
        borderRadius: (size + 4) / 2,
        borderWidth: 2,
        borderColor: theme.accent + 'AA',
      }} />

      {/* ── Circle clip ── */}
      <View style={{
        width: size, height: size, borderRadius: radius,
        backgroundColor: '#0A0A0A',
        overflow: 'hidden',
        alignItems: 'center',
      }}>

        {/* Sky light beam from top */}
        <View style={{
          position: 'absolute', top: 0,
          width: size * 0.35, height: size * 0.55,
          backgroundColor: theme.light || theme.accent,
          opacity: 0.14,
          borderBottomLeftRadius: size,
          borderBottomRightRadius: size,
        }} />

        {/* Background gradient simulation */}
        <View style={{
          position: 'absolute', bottom: 0,
          width: size, height: size * 0.5,
          backgroundColor: theme.accent,
          opacity: 0.06,
          borderTopLeftRadius: size,
          borderTopRightRadius: size,
        }} />

        {/* ── HEAD ── */}
        <View style={{
          width: size * 0.46,
          height: size * 0.46,
          borderRadius: size * 0.23,
          backgroundColor: '#1A1A1A',
          borderWidth: 1.5,
          borderColor: theme.accent + 'AA',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: size * 0.12,
          overflow: 'hidden',
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 8,
          elevation: 8,
        }}>
          {/* face highlight */}
          <View style={{
            position: 'absolute', top: '15%', left: '22%',
            width: '55%', height: '40%',
            backgroundColor: theme.accent + '18',
            borderRadius: 20,
          }} />
          {/* eyes */}
          <View style={{ flexDirection: 'row', gap: Math.round(7 * sc), marginTop: Math.round(4 * sc) }}>
            {[0, 1].map(i => (
              <View key={i} style={{
                width: Math.round(6 * sc),
                height: Math.round(3.5 * sc),
                borderRadius: 3,
                backgroundColor: theme.accent,
                shadowColor: theme.glow || theme.accent,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 4,
                elevation: 4,
              }} />
            ))}
          </View>
        </View>

        {/* ── NECK ── */}
        <View style={{
          width: Math.round(10 * sc),
          height: Math.round(6 * sc),
          backgroundColor: theme.accent + '22',
          borderRadius: 2,
        }} />

        {/* ── SHOULDERS ── */}
        <View style={{
          width: size * 0.72,
          height: Math.round(16 * sc),
          backgroundColor: theme.accent + alpha,
          borderRadius: size,
          borderWidth: 1,
          borderColor: theme.accent + '44',
          marginTop: 1,
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* epaulettes */}
          {[-1, 1].map(side => (
            <View key={side} style={{
              position: 'absolute',
              [side === -1 ? 'left' : 'right']: Math.round(4 * sc),
              top: Math.round(-6 * sc),
              width: Math.round(8 * sc),
              height: Math.round(12 * sc),
              backgroundColor: theme.accent + '55',
              borderRadius: 3,
              borderWidth: 1,
              borderColor: theme.accent + '88',
            }} />
          ))}
        </View>

        {/* ── UPPER CHEST ── */}
        <View style={{
          width: size * 0.52,
          height: Math.round(22 * sc),
          backgroundColor: theme.accent + '18',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.accent + '33',
          marginTop: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* chest emblem */}
          <View style={{
            width: Math.round(10 * sc),
            height: Math.round(10 * sc),
            borderRadius: Math.round(5 * sc),
            borderWidth: 1.5,
            borderColor: theme.accent + '99',
            backgroundColor: theme.accent + '22',
          }} />
        </View>

        {/* ── GROUND MIST ── */}
        <View style={{
          position: 'absolute', bottom: 0,
          width: size * 1.2, height: Math.round(14 * sc),
          backgroundColor: theme.accent + '14',
          borderRadius: size,
        }} />
      </View>
    </View>
  );
}
