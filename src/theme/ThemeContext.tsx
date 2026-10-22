import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette, lightColours, darkColours } from '../constants/colours';
import { fetchProfile } from '../services/profile';

const STORAGE_KEY = 'studytrack.darkMode';

interface ThemeContextValue {
  colours: Palette;
  isDark: boolean;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colours: lightColours,
  isDark: false,
  setDarkMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  // On launch: read the saved choice from the phone (fast, no flash).
  // If nothing is saved on this phone yet, fall back to the Firestore profile.
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsDark(stored === 'true');
        } else {
          const profile = await fetchProfile();
          if (profile?.darkMode) setIsDark(true);
        }
      } catch {
        // Ignore — default to light mode
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const setDarkMode = (value: boolean) => {
    setIsDark(value);
    AsyncStorage.setItem(STORAGE_KEY, String(value)).catch(() => {});
  };

  const value = useMemo(
    () => ({ colours: isDark ? darkColours : lightColours, isDark, setDarkMode }),
    [isDark]
  );

  // Render nothing for the split second it takes to read the setting,
  // so the app never flashes light before switching to dark.
  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
