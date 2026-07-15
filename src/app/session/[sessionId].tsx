import SessionDetail from '@/components/history/SessionDetail';
import { useLocalSearchParams } from 'expo-router';

// Read-only detail for a past (finished) session. Root-stack route so it's reachable from History
// now and Home later without a cross-navigator push. Coexists with the live-session route at
// /session — this is /session/[sessionId]. Thin screen: params in, fat component renders.
export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <SessionDetail sessionId={sessionId} />;
}
