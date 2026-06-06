import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSize } from '../theme/colors';
import { getWorkoutExerciseImageUrls, getExerciseImageUrls } from '../utils/image';
import LogoFallback from './LogoFallback';
import type { Exercise } from '../types';
import type { WorkoutPlanExercise } from '../data/workoutPlans';

type MediaMode = 'preStart' | 'activeSession' | 'detail';

interface ExerciseMediaCardProps {
  exercise: WorkoutPlanExercise | Exercise;
  height?: number;
  rounded?: number;
  mode?: MediaMode;
  aspectRatio?: number;
  contentFit?: ImageContentFit;
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
  contentFit: contentFitProp,
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

  const contentFit: ImageContentFit = contentFitProp ?? 'cover';
  const cardHeight = height || (mode === 'preStart' ? 240 : mode === 'activeSession' ? 260 : 200);

  return (
    <View
      style={[
        styles.card,
        { borderRadius: rounded, height: cardHeight, backgroundColor: '#FFFFFF' },
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
              <MaterialIcons name="play-circle-outline" size={12} color="#fff" />
              <Text style={styles.gifBadgeText}>GIF</Text>
            </View>
          )}
        </>
      ) : (
        <LogoFallback caption={getName(exercise)} backgroundColor="#FFFFFF" />
      )}
    </View>
  );
});

export default ExerciseMediaCard;

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gifBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
