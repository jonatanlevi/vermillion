import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { saveProfile } from '../../services/storage';
import { markLocalOnboardingComplete } from '../../utils/registrationGate';

export default function ModelDownloadScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, reloadProfile } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(proceed, 2200);
    return () => clearTimeout(timer);
  }, []);

  async function proceed() {
    try {
      await saveProfile({ onboarding_complete: true });
      markLocalOnboardingComplete(user?.id);
      await reloadProfile?.();
    } catch {
      markLocalOnboardingComplete(user?.id);
    }
    navigation.replace('MainTabs');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={styles.check}>✅</Text>
        <Text style={styles.title}>VerMillion מוכן!</Text>
        <Text style={styles.sub}>היועץ הפיננסי האישי שלך מחכה לך</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0A',
    alignItems: 'center',
  },
  logo: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FF4D4D',
    marginBottom: 24,
    shadowColor: '#C0392B', shadowOpacity: 0.5,
    shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoText: { color: '#FFF', fontSize: 32, fontWeight: '900' },
  check:  { fontSize: 56, marginBottom: 16 },
  title:  { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  sub:    { color: '#666', fontSize: 15, textAlign: 'center' },
});
