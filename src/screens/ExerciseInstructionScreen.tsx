import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { fetchExerciseById } from '../services/exerciseDbApi';
import AIFitnessAssistant from '../components/AIFitnessAssistant';
import AIFloatingButton from '../components/AIFloatingButton';
import ExerciseHeroImage from '../components/ExerciseHeroImage';
import InstructionSteps from '../components/InstructionSteps';
import { getExerciseImageUrls } from '../utils/image';
import { buildSingleExerciseWorkoutPlan } from '../utils/workoutPlanBuilder';
import {
  setCurrentExerciseForAI,
  clearFitnessAIScreenContext,
} from '../services/fitnessAiContext';
import type { Exercise } from '../types';
import { useStore } from '../store/useStore';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseInstruction'>;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

const SETS_REPS_BY_DIFFICULTY: Record<string, { sets: number; reps: number; rest: number }> = {
  Beginner: { sets: 3, reps: 10, rest: 60 },
  Intermediate: { sets: 4, reps: 10, rest: 75 },
  Advanced: { sets: 4, reps: 8, rest: 90 },
};

function formatDifficulty(d: string): string {
  const map: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return map[d.toLowerCase()] || 'Intermediate';
}

function formatEquipment(e: string): string {
  const map: Record<string, string> = {
    barbell: 'Barbell',
    dumbbell: 'Dumbbell',
    'body weight': 'Bodyweight',
    body_weight: 'Bodyweight',
    bodyweight: 'Bodyweight',
    machine: 'Machine',
    cable: 'Cable',
    kettlebell: 'Kettlebell',
    bands: 'Band',
    band: 'Band',
  };
  return map[e.toLowerCase()] || e;
}

function normalizeInstructions(exercise: Exercise): string[] {
  const raw = exercise.instructions || [];
  if (raw.length > 0) {
    return raw.map((s) => s.replace(/^Step:\d+\s*/i, '').trim()).filter(Boolean);
  }
  if (exercise.description) {
    return exercise.description
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
  }
  return [];
}

export default function ExerciseInstructionScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { exerciseId, exerciseData } = route.params;
  const [exercise, setExercise] = useState<Exercise | null>(exerciseData || null);
  const [loading, setLoading] = useState(!exerciseData);
  const [error, setError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const savedWorkoutIds = useStore((s) => s.savedWorkoutIds);
  const toggleSavedWorkout = useStore((s) => s.toggleSavedWorkout);
  const isSaved = exercise ? savedWorkoutIds.includes(exercise.id) : false;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (exerciseData) {
      setCurrentExerciseForAI(exerciseData);
      return () => clearFitnessAIScreenContext();
    }
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchExerciseById(exerciseId);
        if (mounted) {
          setExercise(data);
          if (data) setCurrentExerciseForAI(data);
        }
      } catch {
        if (mounted) setError('Could not load exercise details.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      clearFitnessAIScreenContext();
    };
  }, [exerciseId, exerciseData]);

  useEffect(() => {
    if (exercise) setCurrentExerciseForAI(exercise);
  }, [exercise]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [exercise]);

  const diff = useMemo(() => (exercise ? formatDifficulty(exercise.difficulty) : 'Intermediate'), [exercise]);
  const sr = useMemo(() => SETS_REPS_BY_DIFFICULTY[diff] || SETS_REPS_BY_DIFFICULTY.Intermediate, [diff]);

  const imageUrls = useMemo(() => {
    if (!exercise) return [];
    return getExerciseImageUrls(exercise);
  }, [exercise]);

  const instructionSteps = useMemo(() => {
    if (!exercise) return [];
    return normalizeInstructions(exercise);
  }, [exercise]);

  const handleStartWorkout = useCallback(() => {
    if (!exercise) return;
    const plan = buildSingleExerciseWorkoutPlan(exercise);
    navigation.navigate('WorkoutTimer', { planJson: JSON.stringify(plan) });
  }, [exercise, navigation]);

  const footerBottom = insets.bottom + spacing.md;
  const fabBottom = footerBottom + buttonHeight.lg + spacing.lg;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{error || 'Exercise not found'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{exercise.name}</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => toggleSavedWorkout(exercise.id)}>
          <MaterialIcons
            name={isSaved ? 'bookmark' : 'bookmark-border'}
            size={22}
            color={isSaved ? colors.primary : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: fabBottom + 72 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.heroCard}>
            <ExerciseHeroImage
              urls={imageUrls}
              name={exercise.name}
              style={styles.heroImage}
              contentFit="contain"
              showAnimationBadge={false}
            />
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLine}>
              <Text style={styles.infoBold}>{sr.sets} × {sr.reps}</Text>
              <Text style={styles.infoMuted}>  |  </Text>
              <Text style={styles.infoBold}>{sr.rest}s rest</Text>
              <Text style={styles.infoMuted}>  |  </Text>
              <Text style={[styles.infoBold, { color: DIFFICULTY_COLORS[diff] }]}>{diff}</Text>
              {exercise.equipment ? (
                <>
                  <Text style={styles.infoMuted}>  |  </Text>
                  <Text style={styles.infoBold}>{formatEquipment(exercise.equipment)}</Text>
                </>
              ) : null}
            </Text>
          </View>
        </Animated.View>

        {instructionSteps.length > 0 && (
          <View style={styles.section}>
            <InstructionSteps instructions={instructionSteps} title="How To" />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottom }]}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout} activeOpacity={0.85}>
          <MaterialIcons name="play-arrow" size={24} color="#fff" />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </View>

      <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
      <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingTop: spacing.xs },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },

  heroCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    overflow: 'hidden',
    aspectRatio: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },

  infoCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLine: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  infoBold: {
    color: colors.text,
    fontWeight: '700',
  },
  infoMuted: {
    color: colors.textMuted,
    fontWeight: '500',
  },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: buttonHeight.lg,
    gap: spacing.sm,
  },
  startBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
