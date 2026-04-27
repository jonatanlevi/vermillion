import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CharacterFigure, { THEMES, ARCHETYPES } from '../../components/CharacterFigure';
import { mockUser } from '../../mock/data';

const { width: SW } = Dimensions.get('window');

const STAT_MAPS = {
  advice_style: { direct: 'ישיר', gentle: 'עדין', tough: 'קשוח' },
  personality:  { serious: 'רציני', friendly: 'חם', mentor: 'מנטור' },
  goal_focus:   { money: '💰 עושר', freedom: '🕊️ חופש', growth: '📈 צמיחה' },
};

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

export default function AvatarRevealScreen({ navigation, route }) {
  const { appearance = {}, tone = {}, day1 = {} } = route.params || {};
  const theme     = THEMES[appearance.colors] || THEMES.fire;
  const archetype = ARCHETYPES[appearance.style] || ARCHETYPES.sage;
  const name      = makeName(appearance, tone);

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

  return (
    <Animated.View style={[s.root, { opacity: screenOp }]}>
      <LinearGradient colors={theme.bg} style={s.container}>

        <Text style={[s.topLabel, { color: theme.accent }]}>VerMillion שלך</Text>

        <Animated.View style={[s.cardWrap, { opacity: cardOp, transform: [{ scale: cardScale }] }]}>
          <Ring size={260} color={theme.accent} dur={10000} cw={true} />
          <Ring size={210} color={theme.glow}   dur={6000}  cw={false} />

          <View style={[s.card, { borderColor: theme.accent + '88' }]}>
            <View style={[s.cTL, { borderColor: theme.accent }]} />
            <View style={[s.cTR, { borderColor: theme.accent }]} />
            <View style={[s.cBL, { borderColor: theme.accent }]} />
            <View style={[s.cBR, { borderColor: theme.accent }]} />

            <CharacterFigure theme={theme} styleKey={appearance.style || 'sage'} />

            <LinearGradient colors={['transparent', '#000000EE', '#000']} style={s.titleBar}>
              <Text style={[s.archetypeTitle, { color: theme.accent }]}>{archetype.title}</Text>
              <Text style={s.archetypeDesc}>{archetype.subtitle}</Text>
            </LinearGradient>
          </View>

          <View style={[s.badge, { borderColor: theme.accent + '55' }]}>
            <Text style={[s.badgeText, { color: theme.accent }]}>✦ AI GENERATED ✦</Text>
          </View>
        </Animated.View>

        <Animated.Text style={[s.charName, { opacity: nameOp, transform: [{ translateY: nameY }] }]}>
          {name}
        </Animated.Text>

        <Animated.View style={[s.statsRow, { opacity: statsOp }]}>
          {stats.map((st, i) => (
            <View key={i} style={[s.chip, { borderColor: theme.accent + '44' }]}>
              <Text style={[s.chipVal, { color: theme.accent }]}>{st.val}</Text>
              <Text style={s.chipLabel}>{st.label}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[s.btnWrap, { opacity: btnOp }]}>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: theme.accent }]}
            onPress={() => {
              // שמירת נתוני האווטאר ב-mockUser
              mockUser.vermillion = {
                name: name,
                appearance: appearance,
                tone: tone
              };
              navigation.replace('ModelDownload');
            }}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>צאו לאתגר הראשון ▶</Text>
          </TouchableOpacity>
          <Text style={s.trialNote}>7 ימים ראשונים — חינם לחלוטין</Text>
        </Animated.View>

      </LinearGradient>
    </Animated.View>
  );
}

const CARD_W = Math.min(SW * 0.56, 220);
const CARD_H = CARD_W * 1.5;

const s = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 24 },
  topLabel:  { fontSize: 11, fontWeight: '800', letterSpacing: 3, textAlign: 'center' },

  cardWrap: { alignItems: 'center', justifyContent: 'center' },
  card: {
    width: CARD_W, height: CARD_H,
    backgroundColor: '#080808', borderWidth: 1.5, borderRadius: 16, overflow: 'hidden',
  },
  cTL: { position: 'absolute', top: -1,    left: -1,   width: 20, height: 20, borderTopWidth: 3,    borderLeftWidth: 3,   borderRadius: 3, zIndex: 3 },
  cTR: { position: 'absolute', top: -1,    right: -1,  width: 20, height: 20, borderTopWidth: 3,    borderRightWidth: 3,  borderRadius: 3, zIndex: 3 },
  cBL: { position: 'absolute', bottom: -1, left: -1,   width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3,   borderRadius: 3, zIndex: 3 },
  cBR: { position: 'absolute', bottom: -1, right: -1,  width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3,  borderRadius: 3, zIndex: 3 },

  titleBar: { position: 'absolute', bottom: 0, width: '100%', paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  archetypeTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 3, marginBottom: 3 },
  archetypeDesc:  { color: '#555', fontSize: 11, letterSpacing: 1 },

  badge: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)' },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },

  charName: { color: '#FFF', fontSize: 19, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },

  statsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', minWidth: 64, backgroundColor: 'rgba(255,255,255,0.03)' },
  chipVal:   { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  chipLabel: { color: '#444', fontSize: 10 },

  btnWrap:   { width: '100%', alignItems: 'center', gap: 8 },
  btn:       { width: '100%', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnText:   { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  trialNote: { color: '#444', fontSize: 12 },
});
