import { layout, spacing, typography } from '@/styles';
import { formatSessionDate, formatSessionDuration } from '@/utils/session';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

interface PastSessionCardProps {
  sessionId: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  exerciseCount: number;
  setCount: number;
  onPress: (sessionId: string) => void;
}

// Receives primitive props (not the whole WorkoutSession) so memo can bail out of re-render for
// unchanged rows even when the parent reloads a fresh array of objects from storage on focus.
const PastSessionCard = memo(function PastSessionCard({
  sessionId,
  name,
  startedAt,
  finishedAt,
  exerciseCount,
  setCount,
  onPress,
}: PastSessionCardProps) {
  // Duration is '' only if finishedAt is null (shouldn't happen for a finished session) — filter it
  // out so the meta line never shows a dangling separator.
  const metaLine = [formatSessionDate(startedAt), formatSessionDuration(startedAt, finishedAt)]
    .filter(Boolean)
    .join('  •  ');

  return (
    <Pressable
      onPress={() => onPress(sessionId)}
      style={({ pressed }) => [layout.card, pressed && layout.pressedCard]}
    >
      <Text style={typography.subheading} numberOfLines={1}>
        {name}
      </Text>
      <View style={{ marginTop: spacing.xs, gap: 2 }}>
        <Text style={typography.caption}>{metaLine}</Text>
        <Text style={typography.caption}>
          {exerciseCount} exercises, {setCount} sets
        </Text>
      </View>
    </Pressable>
  );
});

export default PastSessionCard;
