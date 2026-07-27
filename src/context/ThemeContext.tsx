import { palettes, type Palette, type ThemeMode } from '@/styles/colors';
import { makeLayout, type Layout } from '@/styles/layout';
import { makePicker, type Picker } from '@/styles/picker';
import { makeTypography, type Typography } from '@/styles/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
  /** False until the stored mode has been read on cold launch. Consumed by SplashGate, which
   *  holds the native splash until every provider has hydrated. Without it a Light-mode user
   *  sees the first frames painted in DEFAULT_MODE and then snap — a visible dark flash. */
  hasHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Holds the active theme mode, persists the choice, and exposes the resolved colour +
 * style objects. This is the single reactive source that replaces static colour imports:
 * toggling the mode re-renders every useTheme() consumer, so the whole app switches at once.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate the persisted mode once on cold launch. useEffect (not useFocusEffect): a
  // provider has no navigation focus lifecycle, and this must run exactly once at startup.
  useEffect(() => {
    async function hydrateThemeMode() {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (storedMode === 'dark' || storedMode === 'light') {
          setModeState(storedMode);
        }
      } finally {
        // finally, not the end of the try block: a storage read that throws must still release
        // the splash, or the app hangs on it forever. Falling back to DEFAULT_MODE is the
        // correct outcome in that case.
        setHasHydrated(true);
      }
    }
    hydrateThemeMode();
  }, []);

  // useCallback so this has a stable identity and can be listed honestly in the value memo's
  // deps below. Closes over nothing but setModeState (a stable setter), hence [].
  const setMode = useCallback((nextMode: ThemeMode) => {
    // In-memory state is the source of truth for the UI; persist is fire-and-forget.
    setModeState(nextMode);
    AsyncStorage.setItem(THEME_MODE_KEY, nextMode);
  }, []);

  // `palettes` is a module-level constant, so `palettes.dark`/`palettes.light` are each a single
  // fixed object reference for the app's lifetime. Indexing (not cloning) means `colors` keeps the
  // SAME reference across re-renders while `mode` is unchanged, and only becomes a different
  // reference when `mode` flips. That reference stability is what the memos below key off.
  //
  // These memos are now load-bearing — due to the hydration flag below. This
  // provider can now re-render with `mode` unchanged (hasHydrated flipping) and vice versa, so
  // [colors] no longer invalidates on every render: the memos genuinely skip rebuilding three
  // StyleSheets, and the value memo stops every useTheme() consumer re-rendering for free.
  const colors = palettes[mode];
  const layout = useMemo(() => makeLayout(colors), [colors]);
  const typography = useMemo(() => makeTypography(colors), [colors]);
  const picker = useMemo(() => makePicker(colors), [colors]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, colors, layout, typography, picker, hasHydrated }),
    [mode, setMode, colors, layout, typography, picker, hasHydrated],
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
