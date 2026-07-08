import WorkoutSession from '@/components/session/WorkoutSession';
import { useActiveSession } from '@/context/ActiveSessionContext';

export default function SessionScreen() {
  const { activeSession } = useActiveSession();

  // Renders nothing while activeSession is null — covers the brief window between
  // router.push('/session') and React committing the startSession state update,
  // and also covers hot-reload in dev where Expo Router restores /session with no session.
  // WorkoutSession owns back-navigation explicitly (router.back in handleFinish/handleDiscard).
  if (!activeSession) return null;

  return <WorkoutSession />;
}
