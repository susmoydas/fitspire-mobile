import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface MuscleMapProps {
  muscles: string[];
}

const MUSCLE_POSITIONS: Record<string, { top: number; left: number }> = {
  Chest: { top: 24, left: 38 },
  Back: { top: 24, left: 58 },
  Shoulders: { top: 16, left: 34 },
  Biceps: { top: 30, left: 22 },
  Triceps: { top: 30, left: 72 },
  Forearms: { top: 42, left: 22 },
  Abs: { top: 38, left: 46 },
  Core: { top: 38, left: 46 },
  Obliques: { top: 38, left: 38 },
  Quads: { top: 52, left: 38 },
  Hamstrings: { top: 52, left: 58 },
  Glutes: { top: 46, left: 50 },
  Calves: { top: 66, left: 42 },
  Traps: { top: 10, left: 46 },
  Lats: { top: 20, left: 62 },
  Neck: { top: 4, left: 46 },
};

export default function MuscleMap({ muscles }: MuscleMapProps) {
  const targetLower = muscles.map((m) => m.toLowerCase());
  const highlight = Object.entries(MUSCLE_POSITIONS).find(([name]) =>
    targetLower.includes(name.toLowerCase()),
  );

  if (!highlight) {
    return (
      <View style={styles.container}>
        <View style={styles.outline}>
          <Text style={styles.placeholder}>Target: {muscles.join(', ')}</Text>
        </View>
      </View>
    );
  }

  const [name, pos] = highlight;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Target Muscle</Text>
      <View style={styles.outline}>
        <View style={styles.bodyShape}>
          <View style={styles.head} />
          <View style={styles.torso}>
            <View style={styles.armLeft} />
            <View style={styles.armRight} />
            <View
              style={[
                styles.highlightDot,
                { top: `${pos.top}%`, left: `${pos.left}%` },
              ]}
            />
          </View>
          <View style={styles.legs}>
            <View style={styles.legLeft} />
            <View style={styles.legRight} />
          </View>
          <Text style={styles.muscleLabel}>{name}</Text>
        </View>
      </View>
      <Text style={styles.caption}>{name} — primary target area</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  outline: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bodyShape: {
    width: 120,
    height: 200,
    alignItems: 'center',
    position: 'relative',
  },
  head: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardElevated,
    marginBottom: 4,
  },
  torso: {
    width: 60,
    height: 80,
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    position: 'relative',
  },
  armLeft: {
    position: 'absolute',
    left: -18,
    top: 6,
    width: 16,
    height: 50,
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
  },
  armRight: {
    position: 'absolute',
    right: -18,
    top: 6,
    width: 16,
    height: 50,
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
  },
  highlightDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    opacity: 0.85,
    marginLeft: -9,
    marginTop: -9,
  },
  legs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  legLeft: {
    width: 22,
    height: 80,
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
  },
  legRight: {
    width: 22,
    height: 80,
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
  },
  muscleLabel: {
    position: 'absolute',
    bottom: -24,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  caption: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
