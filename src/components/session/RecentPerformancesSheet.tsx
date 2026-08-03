import ExercisePerformanceCard from '@/components/history/byExercise/ExercisePerformanceCard';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { getExercisePerformances } from '@/storage';
import { radius, spacing, type Palette } from '@/styles';
import type { ExercisePerformance } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RecentPerformancesSheetProps {
  visible: boolean;
  // null whenever the sheet is closed — the parent clears its target on dismiss.
  exerciseId: string | null;
  // Resolved by the parent (which already holds the joined exercise) so this sheet never has to
  // re-resolve a possibly-dangling exerciseId FK.
  exerciseName: string;
  onClose: () => void;
}

/** How many past sessions the in-session glance shows. The full history lives in the History
 *  tab's "By exercise" lens; this is deliberately a glance. */
const RECENT_PERFORMANCE_LIMIT = 3;

/** Bottom sheet showing the last few sessions in which the given exercise was performed, opened
 *  from an exercise card's info button during a live session. Exists so a user deciding today's
 *  load does not have to minimise the session and cross into the History tab to see last time's
 *  sets — the friction this removes is the whole point of the feature.
 *
 *  Read-only and self-contained: it owns its own storage read and renders the History tab's
 *  ExercisePerformanceCard unchanged. Note the live session can never appear in its own history —
 *  getExercisePerformances reads finished sessions only, from a different AsyncStorage key. */
export default function RecentPerformancesSheet({
  visible,
  exerciseId,
  exerciseName,
  onClose,
}: RecentPerformancesSheetProps) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [performances, setPerformances] = useState<ExercisePerformance[]>([]);
  // Distinguishes "still reading" from "read, and there is nothing" so the empty message never
  // flashes before the load resolves — the ExerciseHistory / SessionDetail guard.
  const [hasLoaded, setHasLoaded] = useState(false);

  // useEffect (not useFocusEffect) — this is a Modal component, not a navigation screen.
  // Reloads each time the sheet opens for an exercise, and resets when it closes.
  useEffect(() => {
    if (!visible || !exerciseId) {
      setPerformances([]);
      setHasLoaded(false);
      return;
    }
    // Captured as a const so the narrowing from the guard above survives into the closure below
    // (TypeScript does not carry a parameter's narrowed type into a nested function).
    const targetExerciseId = exerciseId;
    // Guards against a fast open-A -> close -> open-B sequence: without it, A's slower promise
    // could resolve last and overwrite B's results.
    let isCancelled = false;
    async function loadPerformances() {
      const recentPerformances = await getExercisePerformances(targetExerciseId, RECENT_PERFORMANCE_LIMIT);
      if (isCancelled) return;
      setPerformances(recentPerformances);
      setHasLoaded(true);
    }
    loadPerformances();
    return () => {
      isCancelled = true;
    };
  }, [visible, exerciseId]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* The backdrop is a SIBLING of the sheet, not its parent. A Pressable claims the touch
          start unconditionally, so wrapping the sheet in one (the usual "stop taps bubbling to
          the backdrop" idiom) leaves the ScrollView below fighting it for every gesture — which
          is what made this sheet scroll only intermittently. As siblings, responder negotiation
          never offers a sheet touch to the backdrop at all, since it walks ancestors only. */}
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Rendered after the backdrop, so it paints on top of it */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.l }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={typography.subheading} numberOfLines={1}>
              {exerciseName}
            </Text>
            <Text style={typography.caption}>Your last {RECENT_PERFORMANCE_LIMIT} sessions</Text>
          </View>

          {/* keyboardShouldPersistTaps is per-scroll-view and never inherited. This sheet has no
              scrollable React ancestor to inherit from anyway — WorkoutSession renders it as a
              SIBLING of its ScrollViewContainer, so it is a cousin of the exercise cards, not a
              descendant. The prop governs taps in this ScrollView's OWN subtree, which today
              holds nothing tappable (the cards are read-only) and opens with the keyboard already
              dismissed. Kept as the app-wide convention, so any tappable content added here later
              fires on the first tap rather than being eaten. */}
          <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
            {!hasLoaded ? null : performances.length === 0 ? (
              <ListEmptyText message="No past sessions with this exercise yet." />
            ) : (
              performances.map((performance, index) => (
                <View
                  key={performance.sessionId}
                  style={index > 0 ? { marginTop: spacing.s } : undefined}
                >
                  <ExercisePerformanceCard
                    sessionName={performance.sessionName}
                    performedAt={performance.performedAt}
                    loggedUnit={performance.unit}
                    sets={performance.sets}
                  />
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // Holds the backdrop and the sheet as siblings; the sheet is the only in-flow child, so
    // flex-end docks it to the bottom.
    container: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    // Absolutely positioned so it covers the whole screen behind the sheet without being its
    // ancestor — see the structural comment in the JSX above.
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.m,
      paddingTop: spacing.s,
      maxHeight: '70%',
    },
    // Small handle hinting the sheet can be dismissed.
    grabber: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: radius.s,
      backgroundColor: colors.border,
      marginBottom: spacing.m,
    },
    header: {
      gap: spacing.xs,
      marginBottom: spacing.m,
    },
    // The height cap lives on the sheet above, not here, and RN's default flexShrink is 0
    // (web CSS defaults to 1). Without this the ScrollView lays out at its full content
    // height, so its viewport equals its content, its scroll range is zero, and it silently
    // refuses to scroll while the sheet clips the overflow. flexShrink (not flex) so a short
    // history still hugs its content instead of stretching the sheet to 70% of the screen.
    scrollArea: {
      flexShrink: 1,
    },
  });
