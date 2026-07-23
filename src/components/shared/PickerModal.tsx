import ListEmptyText from '@/components/shared/ListEmptyText';
import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/styles';
import { matchesSearchQuery } from '@/utils/search';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';

interface PickerModalProps<ItemType extends { name: string }> {
  visible: boolean;
  title: string;
  searchPlaceholder: string;
  emptyMessage: string;
  createLabel: string;
  items: ItemType[]; // already in display order
  keyExtractor: (item: ItemType) => string;
  renderItemContent: (item: ItemType, isDisabled: boolean) => ReactElement;
  isItemDisabled?: (item: ItemType) => boolean;
  onSelect: (item: ItemType) => void;
  onCreateNew: () => void; // PickerModal closes itself first, then calls this
  onClose: () => void; // PickerModal resets search first, then calls this
}

// Generic Modal that contains header, search bar, FlatList, (empty-state), "create new" footer
// scaffold shared by ExercisePicker and WorkoutPicker. Implements the CLAUDE.md large-list
// memoisation chain internally since ExercisePicker feeds it 90+ exercises. Search filtering
// uses matchesSearchQuery against item.name for both pickers.
export default function PickerModal<ItemType extends { name: string }>({
  visible,
  title,
  searchPlaceholder,
  emptyMessage,
  createLabel,
  items,
  keyExtractor,
  renderItemContent,
  isItemDisabled,
  onSelect,
  onCreateNew,
  onClose,
}: PickerModalProps<ItemType>) {
  const { colors, layout, typography, picker } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const closePicker = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesSearchQuery(item, searchQuery)),
    [items, searchQuery],
  );

  // id-based — stable reference; looks up the item once per user tap (not per render)
  const handleSelectId = useCallback(
    (id: string) => {
      const selectedItem = items.find((item) => keyExtractor(item) === id);
      if (selectedItem) {
        onSelect(selectedItem);
        closePicker();
      }
    },
    [items, keyExtractor, onSelect, closePicker],
  );

  const handleCreateNew = useCallback(() => {
    closePicker();
    onCreateNew();
  }, [closePicker, onCreateNew]);

  const renderItem = useCallback(
    ({ item }: { item: ItemType }) => (
      <PickerRow
        item={item}
        keyId={keyExtractor(item)}
        isDisabled={isItemDisabled?.(item) ?? false}
        renderItemContent={renderItemContent}
        onSelectId={handleSelectId}
      />
    ),
    [keyExtractor, isItemDisabled, renderItemContent, handleSelectId],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePicker}
    >
      <View style={picker.container}>
        <View style={[layout.rowBetween, picker.header]}>
          <Text style={typography.heading}>{title}</Text>
          <Pressable onPress={closePicker} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={picker.searchBar}>
          <Ionicons name="search" size={16} color={colors.textSubtle} />
          <TextInput
            style={picker.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textDisabled}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          // The search keyboard is almost always up when a result is tapped; without "handled"
          // this FlatList (a ScrollView underneath, running its own tap interception) swallows
          // the first tap on a row / Create-new to dismiss the keyboard — the DraggableCardList
          // lesson: keyboardShouldPersistTaps is per-scroll-view and not inherited.
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          ListEmptyComponent={<ListEmptyText message={emptyMessage} />}
          ListFooterComponent={
            <Pressable
              onPress={handleCreateNew}
              style={({ pressed }) => [picker.createButton, pressed && layout.pressedButton]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={picker.createLabel}>{createLabel}</Text>
            </Pressable>
          }
        />
      </View>
    </Modal>
  );
}

interface PickerRowProps<ItemType> {
  item: ItemType;
  keyId: string;
  isDisabled: boolean;
  renderItemContent: (item: ItemType, isDisabled: boolean) => ReactElement;
  onSelectId: (id: string) => void;
}

const PickerRow = memo(function PickerRow<ItemType>({
  item,
  keyId,
  isDisabled,
  renderItemContent,
  onSelectId,
}: PickerRowProps<ItemType>) {
  // Own useTheme() call — PickerRow is a memoised sibling of the main component, not nested
  // in its render, so it can't close over the parent's themed styles. Context change still
  // re-renders it (past memo), which is what we want on a theme toggle.
  const { layout, picker } = useTheme();
  return (
    <Pressable
      onPress={() => !isDisabled && onSelectId(keyId)}
      style={({ pressed }) => [
        picker.item,
        isDisabled && layout.disabled,
        pressed && !isDisabled && layout.pressedCard,
      ]}
    >
      {renderItemContent(item, isDisabled)}
    </Pressable>
  );
}) as <ItemType>(props: PickerRowProps<ItemType>) => ReactElement;
