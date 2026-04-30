import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { supabase } from '../../services/supabase';

export default function SplashScreen({ navigation }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(ringScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
    ]).start();

    let animDone = false;
    let sessionResolved = false;
    let resolvedSession = null;
    let navigated = false;

    async function doNavigate(session) {
      if (navigated) return;
      navigated = true;
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', session.user.id)
          .maybeSingle();
        const done = !error && profile?.onboarding_complete === true;
        navigation.replace(done ? 'MainTabs' : 'CompleteProfile');
      } else {
        navigation.replace('Welcome');
      }
    }

    function tryNavigate() {
      if (animDone && sessionResolved) doNavigate(resolvedSession);
    }

    // Minimum splash display time
    const timer = setTimeout(() => {
      animDone = true;
      tryNavigate();
    }, 2800);

    // Primary: read session from storage immediately (works on web + native; avoids hanging
    // when onAuthStateChange does not emit INITIAL_SESSION the way we expect).
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolvedSession = session;
      sessionResolved = true;
      tryNavigate();
    });

    // Also react to PKCE / OAuth completing mid-splash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolvedSession = session;
      sessionResolved = true;
      tryNavigate();
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background rings */}
      <Animated.View style={[styles.ring, styles.ring1, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
      <Animated.View style={[styles.ring, styles.ring2, { opacity: Animated.multiply(ringOpacity, 0.5), transform: [{ scale: ringScale }] }]} />

      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoV}>V</Text>
        </View>
        <Text style={styles.logoTitle}>VERMILLION</Text>
        <Text style={styles.logoSub}>משקל למיליון</Text>
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        מיומנות היא לא מזל
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0A',
    alignItems: 'center', justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.15)',
  },
  ring1: { width: 260, height: 260 },
  ring2: { width: 380, height: 380 },

  logoWrap: { alignItems: 'center', gap: 12 },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#C0392B',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  logoV: { fontSize: 52, fontWeight: '900', color: '#FFF' },
  logoTitle: {
    fontSize: 26, fontWeight: '800', color: '#FFF',
    letterSpacing: 8,
  },
  logoSub: { fontSize: 14, color: '#444', letterSpacing: 3 },

  tagline: {
    position: 'absolute', bottom: 56,
    fontSize: 14, color: '#333', letterSpacing: 2,
  },
});
