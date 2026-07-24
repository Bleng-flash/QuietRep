import { useCallback, useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  NestedReorderableList,
  reorderItems,
  useReorderableDrag,
} from 'react-native-reorderable-list';

/**
 * The delay (ms) each consumer passes to its drag Pressable's `delayLongPress`, so
 * press-and-hold starts a reorder. Exported so the pan-activation delay below stays
 * coupled to it — see PAN_ACTIVATE_AFTER_LONG_PRESS_MS.
 */
export const DRAG_LONG_PRESS_DELAY_MS = 200;

/**
 * How long the finger must be held (roughly) still before the library's internal pan
 * gesture is allowed to arm. Must be >= the drag long-press delay: a plain swipe moves
 * the finger well before this, so the pan never arms and the touch falls through to the
 * outer ScrollViewContainer (the scroll works from anywhere on a card, not just the
 * padding gutters). Only a deliberate press-and-hold — the same gesture that fires the
 * card's onLongPress drag — arms it. Without this the default Gesture.Pan() arms on
 * ~10dp of movement in any direction and swallows vertical scrolls over the whole list.
 */
const PAN_ACTIVATE_AFTER_LONG_PRESS_MS = 220;

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
  // Constrain the library's internal pan so it only arms after a long press, letting plain
  // swipes reach the outer scroll. See PAN_ACTIVATE_AFTER_LONG_PRESS_MS for the full rationale.
  const panGesture = useMemo(
    () => Gesture.Pan().activateAfterLongPress(PAN_ACTIVATE_AFTER_LONG_PRESS_MS),
    [],
  );

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
      panGesture={panGesture}
      scrollEnabled={false}
      // keyboardShouldPersistTaps is per-scroll-view and NOT inherited: this list is FlatList-based
      // (a ScrollView underneath, even with scrolling disabled), so without its own "handled" it
      // swallows the first tap on any child button to dismiss the keyboard — the outer
      // ScrollViewContainer's "handled" cannot reach in here. Matches the app-wide convention.
      keyboardShouldPersistTaps="handled"
    />
  );
}
