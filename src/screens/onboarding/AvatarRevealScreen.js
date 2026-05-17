import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import VermillionAvatar from '../../components/VermillionAvatar';
import { saveProfile, saveLocalAvatarStyle } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';

const STAT_MAPS = {
  advice_style: { direct: 'ישיר', gentle: 'עדין', tough: 'קשוח' },
  personality:  { serious: 'רציני', friendly: 'חם', mentor: 'מנטור' },
  goal_focus:   { money: '💰 עושר', freedom: '🕊️ חופש', growth: '📈 צמיחה' },
};

// Maps onboarding answers → DiceBear avataaars params
// Only uses params that are proven to work (same set as EQUIP_OVERRIDES in VermillionAvatar.js)
const ANSWER_OVERRIDES = {
  // appearance.style → accessory / facial hair / hat
  warrior: { facialHair: 'beardMedium' },
  sage:    { accessories: 'prescription01' },
  royal:   { accessories: 'sunglasses' },
  street:  { top: 'hat' },
  // goal_focus → clothes color (hoodie proven to work)
  money:   { clothes: 'hoodie', clothesColor: 'f5c518' },
  freedom: { clothes: 'hoodie', clothesColor: '2c3e50' },
  growth:  { clothes: 'hoodie', clothesColor: '1a5276' },
};

function computeAvatarOverrides(appearance, tone) {
  const o = {};
  if (appearance?.style)    Object.assign(o, ANSWER_OVERRIDES[appearance.style]    || {});
  if (tone?.goal_focus)     Object.assign(o, ANSWER_OVERRIDES[tone.goal_focus]     || {});
  if (tone?.personality)    Object.assign(o, ANSWER_OVERRIDES[tone.personality]    || {});
  return o;
}

function makeName(appearance, tone) {
  const firsts = { warrior: 'KRAV', sage: 'EYAL', royal: 'ARIEL', street: 'TAL' };
  const lasts  = { calm: 'THE SILENT', intense: 'THE STORM', wise: 'THE DEEP', playful: 'THE WILD' };
  return `${firsts[appearance?.style] || 'NIR'} · ${lasts[appearance?.energy] || 'THE GUIDE'}`;
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

const ACCENT = '#C0392B';

export default function AvatarRevealScreen({ navigation, route }) {
  const { appearance = {}, tone = {}, day1 = {} } = route.params || {};
  const { user, reloadProfile } = useAuth();
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 14));
  const [saving, setSaving] = useState(false);
  const name = makeName(appearance, tone);
  const personalityOverrides = computeAvatarOverrides(appearance, tone);

  const screenOp  = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.5)).current;
  const cardOp    = useRef(new Animated.Value(0)).current;
  const nameOp    = useRef(new Animated.Value(0)).current;
  const nameY     = useRef(new Animated.Value(24)).current;
  const statsOp   = useRef(new Animated.Value(0)).current;
  const btnOp     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(screenOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(cardOp,   { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(nameOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(nameY,  { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(statsOp, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnOp,   { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const stats = [
    tone.advice_style && { label: 'סגנון',  val: STAT_MAPS.advice_style[tone.advice_style] },
    tone.personality  && { label: 'אישיות', val: STAT_MAPS.personality[tone.personality]   },
    tone.goal_focus   && { label: 'מטרה',   val: STAT_MAPS.goal_focus[tone.goal_focus]     },
  ].filter(Boolean);

  async function handleSave() {
    setSaving(true);
    const avatarStyle = { seed, equipment: [], overrides: personalityOverrides };
    saveLocalAvatarStyle(user?.id, avatarStyle);
    try {
      await saveProfile({ avatar_style: avatarStyle });
      await reloadProfile();
    } catch (_) {}
    navigation.replace('RegulationsConsent');
  }

  return (
    <Animated.View style={[s.root, { opacity: screenOp }]}>
      <LinearGradient colors={['#0A0A0A', '#140808', '#0A0A0A']} style={s.container}>

        <Text style={s.topLabel}>האווטאר שלך</Text>

        <Animated.View style={[s.cardWrap, { opacity: cardOp, transform: [{ scale: cardScale }] }]}>
          <Ring size={280} color={ACCENT} dur={10000} cw={true} />
          <Ring size={230} color={ACCENT} dur={6000}  cw={false} />
          <VermillionAvatar
            userId={user?.id}
            seed={seed}
            overrides={personalityOverrides}
            size={160}
            showGlow={true}
            accentColor={ACCENT}
          />
        </Animated.View>

        <Animated.Text style={[s.charName, { opacity: nameOp, transform: [{ translateY: nameY }] }]}>
          {name}
        </Animated.Text>

        <Animated.View style={[s.statsRow, { opacity: statsOp }]}>
          {stats.map((st, i) => (
            <View key={i} style={s.chip}>
              <Text style={s.chipVal}>{st.val}</Text>
              <Text style={s.chipLabel}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[s.btnWrap, { opacity: btnOp }]}>
          <TouchableOpacity
            style={s.shuffleBtn}
            onPress={() => setSeed(Math.random().toString(36).slice(2, 14))}
            activeOpacity={0.8}
          >
            <Text style={s.shuffleText}>🎲 ערבב אוואטר</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>{saving ? 'שומר...' : 'שמור והמשך ▶'}</Text>
          </TouchableOpacity>
          <Text style={s.trialNote}>7 ימים ראשונים — חינם לחלוטין</Text>
        </Animated.View>

      </LinearGradient>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 24 },
  topLabel:  { fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center', color: ACCENT },

  cardWrap:  { alignItems: 'center', justifyContent: 'center', width: 300, height: 300 },

  charName:  { color: '#FFF', fontSize: 19, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },

  statsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    alignItems: 'center', minWidth: 64,
    backgroundColor: 'rgba(255,255,255,0.03)', borderColor: ACCENT + '44',
  },
  chipVal:   { fontSize: 12, fontWeight: '800', marginBottom: 2, color: ACCENT },
  chipLabel: { color: '#444', fontSize: 10 },

  btnWrap:    { width: '100%', alignItems: 'center', gap: 10 },
  shuffleBtn: {
    width: '100%', height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: ACCENT + '88',
    backgroundColor: 'rgba(192,57,43,0.08)',
  },
  shuffleText: { color: ACCENT, fontSize: 15, fontWeight: '700' },
  btn:         { width: '100%', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: ACCENT },
  btnText:     { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  trialNote:   { color: '#444', fontSize: 12 },
});
