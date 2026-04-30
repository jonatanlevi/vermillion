import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { isRegistrationComplete } from '../utils/registrationGate';

import SplashScreen           from '../screens/onboarding/SplashScreen';
import WelcomeScreen          from '../screens/onboarding/WelcomeScreen';
import RegisterScreen         from '../screens/onboarding/RegisterScreen';
import LoginScreen            from '../screens/onboarding/LoginScreen';
import CompleteProfileScreen  from '../screens/onboarding/CompleteProfileScreen';
import AvatarAppearanceScreen from '../screens/onboarding/AvatarAppearanceScreen';
import AvatarToneScreen       from '../screens/onboarding/AvatarToneScreen';
import AvatarIntroScreen      from '../screens/onboarding/AvatarIntroScreen';
import AvatarRevealScreen     from '../screens/onboarding/AvatarRevealScreen';
import SubscriptionScreen     from '../screens/onboarding/SubscriptionScreen';
import ModelDownloadScreen    from '../screens/onboarding/ModelDownloadScreen';

import GamesScreen      from '../screens/games/GamesScreen';
import VerMillionScreen from '../screens/vermillion/VerMillionScreen';
import ProfileScreen    from '../screens/profile/ProfileScreen';

import DailyQuestionsScreen from '../screens/main/DailyQuestionsScreen';
import DailyCoachingScreen  from '../screens/main/DailyCoachingScreen';
import ProfileRevealScreen  from '../screens/main/ProfileRevealScreen';
import SettingsScreen       from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TABS = [
  { name: 'Games',      label: 'משחקים',     icon: '🎮' },
  { name: 'VerMillion', label: 'VerMillion', icon: '🤖', isCenter: true },
  { name: 'Profile',    label: 'פרופיל',     icon: '👤' },
];

function TabIcon({ icon, focused, isCenter }) {
  if (isCenter) {
    return (
      <View style={[styles.centerTab, focused && styles.centerTabActive]}>
        <Text style={styles.centerTabIcon}>{icon}</Text>
      </View>
    );
  }
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function MainTabs() {
  const screens = {
    Games:      GamesScreen,
    VerMillion: VerMillionScreen,
    Profile:    ProfileScreen,
  };

  return (
    <Tab.Navigator
      initialRouteName="VerMillion"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   '#C0392B',
        tabBarInactiveTintColor: '#444',
      }}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={screens[tab.name]}
          options={{
            tabBarLabel: tab.label,
            tabBarLabelStyle: [styles.tabLabel, tab.isCenter && { marginTop: 8 }],
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} focused={focused} isCenter={tab.isCenter} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#C0392B" size="large" />
      </View>
    );
  }

  const authInitial = isRegistrationComplete(profile) ? 'MainTabs' : 'CompleteProfile';

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? 'auth' : 'guest'}
        initialRouteName={user ? authInitial : 'Splash'}
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {user ? (
          <>
            <Stack.Screen name="MainTabs"          component={MainTabs} />
            <Stack.Screen name="CompleteProfile"   component={CompleteProfileScreen} />
            <Stack.Screen name="AvatarAppearance"  component={AvatarAppearanceScreen} />
            <Stack.Screen name="AvatarTone"        component={AvatarToneScreen} />
            <Stack.Screen name="AvatarIntro"       component={AvatarIntroScreen} />
            <Stack.Screen name="AvatarReveal"      component={AvatarRevealScreen} />
            <Stack.Screen name="Subscription"      component={SubscriptionScreen} />
            <Stack.Screen name="ModelDownload"     component={ModelDownloadScreen} />
            <Stack.Screen name="DailyQuestions"    component={DailyQuestionsScreen} />
            <Stack.Screen name="DailyCoaching"     component={DailyCoachingScreen} />
            <Stack.Screen name="ProfileReveal"     component={ProfileRevealScreen} />
            <Stack.Screen name="Settings"          component={SettingsScreen} />
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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: '#0F0F0F',
    borderTopColor: '#1A1A1A',
    borderTopWidth: 1,
    height: 76,
    paddingBottom: 14,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconWrap:      { alignItems: 'center', paddingTop: 2 },
  tabIcon:       { fontSize: 22, color: '#444' },
  tabIconActive: { color: '#C0392B' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C0392B',
    marginTop: 3,
  },
  centerTab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    borderWidth: 3,
    borderColor: '#0F0F0F',
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerTabActive: {
    backgroundColor: '#C0392B',
    shadowOpacity: 0.6,
  },
  centerTabIcon: { fontSize: 24 },
});
