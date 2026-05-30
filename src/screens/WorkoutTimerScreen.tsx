import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { Image } from 'expo-image';
import SetTrackerRow from '../components/SetTrackerRow';
import BottomSheetModal from '../components/BottomSheetModal';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import InstructionSteps from '../components/InstructionSteps';
import { getWorkoutExerciseImageUrls } from '../utils/image';
import AIFitnessAssistant from '../components/AIFitnessAssistant';
import AIFloatingButton from '../components/AIFloatingButton';
import {
  setCurrentWorkoutSessionForAI,
  clearFitnessAIScreenContext,
} from '../services/fitnessAiContext';
import type { WorkoutPlan } from '../data/workoutPlans';

type TimerRoute = RouteProp<RootStackParamList, 'WorkoutTimer'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_COLORS: Record<string, string> = {
  Chest: '#EF4444',
  Back: '#10B981',
  Arms: '#F59E0B',
  Core: '#3B82F6',
  Legs: '#FF7A1A',
  Shoulder: '#EC4899',
};

const TIMED_KEYWORDS = ['plank', 'hold', 'stretch', 'wall sit', 'bridge', 'dead hang', 'hollow', 'pose'];

const MOTIVATION_MESSAGES = [
  'Great job! Keep going!',
  'You are doing amazing!',
  'Almost there - stay strong!',
  'One rep at a time!',
  'Every rep counts!',
  'You have got this!',
  'Push through - you are stronger than you think!',
  'Consistency is key - well done!',
  'Breathe and focus!',
  'Making progress every second!',
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function WorkoutTimerScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<TimerRoute>();
  const navigation = useNavigation<Nav>();
  const addCompletedWorkout = useStore((s) => s.addCompletedWorkout);

  const plan = useMemo<WorkoutPlan>(
    () => JSON.parse(route.params.planJson),
    [route.params.planJson],
  );
  const exercises = plan.exercises;

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'active' | 'rest' | 'completed' | 'finished'>('active');
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());
  const [totalDuration, setTotalDuration] = useState(0);
  const [motivationIndex, setMotivationIndex] = useState(0);
  const [setData, setSetData] = useState<{ kg: number; reps: number; completed: boolean }[]>([]);
  const [showFinishSheet, setShowFinishSheet] = useState(false);
  const [showCompleteSheet, setShowCompleteSheet] = useState(false);
  const [showQuitSheet, setShowQuitSheet] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const startTimeRef = useRef(Date.now());
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  const currentExercise = exercises[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex >= exercises.length - 1;
  const nextExercise = !isLastExercise ? exercises[currentExerciseIndex + 1] : null;
  const totalExercises = exercises.length;
  const allSetsComplete = currentSet > (currentExercise?.sets || 0);
  const totalSets = useMemo(() => exercises.reduce((s, e) => s + e.sets, 0), [exercises]);
  const completedSetCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentExerciseIndex; i++) count += exercises[i].sets;
    count += currentSet - 1;
    return count;
  }, [currentExerciseIndex, currentSet, exercises]);
  const progress = totalSets > 0 ? completedSetCount / totalSets : 0;
  const isTimed = useMemo(
    () => TIMED_KEYWORDS.some((k) => currentExercise?.name.toLowerCase().includes(k)),
    [currentExercise],
  );
  const categoryColor = CATEGORY_COLORS[currentExercise?.category || ''] || colors.primary;

  const finishWorkout = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);

    const exCompleted = Math.min(completedExerciseIds.size + 1, exercises.length);
    const duration = totalDuration;

    addCompletedWorkout({
      workoutId: plan.id,
      workoutTitle: plan.title,
      completedAt: new Date().toISOString(),
      duration,
      exercisesCompleted: exCompleted,
      totalExercises: exercises.length,
      calories: plan.calories,
      category: plan.category,
      difficulty: plan.difficulty,
      targetMuscles: plan.targetMuscles,
      planId: plan.id,
      source: plan.source || 'home',
    });

    navigation.replace('WorkoutComplete', {
      workoutId: plan.id,
      duration,
      exercisesCompleted: exCompleted,
      totalExercises: exercises.length,
      calories: plan.calories,
      workoutTitle: plan.title,
      category: plan.category,
      difficulty: plan.difficulty,
      targetMusclesJson: JSON.stringify(plan.targetMuscles),
      planId: plan.id,
    });
  }, [totalDuration, completedExerciseIds, exercises.length, plan, addCompletedWorkout, navigation]);

  const finishWorkoutRef = useRef(finishWorkout);
  useEffect(() => { finishWorkoutRef.current = finishWorkout; }, [finishWorkout]);

  const goToNextExercise = useCallback(() => {
    if (currentExerciseIndex >= exercises.length - 1) {
      setPhase('finished');
      finishWorkoutRef.current();
    } else {
      setCompletedExerciseIds((prev) => new Set(prev).add(currentExercise.exerciseId));
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setExerciseTimer(0);
      setPhase('active');
    }
  }, [currentExerciseIndex, exercises.length, currentExercise?.exerciseId]);

  const goToNextRef = useRef(goToNextExercise);
  useEffect(() => { goToNextRef.current = goToNextExercise; }, [goToNextExercise]);

  useEffect(() => {
    setCurrentWorkoutSessionForAI(plan, currentExerciseIndex);
  }, [plan, currentExerciseIndex]);

  useEffect(() => {
    const nextIdx = currentExerciseIndex + 1;
    if (nextIdx < exercises.length) {
      const urls = getWorkoutExerciseImageUrls(exercises[nextIdx]);
      urls.forEach((url) => { if (url) Image.prefetch(url); });
    }
  }, [currentExerciseIndex, exercises]);

  useEffect(() => () => clearFitnessAIScreenContext(), []);

  useEffect(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      tension: 50,
      friction: 10,
      useNativeDriver: true,
    }).start();
    if (currentExercise) {
      setSetData(
        [...Array(currentExercise.sets)].map(() => ({
          kg: 0,
          reps: currentExercise.reps,
          completed: false,
        }))
      );
    }
  }, [currentExerciseIndex]);

  useEffect(() => {
    if (isPaused || phase === 'finished') return;
    const interval = setInterval(() => {
      setTotalDuration((p) => p + 1);
      if (phase === 'active') setExerciseTimer((p) => p + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, phase]);

  useEffect(() => {
    if (isPaused || phase !== 'rest') return;
    restIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    };
  }, [isPaused, phase]);

  useEffect(() => {
    if (phase === 'rest' && restTimer === 0 && !isPaused && currentExercise) {
      const id = setTimeout(() => goToNextRef.current(), 100);
      return () => clearTimeout(id);
    }
  }, [phase, restTimer, isPaused, currentExercise]);

  useEffect(() => {
    if (phase === 'completed') {
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
      ]).start(() => {
        if (isLastExercise) {
          setPhase('finished');
          finishWorkoutRef.current();
        } else {
          setPhase('rest');
          setCurrentSet(1);
          setExerciseTimer(0);
          setRestTimer(currentExercise.restSeconds || 60);
        }
      });
    }
    return () => { checkScale.setValue(0); };
  }, [phase]);

  const handleCompleteSet = useCallback((setIndex: number) => {
    if (phase !== 'active' || !currentExercise) return;
    setSetData((prev) => {
      const next = [...prev];
      next[setIndex] = { ...next[setIndex], completed: true };
      return next;
    });
    setShowCompleteSheet(true);
  }, [phase, currentExercise]);

  const advanceAfterSetComplete = useCallback(() => {
    setShowCompleteSheet(false);
    setMotivationIndex((prev) => (prev + 1) % MOTIVATION_MESSAGES.length);
    if (!currentExercise) return;
    if (currentSet >= currentExercise.sets) {
      setCompletedExerciseIds((prev) => new Set(prev).add(currentExercise.exerciseId));
      setPhase('completed');
      setCurrentSet((prev) => prev + 1);
    } else {
      setCurrentSet((prev) => prev + 1);
    }
  }, [currentExercise, currentSet]);

  const handleKgChange = useCallback((setIndex: number, value: number) => {
    setSetData((prev) => {
      const next = [...prev];
      next[setIndex] = { ...next[setIndex], kg: value };
      return next;
    });
  }, []);

  const handleRepsChange = useCallback((setIndex: number, value: number) => {
    setSetData((prev) => {
      const next = [...prev];
      next[setIndex] = { ...next[setIndex], reps: value };
      return next;
    });
  }, []);

  const handleSkipRest = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer(0);
    goToNextRef.current();
  }, []);

  const handleSkipExercise = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer(0);
    setPhase('active');
    setCompletedExerciseIds((prev) => {
      const next = new Set(prev);
      next.add(currentExercise.exerciseId);
      return next;
    });
    goToNextRef.current();
  }, [currentExercise?.exerciseId]);

  const handlePrevExercise = useCallback(() => {
    if (currentExerciseIndex <= 0 || currentSet > 1) return;
    setCurrentExerciseIndex((prev) => prev - 1);
    setCurrentSet(1);
    setExerciseTimer(0);
    setPhase('active');
  }, [currentExerciseIndex, currentSet]);

  const handlePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleQuit = useCallback(() => {
    setShowQuitSheet(true);
  }, []);

  const confirmQuit = useCallback(() => {
    setShowQuitSheet(false);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    navigation.goBack();
  }, [navigation]);

  const handleEndWorkout = useCallback(() => {
    setShowFinishSheet(true);
  }, []);

  if (!exercises.length) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <MaterialIcons name="fitness-center" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No exercises in this plan</Text>
        </View>
      </View>
    );
  }

  if (!currentExercise) return null;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  const renderImageCard = () => {
    const cardWidth = SCREEN_WIDTH - 48;
    const cardHeight = Math.min(260, cardWidth * 0.62);

    return (
      <Animated.View
        style={[
          styles.imageCardWhite,
          {
            width: cardWidth,
            height: cardHeight,
            transform: [{ translateX }],
            opacity: slideAnim,
          },
        ]}
      >
        <ExerciseMediaCard
          exercise={currentExercise}
          mode="activeSession"
          height={cardHeight}
        />
      </Animated.View>
    );
  };

  const renderInfoCard = () => (
    <Animated.View
      style={[
        styles.infoCard,
        { borderColor: categoryColor + '30', transform: [{ translateX }], opacity: slideAnim },
      ]}
    >
      <Text style={[styles.categoryTag, { color: categoryColor }]}>
        {currentExercise.category.toUpperCase()}
      </Text>
      <Text style={styles.exerciseName}>{currentExercise.name}</Text>
      <Text style={styles.setBadge}>Set {currentSet} of {currentExercise.sets}</Text>

      <View style={styles.chipRow}>
        {currentExercise.targetMuscles.slice(0, 4).map((m) => (
          <View key={m} style={[styles.chip, { backgroundColor: categoryColor + '18' }]}>
            <View style={[styles.chipDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.chipText, { color: categoryColor }]}>{m}</Text>
          </View>
        ))}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <MaterialIcons name="fitness-center" size={12} color={colors.textSecondary} />
          <Text style={styles.metaPillText}>{currentExercise.equipment}</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialIcons name="signal-cellular-alt" size={12} color={colors.textSecondary} />
          <Text style={styles.metaPillText}>{currentExercise.difficulty}</Text>
        </View>
        <View style={styles.metaPill}>
          <MaterialIcons name="repeat" size={12} color={colors.textSecondary} />
          <Text style={styles.metaPillText}>
            {isTimed ? `${currentExercise.reps}s` : `${currentExercise.reps} reps`}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.setDots}>
        {setData.map((sd, i) => (
          <View
            key={i}
            style={[
              styles.setDot,
              sd.completed && styles.setDotCompleted,
              i === currentSet - 1 && !sd.completed && styles.setDotActive,
            ]}
          />
        ))}
      </View>

      {phase === 'rest' && (
        <View style={styles.phaseSection}>
          <Text style={styles.restLabel}>Rest</Text>
          <Text style={styles.restTimerText}>{formatTime(restTimer)}</Text>
          <TouchableOpacity onPress={handleSkipRest} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip Rest</Text>
          </TouchableOpacity>
          {nextExercise && (
            <View style={styles.nextPreview}>
              <Text style={styles.nextLabel}>Next:</Text>
              <Text style={styles.nextName}>{nextExercise.name}</Text>
              <Text style={styles.nextMeta}>{nextExercise.sets} sets · {nextExercise.reps} reps</Text>
            </View>
          )}
        </View>
      )}

      {phase === 'completed' && (
        <View style={styles.phaseSection}>
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <View style={styles.checkCircle}>
              <MaterialIcons name="check" size={36} color="#fff" />
            </View>
          </Animated.View>
          <Text style={styles.completedText}>Exercise Complete!</Text>
          <Text style={styles.completedSub}>Great work</Text>
        </View>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit} style={styles.iconBtn}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{plan.title}</Text>
        <TouchableOpacity onPress={handlePause} style={styles.iconBtn}>
          <MaterialIcons name={isPaused ? 'play-arrow' : 'pause'} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>
          Exercise {currentExerciseIndex + 1} of {totalExercises}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {renderImageCard()}
        {renderInfoCard()}

        {/* Set Tracking Table */}
        {phase === 'active' && setData.length > 0 && (
          <View style={styles.trackingSection}>
            <Text style={styles.trackingTitle}>Set Tracking</Text>
            {setData.map((sd, i) => (
              <SetTrackerRow
                key={i}
                setNumber={i + 1}
                kg={sd.kg}
                reps={sd.reps}
                completed={sd.completed}
                isActive={i === currentSet - 1}
                lastKg={i > 0 ? setData[i - 1].kg : undefined}
                lastReps={i > 0 ? setData[i - 1].reps : undefined}
                onKgChange={(v) => handleKgChange(i, v)}
                onRepsChange={(v) => handleRepsChange(i, v)}
                onComplete={() => handleCompleteSet(i)}
              />
            ))}
          </View>
        )}

        {/* Timer Display */}
        {phase === 'active' && (
          <View style={styles.timerStrip}>
            <MaterialIcons name="timer" size={16} color={colors.textMuted} />
            <Text style={styles.timerStripText}>{formatTime(exerciseTimer)}</Text>
            <Text style={styles.timerStripLabel}>elapsed</Text>
          </View>
        )}

        {phase === 'active' && currentExercise.instructions.length > 0 && (
          <View style={styles.instructionsWrap}>
            <InstructionSteps
              instructions={currentExercise.instructions}
              title="Form Guide"
              collapsible
              defaultExpanded={false}
              maxVisible={2}
            />
          </View>
        )}

        {phase === 'active' && (
          <View style={styles.motivationSection}>
            <MaterialIcons name="mood" size={16} color={colors.success} />
            <Text style={styles.motivationText}>{MOTIVATION_MESSAGES[motivationIndex]}</Text>
          </View>
        )}

        <View style={styles.quickControls}>
          <TouchableOpacity
            onPress={handlePrevExercise}
            style={[styles.quickBtn, (currentExerciseIndex === 0 || currentSet > 1) && styles.quickBtnDisabled]}
            disabled={currentExerciseIndex === 0 || currentSet > 1}
          >
            <MaterialIcons
              name="skip-previous"
              size={22}
              color={currentExerciseIndex === 0 || currentSet > 1 ? colors.textMuted : colors.text}
            />
            <Text style={[styles.quickBtnText, (currentExerciseIndex === 0 || currentSet > 1) && { color: colors.textMuted }]}>Prev</Text>
          </TouchableOpacity>

          {phase === 'active' && (
            <TouchableOpacity onPress={handleSkipExercise} style={styles.quickBtn}>
              <MaterialIcons name="skip-next" size={22} color={colors.text} />
              <Text style={styles.quickBtnText}>Skip</Text>
            </TouchableOpacity>
          )}

          {phase === 'rest' && (
            <TouchableOpacity onPress={handleSkipRest} style={styles.quickBtn}>
              <MaterialIcons name="skip-next" size={22} color={colors.text} />
              <Text style={styles.quickBtnText}>Skip Rest</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleEndWorkout} style={styles.quickBtn}>
            <MaterialIcons name="stop" size={22} color={colors.error} />
            <Text style={[styles.quickBtnText, { color: colors.error }]}>End</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Set Complete Bottom Sheet */}
      <BottomSheetModal
        visible={showCompleteSheet}
        onClose={() => setShowCompleteSheet(false)}
        title="Set Complete!"
        subtitle="Great work on that set"
        actions={[
          {
            label: 'Continue',
            variant: 'primary',
            icon: 'arrow-forward',
            onPress: advanceAfterSetComplete,
          },
        ]}
      />

      {/* Finish Workout Bottom Sheet */}
      <BottomSheetModal
        visible={showFinishSheet}
        onClose={() => setShowFinishSheet(false)}
        title="Finish Workout?"
        subtitle="This will complete your session"
        actions={[
          {
            label: 'Complete Workout',
            variant: 'primary',
            icon: 'check-circle',
            onPress: () => {
              setShowFinishSheet(false);
              finishWorkoutRef.current();
            },
          },
          {
            label: 'Cancel',
            variant: 'secondary',
            onPress: () => setShowFinishSheet(false),
          },
        ]}
      />

      {/* Quit Workout Bottom Sheet */}
      <BottomSheetModal
        visible={showQuitSheet}
        onClose={() => setShowQuitSheet(false)}
        title="End Workout?"
        subtitle="Your progress will be saved"
        actions={[
          {
            label: 'End Workout',
            variant: 'destructive',
            icon: 'exit-to-app',
            onPress: confirmQuit,
          },
          {
            label: 'Cancel',
            variant: 'secondary',
            onPress: () => setShowQuitSheet(false),
          },
        ]}
      />

      <AIFloatingButton
        bottom={insets.bottom + spacing.lg}
        onPress={() => setShowAIAssistant(true)}
      />
      <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
          <View style={styles.pauseContent}>
            <MaterialIcons name="pause-circle-outline" size={72} color={colors.primary} />
            <Text style={styles.pauseTitle}>Workout Paused</Text>
            <Text style={styles.pauseSubtitle}>{formatTime(totalDuration)} elapsed</Text>
            <TouchableOpacity onPress={handlePause} activeOpacity={0.85} style={styles.resumeBtn}>
              <MaterialIcons name="play-arrow" size={22} color="#fff" />
              <Text style={styles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleQuit} style={styles.quitBtn}>
              <Text style={styles.quitBtnText}>Quit Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },

  progressSection: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  progressLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.xs },
  progressTrack: {
    height: 4, backgroundColor: colors.cardElevated, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  progressPct: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '500', textAlign: 'right', marginTop: 2 },

  body: { flex: 1 },
  bodyContent: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.md },

  imageCardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginTop: 24,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  infoCard: {
    backgroundColor: '#151515',
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  instructionsWrap: {
    marginBottom: spacing.sm,
  },
  categoryTag: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: spacing.xs },
  exerciseName: { color: '#fff', fontSize: fontSize.title, fontWeight: '800', marginBottom: spacing.xs },
  setBadge: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.md },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: fontSize.xs, fontWeight: '600' },

  metaRow: { flexDirection: 'row', gap: spacing.sm },
  metaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
  },
  metaPillText: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '500' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  setDots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  setDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.cardElevated },
  setDotCompleted: { backgroundColor: colors.success },
  setDotActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primary + '30' },

  phaseSection: { alignItems: 'center', gap: spacing.sm },
  timerText: {
    color: '#fff', fontSize: fontSize.giant, fontWeight: '800',
    fontVariant: ['tabular-nums'], letterSpacing: 2,
  },
  timerLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  primaryBtn: {
    width: '100%', borderRadius: borderRadius.lg,
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    gap: spacing.sm, marginTop: spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },

  restLabel: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  restTimerText: {
    color: colors.warning, fontSize: 52, fontWeight: '800',
    fontVariant: ['tabular-nums'], letterSpacing: 2,
  },
  skipBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  skipBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },

  nextPreview: {
    backgroundColor: colors.cardElevated, borderRadius: borderRadius.md,
    padding: spacing.md, width: '100%', alignItems: 'center', marginTop: spacing.sm,
  },
  nextLabel: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  nextName: { color: '#fff', fontSize: fontSize.md, fontWeight: '700', marginTop: 2 },
  nextMeta: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500', marginTop: 2 },

  checkCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  completedText: { color: colors.success, fontSize: fontSize.xl, fontWeight: '800' },
  completedSub: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '500' },

  trackingSection: {
    marginBottom: spacing.sm,
  },
  trackingTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  timerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  timerStripText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerStripLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  motivationSection: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    justifyContent: 'center', paddingVertical: spacing.sm,
  },
  motivationText: { color: colors.success, fontSize: fontSize.sm, fontWeight: '700', lineHeight: 20 },

  quickControls: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
  },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.cardElevated,
  },
  quickBtnDisabled: { opacity: 0.4 },
  quickBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },

  pauseOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  pauseContent: { alignItems: 'center', gap: spacing.md },
  pauseTitle: { color: '#fff', fontSize: fontSize.title, fontWeight: '800' },
  pauseSubtitle: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: '600', fontVariant: ['tabular-nums'] },
  resumeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: borderRadius.full, marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  resumeBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  quitBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: borderRadius.full },
  quitBtnText: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '500' },
});
