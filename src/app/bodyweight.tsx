import BodyweightEntryRow from '@/components/profile/BodyweightEntryRow';
import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { deleteBodyweightEntry, getBodyweightEntries } from '@/storage';
import { spacing } from '@/styles';
import type { BodyweightEntry } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bodyweight trend screen — a root-stack screen reached from the Profile tab (opens full-screen with
// the tab bar hidden, the monthly-stats / session-detail recipe).
// View + manage only: logging happens on the Home tab (LogBodyweightCard); here you review past
// entries and delete mistakes.
// Now-only logging means storage is already newest-first, so the list
// renders it as-is. The progression chart lands above the list in a later stage.
export default function BodyweightScreen() {
  const { colors, layout, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [bodyweightEntries, setBodyweightEntries] = useState<BodyweightEntry[]>([]);
  // Distinguishes "still loading" from "loaded but empty" so the empty state never flashes.
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    const stored = await getBodyweightEntries();
    setBodyweightEntries(stored);
    setHasLoaded(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete entry', 'Remove this bodyweight entry?', [
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
    [load],
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
      {/* Back-chevron top bar — same recipe as monthly-stats / SessionDetail (no trash action).
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
          Bodyweight
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={bodyweightEntries}
        keyExtractor={(entry) => entry.id}
        renderItem={renderItem}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={
          hasLoaded ? <ListEmptyText message="No bodyweight entries yet." /> : null
        }
      />
    </View>
  );
}

function ItemSeparator() {
  return <View style={{ height: spacing.s }} />;
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
});
