import { palettes, type Palette, type ThemeMode } from '@/styles/colors';
import { makeLayout, type Layout } from '@/styles/layout';
import { makePicker, type Picker } from '@/styles/picker';
import { makeTypography, type Typography } from '@/styles/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const THEME_MODE_KEY = '@quietrep/themeMode';
const DEFAULT_MODE: ThemeMode = 'dark';

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  // The resolved style objects for the active mode. Consumers read these instead of the
  // former static @/styles imports, so every screen repaints when the mode toggles.
  colors: Palette;
  layout: Layout;
  typography: Typography;
  picker: Picker;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Holds the active theme mode, persists the choice, and exposes the resolved colour +
 * style objects. This is the single reactive source that replaces static colour imports:
 * toggling the mode re-renders every useTheme() consumer, so the whole app switches at once.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  // Hydrate the persisted mode once on cold launch. useEffect (not useFocusEffect): a
  // provider has no navigation focus lifecycle, and this must run exactly once at startup.
  useEffect(() => {
    async function hydrateThemeMode() {
      const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      if (storedMode === 'dark' || storedMode === 'light') {
        setModeState(storedMode);
      }
    }
    hydrateThemeMode();
  }, []);

  function setMode(nextMode: ThemeMode) {
    // In-memory state is the source of truth for the UI; persist is fire-and-forget.
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
  }

  // `palettes` is a module-level constant, so `palettes.dark`/`palettes.light` are each a single
  // fixed object reference for the app's lifetime. Indexing (not cloning) means `colors` keeps the
  // SAME reference across re-renders while `mode` is unchanged, and only becomes a different
  // reference when `mode` flips. That lets the useMemo shallow compare (`Object.is` on [colors])
  // skip rebuilding the stylesheets every render and rebuild them only on an actual theme toggle.
  const colors = palettes[mode];
  const layout = useMemo(() => makeLayout(colors), [colors]);
  const typography = useMemo(() => makeTypography(colors), [colors]);
  const picker = useMemo(() => makePicker(colors), [colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, colors, layout, typography, picker }),
    [mode, colors, layout, typography, picker],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
