import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import AppModal from '../components/AppModal';
import BottomSheetModal from '../components/BottomSheetModal';
import type { WorkoutPlan } from '../data/workoutPlans';
import type { CompletedSetEntry } from '../types';

type TimerRoute = RouteProp<RootStackParamList, 'WorkoutTimer'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

type Phase = 'getReady' | 'active' | 'rest' | 'transition' | 'finished';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_SIDE = 16;
const MEDIA_WIDTH = SCREEN_WIDTH - MEDIA_SIDE * 2;
const MEDIA_HEIGHT = MEDIA_WIDTH;
const MEDIA_RADIUS = 24;

if (require('react-native').Platform.OS === 'android' && (require('react-native').UIManager as any).setLayoutAnimationEnabledExperimental) {
  (require('react-native').UIManager as any).setLayoutAnimationEnabledExperimental(true);
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
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
  const [phase, setPhase] = useState<Phase>('getReady');
  const [countdown, setCountdown] = useState(3);
  const [restTimer, setRestTimer] = useState(0);
  const [timeAccum, setTimeAccum] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimedRunning, setIsTimedRunning] = useState(false);
  const [showFormGuide, setShowFormGuide] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showEndSheet, setShowEndSheet] = useState(false);
  const [setLog, setSetLog] = useState<CompletedSetEntry[]>([]);

  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const setLogRef = useRef<CompletedSetEntry[]>([]);

  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;
  const isLastExercise = currentExerciseIndex >= exercises.length - 1;
  const nextExercise = !isLastExercise ? exercises[currentExerciseIndex + 1] : null;
  const totalSetsAll = useMemo(() => exercises.reduce((s, e) => s + e.sets, 0), [exercises]);
  const isTimedExercise = currentExercise?.type === 'time';
  const isWeightedExercise = currentExercise?.type === 'weight_reps';

  const targetSeconds = isTimedExercise ? Math.max(1, currentExercise?.reps || 30) : 0;
  const defaultReps = currentExercise?.reps || 10;

  const completedSetCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentExerciseIndex; i++) count += exercises[i].sets;
    count += setLog.filter((s) => s.completed).length;
    return count;
  }, [currentExerciseIndex, setLog, exercises]);
  const overallProgress = totalSetsAll > 0 ? completedSetCount / totalSetsAll : 0;

  const currentSetNumber = useMemo(() => {
    const idx = setLog.findIndex((s) => !s.completed);
    return idx === -1 ? setLog.length : idx + 1;
  }, [setLog]);

  useEffect(() => {
    setLogRef.current = setLog;
  }, [setLog]);

  useEffect(() => {
    if (!currentExercise) return;
    const isTimed = currentExercise.type === 'time';
    const initial: CompletedSetEntry[] = Array.from({ length: currentExercise.sets }).map(() => ({
      kg: isTimed ? null : null,
      reps: isTimed ? 0 : defaultReps,
      timeSec: isTimed ? targetSeconds : undefined,
      completed: false,
    }));
    setSetLog(initial);
    setTimeAccum(0);
    setIsTimedRunning(false);
    setShowFormGuide(false);
  }, [currentExerciseIndex]);

  useEffect(() => {
    if (isPaused || phase === 'finished') return;
    totalIntervalRef.current = setInterval(() => {}, 1000);
    return () => {
      if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    };
  }, [isPaused, phase]);

  useEffect(() => {
    if (phase !== 'getReady') return;
    setCountdown(3);
    countdownAnim.setValue(0);
    Animated.spring(countdownAnim, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          setPhase('active');
          return 0;
        }
        countdownAnim.setValue(0);
        Animated.spring(countdownAnim, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }).start();
        Haptics.selectionAsync().catch(() => {});
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (isPaused || phase !== 'rest') return;
    restIntervalRef.current = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          if (restIntervalRef.current) clearInterval(restIntervalRef.current);
          setPhase('active');
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
    if (isPaused || phase !== 'active' || !isTimedExercise || !isTimedRunning) return;
    timedIntervalRef.current = setInterval(() => {
      setTimeAccum((p) => {
        const next = p + 1;
        if (next >= targetSeconds) {
          if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          markCurrentSetComplete();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    };
  }, [isPaused, phase, isTimedExercise, isTimedRunning]);

  const markCurrentSetComplete = useCallback(() => {
    setSetLog((prev) => {
      if (!prev.length) return prev;
      const idx = prev.findIndex((s) => !s.completed);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], completed: true };
      return next;
    });
  }, []);

  const finishWorkout = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);

    const setLogToSave: { exerciseId: string; sets: CompletedSetEntry[] }[] = exercises.map(
      (ex) => {
        if (ex.exerciseId === currentExercise?.exerciseId) {
          return { exerciseId: ex.exerciseId, sets: setLogRef.current };
        }
        return { exerciseId: ex.exerciseId, sets: [] };
      },
    );

    const allCompleted = setLogRef.current.every((s) => s.completed);
    const completedCount = allCompleted ? exercises.length : currentExerciseIndex;

    addCompletedWorkout({
      workoutId: plan.id,
      workoutTitle: plan.title,
      completedAt: new Date().toISOString(),
      duration: 0,
      exercisesCompleted: completedCount,
      totalExercises: exercises.length,
      calories: plan.calories,
      category: plan.category,
      difficulty: plan.difficulty,
      targetMuscles: plan.targetMuscles,
      planId: plan.id,
      source: plan.source || 'home',
      setLog: setLogToSave,
    });

    setPhase('finished');
    navigation.replace('WorkoutComplete', {
      workoutId: plan.id,
      duration: 0,
      exercisesCompleted: completedCount,
      totalExercises: exercises.length,
      calories: plan.calories,
      workoutTitle: plan.title,
      category: plan.category,
      difficulty: plan.difficulty,
      targetMusclesJson: JSON.stringify(plan.targetMuscles),
      planId: plan.id,
      setLogJson: JSON.stringify(setLogToSave),
    });
  }, [exercises, currentExercise, currentExerciseIndex, plan, addCompletedWorkout, navigation]);

  const advanceAfterSet = useCallback(() => {
    setIsTimedRunning(false);
    setTimeAccum(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const allDone = setLogRef.current.every((s) => s.completed);
    if (allDone) {
      if (isLastExercise) {
        finishWorkout();
        return;
      }
      setPhase('transition');
      return;
    }
    setPhase('rest');
    setRestTimer(currentExercise?.restSeconds || 45);
  }, [isLastExercise, currentExercise, finishWorkout]);

  const handleLogSet = useCallback(() => {
    if (phase !== 'active' || !currentExercise) return;
    markCurrentSetComplete();
    advanceAfterSet();
  }, [phase, currentExercise, markCurrentSetComplete, advanceAfterSet]);

  const handleStartTimed = useCallback(() => {
    setIsTimedRunning(true);
    setTimeAccum(0);
  }, []);

  const handleStopTimed = useCallback(() => {
    setIsTimedRunning(false);
    markCurrentSetComplete();
    advanceAfterSet();
  }, [markCurrentSetComplete, advanceAfterSet]);

  const handleSkipSet = useCallback(() => {
    setIsTimedRunning(false);
    setTimeAccum(0);
    markCurrentSetComplete();
    advanceAfterSet();
  }, [markCurrentSetComplete, advanceAfterSet]);

  const handleUpdateReps = useCallback((setIdx: number, value: string) => {
    const n = parseInt(value, 10);
    setSetLog((prev) => {
      const next = [...prev];
      next[setIdx] = { ...next[setIdx], reps: Number.isFinite(n) ? Math.max(0, n) : 0 };
      return next;
    });
  }, []);

  const handleUpdateKg = useCallback((setIdx: number, value: string) => {
    const n = parseFloat(value);
    setSetLog((prev) => {
      const next = [...prev];
      next[setIdx] = {
        ...next[setIdx],
        kg: Number.isFinite(n) && n > 0 ? n : null,
      };
      return next;
    });
  }, []);

  const handleAddSet = useCallback(() => {
    setSetLog((prev) => {
      const last = prev[prev.length - 1];
      return [
        ...prev,
        {
          kg: last?.kg ?? null,
          reps: last?.reps ?? defaultReps,
          timeSec: isTimedExercise ? targetSeconds : undefined,
          completed: false,
        },
      ];
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [defaultReps, isTimedExercise, targetSeconds]);

  const handleSkipRest = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer(0);
    setPhase('active');
  }, []);

  const handleAdd15s = useCallback(() => {
    setRestTimer((p) => p + 15);
  }, []);

  const handleStartNextSet = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer(0);
    setPhase('active');
  }, []);

  const handleStartNextExercise = useCallback(() => {
    setCurrentExerciseIndex((p) => p + 1);
    setShowFormGuide(false);
    setPhase('active');
  }, []);

  const handleSkipExercise = useCallback(() => {
    if (!currentExercise) return;
    if (isLastExercise) {
      finishWorkout();
      return;
    }
    setPhase('transition');
  }, [currentExercise, isLastExercise, finishWorkout]);

  const handlePause = useCallback(() => setShowPauseModal(true), []);
  const handleResume = useCallback(() => {
    setShowPauseModal(false);
    setIsPaused(false);
  }, []);
  const handleEndRequest = useCallback(() => {
    setShowPauseModal(false);
    setShowEndSheet(true);
  }, []);
  const handleEndOpen = useCallback(() => setShowEndSheet(true), []);
  const confirmEnd = useCallback(() => {
    setShowEndSheet(false);
    setShowPauseModal(false);
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    navigation.goBack();
  }, [navigation]);
  const handleSkipGetReady = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(0);
    setPhase('active');
  }, []);

  useEffect(() => {
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current);
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (totalIntervalRef.current) clearInterval(totalIntervalRef.current);
    };
  }, []);

  if (!exercises.length || !currentExercise) {
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

  // ──────────────────────────────────────────────
  // GET READY
  // ──────────────────────────────────────────────
  if (phase === 'getReady') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleEndOpen} style={styles.iconBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{plan.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.getReadyContent}>
          <Text style={styles.getReadyLabel}>Get Ready</Text>
          <Animated.View
            style={[
              styles.countdownCircle,
              {
                transform: [
                  {
                    scale: countdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ],
                opacity: countdownAnim,
              },
            ]}
          >
            <Text style={styles.countdownNumber}>{countdown}</Text>
          </Animated.View>
          <Text style={styles.getReadyNext}>
            First: <Text style={styles.getReadyNextName}>{currentExercise.name}</Text>
          </Text>
          <Text style={styles.getReadyHint}>Prepare your position</Text>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSkipGetReady} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Start Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  // REST
  // ──────────────────────────────────────────────
  if (phase === 'rest') {
    const completedHere = setLog.filter((s) => s.completed).length;
    const totalHere = setLog.length;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleEndOpen} style={styles.iconBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rest</Text>
          <TouchableOpacity onPress={handlePause} style={styles.iconBtn}>
            <MaterialIcons name="pause" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.restContent}>
          <Text style={styles.restLabel}>REST TIME</Text>
          <Text style={styles.restTimerText}>{formatTime(restTimer)}</Text>
          <Text style={styles.restHint}>Relax. Next set is coming.</Text>

          <View style={styles.restSummary}>
            <View style={styles.restSummaryRow}>
              <Text style={styles.restSummaryLabel}>Completed</Text>
              <Text style={styles.restSummaryValue}>
                Set {Math.max(1, completedHere)} of {totalHere}
              </Text>
            </View>
            <View style={styles.restSummaryRow}>
              <Text style={styles.restSummaryLabel}>Next</Text>
              <Text style={styles.restSummaryValue}>
                Set {Math.min(totalHere, completedHere + 1)} of {totalHere}
              </Text>
            </View>
          </View>

          <View style={styles.setDotsLarge}>
            {setLog.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.setDotLarge,
                  s.completed && styles.setDotLargeDone,
                  !s.completed && i === currentSetNumber - 1 && styles.setDotLargeActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.restRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleAdd15s}>
              <Text style={styles.secondaryBtnText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1.5 }]}
              onPress={handleStartNextSet}
            >
              <Text style={styles.primaryBtnText}>Start Next Set</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkipRest}>
              <Text style={styles.secondaryBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AppModal
          visible={showPauseModal}
          onClose={handleResume}
          title="Workout Paused"
          message="Take a break. Resume when you're ready."
          actions={[
            { label: 'Resume', onPress: handleResume, variant: 'primary' },
            { label: 'End Workout', onPress: handleEndRequest, variant: 'destructive' },
          ]}
        />
        <BottomSheetModal
          visible={showEndSheet}
          onClose={() => setShowEndSheet(false)}
          title="End Workout?"
          subtitle="Your progress will be saved."
          actions={[
            { label: 'End Workout', onPress: confirmEnd, variant: 'destructive', icon: 'stop' },
            { label: 'Cancel', onPress: () => setShowEndSheet(false), variant: 'secondary' },
          ]}
        />
      </View>
    );
  }

  // ──────────────────────────────────────────────
  // TRANSITION
  // ──────────────────────────────────────────────
  if (phase === 'transition' && nextExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Next Exercise</Text>
          <TouchableOpacity onPress={handleEndOpen} style={styles.iconBtn}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.transitionContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.checkCircle}>
            <MaterialIcons name="check" size={40} color="#fff" />
          </View>
          <Text style={styles.transitionDone}>{currentExercise.name} Completed</Text>

          <View style={styles.transitionNextCard}>
            <Text style={styles.transitionNextLabel}>NEXT</Text>
            <Text style={styles.transitionNextName}>{nextExercise.name}</Text>
            <Text style={styles.transitionNextMeta}>
              {nextExercise.sets} sets × {nextExercise.reps}{' '}
              {nextExercise.type === 'time' ? 'sec' : 'reps'} · {nextExercise.restSeconds}s rest
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartNextExercise} activeOpacity={0.85}>
            <MaterialIcons name="play-arrow" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Start {nextExercise.name}</Text>
          </TouchableOpacity>
        </View>

        <AppModal
          visible={showPauseModal}
          onClose={handleResume}
          title="Workout Paused"
          message="Take a break. Resume when you're ready."
          actions={[
            { label: 'Resume', onPress: handleResume, variant: 'primary' },
            { label: 'End Workout', onPress: handleEndRequest, variant: 'destructive' },
          ]}
        />
        <BottomSheetModal
          visible={showEndSheet}
          onClose={() => setShowEndSheet(false)}
          title="End Workout?"
          subtitle="Your progress will be saved."
          actions={[
            { label: 'End Workout', onPress: confirmEnd, variant: 'destructive', icon: 'stop' },
            { label: 'Cancel', onPress: () => setShowEndSheet(false), variant: 'secondary' },
          ]}
        />
      </View>
    );
  }

  // ──────────────────────────────────────────────
  // ACTIVE - render 3 branches
  // ──────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleEndOpen} style={styles.iconBtn}>
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>
        <TouchableOpacity onPress={handlePause} style={styles.iconBtn}>
          <MaterialIcons name="pause" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallProgress * 100}%` }]} />
        </View>
        <Text style={styles.progressPct}>{Math.round(overallProgress * 100)}%</Text>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* IMAGE - no text overlay, 1:1 square */}
        <View style={styles.gifWrap}>
          <ExerciseMediaCard
            exercise={currentExercise}
            mode="activeSession"
            aspectRatio={1}
            contentFit="contain"
            rounded={MEDIA_RADIUS}
          />
        </View>

        {/* Title BELOW the image */}
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <View style={styles.exerciseMetaRow}>
            <Text style={styles.exerciseMeta}>
              {currentExercise.targetMuscles?.[0] || currentExercise.category}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.exerciseMeta}>{currentExercise.equipment}</Text>
          </View>
        </View>

        {/* Helper line */}
        <View style={styles.helperLine}>
          <MaterialIcons name="tips-and-updates" size={16} color={colors.primary} />
          <Text style={styles.helperText}>Read the form guide first, then start your set.</Text>
        </View>

        {/* Form Guide */}
        <FormGuideCard
          exercise={currentExercise}
          expanded={showFormGuide}
          onToggle={() => setShowFormGuide((p) => !p)}
        />

        {/* BRANCH A: weight_reps — table with Kg column */}
        {currentExercise.type === 'weight_reps' && (
          <SetLoggerCard
            setLog={setLog}
            currentSetNumber={currentSetNumber}
            showKg
            onUpdateReps={handleUpdateReps}
            onUpdateKg={handleUpdateKg}
            onAddSet={handleAddSet}
          />
        )}

        {/* BRANCH B: bodyweight_reps — table without Kg column */}
        {currentExercise.type === 'bodyweight_reps' && (
          <SetLoggerCard
            setLog={setLog}
            currentSetNumber={currentSetNumber}
            showKg={false}
            onUpdateReps={handleUpdateReps}
            onUpdateKg={handleUpdateKg}
            onAddSet={handleAddSet}
          />
        )}

        {/* BRANCH C: time — timer block */}
        {currentExercise.type === 'time' && (
          <View style={styles.timeBlock}>
            <Text style={styles.setLine}>
              Set <Text style={styles.setBold}>{currentSetNumber}</Text> of {setLog.length}
            </Text>
            <Text style={styles.targetLine}>Target: {targetSeconds} sec</Text>

            {isTimedRunning ? (
              <Text style={styles.timedDisplay}>{formatTime(timeAccum)}</Text>
            ) : (
              <Text style={styles.timedDisplay}>{formatTime(targetSeconds)}</Text>
            )}

            <View style={styles.setDots}>
              {setLog.map((s, i) => (
                <View
                  key={i}
                  style={[
                    styles.setDot,
                    s.completed && styles.setDotDone,
                    !s.completed && i === currentSetNumber - 1 && styles.setDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Small action row */}
        <View style={styles.quickControls}>
          <TouchableOpacity style={styles.quickBtn} onPress={handlePause}>
            <MaterialIcons name="pause" size={18} color={colors.text} />
            <Text style={styles.quickBtnText}>Pause</Text>
          </TouchableOpacity>
          {isTimedExercise ? (
            <TouchableOpacity style={styles.quickBtn} onPress={handleSkipSet}>
              <MaterialIcons name="skip-next" size={18} color={colors.text} />
              <Text style={styles.quickBtnText}>Skip Set</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.quickBtn} onPress={handleSkipExercise}>
              <MaterialIcons name="skip-next" size={18} color={colors.text} />
              <Text style={styles.quickBtnText}>Skip</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.quickBtn} onPress={handleEndOpen}>
            <MaterialIcons name="stop" size={18} color={colors.error} />
            <Text style={[styles.quickBtnText, { color: colors.error }]}>End</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        {isTimedExercise ? (
          isTimedRunning ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStopTimed} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>Stop</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryBtn} onPress={handleStartTimed} activeOpacity={0.85}>
              <MaterialIcons name="play-arrow" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Start Timer</Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogSet} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Log Set</Text>
          </TouchableOpacity>
        )}
      </View>

      <AppModal
        visible={showPauseModal}
        onClose={handleResume}
        title="Workout Paused"
        message="Take a break. Resume when you're ready."
        actions={[
          { label: 'Resume', onPress: handleResume, variant: 'primary' },
          { label: 'End Workout', onPress: handleEndRequest, variant: 'destructive' },
        ]}
      />
      <BottomSheetModal
        visible={showEndSheet}
        onClose={() => setShowEndSheet(false)}
        title="End Workout?"
        subtitle="Your progress will be saved."
        actions={[
          { label: 'End Workout', onPress: confirmEnd, variant: 'destructive', icon: 'stop' },
          { label: 'Cancel', onPress: () => setShowEndSheet(false), variant: 'secondary' },
        ]}
      />
    </View>
  );
}

// ──────────────────────────────────────────────────────
// Set Logger Card (weight_reps and bodyweight_reps)
// ──────────────────────────────────────────────────────
function SetLoggerCard({
  setLog,
  currentSetNumber,
  showKg,
  onUpdateReps,
  onUpdateKg,
  onAddSet,
}: {
  setLog: CompletedSetEntry[];
  currentSetNumber: number;
  showKg: boolean;
  onUpdateReps: (idx: number, value: string) => void;
  onUpdateKg: (idx: number, value: string) => void;
  onAddSet: () => void;
}) {
  return (
    <View style={styles.loggerCard}>
      <View style={styles.loggerHeader}>
        <Text style={[styles.loggerHeaderText, { flex: 1 }]}>Set</Text>
        <Text style={[styles.loggerHeaderText, { flex: 1 }]}>Reps</Text>
        {showKg && <Text style={[styles.loggerHeaderText, { flex: 1 }]}>Kg</Text>}
        <Text style={[styles.loggerHeaderText, { flex: 1, textAlign: 'right' }]}>Done</Text>
      </View>

      {setLog.map((s, i) => {
        const isActive = i === currentSetNumber - 1;
        const isDone = s.completed;
        return (
          <View
            key={i}
            style={[
              styles.loggerRow,
              isActive && !isDone && styles.loggerRowActive,
              isDone && styles.loggerRowDone,
            ]}
          >
            <View style={[styles.loggerCell, { flex: 1 }]}>
              <View
                style={[
                  styles.setNum,
                  isDone && styles.setNumDone,
                  isActive && !isDone && styles.setNumActive,
                ]}
              >
                {isDone ? (
                  <MaterialIcons name="check" size={12} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.setNumText,
                      isActive && !isDone && { color: colors.primary },
                    ]}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.loggerCell, { flex: 1 }]}>
              <TextInput
                style={styles.repsInput}
                value={String(s.reps || '')}
                onChangeText={(v) => onUpdateReps(i, v)}
                keyboardType="number-pad"
                editable={!isDone}
                selectTextOnFocus
                maxLength={3}
              />
            </View>
            {showKg && (
              <View style={[styles.loggerCell, { flex: 1 }]}>
                <TextInput
                  style={styles.repsInput}
                  value={s.kg != null ? String(s.kg) : ''}
                  placeholder="–"
                  placeholderTextColor={colors.textMuted}
                  onChangeText={(v) => onUpdateKg(i, v)}
                  keyboardType="decimal-pad"
                  editable={!isDone}
                  selectTextOnFocus
                  maxLength={5}
                />
              </View>
            )}
            <View style={[styles.loggerCell, { flex: 1, alignItems: 'flex-end' }]}>
              <View
                style={[
                  styles.doneDot,
                  isDone && styles.doneDotFilled,
                  isActive && !isDone && styles.doneDotActive,
                ]}
              />
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.addSetBtn} onPress={onAddSet} activeOpacity={0.85}>
        <MaterialIcons name="add" size={16} color={colors.primary} />
        <Text style={styles.addSetText}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

function FormGuideCard({
  exercise,
  expanded,
  onToggle,
}: {
  exercise: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const fg = exercise?.formGuide;
  const sections = useMemo(() => {
    if (!fg) return [];
    const out: Array<{ key: string; title: string; icon: any; color: string; items: string[] }> = [];
    if (fg.setup) {
      out.push({
        key: 'setup',
        title: 'Setup',
        icon: 'flag',
        color: '#5AC8FA',
        items: splitSentences(fg.setup, 3),
      });
    }
    if (fg.movement) {
      out.push({
        key: 'how',
        title: 'How to do',
        icon: 'directions-run',
        color: colors.primary,
        items: splitSentences(fg.movement, 4),
      });
    }
    if (fg.breathing) {
      out.push({
        key: 'breathing',
        title: 'Breathing',
        icon: 'air',
        color: '#34C759',
        items: splitSentences(fg.breathing, 2),
      });
    }
    if (fg.mistakes) {
      out.push({
        key: 'mistakes',
        title: 'Common mistake',
        icon: 'error-outline',
        color: colors.error,
        items: splitSentences(fg.mistakes, 3),
      });
    }
    if (fg.easyOption) {
      out.push({
        key: 'easier',
        title: 'Easier option',
        icon: 'accessibility-new',
        color: colors.warning,
        items: splitSentences(fg.easyOption, 2),
      });
    }
    if (fg.safety) {
      out.push({
        key: 'safety',
        title: 'Safety tip',
        icon: 'health-and-safety',
        color: colors.info,
        items: splitSentences(fg.safety, 2),
      });
    }
    return out;
  }, [fg]);

  if (!sections.length) return null;

  return (
    <View style={styles.formGuideCard}>
      <TouchableOpacity style={styles.formGuideHeader} onPress={onToggle} activeOpacity={0.85}>
        <MaterialIcons name="menu-book" size={20} color={colors.primary} />
        <Text style={styles.formGuideTitle}>Form Guide</Text>
        <Text style={styles.formGuideHint} numberOfLines={1}>
          {expanded ? 'Tap to collapse' : 'Tap to expand'}
        </Text>
        <MaterialIcons
          name={expanded ? 'expand-less' : 'expand-more'}
          size={22}
          color={colors.textMuted}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      {!expanded && (
        <View style={styles.formGuideList}>
          {sections.map((s) => (
            <View key={s.key} style={styles.formGuideRow}>
              <View style={[styles.formGuideIconBubble, { backgroundColor: s.color + '22' }]}>
                <MaterialIcons name={s.icon} size={14} color={s.color} />
              </View>
              <Text style={styles.formGuideRowTitle} numberOfLines={1}>{s.title}</Text>
            </View>
          ))}
        </View>
      )}

      {expanded && (
        <View style={styles.formGuideExpanded}>
          {sections.map((s) => (
            <View key={s.key} style={styles.formGuideSection}>
              <View style={styles.formGuideSectionHeader}>
                <View style={[styles.formGuideSectionAccent, { backgroundColor: s.color }]} />
                <View style={[styles.formGuideIconBubble, { backgroundColor: s.color + '22' }]}>
                  <MaterialIcons name={s.icon} size={16} color={s.color} />
                </View>
                <Text style={styles.formGuideSectionTitle}>{s.title}</Text>
              </View>
              {s.items.map((item, i) => (
                <View key={i} style={styles.formGuideBulletRow}>
                  <View style={[styles.formGuideBullet, { backgroundColor: s.color }]} />
                  <Text style={styles.formGuideBulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function splitSentences(text: string, maxItems: number): string[] {
  if (!text) return [];
  const parts = text
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, maxItems);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  emptyTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },

  progressSection: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  progressTrack: {
    height: 4,
    backgroundColor: colors.cardElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  progressPct: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 2,
  },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: MEDIA_SIDE, paddingBottom: spacing.lg },

  // IMAGE - 1:1 square, matches WorkoutDetailScreen.SquareMedia
  gifWrap: {
    width: MEDIA_WIDTH,
    height: MEDIA_HEIGHT,
    borderRadius: MEDIA_RADIUS,
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF',
  },

  // Title block below image
  exerciseInfo: { marginBottom: spacing.md, alignItems: 'center' },
  exerciseName: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  exerciseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 8 },
  exerciseMeta: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: '600', lineHeight: 24 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },

  // Set logger
  loggerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  loggerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  loggerHeaderText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  loggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
  },
  loggerRowActive: { backgroundColor: colors.cardElevated },
  loggerRowDone: { opacity: 0.6 },
  loggerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  setNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumActive: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  setNumDone: { backgroundColor: colors.success },
  setNumText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  repsInput: {
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    minHeight: 42,
    width: '100%',
  },
  doneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  doneDotActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  doneDotFilled: { backgroundColor: colors.success, borderColor: colors.success },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  addSetText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '800' },

  // Time block
  timeBlock: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setLine: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  setBold: { fontWeight: '800' },
  targetLine: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  timedDisplay: {
    color: colors.primary,
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.sm,
  },
  setDots: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  setDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cardElevated,
  },
  setDotDone: { backgroundColor: colors.success },
  setDotActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' },

  // Helper line above the form guide
  helperLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '12',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  helperText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },

  // Form guide card
  formGuideCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  formGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  formGuideTitle: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  formGuideHint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
    flexShrink: 1,
  },
  formGuideList: {
    gap: 8,
  },
  formGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  formGuideIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGuideRowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  formGuideExpanded: {
    gap: 18,
  },
  formGuideSection: {
    gap: 8,
  },
  formGuideSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  formGuideSectionAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  formGuideSectionTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },
  formGuideBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginLeft: 6,
  },
  formGuideBullet: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 9,
  },
  formGuideBulletText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
  },

  // Quick controls
  quickControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
  },
  quickBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },

  // Bottom
  bottomBar: {
    paddingHorizontal: MEDIA_SIDE,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: buttonHeight.lg,
    gap: spacing.xs,
  },
  primaryBtnText: { color: '#fff', fontSize: fontSize.xl, fontWeight: '800' },
  secondaryBtn: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  secondaryBtnText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  restRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },

  // Get Ready
  getReadyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  getReadyLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xl,
  },
  countdownCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  countdownNumber: {
    color: '#fff',
    fontSize: 96,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  getReadyNext: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  getReadyNextName: { color: colors.text, fontWeight: '800' },
  getReadyHint: { color: colors.textMuted, fontSize: fontSize.sm },

  // Rest
  restContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  restLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  restTimerText: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  restHint: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  restSummary: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restSummaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  restSummaryLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  restSummaryValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  setDotsLarge: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  setDotLarge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.cardElevated,
  },
  setDotLargeDone: { backgroundColor: colors.success },
  setDotLargeActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: 'transparent' },

  // Transition
  transitionContent: {
    padding: spacing.lg,
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  transitionDone: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  transitionNextCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  transitionNextLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  transitionNextName: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  transitionNextMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
