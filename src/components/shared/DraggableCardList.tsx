import { colors } from '@/styles';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  NestedReorderableList,
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from 'react-native-reorderable-list';

interface DraggableCardListProps<ItemType> {
  data: ItemType[];
  keyExtractor: (item: ItemType) => string;
  /**
   * Render the card. The `drag` function is passed so the caller can bind it to whichever
   * element should respond to a long press — the card's own root Pressable (for Pressable-rooted
   * cards) or a wrapping Pressable added by the caller (for View-rooted cards).
   */
  renderCard: (item: ItemType, drag: () => void) => React.ReactNode;
  /** Called with the full reordered array after a drag drop. */
  onReorder: (reordered: ItemType[]) => void;
  separatorHeight?: number;
}

/** Internal per-item wrapper — provides the drag handle and active-state border highlight. */
function DraggableCard({
  renderCard,
  item,
}: {
  renderCard: (item: unknown, drag: () => void) => React.ReactNode;
  item: unknown;
}) {
  const drag = useReorderableDrag();
  const isActive = useIsActive();

  return (
    <View style={isActive ? styles.cardLifted : undefined}>
      {renderCard(item, drag)}
    </View>
  );
}

export default function DraggableCardList<ItemType>({
  data,
  keyExtractor,
  renderCard,
  onReorder,
  separatorHeight = 0,
}: DraggableCardListProps<ItemType>) {
  // Cast to unknown internally — the generic constraint is enforced at the call site.
  const typedRenderCard = renderCard as (item: unknown, drag: () => void) => React.ReactNode;

  const renderItem = useCallback(
    ({ item }: { item: ItemType }) => (
      <DraggableCard renderCard={typedRenderCard} item={item} />
    ),
    [typedRenderCard],
  );

  const handleReorder = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      onReorder(reorderItems(data, from, to));
    },
    [data, onReorder],
  );

  const ItemSeparator = useCallback(
    () => <View style={{ height: separatorHeight }} />,
    [separatorHeight],
  );

  return (
    <NestedReorderableList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onReorder={handleReorder}
      ItemSeparatorComponent={separatorHeight > 0 ? ItemSeparator : undefined}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  cardLifted: {
    // Subtle border highlight to indicate the card is being dragged.
    borderWidth: 1,
    borderColor: colors.dark.primary,
    borderRadius: 12,
  },
});
