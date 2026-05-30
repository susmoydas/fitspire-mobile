import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface RestTimerCardProps {
  remaining: number;
  onSkip: () => void;
  onAddTime: () => void;
}

export default React.memo(function RestTimerCard({ remaining, onSkip, onAddTime }: RestTimerCardProps) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Rest Time</Text>
      <Text style={styles.timer}>{display}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(remaining / 90) * 100}%` }]} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipText}>Skip Rest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={onAddTime}>
          <Text style={styles.addText}>+15s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  timer: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.cardElevated,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardElevated,
  },
  skipText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  addBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  addText: {
    color: colors.warning,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
});
