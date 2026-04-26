import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FEATURES = [
  { icon: '📋', title: 'שאלון אפיון מלא',     sub: '7 ימים לבניית פרופיל פיננסי מדויק' },
  { icon: '🤖', title: 'AI Coach ללא הגבלה',   sub: 'יועץ פיננסי אישי זמין 24/7' },
  { icon: '🏆', title: 'אתגר 30 יום',          sub: 'תחרות חודשית עם ₪45,000 בפרסים' },
  { icon: '📊', title: 'דוח אפיון מלא',        sub: 'מסמך מסכם — מי אתה כלכלית' },
  { icon: '💡', title: 'יעוץ יומי מותאם',      sub: 'טיפ, אתגר ושאלה לפי הפרופיל שלך' },
  { icon: '📈', title: 'מעקב עושר נקי',         sub: 'גרף התקדמות חודשי' },
  { icon: '🎮', title: 'כל המשחקים',            sub: '4 מיני-משחקים פיננסיים' },
  { icon: '🥇', title: 'לוח תוצאות',           sub: 'השווה לאלפי ישראלים' },
];

export default function SubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('monthly');
  const glow = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });

  const handleSubscribe = () => {
    // TODO: RevenueCat / Expo IAP integration
    // For now — simulate subscription
    navigation.replace('MainTabs');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fade }}>

        {/* Hero */}
        <View style={styles.hero}>
          <Animated.View style={[styles.glowRing, { opacity: glowOpacity }]} />
          <Text style={styles.heroLogo}>V</Text>
          <Text style={styles.heroTitle}>VerMillion Premium</Text>
          <Text style={styles.heroSub}>
            יועץ פיננסי אישי לכל אדם.{'\n'}
            בהיסטוריה למלכים. בימינו לעשירים.{'\n'}
            <Text style={styles.heroHighlight}>מחר — לכולם.</Text>
          </Text>
        </View>

        {/* Plans */}
        <View style={styles.plansRow}>
          <TouchableOpacity
            style={[styles.planCard, selected === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelected('monthly')}
            activeOpacity={0.85}
          >
            {selected === 'monthly' && <View style={styles.planBadge}><Text style={styles.planBadgeText}>פופולרי</Text></View>}
            <Text style={styles.planPeriod}>חודשי</Text>
            <Text style={styles.planPrice}>₪79</Text>
            <Text style={styles.planPeriodSub}>לחודש</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selected === 'annual' && styles.planCardSelected]}
            onPress={() => setSelected('annual')}
            activeOpacity={0.85}
          >
            <View style={styles.planSaveBadge}><Text style={styles.planSaveText}>חוסך ₪190</Text></View>
            <Text style={styles.planPeriod}>שנתי</Text>
            <Text style={styles.planPrice}>₪749</Text>
            <Text style={styles.planPeriodSub}>₪62.40/חודש</Text>
          </TouchableOpacity>
        </View>

        {/* Feature list */}
        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>מה כלול</Text>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureCheck}><Text style={styles.featureCheckText}>✓</Text></View>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureSub}>{f.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity style={styles.ctaBtn} onPress={handleSubscribe} activeOpacity={0.88}>
          <Text style={styles.ctaBtnText}>
            {selected === 'monthly' ? 'התחל 7 ימים חינם · ₪79/חודש' : 'התחל 7 ימים חינם · ₪749/שנה'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          ניתן לביטול בכל עת דרך חנות האפליקציות.{'\n'}
          הכסף לא עובד — אתה לא עובד עליו.
        </Text>

        {/* Free tier reminder */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipBtn}>
          <Text style={styles.skipText}>המשך ללא מנוי</Text>
        </TouchableOpacity>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 50 },

  hero: { alignItems: 'center', marginBottom: 32 },
  glowRing: { position: 'absolute', top: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: '#C0392B', opacity: 0.3 },
  heroLogo: { fontSize: 56, fontWeight: '900', color: '#C0392B', marginBottom: 12 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFF', marginBottom: 12 },
  heroSub: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 },
  heroHighlight: { color: '#C0392B', fontWeight: '800' },

  plansRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  planCard: {
    flex: 1, backgroundColor: '#111', borderRadius: 20, padding: 20,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#1E1E1E',
  },
  planCardSelected: { borderColor: '#C0392B', backgroundColor: '#1A0808' },
  planBadge: { position: 'absolute', top: -10, backgroundColor: '#C0392B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  planBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  planSaveBadge: { position: 'absolute', top: -10, backgroundColor: '#27AE60', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  planSaveText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  planPeriod: { color: '#888', fontSize: 13, marginTop: 8, marginBottom: 4 },
  planPrice: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  planPeriodSub: { color: '#555', fontSize: 12, marginTop: 2 },

  featuresCard: { backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#1E1E1E' },
  featuresTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 16, textAlign: 'right' },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  featureCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#0D2A0D', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#27AE60' },
  featureCheckText: { color: '#27AE60', fontSize: 13, fontWeight: '700' },
  featureIcon: { fontSize: 20 },
  featureTitle: { color: '#E0E0E0', fontSize: 14, fontWeight: '700', textAlign: 'right' },
  featureSub: { color: '#555', fontSize: 12, marginTop: 1, textAlign: 'right' },

  ctaBtn: {
    backgroundColor: '#C0392B', borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', marginBottom: 14,
    shadowColor: '#C0392B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  ctaBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },

  legalNote: { color: '#333', fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: '#444', fontSize: 14 },
});
