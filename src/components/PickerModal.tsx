import ListEmptyText from '@/components/ListEmptyText';
import { colors, layout, picker, spacing, typography } from '@/styles';
import { matchesSearchQuery } from '@/utils/search';
import { Ionicons } from '@expo/vector-icons';
import type { ReactElement } from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
            <Ionicons name="close" size={24} color={colors.dark.textSubtle} />
          </Pressable>
        </View>

        <View style={picker.searchBar}>
          <Ionicons name="search" size={16} color={colors.dark.textSubtle} />
          <TextInput
            style={picker.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.dark.textDisabled}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={renderItem}
          ListEmptyComponent={<ListEmptyText message={emptyMessage} />}
          ListFooterComponent={
            <Pressable
              onPress={handleCreateNew}
              style={({ pressed }) => [picker.createButton, pressed && layout.pressedButton]}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.dark.primary} />
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
  return (
    <Pressable
      onPress={() => !isDisabled && onSelectId(keyId)}
      style={({ pressed }) => [
        picker.item,
        isDisabled && styles.disabledItem,
        pressed && !isDisabled && layout.pressedCard,
      ]}
    >
      {renderItemContent(item, isDisabled)}
    </Pressable>
  );
}) as <ItemType>(props: PickerRowProps<ItemType>) => ReactElement;

const styles = StyleSheet.create({
  disabledItem: {
    opacity: 0.4,
  },
});
