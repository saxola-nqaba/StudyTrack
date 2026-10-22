import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './MainNavigator';
import { useTheme } from '../theme/ThemeContext';

export default function AppNavigator() {
  const { colours, isDark } = useTheme();

  // Tell React Navigation our colours too, so screen transitions
  // don't flash white behind the cards in dark mode.
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

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <MainNavigator />
    </NavigationContainer>
  );
}
