import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';
import { getWorkoutExerciseImageUrls, getExerciseImageUrls } from '../utils/image';
import type { Exercise } from '../types';
import type { WorkoutPlanExercise } from '../data/workoutPlans';

type MediaMode = 'preStart' | 'activeSession' | 'detail';

interface ExerciseMediaCardProps {
  exercise: WorkoutPlanExercise | Exercise;
  height?: number;
  rounded?: number;
  mode?: MediaMode;
  aspectRatio?: number;
}

function getUrls(exercise: WorkoutPlanExercise | Exercise): string[] {
  if ('exerciseId' in exercise) {
    return getWorkoutExerciseImageUrls(exercise);
  }
  return getExerciseImageUrls(exercise);
}

function getName(exercise: WorkoutPlanExercise | Exercise): string {
  return exercise.name;
}

const ExerciseMediaCard = React.memo(function ExerciseMediaCard({
  exercise,
  height,
  rounded = borderRadius.lg,
  mode = 'detail',
  aspectRatio,
}: ExerciseMediaCardProps) {
  const urls = useMemo(() => getUrls(exercise), [exercise]);
  const uniqueUrls = useMemo(() => urls.filter(Boolean), [urls]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const currentUrl = uniqueUrls[urlIndex];
  const isGif = currentUrl?.toLowerCase().endsWith('.gif');

  const handleError = useCallback(() => {
    if (urlIndex < uniqueUrls.length - 1) {
      setUrlIndex((i) => i + 1);
    } else {
      setAllFailed(true);
    }
  }, [urlIndex, uniqueUrls.length]);

  React.useEffect(() => {
    setUrlIndex(0);
    setAllFailed(false);
  }, [uniqueUrls.join('|')]);

  const contentFit: ImageContentFit = 'contain';
  const cardHeight = height || (mode === 'preStart' ? 260 : mode === 'activeSession' ? 280 : 220);

  return (
    <View
      style={[
        styles.card,
        { borderRadius: rounded, height: cardHeight, backgroundColor: mode === 'activeSession' ? '#FFFFFF' : '#1C1C1E' },
        aspectRatio ? { height: undefined, aspectRatio } : null,
      ]}
    >
      {currentUrl && !allFailed ? (
        <>
          <Image
            source={{ uri: currentUrl }}
            style={styles.image}
            contentFit={contentFit}
            cachePolicy="disk"
            transition={200}
            onError={handleError}
          />
          {isGif && mode !== 'detail' && (
            <View style={styles.gifBadge}>
              <MaterialIcons name="play-circle-outline" size={14} color="#fff" />
              <Text style={styles.gifBadgeText}>GIF</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="fitness-center" size={40} color={colors.textMuted} />
          <Text style={styles.placeholderText}>{getName(exercise)}</Text>
        </View>
      )}
    </View>
  );
});

export default ExerciseMediaCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gifBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gifBadgeText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
    gap: spacing.xs,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
