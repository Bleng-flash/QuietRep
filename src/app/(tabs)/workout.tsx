// TEMPORARY: debug entry point for testing the session screen (Step 3).
// This file will be replaced by the FAB fan menu in Step 4.
import { useActiveSession } from '@/context/ActiveSessionContext';
import { getAllExercises } from '@/storage';
import { colors, typography } from '@/styles';
import { seedSessionExercises } from '@/utils/session';
import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';

export default function WorkoutScreen() {
  const { activeSession, startSession, discardActiveSession } = useActiveSession();

  async function handleStartDebugSession() {
    const allExercises = await getAllExercises();
    if (allExercises.length === 0) {
      Alert.alert('No exercises', 'Seed some exercises first via the Plan tab.');
      return;
    }

    // Build a minimal session from the first two exercises in the library.
    const sampleExercises = allExercises.slice(0, 2).map((exercise) => ({
      exerciseId: exercise.id,
      sets: [
        { minReps: 8, maxReps: 12 },
        { minReps: 8, maxReps: 12 },
        { minReps: 8, maxReps: 12 },
      ],
    }));
    const sessionExercises = seedSessionExercises(sampleExercises);
    await startSession('Debug Session', sessionExercises);
    router.push('/session');
  }

  async function handleDiscardSession() {
    await discardActiveSession();
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: colors.dark.background }}>
      <Text style={[typography.caption, { textAlign: 'center' }]}>
        Temporary debug screen — replaced by FAB fan menu in Step 4.
      </Text>

      {activeSession ? (
        <>
          <Pressable onPress={() => router.push('/session')} style={{ padding: 16, backgroundColor: colors.dark.primary, borderRadius: 8 }}>
            <Text style={{ color: colors.dark.textInverse, fontWeight: '600' }}>Resume session: {activeSession.name}</Text>
          </Pressable>
          <Pressable onPress={handleDiscardSession} style={{ padding: 16, backgroundColor: colors.dark.errorSubtle, borderRadius: 8 }}>
            <Text style={{ color: colors.dark.error, fontWeight: '600' }}>Discard session</Text>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={handleStartDebugSession} style={{ padding: 16, backgroundColor: colors.dark.primary, borderRadius: 8 }}>
          <Text style={{ color: colors.dark.textInverse, fontWeight: '600' }}>Start debug session</Text>
        </Pressable>
      )}
    </View>
  );
}
