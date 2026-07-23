import BodyweightEntryRow from '@/components/profile/BodyweightEntryRow';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { useUnit } from '@/context/UnitContext';
import { deleteBodyweightEntry, getBodyweightEntries } from '@/storage';
import { spacing } from '@/styles';
import type { BodyweightEntry } from '@/types';
import { formatDateTime } from '@/utils/datetime';
import { formatWeight } from '@/utils/units';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bodyweight entries screen — the management surface behind the trend screen's list icon: every
// recorded entry as a compact row (weight, date + time), with per-row delete. Root-stack route
// /bodyweight/entries (file + same-named-folder coexistence with bodyweight.tsx, the session.tsx
// pattern). Self-contained rather than thin-screen + fat-component: no route params and a single
// consumer, the monthly-stats exception. Owns its background via layout.screen. Deleting here and
// navigating back refreshes the chart via the trend screen's useFocusEffect — no extra plumbing.
export default function BodyweightEntriesScreen() {
  const { colors, layout, typography } = useTheme();
  const { unit: displayUnit } = useUnit();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bodyweightEntries, setBodyweightEntries] = useState<BodyweightEntry[]>([]);
  // Mirror of bodyweightEntries for the delete confirm's by-id lookup (the latestSessionRef
  // pattern): reading via a ref keeps handleDelete referentially stable across focus reloads, so
  // the memoised rows keep bailing out — a state dep would recreate it on every load.
  const bodyweightEntriesRef = useRef<BodyweightEntry[]>([]);
  // Distinguishes "still loading" from "loaded but empty" so the empty state never flashes.
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    const stored = await getBodyweightEntries();
    setBodyweightEntries(stored);
    bodyweightEntriesRef.current = stored;
    setHasLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = useCallback(
    (id: string) => {
      // Name the entry (weight in the current display unit — matching what the row shows — plus
      // date and time) so the user is sure which reading they are removing; entries are now-only,
      // so a wrong delete cannot be undone by editing. Falls back to a generic message if the id
      // is somehow no longer in the ref (should not happen — rows render from the same data).
      const entry = bodyweightEntriesRef.current.find(
        (candidateEntry) => candidateEntry.id === id,
      );
      const confirmMessage = entry
        ? `Delete the ${formatWeight(entry.weight, entry.unit, displayUnit)} ${displayUnit} entry from ${formatDateTime(entry.recordedAt)}?`
        : 'Delete this bodyweight entry?';
      Alert.alert('Delete bodyweight entry', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBodyweightEntry(id);
            await load();
          },
        },
      ]);
    },
    [load, displayUnit],
  );

  const renderItem = useCallback(
    ({ item }: { item: BodyweightEntry }) => (
      <BodyweightEntryRow
        id={item.id}
        weight={item.weight}
        loggedUnit={item.unit}
        recordedAt={item.recordedAt}
        onDelete={handleDelete}
      />
    ),
    [handleDelete],
  );

  return (
    <View style={layout.screen}>
      {/* Back-chevron top bar — same recipe as monthly-stats / SessionDetail (no right action).
          The width-24 spacer keeps the centred title balanced. */}
      <View style={[layout.rowBetween, layout.topBar, { paddingTop: insets.top + spacing.s }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => pressed && layout.pressedButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textSubtle} />
        </Pressable>
        <Text style={typography.heading} numberOfLines={1}>
          Bodyweight entries
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bodyweightEntries}
        keyExtractor={(entry) => entry.id}
        renderItem={renderItem}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={RowDivider}
        ListEmptyComponent={
          hasLoaded ? (
            <ListEmptyText message="No bodyweight entries yet. Log your weight from the Home tab." />
          ) : null
        }
      />
    </View>
  );
}

// Hairline rule between the compact rows (denser than card separation).
function RowDivider() {
  const { layout } = useTheme();
  return <View style={layout.divider} />;
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
});
