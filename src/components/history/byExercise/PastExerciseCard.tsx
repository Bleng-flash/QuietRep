import { layout, spacing, typography } from '@/styles';
import type { MuscleGroup } from '@/types';
import { formatSessionDate } from '@/utils/session';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

interface PastExerciseCardProps {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  sessionCount: number;
  lastPerformedAt: string;
  onPress: (exerciseId: string) => void;
}

// Receives primitive props (not the whole ExerciseHistorySummary) so memo can bail out of
// re-render for unchanged rows even when the parent reloads a fresh array from storage on focus.
const PastExerciseCard = memo(function PastExerciseCard({
  exerciseId,
  name,
  muscleGroup,
  sessionCount,
  lastPerformedAt,
  onPress,
}: PastExerciseCardProps) {
  const performanceLine = [
    `${sessionCount} session${sessionCount === 1 ? '' : 's'}`,
    `Last performed: ${formatSessionDate(lastPerformedAt)}`,
  ].join('  •  ');

  return (
    <Pressable
      onPress={() => onPress(exerciseId)}
      style={({ pressed }) => [layout.card, pressed && layout.pressedCard]}
    >
      <Text style={typography.subheading} numberOfLines={1}>
        {name}
      </Text>
      {/* Two caption lines under the name, mirroring PastSessionCard's meta block */}
      <View style={{ marginTop: spacing.xs, gap: 2 }}>
        <Text style={typography.caption}>{muscleGroup}</Text>
        <Text style={typography.caption}>{performanceLine}</Text>
      </View>
    </Pressable>
  );
});

export default PastExerciseCard;
