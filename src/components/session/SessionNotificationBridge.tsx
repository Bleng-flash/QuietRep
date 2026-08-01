import { useActiveSession, type SessionBuffer } from '@/context/ActiveSessionContext';
import {
  addActiveSessionNotificationTapListener,
  dismissActiveSessionNotification,
  postActiveSessionNotification,
} from '@/notifications/sessionNotification';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * Null-rendering controller owning the ongoing-session notification end to end: it keeps the
 * notification in sync with AppState, and routes a tap on it back into the live session.
 * Mounted inside ActiveSessionProvider (see src/app/_layout.tsx) as a plain context consumer,
 * the same way ResumeSessionBanner is.
 *
 * Post and dismiss are deliberately ASYMMETRIC, and that asymmetry is what erases the hydration
 * race. On cold launch ActiveSessionProvider reads the stored buffer from AsyncStorage
 * asynchronously, so activeSession is null for the first frames even when a session exists — if
 * dismissal had to know whether a session was live, it would read the wrong answer and leave a
 * stale notification up. So:
 *
 *   - dismiss is UNCONDITIONAL: at mount, and on every transition into `active`. The question
 *     "is a session live?" is simply never asked.
 *   - post is CONDITIONAL: only on a transition into `background`, and only with a live session.
 *     Backgrounding is always long after hydration has settled, so the answer is trustworthy.
 *
 * finishActiveSession / discardActiveSession deliberately do NOT dismiss: both are only reachable
 * from the foreground, where the `active` transition has already cleared the notification.
 */
/** The live-session route. Compared against usePathname() to avoid pushing a duplicate. */
const SESSION_PATHNAME = '/session';

export default function SessionNotificationBridge() {
  const { activeSession } = useActiveSession();
  const router = useRouter();
  const pathname = usePathname();

  // Stale-closure guards, the latestSessionRef pattern from ActiveSessionContext applied locally.
  // Both listeners below are registered once, so a closure over `activeSession` or `pathname` would
  // be frozen at the value from the render that registered it. A ref is a stable container: the
  // listener captures the container, and the effects below keep .current current.
  // (The provider's own ref stays private — this is a separate, independently-synced one.)
  //
  // The pathname could not simply be a dep of the tap effect: that would tear down and re-register
  // the notification subscription on every navigation in the app, risking a tap arriving in the gap.
  const latestSessionRef = useRef<SessionBuffer | null>(null);
  const currentPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    latestSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    currentPathnameRef.current = pathname;
  }, [pathname]);

  // useEffect (not useFocusEffect) — a bridge component is not a navigation screen and has no
  // focus lifecycle. The subscription must be registered exactly once, for the app's whole life.
  useEffect(() => {
    // Clear anything left over from a previous process: a session force-killed mid-workout leaves
    // its sticky notification in the tray, and this is the only chance to take it down.
    dismissActiveSessionNotification();

    function handleAppStateChange(nextAppState: AppStateStatus): void {
      if (nextAppState === 'active') {
        dismissActiveSessionNotification();
        return;
      }
      if (nextAppState === 'background' && latestSessionRef.current) {
        const { name, startedAt } = latestSessionRef.current;
        postActiveSessionNotification({ name, startedAt });
      }
      // `inactive` is deliberately ignored. It fires for transient interruptions — pulling down
      // the notification shade, the app switcher, a permission dialog, an incoming call — where
      // the user has not left the app. Acting on it would post while the app is still on screen.
      // iOS-only in practice: React Native never emits `inactive` on Android.
    }

    // registration: "run my handler whenever the app state changes."
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Warm tap: the notification was tapped while the process was alive, so jump straight to the
  // live session rather than leaving the user on whichever screen they had backgrounded from.
  // Separate effect from the AppState one above — unrelated concerns, and keeping them apart means
  // neither re-registers when the other changes.
  //
  // Backgrounding *from* the session screen already restores to /session for free (the React tree
  // and current route survive untouched), so this exists for the case where the session was
  // minimised and another tab was open at the time.
  useEffect(() => {
    return addActiveSessionNotificationTapListener(() => {
      // Expected to be redundant, since a cold-launch response never reaches this listener. But if
      // that assumption is ever wrong, this degrades to the cold fallback (Home, with the resume
      // banner) instead of navigating to /session while activeSession is still null — which
      // src/app/session.tsx renders as a blank screen.
      if (!latestSessionRef.current) return;
      // Already on the session screen — this is the case where the app simply restored to the route
      // it was backgrounded from. Pushing again would stack a duplicate that needs two back presses.
      if (currentPathnameRef.current === SESSION_PATHNAME) return;
      // push, not navigate: every other navigation in this app uses push, and ResumeSessionBanner
      // proves push('/session') works from a tab. navigate resolves to a React Navigation NAVIGATE
      // action, which returns to an existing route of that name rather than pushing, and was
      // observed doing nothing at all from a tab. The pathname guard above is what push needs to
      // stay duplicate-free, which was the only reason navigate looked attractive.
      router.push(SESSION_PATHNAME);
    });
  }, [router]);

  return null;
}
