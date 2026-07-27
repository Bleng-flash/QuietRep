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
  /** False until the stored unit has been read on cold launch. Consumed by SplashGate, which
   *  holds the native splash until every provider has hydrated — otherwise the first frames
   *  render against DEFAULT_UNIT and then visibly snap to the stored value. */
  hasHydrated: boolean;
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
  const [hasHydrated, setHasHydrated] = useState(false);

  // Hydrate the persisted unit once on cold launch. useEffect (not useFocusEffect): a
  // provider has no navigation focus lifecycle, and this must run exactly once at startup.
  useEffect(() => {
    async function hydrateUnit() {
      try {
        const storedUnit = await AsyncStorage.getItem(WEIGHT_UNIT_KEY);
        // Validate against the union before trusting the stored string.
        if (storedUnit === 'kg' || storedUnit === 'lbs') {
          setUnitState(storedUnit);
        }
      } finally {
        // finally, not the end of the try block: a storage read that throws must still release
        // the splash, or the app hangs on it forever. Falling back to DEFAULT_UNIT is the
        // correct outcome in that case.
        setHasHydrated(true);
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

  // This memo is now load-bearing. hasHydrated is the second piece of state, so this provider can re-render
  // with `unit` unchanged (and vice versa); the memo is what stops every useUnit() consumer
  // re-rendering on the unrelated one.
  const value = useMemo<UnitContextValue>(
    () => ({ unit, setUnit, hasHydrated }),
    [unit, setUnit, hasHydrated],
  );

  return <UnitContext.Provider value={value}>{children}</UnitContext.Provider>;
}

export function useUnit(): UnitContextValue {
  const context = useContext(UnitContext);
  if (context === null) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
}
