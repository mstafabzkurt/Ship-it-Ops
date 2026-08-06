// ─────────────────────────────────────────────────────────────────────────────
// ThemeContext — aktif temayı yönetir ve tüm bileşenlere yayar.
//
// Kullanım:
//   const { theme, themeId, setThemeId } = useTheme();
//
// ThemeProvider, app/_layout.tsx içinde ReputationProvider'dan önce
// yerleştirilmelidir.
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, cyberpunkTheme } from '../theme/themes';
import type { Theme } from '../theme/themes';

const THEME_STORAGE_KEY = '@shipit_theme_id';

// ── Context shape ─────────────────────────────────────────────────────────────
interface ThemeContextValue {
  /** Full theme object — colors, geometry, effects */
  theme: Theme;
  /** ID string of the currently active theme */
  themeId: Theme['id'];
  /** Switch to a different theme and persist the choice */
  setThemeId: (id: Theme['id']) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to 'default' theme. The 'cyberpunk' theme must be purchased in the
  // store and then equipped. Persisted value loaded from AsyncStorage on mount
  // will override this (so an equipped theme survives restarts).
  const [themeId, setThemeIdState] = useState<Theme['id']>('default');

  // Load persisted preference on startup
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored && stored in THEMES) {
          setThemeIdState(stored as Theme['id']);
        }
      } catch (_) {
        // Silently fall back to default
      }
    };
    load();
  }, []);

  const setThemeId = async (id: Theme['id']) => {
    setThemeIdState(id);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, id);
    } catch (e) {
      console.error('[ThemeContext] Tema kaydedilemedi:', e);
    }
  };

  const theme = THEMES[themeId] ?? cyberpunkTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('[ThemeContext] useTheme must be used inside <ThemeProvider>');
  return ctx;
}
