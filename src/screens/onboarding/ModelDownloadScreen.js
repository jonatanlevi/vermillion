import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { saveProfile } from '../../services/storage';

// llama.rn יותקן בשלב הבא (expo prebuild).
// כרגע: mockAI פועל אוטומטית ללא הורדה.
// המסך הזה מוצג רק כ-UX — מדלג לאפליקציה אחרי 2 שניות.

export default function ModelDownloadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { reloadProfile } = useAuth();
  const [phase, setPhase] = useState('intro'); // 'intro' | 'downloading' | 'done'
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  function startDownload() {
    setPhase('downloading');
    // כרגע: animation בלבד — VerMillion AI כבר זמין דרך mockAI
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      useNativeDriver: false,
    }).start(() => {
      setPhase('done');
    });
  }

  async function proceed() {
    try {
      await saveProfile({ onboarding_complete: true });
      await reloadProfile?.();
    } catch (_) {
      /* still enter app; flag can be retried from settings later */
    }
    navigation.replace('MainTabs');
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, paddingTop: insets.top + 40 }]}>

      <View style={styles.logoRow}>
        <View style={styles.logo}><Text style={styles.logoText}>V</Text></View>
        <Text style={styles.logoName}>VerMillion</Text>
      </View>

      {phase === 'intro' && (
        <>
          <Text style={styles.title}>המוח של VerMillion</Text>
          <Text style={styles.sub}>
            VerMillion פועל לגמרי על הטלפון שלך.{'\n'}
            הנתונים הפיננסיים שלך לא עוזבים את המכשיר — לעולם.
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoRow}>📱 פועל ללא אינטרנט</Text>
            <Text style={styles.infoRow}>🔒 הנתונים שלך נשארים אצלך</Text>
            <Text style={styles.infoRow}>⚡ תגובות תוך שניות</Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={startDownload} activeOpacity={0.88}>
            <Text style={styles.btnText}>התחל — הכן את VerMillion</Text>
          </TouchableOpacity>

          <Text style={styles.sizeNote}>הורדה חד-פעמית · ~400MB</Text>
        </>
      )}

      {phase === 'downloading' && (
        <>
          <Text style={styles.title}>מכין את VerMillion...</Text>
          <Text style={styles.sub}>מוריד את מנוע ה-AI לטלפון שלך</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <Text style={styles.progressLabel}>VerMillion AI · 400MB</Text>
          </View>

          <Text style={styles.privacyNote}>
            🔒 הנתונים שלך לא יוצאים לשום שרת
          </Text>
        </>
      )}

      {phase === 'done' && (
        <>
          <Text style={styles.doneEmoji}>✅</Text>
          <Text style={styles.title}>VerMillion מוכן!</Text>
          <Text style={styles.sub}>
            מעכשיו כל השיחות מתבצעות על הטלפון שלך בלבד.
          </Text>

          <TouchableOpacity style={styles.btn} onPress={proceed} activeOpacity={0.88}>
            <Text style={styles.btnText}>בואו נתחיל</Text>
          </TouchableOpacity>
        </>
      )}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0A',
    alignItems: 'center', paddingHorizontal: 32,
  },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 48 },
  logo: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FF4D4D',
  },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  logoName: { color: '#FFF', fontSize: 26, fontWeight: '900' },

  title: { color: '#FFF', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  sub: { color: '#888', fontSize: 15, lineHeight: 24, textAlign: 'center', marginBottom: 32 },

  infoCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    width: '100%', marginBottom: 32, borderWidth: 1, borderColor: '#1E1E1E', gap: 12,
  },
  infoRow: { color: '#CCC', fontSize: 15, textAlign: 'right' },

  btn: {
    backgroundColor: '#C0392B', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 40,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  sizeNote: { color: '#444', fontSize: 13 },

  progressContainer: { width: '100%', marginBottom: 24 },
  progressTrack: {
    height: 8, backgroundColor: '#1E1E1E', borderRadius: 4,
    overflow: 'hidden', marginBottom: 10,
  },
  progressFill: { height: 8, backgroundColor: '#C0392B', borderRadius: 4 },
  progressLabel: { color: '#555', fontSize: 13, textAlign: 'center' },

  privacyNote: { color: '#4CAF50', fontSize: 13, textAlign: 'center' },

  doneEmoji: { fontSize: 64, marginBottom: 16 },
});
