import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/onboarding/SplashScreen';
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import RegisterScreen from '../screens/onboarding/RegisterScreen';
import LoginScreen from '../screens/onboarding/LoginScreen';
import CompleteProfileScreen from '../screens/onboarding/CompleteProfileScreen';
import AvatarAppearanceScreen from '../screens/onboarding/AvatarAppearanceScreen';
import AvatarToneScreen from '../screens/onboarding/AvatarToneScreen';
import AvatarIntroScreen from '../screens/onboarding/AvatarIntroScreen';
import AvatarRevealScreen from '../screens/onboarding/AvatarRevealScreen';

import HomeScreen from '../screens/main/HomeScreen';
import DailyQuestionsScreen from '../screens/main/DailyQuestionsScreen';
import DailyCoachingScreen from '../screens/main/DailyCoachingScreen';
import ProfileRevealScreen from '../screens/main/ProfileRevealScreen';
import ChallengeScreen from '../screens/main/ChallengeScreen';
import LeaderboardScreen from '../screens/main/LeaderboardScreen';
import AICoachScreen from '../screens/main/AICoachScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SubscriptionScreen from '../screens/onboarding/SubscriptionScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',        label: 'בית',      icon: '⌂',  activeIcon: '⌂'  },
  { name: 'Challenge',   label: 'אתגר',     icon: '◎',  activeIcon: '◉'  },
  { name: 'Leaderboard', label: 'דירוג',    icon: '≡',  activeIcon: '≡'  },
  { name: 'AICoach',     label: 'AI',       icon: '◇',  activeIcon: '◆'  },
  { name: 'Profile',     label: 'פרופיל',   icon: '○',  activeIcon: '●'  },
];

function TabIcon({ icon, activeIcon, focused, isChallenge }) {
  if (isChallenge) {
    return (
      <View style={[styles.challengeTab, focused && styles.challengeTabActive]}>
        <Text style={[styles.challengeTabIcon, focused && styles.challengeTabIconActive]}>
          🎯
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
        {focused ? activeIcon : icon}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#C0392B',
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {TABS.map((tab) => {
        const screens = {
          Home: HomeScreen,
          Challenge: ChallengeScreen,
          Leaderboard: LeaderboardScreen,
          AICoach: AICoachScreen,
          Profile: ProfileScreen,
        };
        return (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={screens[tab.name]}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ focused }) => (
                <TabIcon
                  icon={tab.icon}
                  activeIcon={tab.activeIcon}
                  focused={focused}
                  isChallenge={tab.name === 'Challenge'}
                />
              ),
              tabBarLabelStyle: [
                styles.tabLabel,
                tab.name === 'Challenge' && { marginTop: 8 },
              ],
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        <Stack.Screen name="AvatarAppearance" component={AvatarAppearanceScreen} />
        <Stack.Screen name="AvatarTone"       component={AvatarToneScreen} />
        <Stack.Screen name="AvatarIntro"      component={AvatarIntroScreen} />
        <Stack.Screen name="AvatarReveal"     component={AvatarRevealScreen} />
        <Stack.Screen name="Subscription"    component={SubscriptionScreen} />
        <Stack.Screen name="DailyQuestions"  component={DailyQuestionsScreen} />
        <Stack.Screen name="DailyCoaching"   component={DailyCoachingScreen} />
        <Stack.Screen name="ProfileReveal"   component={ProfileRevealScreen} />
        <Stack.Screen name="MainTabs"        component={MainTabs} />
        <Stack.Screen name="Settings"        component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
  iconWrap: { alignItems: 'center', paddingTop: 2 },
  tabIcon: { fontSize: 20, color: '#444' },
  tabIconActive: { color: '#C0392B' },
  activeDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#C0392B',
    marginTop: 3,
  },
  // Challenge tab — elevated pill
  challengeTab: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#1A1A1A',
    alignItems: 'center', justifyContent: 'center',
    marginTop: -20,
    borderWidth: 3,
    borderColor: '#0F0F0F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  challengeTabActive: {
    backgroundColor: '#C0392B',
    borderColor: '#0F0F0F',
  },
  challengeTabIcon: { fontSize: 22 },
  challengeTabIconActive: {},
});
