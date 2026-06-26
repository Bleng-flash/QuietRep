import {
  clearActiveSession,
  finishSession,
  getActiveSession,
  setActiveSession,
} from '@/storage';
import type { EditableSessionExercise } from '@/types';
import { hydrateSessionExercises, toCanonicalSession } from '@/utils/session';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { v4 as uuid } from 'uuid';

/** The in-memory working buffer for a live session. Holds editable view-model exercises
 *  (with localKey + target hints) — never written to storage directly; always stripped
 *  to canonical form first via toCanonicalSession before any AsyncStorage write. */
export interface SessionBuffer {
  id: string;
  name: string;
  startedAt: string;
  exercises: EditableSessionExercise[];
}

interface ActiveSessionContextValue {
  activeSession: SessionBuffer | null;
  /** Starts a new session. Rejects with an Alert if one is already live.
   *  Awaiting ensures the session is persisted before the caller navigates to /session. */
  startSession: (name: string, exercises: EditableSessionExercise[]) => Promise<void>;
  /** Applies an updater to session state immediately; debounces the AsyncStorage write
   *  so rapid edits (e.g. typing in set inputs) don't hammer storage. */
  updateActiveSession: (updater: (prev: SessionBuffer) => SessionBuffer) => void;
  // Stamps finishedAt, writes to history, and clears the active buffer
  finishActiveSession: () => Promise<void>;
  // Clears the active buffer without writing to history
  discardActiveSession: () => Promise<void>;
}

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  // the name setActiveSession is already used in src/storage/sessions.ts
  const [activeSession, setSessionBuffer] = useState<SessionBuffer | null>(null);

  // Ref always mirrors the latest state — used by the debounced persist callback so it
  // always writes the freshest version even if the timeout was scheduled a render ago.
  const latestSessionRef = useRef<SessionBuffer | null>(null);
  // ReturnType<typeof setTimeout> derives the timer ID type from setTimeout itself (a global) — no import needed
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latestSessionRef.current = activeSession;
  }, [activeSession]);

  // useEffect (not useFocusEffect) — ActiveSessionProvider is not a navigation screen and
  // has no focus lifecycle. Hydration must run exactly once at mount.
  useEffect(() => {
    async function hydrate() {
      const stored = await getActiveSession();
      if (stored) {
        setSessionBuffer({
          id: stored.id,
          name: stored.name,
          startedAt: stored.startedAt,
          // Re-attach fresh localKeys — they are stripped before storage writes, so they
          // are never present in the stored data and must be regenerated on hydration.
          exercises: hydrateSessionExercises(stored.exercises),
        });
      }
    }
    hydrate();
  }, []);

  /** Strips view-model fields and writes the canonical session to AsyncStorage. */
  async function persistSessionBuffer(buffer: SessionBuffer): Promise<void> {
    const canonicalSession = toCanonicalSession(
      buffer.id,
      buffer.name,
      buffer.startedAt,
      buffer.exercises,
    );
    await setActiveSession(canonicalSession);
  }

  async function startSession(name: string, exercises: EditableSessionExercise[]): Promise<void> {
    if (activeSession !== null) {
      Alert.alert('Session in progress', 'Finish or discard the current session first.');
      return;
    }
    const newSession: SessionBuffer = {
      id: uuid(),
      name,
      startedAt: new Date().toISOString(),
      exercises,
    };
    setSessionBuffer(newSession);
    // Await the persist so the caller can navigate to /session knowing the buffer is saved —
    // important for crash-recovery: if the user immediately kills the app after starting.
    await persistSessionBuffer(newSession);
  }

  function updateActiveSession(updater: (prev: SessionBuffer) => SessionBuffer): void {
    setSessionBuffer((prev) => (prev ? updater(prev) : null));
    // Debounce the storage write — state is updated synchronously above; the ref is kept
    // in sync via a useEffect so by the time the 500 ms timeout fires it holds the latest value.
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (latestSessionRef.current) {
        persistSessionBuffer(latestSessionRef.current);
      }
    }, 500);
  }

  async function finishActiveSession(): Promise<void> {
    if (!activeSession) return;
    // Cancel any pending debounce — we build the canonical session from the current state
    // directly below, so the debounced write would be redundant and could race.
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    const canonicalSession = toCanonicalSession(
      activeSession.id,
      activeSession.name,
      activeSession.startedAt,
      activeSession.exercises,
    );
    await finishSession(canonicalSession);
    setSessionBuffer(null);
  }

  async function discardActiveSession(): Promise<void> {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await clearActiveSession();
    setSessionBuffer(null);
  }

  // .Provider is a built-in React component that comes with every context object.
  // value= is what gets broadcast: any useActiveSession() caller inside this tree receives
  // this exact object and re-renders automatically when any field in it changes.
  // {children} (the children here is the <Stack>) renders the rest of the app unchanged — the provider adds no visible UI,
  // it just wraps the tree in a context boundary so descendants can subscribe.
  return (
    <ActiveSessionContext.Provider
      value={{
        activeSession,
        startSession,
        updateActiveSession,
        finishActiveSession,
        discardActiveSession,
      }}
    >
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession(): ActiveSessionContextValue {
  const value = useContext(ActiveSessionContext);
  if (!value) throw new Error('useActiveSession must be called within ActiveSessionProvider');
  return value;
}
