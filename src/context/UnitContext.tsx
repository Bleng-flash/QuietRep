import type { WeightUnit } from '@/types';
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

const WEIGHT_UNIT_KEY = '@quietrep/weightUnit';
const DEFAULT_UNIT: WeightUnit = 'kg';

interface UnitContextValue {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
}

const UnitContext = createContext<UnitContextValue | null>(null);

/**
 * Holds the user's weight unit preference and persists it. Like ThemeContext, this exists
 * because AsyncStorage has no subscriptions: holding the unit in React state is what makes
 * every consumer repaint when the Profile toggle flips.
 *
 * The setting is the unit NEW loads are logged in. It is not retroactive — each session
 * records the unit it was logged in, and past loads are converted for display.
 */
export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>(DEFAULT_UNIT);

  // Hydrate the persisted unit once on cold launch. useEffect (not useFocusEffect): a
  // provider has no navigation focus lifecycle, and this must run exactly once at startup.
  useEffect(() => {
    async function hydrateUnit() {
      const storedUnit = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
      // Validate against the union before trusting the stored string.
      if (storedUnit === 'kg' || storedUnit === 'lbs') {
        setUnitState(storedUnit);
      }
    }
    hydrateUnit();
  }, []);

  // useCallback so this has a stable identity and can be listed honestly in the value memo's
  // deps below. Closes over nothing but setUnitState (a stable setter), hence [].
  const setUnit = useCallback((nextUnit: WeightUnit) => {
    // In-memory state is the source of truth for the UI; persist is fire-and-forget.
    setUnitState(nextUnit);
    AsyncStorage.setItem(WEIGHT_UNIT_KEY, nextUnit);
  }, []);

  // Like ThemeContext's, this memo skips no work today — `unit` changing is this provider's
  // only re-render trigger, so every render invalidates it anyway. Kept for the same reason:
  // it becomes load-bearing the moment a second piece of state lands here, and an unmemoised
  // value re-renders every useUnit() consumer on any unrelated render.
  // See "Context value memoisation" in CLAUDE.md.
  const value = useMemo<UnitContextValue>(() => ({ unit, setUnit }), [unit, setUnit]);

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit(): UnitContextValue {
  const context = useContext(UnitContext);
  if (context === null) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
