import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorPalette } from './colors';

export type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  scheme: ResolvedScheme;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
}

const STORAGE_KEY = 'sc_theme_mode';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 'light' | 'dark' | null — the OS-level preference, used only when mode is 'system'.
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  // Hydrate the saved preference once on mount. Defaults to 'system' until this
  // resolves — a brief, one-time flash if the user had explicitly chosen
  // light/dark against a differing OS setting, same tradeoff most apps make
  // rather than blocking the first paint on AsyncStorage.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const scheme: ResolvedScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, scheme, colors, setMode }),
    [mode, scheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/** The live, switchable theme — `colors` re-resolves whenever the mode or the
 * OS scheme changes, so a component using it re-renders with the new palette
 * immediately (no app restart required). Every screen's styles must be built
 * from this (inside the component, via useMemo) rather than the static
 * `Colors` export, or they won't react to the switch. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
