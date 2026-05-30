import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { useStore } from '../store/useStore';
import { getWorkoutPlanById, type WorkoutPlan, type WorkoutPlanExercise } from '../data/workoutPlans';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import AIFloatingButton from '../components/AIFloatingButton';
import AIFitnessAssistant from '../components/AIFitnessAssistant';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_H = (SCREEN_WIDTH - spacing.lg * 2) * 0.7;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

function Skeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            height: i === 1 ? CARD_H : 80,
            borderRadius: borderRadius.lg,
            backgroundColor: colors.skeleton,
            marginBottom: spacing.md,
          }}
        />
      ))}
    </View>
  );
}

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { workoutId } = route.params;
  const { plans, loading } = useWorkoutPlans();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);

  const plan = useMemo(() => {
    if (!plans.length) return null;
    return getWorkoutPlanById(plans, workoutId) || null;
  }, [plans, workoutId]);

  const currentExercise = plan?.exercises?.[focusedIndex] || null;
  const isLastExercise = plan ? focusedIndex >= plan.exercises.length - 1 : true;
  const nextExercise = !isLastExercise && plan ? plan.exercises[focusedIndex + 1] : null;
  const instructions = currentExercise?.instructions || [];

  const completedCount = useMemo(() => {
    if (!plan) return 0;
    return completedWorkoutLog.filter((cw) => cw.workoutId === plan.id).length;
  }, [completedWorkoutLog, plan]);

  const handleStart = useCallback(() => {
    if (!plan) return;
    nav.navigate('WorkoutTimer', { planJson: JSON.stringify(plan) });
  }, [plan, nav]);

  const goNext = useCallback(() => {
    if (!isLastExercise) setFocusedIndex((i) => i + 1);
  }, [isLastExercise]);

  const goPrev = useCallback(() => {
    if (focusedIndex > 0) setFocusedIndex((i) => i - 1);
  }, [focusedIndex]);

  if (loading) return <Skeleton />;
  if (!plan || !currentExercise) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <MaterialIcons name="error-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Workout not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{plan.title}</Text>
          <Text style={styles.headerSub}>
            Exercise {focusedIndex + 1} of {plan.exercises.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Exercise Image */}
        <View style={styles.imageSection}>
          <ExerciseMediaCard
            exercise={currentExercise}
            mode="preStart"
            height={CARD_H}
          />
        </View>

        {/* Exercise Title & Equipment */}
        <View style={styles.infoSection}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          {currentExercise.equipment && (
            <View style={styles.equipRow}>
              <MaterialIcons name="fitness-center" size={16} color={colors.textSecondary} />
              <Text style={styles.equipText}>{currentExercise.equipment}</Text>
            </View>
          )}
        </View>

        {/* Info Chips: sets, reps, rest, difficulty */}
        <View style={styles.chipsSection}>
          <View style={styles.chip}>
            <Text style={styles.chipBold}>{currentExercise.sets}</Text>
            <Text style={styles.chipLabel}> sets</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipBold}>{currentExercise.reps}</Text>
            <Text style={styles.chipLabel}> reps</Text>
          </View>
          <View style={styles.chip}>
            <MaterialIcons name="timer" size={15} color={colors.textMuted} />
            <Text style={styles.chipLabel}> {currentExercise.restSeconds}s</Text>
          </View>
          {currentExercise.difficulty && (
            <View
              style={[
                styles.chip,
                { borderColor: DIFFICULTY_COLORS[currentExercise.difficulty] + '40' },
              ]}
            >
              <Text
                style={[
                  styles.chipLabel,
                  { color: DIFFICULTY_COLORS[currentExercise.difficulty], fontWeight: '600' },
                ]}
              >
                {currentExercise.difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Target Muscles */}
        {currentExercise.targetMuscles?.length > 0 && (
          <View style={styles.muscleRow}>
            {currentExercise.targetMuscles.slice(0, 6).map((m) => (
              <View key={m} style={styles.muscleChip}>
                <Text style={styles.muscleText}>{m}</Text>
              </View>
            ))}
          </View>
        )}

        {/* How to Do It Section */}
        {instructions.length > 0 && (
          <View style={styles.instructionSection}>
            <View style={styles.instructionHeader}>
              <Text style={styles.sectionTitle}>How to do it</Text>
              <Text style={styles.sectionCount}>{instructions.length} steps</Text>
            </View>
            {instructions.map((step, i) => (
              <View key={i} style={styles.instructionCard}>
                <View style={styles.instructionBadge}>
                  <Text style={styles.instructionBadgeText}>STEP {i + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Exercise Card */}
        {nextExercise && (
          <View style={styles.nextSection}>
            <Text style={styles.sectionTitle}>Next Exercise</Text>
            <TouchableOpacity
              style={styles.nextCard}
              activeOpacity={0.85}
              onPress={goNext}
            >
              <View style={styles.nextNumWrap}>
                <Text style={styles.nextNum}>#{focusedIndex + 2}</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextName}>{nextExercise.name}</Text>
                <Text style={styles.nextMeta}>
                  {nextExercise.targetMuscles?.slice(0, 2).join(', ') || nextExercise.category}
                </Text>
                <View style={styles.nextStats}>
                  <Text style={styles.nextStatsText}>
                    {nextExercise.sets} sets · {nextExercise.reps} reps · {nextExercise.restSeconds}s rest
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {focusedIndex > 0 && (
          <TouchableOpacity style={styles.prevLink} onPress={goPrev}>
            <MaterialIcons name="keyboard-arrow-up" size={20} color={colors.textMuted} />
            <Text style={styles.prevLinkText}>Back to #{focusedIndex} {plan.exercises[focusedIndex - 1]?.name}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Start Workout Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <MaterialIcons
            name={completedCount > 0 ? 'play-circle-filled' : 'play-arrow'}
            size={24}
            color="#fff"
          />
          <Text style={styles.startBtnText}>
            {completedCount > 0 ? 'Continue Workout' : 'Start Workout'}
          </Text>
          <View style={styles.startBtnMeta}>
            <Text style={styles.startBtnMetaText}>{plan.exerciseCount} ex</Text>
            <Text style={styles.startBtnMetaDot}> </Text>
            <Text style={styles.startBtnMetaText}>{plan.duration} min</Text>
          </View>
        </TouchableOpacity>
      </View>

      <AIFloatingButton
        bottom={insets.bottom + buttonHeight.lg + spacing.xl}
        onPress={() => setShowAIAssistant(true)}
      />
      <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    flex: 1,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  backBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  backBtnText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 1,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // Image Section
  imageSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  // Info Section
  infoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  exerciseName: {
    color: '#fff',
    fontSize: fontSize.title,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  equipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equipText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Chips
  chipsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm + 2,
    height: 36,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipBold: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Muscles
  muscleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  muscleChip: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  muscleText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },

  // Instructions
  instructionSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  instructionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  instructionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionBadge: {
    marginBottom: spacing.xs,
  },
  instructionBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },

  // Next Exercise
  nextSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  nextNumWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextNum: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  nextInfo: {
    flex: 1,
  },
  nextName: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  nextMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 1,
    textTransform: 'capitalize',
  },
  nextStats: {
    marginTop: 2,
  },
  nextStatsText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  prevLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  prevLinkText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Bottom Bar
  bottomBar: {
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
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
  startBtnMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: spacing.lg,
    gap: 4,
  },
  startBtnMetaText: {
    fontSize: fontSize.sm,
    color: '#fff',
    opacity: 0.8,
    fontWeight: '600',
  },
  startBtnMetaDot: {
    fontSize: fontSize.sm,
    color: '#fff',
    opacity: 0.5,
  },
});
