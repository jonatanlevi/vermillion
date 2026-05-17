import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar3D from '../../components/Avatar3D';
import { saveProfile, saveLocalAvatarStyle } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { classifyArchetype, ARCHETYPES } from '../../utils/archetypeEngine';

function computeOverrides(appearance, tone) {
  const overrides = {};
  if (appearance?.style === 'warrior') overrides.facialHair = 'beardMedium';
  if (appearance?.style === 'sage')    overrides.accessories = 'prescription01';
  if (appearance?.style === 'royal')   overrides.accessories = 'sunglasses';
  return overrides;
}

function Ring({ size, color, dur, cw }) {
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(r, { toValue: 1, duration: dur, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);
  const rotate = r.interpolate({ inputRange: [0, 1], outputRange: cw ? ['0deg', '360deg'] : ['0deg', '-360deg'] });
  return (
    <Animated.View style={{
      position: 'absolute', width: size, height: size, borderRadius: size / 2,
      borderWidth: 1, borderColor: color + '28', borderTopColor: color + 'BB',
      transform: [{ rotate }],
    }} />
  );
}

function ScanLine({ color }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] });
  return (
    <Animated.View style={{
      position: 'absolute', left: 0, right: 0, height: 2,
      backgroundColor: color, opacity: 0.6,
      transform: [{ translateY }],
    }} />
  );
}

export default function AvatarRevealScreen({ navigation, route }) {
  const { appearance = {}, tone = {}, day1 = {} } = route.params || {};
  const { user, reloadProfile } = useAuth();
  const [phase, setPhase]   = useState('analyzing'); // 'analyzing' | 'revealed'
  const [saving, setSaving] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  const archetype  = classifyArchetype(appearance, tone, null);
  const archetypeData = ARCHETYPES[archetype] || ARCHETYPES.builder;
  const overrides  = computeOverrides(appearance, tone);

  // Animated values
  const screenOp   = useRef(new Animated.Value(0)).current;
  const scanOp     = useRef(new Animated.Value(1)).current;
  const revealOp   = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0.6)).current;
  const nameOp     = useRef(new Animated.Value(0)).current;
  const nameY      = useRef(new Animated.Value(20)).current;
  const descOp     = useRef(new Animated.Value(0)).current;
  const btnOp      = useRef(new Animated.Value(0)).current;

  // Dots animation during analyzing
  useEffect(() => {
    const iv = setInterval(() => setDotCount(d => (d % 3) + 1), 400);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    Animated.timing(screenOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // After 2.8s transition to reveal
    const t = setTimeout(() => {
      setPhase('revealed');
      Animated.sequence([
        Animated.timing(scanOp,  { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(revealOp,  { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(nameOp, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(nameY,  { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.timing(descOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnOp,  { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }, 2800);

    return () => clearTimeout(t);
  }, []);

  async function handleSave() {
    setSaving(true);
    const avatarStyle = { archetype, equipment: [], overrides };
    saveLocalAvatarStyle(user?.id, avatarStyle);
    try {
      await saveProfile({ avatar_style: avatarStyle });
      await reloadProfile();
    } catch (_) {}
    navigation.replace('RegulationsConsent');
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `גיליתי שאני ${archetypeData.name} ${archetypeData.emoji} ב-VerMillion!\n${archetypeData.description}\n\nגלה את הארכיטיפ הפיננסי שלך: vermillion-ashen.vercel.app`,
      });
    } catch (_) {}
  }

  const accentColor = archetypeData.color;

  return (
    <Animated.View style={[s.root, { opacity: screenOp }]}>
      <LinearGradient
        colors={['#0A0A0A', '#0D0D0D', '#0A0A0A']}
        style={s.container}
      >

        {/* PHASE: ANALYZING */}
        <Animated.View style={[s.analyzeWrap, { opacity: scanOp }]} pointerEvents={phase === 'analyzing' ? 'auto' : 'none'}>
          <View style={s.scanBox}>
            <Ring size={220} color={accentColor} dur={8000} cw={true} />
            <Ring size={170} color={accentColor} dur={5000} cw={false} />
            <ScanLine color={accentColor} />
            <View style={[s.scanCenter, { borderColor: accentColor + '55' }]}>
              <Text style={[s.scanEmoji]}>{archetypeData.emoji}</Text>
            </View>
          </View>
          <Text style={[s.analyzeLabel, { color: accentColor }]}>
            מנתח את הפרופיל שלך{'.'.repeat(dotCount)}
          </Text>
          <Text style={s.analyzeSub}>מזהה ארכיטיפ פיננסי</Text>
        </Animated.View>

        {/* PHASE: REVEALED */}
        <Animated.View style={[s.revealWrap, { opacity: revealOp }]} pointerEvents={phase === 'revealed' ? 'auto' : 'none'}>

          <Text style={[s.topLabel, { color: accentColor }]}>הVerMillion שלך</Text>

          <View style={s.cardWrap}>
            <Ring size={300} color={accentColor} dur={12000} cw={true} />
            <Ring size={245} color={accentColor} dur={7500}  cw={false} />
            <Animated.View style={{ transform: [{ scale: cardScale }] }}>
              <Avatar3D
                archetype={archetype}
                userId={user?.id}
                equipment={[]}
                overrides={overrides}
                size={148}
                showGlow={true}
                accentColor={accentColor}
              />
            </Animated.View>
          </View>

          <Animated.View style={{ alignItems: 'center', opacity: nameOp, transform: [{ translateY: nameY }] }}>
            <Text style={[s.archetypeName, { color: accentColor }]}>{archetypeData.name}</Text>
            <Text style={s.archetypeHebrew}>{archetypeData.hebrewName}</Text>
          </Animated.View>

          <Animated.View style={[s.descBox, { opacity: descOp, borderColor: accentColor + '33' }]}>
            <Text style={s.descText}>{archetypeData.description}</Text>
          </Animated.View>

          <Animated.View style={[s.btnWrap, { opacity: btnOp }]}>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: accentColor }, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>{saving ? 'שומר...' : 'בוא נתחיל ▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
              <Text style={s.shareBtnText}>📤 שתף את ה{archetypeData.hebrewName} שלך</Text>
            </TouchableOpacity>
            <Text style={s.trialNote}>7 ימים ראשונים — חינם לחלוטין</Text>
          </Animated.View>

        </Animated.View>

      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  // Analyzing phase
  analyzeWrap: {
    position: 'absolute', alignItems: 'center', gap: 20,
  },
  scanBox: {
    width: 240, height: 240, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  scanCenter: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  scanEmoji:    { fontSize: 40 },
  analyzeLabel: { fontSize: 17, fontWeight: '800', letterSpacing: 1.5 },
  analyzeSub:   { color: '#444', fontSize: 12, letterSpacing: 1 },

  // Reveal phase
  revealWrap: {
    width: '100%', alignItems: 'center', gap: 16,
  },
  topLabel:  { fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },

  cardWrap:  {
    width: 320, height: 320, alignItems: 'center', justifyContent: 'center',
  },

  archetypeName:  { fontSize: 22, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  archetypeHebrew: { color: '#888', fontSize: 14, fontWeight: '600', letterSpacing: 1, marginTop: 2 },

  descBox: {
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    maxWidth: 360,
  },
  descText: { color: '#CCCCCC', fontSize: 14, lineHeight: 22, textAlign: 'right' },

  btnWrap:      { width: '100%', alignItems: 'center', gap: 10, marginTop: 4 },
  btn:          { width: '100%', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText:      { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  shareBtn:     { width: '100%', height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#333' },
  shareBtnText: { color: '#888', fontSize: 14, fontWeight: '700' },
  trialNote:    { color: '#444', fontSize: 12 },
});
