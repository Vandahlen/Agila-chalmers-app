/**
 * theme/ThemeContext.tsx
 *
 * Provides scheme-dependent design tokens (see getTheme in theme.ts)
 * to the whole module via useColorScheme(). Matches the kårapp
 * host's own approach: dark mode always follows the device setting,
 * there is no in-app override.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { getTheme, ThemeTokens } from './theme';

const ThemeContext = createContext<ThemeTokens>(getTheme(false));

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const isDark = useColorScheme() === 'dark';
  const value = useMemo(() => getTheme(isDark), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
