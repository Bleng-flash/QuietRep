import WorkoutSession from '@/components/session/WorkoutSession';
import { useActiveSession } from '@/context/ActiveSessionContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function SessionScreen() {
  const { activeSession } = useActiveSession();
  const router = useRouter();

  // useEffect (not useFocusEffect) — fires on mount and whenever activeSession becomes null
  // (after finish or discard), not just on navigation focus. This is the back-navigation guard.
  useEffect(() => {
    if (activeSession === null) router.back();
  }, [activeSession]);

  // Avoids a flash of WorkoutSession rendering while the back-navigation above is pending.
  if (!activeSession) return null;

  return <WorkoutSession />;
}
