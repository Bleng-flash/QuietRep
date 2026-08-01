import { formatTimeOfDay } from '@/utils/datetime';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * The only module in the app that imports expo-notifications, mirroring how src/storage is the
 * only place that touches AsyncStorage. Everything here is a silent no-op on failure: a denied
 * permission, a revoked permission, or a platform that cannot post must never crash or alert.
 */

/** Fixed identifier, so repeated posts REPLACE rather than stack and dismissal by id is
 *  deterministic. On Android this string becomes the notification's *tag* while the numeric id is
 *  a library-wide constant, so the replace/cancel pairing also holds across a process restart —
 *  which is what lets a stale notification from a killed session be cleared at the next mount. */
const ACTIVE_SESSION_NOTIFICATION_ID = 'quietrep-active-session';

/** Android notification channel. Without it the notification lands in a generic "Miscellaneous"
 *  channel, which the user cannot meaningfully mute or recognise. */
const ACTIVE_SESSION_CHANNEL_ID = 'active-session';
const ACTIVE_SESSION_CHANNEL_NAME = 'Active workout';

/**
 * Module scope, because this is a one-time global registration and the handler must be in place
 * before the first post — which can happen on any backgrounding, with no other reliable hook.
 *
 * Required, despite us only ever posting from the background. expo-notifications routes an
 * incoming notification through this JS handler whenever `ProcessLifecycleOwner` still reports
 * RESUMED, and that owner debounces its pause dispatch by 700ms. React Native's AppState, by
 * contrast, emits `background` immediately on the activity's pause. So our post reliably lands
 * inside that 700ms window, takes the foreground branch, finds no handler, and — per
 * expo-notifications' documented default — is discarded after a 3s timeout. Symptom: the channel
 * gets created (proving the post ran) but no notification ever appears.
 *
 * On Android `shouldPresentAlert` is `shouldShowBanner || shouldShowList`, and that flag gates
 * presentation outright, so at least one must be true. Neither produces a heads-up popup here —
 * that needs channel importance HIGH, and this channel is LOW. Sound and badge stay off: this is
 * an ambient status marker, not an alert.
 *
 * Cost worth knowing: routing through this handler adds a JS round trip (native -> JS -> native)
 * to the post, which is why killing the app immediately after backgrounding can beat the
 * notification to the tray. Accepted — without the handler nothing posts at all.
 *
 * Showing a notification "while the app is running" is only reachable via that race window, since
 * posting is confined to the `background` transition — and a return to `active` dismisses
 * unconditionally, so nothing can linger on screen.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** What the notification describes: the two session fields it renders. Deliberately not
 *  SessionBuffer — keeping this module free of any @/context import leaves it a leaf that depends
 *  only on expo-notifications and a formatter. */
interface ActiveSessionNotificationContent {
  name: string;
  startedAt: string;
}

/**
 * Asks for notification permission if it has not already been granted. Called fire-and-forget from
 * startSession, so the prompt appears at the moment notifications become relevant rather than at
 * app launch. Returns false rather than throwing on any failure or denial.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const currentPermission = await Notifications.getPermissionsAsync();
    if (currentPermission.granted) return true;

    // canAskAgain is Android's shouldShowRequestPermissionRationale, so it tracks DIALOG denials
    // only: once the user has said no to the prompt itself, the OS stops re-showing it and this
    // returns early. It deliberately does NOT cover switching notifications off in app settings,
    // which leaves the flag true — that path re-prompts on the next workout, which is the
    // behaviour we want, since the OS itself only asks once per revocation.
    if (!currentPermission.canAskAgain) return false;

    const requestedPermission = await Notifications.requestPermissionsAsync();
    return requestedPermission.granted;
  } catch (error) {
    logNotificationFailure('ensureNotificationPermission', error);
    return false;
  }
}

/**
 * Posts (or replaces) the ongoing-session notification. Only ever called on a transition into
 * `background` with a live session — see SessionNotificationBridge for why posting is conditional
 * while dismissal is not.
 *
 * The start time is deliberately static: a "started at" stamp stays true for as long as the
 * notification is visible, whereas an elapsed count would freeze at whatever it read when posted.
 */
export async function postActiveSessionNotification({
  name,
  startedAt,
}: ActiveSessionNotificationContent): Promise<void> {
  try {
    await ensureActiveSessionChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: ACTIVE_SESSION_NOTIFICATION_ID,
      content: {
        title: 'Workout in progress',
        body: `${name}  •  Started ${formatTimeOfDay(startedAt)}`,
        // Android only (setOngoing): excluded from "Clear all", so it reads as a live status
        // rather than a one-off alert. Note that since Android 14 it IS individually swipeable.
        // iOS has no equivalent concept and ignores this field — there, the user can dismiss it
        // and it simply returns on the next backgrounding, which is the Android 14 behaviour too.
        sticky: true,
        // iOS counterpart to the Android channel's importance below: `passive` means it lands in
        // Notification Center without lighting the screen or playing a sound. Ignored on Android.
        interruptionLevel: 'passive',
      },
      // channelId belongs on the TRIGGER, not the content. expo-notifications maps this shape to a
      // native ChannelAwareTrigger on Android and to null everywhere else — both deliver
      // immediately, so this one trigger is correct cross-platform.
      trigger: { channelId: ACTIVE_SESSION_CHANNEL_ID },
    });
  } catch (error) {
    // Note a DENIED permission does not land here: Android silently drops the post and iOS
    // resolves without presenting, so neither rejects. What reaches this catch is a missing
    // native module or a native scheduling failure.
    logNotificationFailure('postActiveSessionNotification', error);
  }
}

/**
 * Removes the ongoing-session notification. Called unconditionally — at bridge mount and on every
 * transition into `active` — so it must be a harmless no-op when nothing is posted.
 */
export async function dismissActiveSessionNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(ACTIVE_SESSION_NOTIFICATION_ID);
  } catch (error) {
    logNotificationFailure('dismissActiveSessionNotification', error);
  }
}

/**
 * Subscribes to taps on the ongoing-session notification. Returns an unsubscribe function, so the
 * caller can tear it down the same way an AppState subscription is torn down.
 *
 * Needed because expo-router does NOT deep-link from notifications: a tap only brings the app to
 * the foreground, landing on whatever screen was last showing. Any navigation is ours to perform.
 *
 * Handles WARM TAPS ONLY, by design. This fires when the process is already alive and a listener is
 * subscribed to receive the event. 
 * 
 * On a COLD launch the native side emits the response before any JS exists to hear it, so the event is lost
 * and this never fires — reading it back would need getLastNotificationResponse() plus a hydration gate, 
 * which is deliberately not built. A cold tap therefore lands on the Home tab, where ResumeSessionBanner 
 * shows the live session one tap away.
 *
 * The identifier filter matters even though this app posts only one notification: it keeps the
 * handler correct if a second notification type is ever added.
 */
export function addActiveSessionNotificationTapListener(handler: () => void): () => void {
  try {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.identifier === ACTIVE_SESSION_NOTIFICATION_ID) handler();
    });
    return () => subscription.remove();
  } catch (error) {
    logNotificationFailure('addActiveSessionNotificationTapListener', error);
    // A no-op unsubscribe, so the caller's cleanup path stays uniform and never has to null-check.
    return () => {};
  }
}

/** Creates or updates the Android channel. Idempotent, so it runs before every post rather than
 *  once at startup — a session restored on cold launch never passes through startSession, so
 *  there is no other guaranteed moment to create it.
 *
 *  The Platform guard disables NOTHING: notification channels are an Android-only OS concept with
 *  no iOS counterpart, and expo-notifications' non-Android implementation is a stub that returns
 *  null after logging a console.debug. The guard exists purely to keep that log out of the iOS
 *  console. 
 * 
 *  Everything else in this module is cross-platform — see postActiveSessionNotification,
 *  which is the one place that could have gone platform-specific and deliberately does not. 
 */
async function ensureActiveSessionChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ACTIVE_SESSION_CHANNEL_ID, {
    name: ACTIVE_SESSION_CHANNEL_NAME,
    // LOW is silent and shade-only — the convention for ongoing status notifications.
    // Note Android FREEZES a channel's importance at creation (only name and description can be
    // changed afterwards), so altering this line has no effect on a device that already created
    // the channel; that needs a reinstall or a new channel id.
    importance: Notifications.AndroidImportance.LOW,
  });
}

/** Every export here swallows its errors, because notifications are ancillary: nothing about a
 *  failed post should disturb a live workout, and every caller is fire-and-forget (startSession
 *  does not await, and the AppState listener cannot), so a rejection has nowhere to go.
 *
 *  Silent in production, loud in development. A fully silent catch already cost real debugging
 *  time once — a post was being discarded downstream and there was no signal at all. __DEV__ is
 *  inlined as a literal `false` in release bundles and the branch is then folded away, so this
 *  ships in neither the preview nor the production build. */
function logNotificationFailure(context: string, error: unknown): void {
  if (__DEV__) console.warn(`[sessionNotification] ${context} failed`, error);
}
