import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import LanguagePicker from '../../components/LanguagePicker';
import { clearAllData } from '../../services/storage';

const { width: SW } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { t } = useLanguage();
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const STATS = [
    { value: t.stat1Value, label: t.stat1Label },
    { value: `${t.currencySymbol}750K`, label: t.stat2Label },
    { value: t.stat3Value, label: t.stat3Label },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.bgAccent} />
      <View style={styles.bgAccent2} />

      <Animated.View style={[styles.inner, { opacity: fade, transform: [{ translateY: slideY }] }]}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoV}>V</Text>
            </View>
            <Text style={styles.logoText}>{t.appName}</Text>
          </View>
          <LanguagePicker />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.clubName}>{t.clubName}</Text>
          <Text style={styles.heroTitle}>{t.heroTitle}</Text>
          <Text style={styles.heroSub}>{t.heroSub}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={async () => { await clearAllData(); navigation.navigate('CompleteProfile'); }}
            activeOpacity={0.88}
          >
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleText}>{t.continueGoogle}</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t.or}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.phoneBtn}
            onPress={async () => { await clearAllData(); navigation.navigate('CompleteProfile'); }}
            activeOpacity={0.88}
          >
            <Text style={styles.phoneBtnText}>{t.continuePhone}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLinkText}>
              {t.alreadyMember}{' '}
              <Text style={styles.loginLinkBold}>{t.login}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>{t.legalText}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  bgAccent: {
    position: 'absolute', top: -120, right: -120,
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(192,57,43,0.07)',
  },
  bgAccent2: {
    position: 'absolute', bottom: 60, left: -80,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(192,57,43,0.04)',
  },

  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 32, justifyContent: 'space-between' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  logoV: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  logoText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 4 },

  hero: { gap: 12 },
  clubName: { color: '#C0392B', fontSize: 13, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  heroTitle: { color: '#FFF', fontSize: 50, fontWeight: '900', lineHeight: 56, letterSpacing: -1 },
  heroSub: { color: '#555', fontSize: 17, lineHeight: 26 },

  statsRow: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: '#1E1E1E',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: '#1E1E1E' },
  statValue: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 3 },

  actions: { gap: 12 },
  googleBtn: {
    backgroundColor: '#FFF', borderRadius: 14, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },
  googleIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center' },
  googleIconText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  googleText: { color: '#111', fontSize: 16, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E1E1E' },
  dividerText: { color: '#444', fontSize: 13 },

  phoneBtn: {
    backgroundColor: '#151515', borderRadius: 14, height: 56,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  phoneBtnText: { color: '#CCC', fontSize: 16, fontWeight: '600' },

  loginLink: { alignItems: 'center', paddingVertical: 4 },
  loginLinkText: { color: '#555', fontSize: 14 },
  loginLinkBold: { color: '#FFF', fontWeight: '700' },

  legal: { color: '#555', fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
