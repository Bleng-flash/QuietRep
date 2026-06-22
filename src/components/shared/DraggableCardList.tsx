import { useCallback, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  NestedReorderableList,
  reorderItems,
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
  renderCard: (item: ItemType, drag: () => void) => ReactNode;
  /** Called with the full reordered array after a drag drop. */
  onReorder: (reordered: ItemType[]) => void;
  separatorHeight?: number;
}

/** Internal per-item wrapper — retrieves the drag handle and passes it to the caller's renderCard. */
function DraggableCard<ItemType>({
  renderCard,
  item,
}: {
  renderCard: (item: ItemType, drag: () => void) => ReactNode;
  item: ItemType;
}) {
  const drag = useReorderableDrag();
  // The library's own cell animation handles the visual lift — no wrapper needed here.
  return <>{renderCard(item, drag)}</>;
}

export default function DraggableCardList<ItemType>({
  data,
  keyExtractor,
  renderCard,
  onReorder,
  separatorHeight = 0,
}: DraggableCardListProps<ItemType>) {
  const renderItem = useCallback(
    ({ item }: { item: ItemType }) => (
      <DraggableCard renderCard={renderCard} item={item} />
    ),
    [renderCard],
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
