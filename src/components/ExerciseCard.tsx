import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { Exercise } from '../types';
import { getThumbnailSource, getFallbackAsset } from '../utils/image';

interface ExerciseCardProps {
  exercise: Exercise;
  selected: boolean;
  onPress: () => void;
  onSelectToggle: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

export default React.memo(function ExerciseCard({ exercise, selected, onPress, onSelectToggle }: ExerciseCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={imgFailed ? getFallbackAsset(exercise.name, exercise.category) : getThumbnailSource(exercise)}
        style={styles.image}
        contentFit="cover"
        onError={() => setImgFailed(true)}
      />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>{exercise.name}</Text>
          <TouchableOpacity
            style={[styles.checkbox, selected && styles.checkboxSelected]}
            onPress={onSelectToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {selected && <Text style={styles.checkIcon}>✓</Text>}
          </TouchableOpacity>
        </View>
        <Text style={styles.muscle}>{exercise.category}</Text>
        <View style={styles.badges}>
          {exercise.equipment && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{exercise.equipment}</Text>
            </View>
          )}
          {exercise.difficulty && (
            <View style={[styles.badge, { borderColor: DIFFICULTY_COLORS[exercise.difficulty] + '40' }]}>
              <Text style={[styles.badgeText, { color: DIFFICULTY_COLORS[exercise.difficulty] }]}>
                {exercise.difficulty}
              </Text>
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{exercise.defaultSets}×{exercise.defaultReps}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{exercise.restSeconds}s rest</Text>
          </View>
        </View>
        <Text style={styles.hint}>Tap to view form guide</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  image: {
    width: 100,
    height: 120,
    backgroundColor: colors.cardElevated,
  },
  content: {
    flex: 1,
    padding: spacing.sm + 2,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  checkIcon: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  muscle: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
