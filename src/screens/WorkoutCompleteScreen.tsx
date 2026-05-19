import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { getExerciseById } from '../data/exercises';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutComplete'>;

export default function WorkoutCompleteScreen({ route, navigation }: Props) {
  const { sessionId, duration } = route.params;
  const sessions = useStore((s) => s.workoutSessions);
  const session = sessions.find((s) => s.id === sessionId);

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;

  return (
    <View style={styles.container}>
      <Header title="Workout Complete" onBack={() => navigation.navigate('Main')} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Great Job!</Text>
        <Text style={styles.subtitle}>You crushed today's workout</Text>

        <Card style={styles.statsCard} variant="elevated">
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{mins}m {secs}s</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Exercises</Text>
            <Text style={styles.statValue}>{session?.exercises.length || 0}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Sets</Text>
            <Text style={styles.statValue}>
              {session?.exercises.reduce((s, e) => s + e.sets.length, 0) || 0}
            </Text>
          </View>
        </Card>

        <Text style={styles.exercisesTitle}>Exercises Done</Text>
        {session?.exercises.map((we) => {
          const ex = getExerciseById(we.exerciseId);
          return (
            <View key={we.exerciseId} style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{ex?.name || 'Unknown'}</Text>
              <Text style={styles.exerciseSets}>{we.sets.filter((s) => s.completed).length}/{we.sets.length} sets</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Back to Home" onPress={() => navigation.navigate('Main')} size="lg" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, alignItems: 'center' },
  emoji: { fontSize: 64, marginBottom: spacing.md },
  title: { color: colors.text, fontSize: fontSize.title, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.lg },
  statsCard: { width: '100%', marginBottom: spacing.lg },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: { color: colors.textSecondary, fontSize: fontSize.md },
  statValue: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  exercisesTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', alignSelf: 'flex-start', marginBottom: spacing.sm },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  exerciseName: { color: colors.text, fontWeight: '500' },
  exerciseSets: { color: colors.textSecondary, fontSize: fontSize.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
});
