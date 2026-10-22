import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/useAuthStore';
import { onAuthChange } from '../services/auth';

export default function AppNavigator() {
  const { colours, isDark } = useTheme();
  const { user, isLoading, setUser, setIsLoading } = useAuthStore();

  // Firebase tells us who is signed in — on launch (restored from the phone)
  // and every time someone signs in or out.
  useEffect(() => {
    const unsubscribe = onAuthChange((u) => {
      setUser(u);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [setUser, setIsLoading]);

  // Give React Navigation our colours so transitions don't flash white in dark mode
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colours.accent,
      background: colours.background,
      card: colours.card,
      text: colours.text,
      border: colours.grey3,
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colours.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colours.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Signed in → the app. Signed out → Login / Register / Forgot password. */}
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
