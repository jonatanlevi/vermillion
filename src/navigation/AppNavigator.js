import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getAuthLandingRoute } from '../utils/registrationGate';
import { initTelemetry, teardownTelemetry, onScreenFocus } from '../services/activityTelemetry';

import SplashScreen           from '../screens/onboarding/SplashScreen';
import WelcomeScreen          from '../screens/onboarding/WelcomeScreen';
import RegisterScreen         from '../screens/onboarding/RegisterScreen';
import LoginScreen            from '../screens/onboarding/LoginScreen';
import CompleteProfileScreen  from '../screens/onboarding/CompleteProfileScreen';
import AvatarAppearanceScreen from '../screens/onboarding/AvatarAppearanceScreen';
import AvatarToneScreen       from '../screens/onboarding/AvatarToneScreen';
import AvatarIntroScreen      from '../screens/onboarding/AvatarIntroScreen';
import AvatarRevealScreen     from '../screens/onboarding/AvatarRevealScreen';
import RegulationsConsentScreen from '../screens/onboarding/RegulationsConsentScreen';
import SubscriptionScreen     from '../screens/onboarding/SubscriptionScreen';
import ModelDownloadScreen    from '../screens/onboarding/ModelDownloadScreen';

import GamesScreen      from '../screens/games/GamesScreen';
import VerMillionScreen from '../screens/vermillion/VerMillionScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

import HomeScreen              from '../screens/main/HomeScreen';
import DailyQuestionsScreen    from '../screens/main/DailyQuestionsScreen';
import OnboardingChatScreen    from '../screens/main/OnboardingChatScreen';
import DailyCoachingScreen     from '../screens/main/DailyCoachingScreen';
import ProfileRevealScreen     from '../screens/main/ProfileRevealScreen';
import SettingsScreen          from '../screens/main/SettingsScreen';
import RegulationsScreen       from '../screens/main/RegulationsScreen';
import Day30CelebrationScreen  from '../screens/main/Day30CelebrationScreen';
import AvatarGalleryScreen     from '../screens/dev/AvatarGalleryScreen';
import GhostPlayScreen         from '../screens/dev/GhostPlayScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary:      '#C0392B',
    background:   '#0A0A0A',
    card:         '#0F0F0F',
    text:         '#FFFFFF',
    border:       'transparent',
    notification: '#C0392B',
  },
};

const TABS = [
  { name: 'Games',      label: 'משחקים',     icon: '🎮' },
  { name: 'VerMillion', label: 'VerMillion', icon: '🤖', isCenter: true },
  { name: 'Profile',    label: 'פרופיל',     icon: '👤' },
];

function TabIcon({ icon, focused, isCenter, tabIndex }) {
  const cardOp  = useRef(new Animated.Value(0)).current;   // glass card fade
  const arcRot  = useRef(new Animated.Value(0)).current;   // shimmer arc rotation
  const arcRot2 = useRef(new Animated.Value(0)).current;   // second arc (opposite)
  const pulse   = useRef(new Animated.Value(0.4)).current; // glow pulse
  const arcRef  = useRef(null);
  const arc2Ref = useRef(null);
  const pRef    = useRef(null);

  // Glass card appears / disappears with focus
  useEffect(() => {
    if (focused) {
      Animated.timing(cardOp, { toValue: 1, duration: 380, useNativeDriver: true }).start();
      arcRef.current = Animated.loop(
        Animated.timing(arcRot, { toValue: 1, duration: 4500, easing: Easing.linear, useNativeDriver: true })
      );
      arc2Ref.current = Animated.loop(
        Animated.timing(arcRot2, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
      );
      pRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ]));
      arcRef.current.start();
      arc2Ref.current.start();
      pRef.current.start();
    } else {
      Animated.timing(cardOp, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        arcRef.current?.stop();
        arc2Ref.current?.stop();
        pRef.current?.stop();
        arcRot.setValue(0);
        arcRot2.setValue(0);
        pulse.setValue(0.4);
      });
    }
  }, [focused]);

  const spin1 = arcRot.interpolate({  inputRange: [0, 1], outputRange: ['0deg',  '360deg'] });
  const spin2 = arcRot2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // ── Center button ──────────────────────────────────────────────────────────
  if (isCenter) {
    return (
      <View style={s.cOuter}>

        {/* Soft glow behind circle */}
        <Animated.View style={[s.cGlow, { opacity: Animated.multiply(cardOp, pulse) }]} />

        {/* Iridescent arcs rotating around circle */}
        <Animated.View style={[s.cArc1, { transform: [{ rotate: spin1 }], opacity: cardOp }]} />
        <Animated.View style={[s.cArc2, { transform: [{ rotate: spin2 }], opacity: cardOp }]} />

        {/* The circle itself with glass overlay when active */}
        <View style={[s.circle, focused && s.circleActive]}>
          {/* Glass layer inside circle */}
          <Animated.View style={[s.circleGlass, { opacity: cardOp }]}>
            <View style={s.circleSpec} />
          </Animated.View>
          <Text style={s.centerIcon}>{icon}</Text>
        </View>

      </View>
    );
  }

  // ── Regular tabs ───────────────────────────────────────────────────────────
  return (
    <View style={s.tOuter}>

      {/*
        Glass card — absolutely fills tOuter.
        Rounded rect like iOS liquid glass.
        overflow:hidden clips the specular highlight to the card shape.
      */}
      <Animated.View
        style={[
          s.glassCard,
          // backdropFilter: web-only frosted glass — RN Web passes CSS through
          { backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' },
          { opacity: cardOp },
        ]}
      >
        {/* Top specular — bright horizontal band at top edge */}
        <View style={s.specTop} />
        {/* Very bright top-edge line (like light on glass rim) */}
        <View style={s.specLine} />
        {/* Bottom subtle reflection */}
        <View style={s.specBottom} />
      </Animated.View>

      {/* Iridescent arc rotating around card perimeter */}
      <Animated.View style={[s.cardArc1, { transform: [{ rotate: spin1 }], opacity: cardOp }]} />
      <Animated.View style={[s.cardArc2, { transform: [{ rotate: spin2 }], opacity: cardOp }]} />

      {/* Icon above the glass card */}
      <Text style={[s.tabIcon, focused && s.tabIconFocused]}>{icon}</Text>

      {/* Tiny dot indicator */}
      {focused && <View style={s.dot} />}

    </View>
  );
}

function MainTabs() {
  const insets    = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 0);
  const screens   = { Games: GamesScreen, VerMillion: VerMillionScreen, Profile: ProfileScreen };

  return (
    <Tab.Navigator
      initialRouteName="VerMillion"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, {
          height: 62 + safeBottom,
          paddingBottom: Math.max(14, safeBottom + 6),
        }],
        tabBarActiveTintColor:   '#C0392B',
        tabBarInactiveTintColor: '#444',
      }}
    >
      {TABS.map((tab, idx) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={screens[tab.name]}
          options={{
            tabBarLabel:      tab.label,
            tabBarLabelStyle: [styles.tabLabel, tab.isCenter && { marginTop: 8 }],
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} focused={focused} isCenter={tab.isCenter} tabIndex={idx} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function getActiveRouteName(state) {
  if (!state) return null;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
}

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const prevRouteRef = useRef(null);

  useEffect(() => {
    if (user?.id) initTelemetry(user.id);
    else teardownTelemetry();
  }, [user?.id]);

  const handleStateChange = useCallback((state) => {
    const current = getActiveRouteName(state);
    if (current && current !== prevRouteRef.current) {
      prevRouteRef.current = current;
      onScreenFocus(current);
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  const authInitial = getAuthLandingRoute(profile);

  return (
    <NavigationContainer theme={AppTheme} onStateChange={handleStateChange}>
      <Stack.Navigator
        key={user ? 'auth' : 'guest'}
        initialRouteName={user ? authInitial : 'Splash'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {user ? (
          <>
            <Stack.Screen name="MainTabs"           component={MainTabs} />
            <Stack.Screen name="CompleteProfile"    component={CompleteProfileScreen} />
            <Stack.Screen name="AvatarAppearance"   component={AvatarAppearanceScreen} />
            <Stack.Screen name="AvatarTone"         component={AvatarToneScreen} />
            <Stack.Screen name="AvatarIntro"        component={AvatarIntroScreen} />
            <Stack.Screen name="AvatarReveal"       component={AvatarRevealScreen} />
            <Stack.Screen name="RegulationsConsent" component={RegulationsConsentScreen} />
            <Stack.Screen name="Subscription"       component={SubscriptionScreen} />
            <Stack.Screen name="ModelDownload"      component={ModelDownloadScreen} />
            <Stack.Screen name="Home"               component={HomeScreen} />
            <Stack.Screen name="DailyQuestions"     component={DailyQuestionsScreen} />
            <Stack.Screen name="OnboardingChat"     component={OnboardingChatScreen} />
            <Stack.Screen name="DailyCoaching"      component={DailyCoachingScreen} />
            <Stack.Screen name="ProfileReveal"      component={ProfileRevealScreen} />
            <Stack.Screen name="Settings"           component={SettingsScreen} />
            <Stack.Screen name="Regulations"        component={RegulationsScreen} />
            <Stack.Screen name="AvatarGallery"      component={AvatarGalleryScreen} />
            <Stack.Screen name="GhostPlay"          component={GhostPlayScreen} />
            <Stack.Screen name="Day30Celebration"   component={Day30CelebrationScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Splash"   component={SplashScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="Welcome"  component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login"    component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Liquid-glass tab styles ──────────────────────────────────────────────────

const CARD_W  = 52;
const CARD_H  = 38;
const CARD_R  = 14;    // border radius of glass card

const s = StyleSheet.create({

  // ── Regular tab wrapper ──────────────────────────────────────────────────
  tOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 46,
    paddingTop: 2,
  },

  // Glass card — fills tOuter area with rounded corners
  glassCard: {
    position: 'absolute',
    top:  (46 - CARD_H) / 2,
    left: (58 - CARD_W) / 2,
    width:        CARD_W,
    height:       CARD_H,
    borderRadius: CARD_R,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 0.5,
    borderColor:  'rgba(255,255,255,0.40)',
    overflow: 'hidden',
    // subtle inner shadow to add depth
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },

  // Top ~40% of card: bright white band (simulates light on glass)
  specTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: CARD_H * 0.42,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderTopLeftRadius:  CARD_R,
    borderTopRightRadius: CARD_R,
  },

  // Very thin bright line at the very top rim — the "glint"
  specLine: {
    position: 'absolute',
    top: 0,
    left: CARD_W * 0.15,
    right: CARD_W * 0.15,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 0.5,
  },

  // Subtle bottom reflection (like light bouncing off a surface below)
  specBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_H * 0.18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomLeftRadius:  CARD_R,
    borderBottomRightRadius: CARD_R,
  },

  // Iridescent arcs around the card perimeter
  // Slightly larger than the card, same border-radius
  cardArc1: {
    position: 'absolute',
    top:  (46 - CARD_H - 6) / 2,
    left: (58 - CARD_W - 6) / 2,
    width:        CARD_W + 6,
    height:       CARD_H + 6,
    borderRadius: CARD_R + 3,
    borderWidth: 1.5,
    borderColor:       'transparent',
    borderTopColor:    'rgba(255,190,220,0.85)',  // pink
    borderRightColor:  'rgba(190,200,255,0.70)',  // lavender
  },
  cardArc2: {
    position: 'absolute',
    top:  (46 - CARD_H - 2) / 2,
    left: (58 - CARD_W - 2) / 2,
    width:        CARD_W + 2,
    height:       CARD_H + 2,
    borderRadius: CARD_R + 1,
    borderWidth: 1,
    borderColor:       'transparent',
    borderBottomColor: 'rgba(140,230,255,0.75)',  // cyan
    borderLeftColor:   'rgba(180,255,200,0.65)',  // mint
  },

  tabIcon:       { fontSize: 22, color: '#444', zIndex: 1 },
  tabIconFocused:{ color: '#C0392B', zIndex: 1 },

  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#C0392B',
    marginTop: 2,
    zIndex: 1,
  },

  // ── Center button ─────────────────────────────────────────────────────────
  cOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    width: 80,
    height: 80,
  },

  cGlow: {
    position: 'absolute',
    width: 66, height: 66, borderRadius: 33,
    top: 7, left: 7,
    backgroundColor: '#C0392B',
  },

  // Outer arc (pink→lavender)
  cArc1: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    top: 4, left: 4,
    borderWidth: 1.5,
    borderColor:       'transparent',
    borderTopColor:    'rgba(255,190,220,0.85)',
    borderRightColor:  'rgba(190,200,255,0.70)',
  },
  // Inner arc (cyan→mint)
  cArc2: {
    position: 'absolute',
    width: 58, height: 58, borderRadius: 29,
    top: 11, left: 11,
    borderWidth: 1,
    borderColor:       'transparent',
    borderBottomColor: 'rgba(140,230,255,0.75)',
    borderLeftColor:   'rgba(180,255,200,0.65)',
  },

  circle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0F0F0F',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  circleActive: {
    backgroundColor: '#C0392B',
    shadowOpacity: 0.6,
  },

  // Frosted glass overlay inside circle when active
  circleGlass: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 27,
  },
  circleSpec: {
    position: 'absolute',
    top: 3, left: 6,
    width: 22, height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.30)',
    transform: [{ rotate: '-30deg' }],
  },

  centerIcon: { fontSize: 24, zIndex: 1 },
});

// ─── App-level styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: '#0F0F0F',
    borderTopWidth: 0,
    height: 76,
    paddingBottom: 14,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
