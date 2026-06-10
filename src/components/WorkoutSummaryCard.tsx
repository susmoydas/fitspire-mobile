import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface WorkoutSummaryCardProps {
  exerciseCount: number;
  totalSets: number;
  estimatedMinutes: number;
  targetMuscles: string;
}

export default function WorkoutSummaryCard({
  exerciseCount,
  totalSets,
  estimatedMinutes,
  targetMuscles,
}: WorkoutSummaryCardProps) {
  if (exerciseCount === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Workout Summary</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{exerciseCount}</Text>
          <Text style={styles.statLabel}>exercises</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalSets}</Text>
          <Text style={styles.statLabel}>total sets</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>~{estimatedMinutes} min</Text>
          <Text style={styles.statLabel}>est. time</Text>
        </View>
      </View>
      {targetMuscles ? (
        <View style={styles.musclesRow}>
          {targetMuscles.split(', ').map((m) => (
            <View key={m} style={styles.muscleBadge}>
              <Text style={styles.muscleText}>{m}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  title: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  musclesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  muscleBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  muscleText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
