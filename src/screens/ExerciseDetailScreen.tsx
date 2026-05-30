import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pedometer } from 'expo-sensors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import InfoStatCard from '../components/InfoStatCard';
import SetTrackerRow from '../components/SetTrackerRow';
import RestTimerCard from '../components/RestTimerCard';
import InAppLockOverlay from '../components/InAppLockOverlay';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { getExerciseById } from '../data/exercises';
import { getExerciseImageUrls } from '../utils/image';
import ExerciseHeroImage from '../components/ExerciseHeroImage';
import InstructionSteps from '../components/InstructionSteps';
import type { Exercise } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseInstruction'>;
type Phase = 'detail' | 'active' | 'rest' | 'completed';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

const EQUIPMENT_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Barbell: 'fitness-center',
  Dumbbell: 'fitness-center',
  Bodyweight: 'accessibility',
  Machine: 'settings',
  Cable: 'swap-horiz',
  Kettlebell: 'toll',
  Band: 'loop',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  Beginner: 'Easy',
  Intermediate: 'Medium',
  Advanced: 'Hard',
};

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { exerciseId, exerciseData } = route.params || {};
  const staticExercise = exerciseId ? getExerciseById(exerciseId) : null;
  const exercise = staticExercise || exerciseData || null;

  const workoutBuilder = useStore((s) => s.workoutBuilder);
  const updateSetInWorkout = useStore((s) => s.updateSetInWorkout);

  const workoutExercise = Array.isArray(workoutBuilder)
    ? workoutBuilder.find((w) => w && w.exerciseId === exerciseId)
    : null;

  const [phase, setPhase] = useState<Phase>('detail');
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [kgValues, setKgValues] = useState<Record<string, number>>({});
  const [repsValues, setRepsValues] = useState<Record<string, number>>({});
  const [lastKg, setLastKg] = useState<Record<string, number>>({});
  const [lastReps, setLastReps] = useState<Record<string, number>>({});
  const [restRemaining, setRestRemaining] = useState(60);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [trackingSteps, setTrackingSteps] = useState(0);
  const [trackingCalories, setTrackingCalories] = useState(0);

  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedometerRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (workoutExercise && Array.isArray(workoutExercise.sets)) {
      const kg: Record<string, number> = {};
      const reps: Record<string, number> = {};
      workoutExercise.sets.forEach((s) => {
        if (s && s.id) {
          kg[s.id] = s.kg || 0;
          reps[s.id] = s.reps || 0;
        }
      });
      setKgValues(kg);
      setRepsValues(reps);
    }
  }, [workoutExercise?.exerciseId]);

  const MET_STRENGTH = 4.5;

  useEffect(() => {
    return () => {
      if (restRef.current) clearInterval(restRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (pedometerRef.current) { pedometerRef.current.remove(); pedometerRef.current = null; }
    };
  }, []);

  const sets = workoutExercise?.sets || [];
  const totalSets = Array.isArray(sets) ? sets.length : 0;

  const completedSets = useMemo(
    () => (Array.isArray(sets) ? sets.filter((s) => s && completedIds.has(s.id)) : []),
    [sets, completedIds]
  );

  const totalRepsSum = useMemo(
    () => completedSets.reduce((sum, s) => sum + ((s && (repsValues[s.id] ?? s.reps)) || 0), 0),
    [completedSets, repsValues]
  );

  const totalVolume = useMemo(
    () =>
      completedSets.reduce(
        (sum, s) =>
          sum + ((s && (kgValues[s.id] ?? s.kg) * (repsValues[s.id] ?? s.reps)) || 0),
        0
      ),
    [completedSets, kgValues, repsValues]
  );

  const lastStepRef = useRef(0);
  const handleUnlock = useCallback(() => {
    setScreenLocked(false);
  }, []);

  const startExercise = async () => {
    setActiveSetIndex(0);
    setCompletedIds(new Set());
    setLastKg({});
    setLastReps({});
    setPhase('active');
    setIsPaused(false);
    setWorkoutTimer(0);
    setTrackingSteps(0);
    setTrackingCalories(0);
    fadeAnim.setValue(0);

    timerRef.current = setInterval(() => {
      setWorkoutTimer((p) => p + 1);
    }, 1000);

    try {
      const available = await Pedometer.isAvailableAsync();
      if (available) {
        pedometerRef.current = Pedometer.watchStepCount((result) => {
          const delta = result.steps - lastStepRef.current;
          lastStepRef.current = result.steps;
          if (delta < 0) {
            lastStepRef.current = result.steps;
            return;
          }
          if (delta > 0 && delta < 10000) {
            setTrackingSteps((prev) => prev + delta);
          }
        });
      }
    } catch {}
  };

  const completeCurrentSet = () => {
    const set = Array.isArray(sets) ? sets[activeSetIndex] : null;
    if (!set || !set.id || completedIds.has(set.id)) return;

    const updatedKg = kgValues[set.id] ?? set.kg ?? 0;
    const updatedReps = repsValues[set.id] ?? set.reps ?? 0;
    setLastKg((p) => ({ ...p, [set.id]: updatedKg }));
    setLastReps((p) => ({ ...p, [set.id]: updatedReps }));

    const next = new Set(completedIds);
    next.add(set.id);
    setCompletedIds(next);

    updateSetInWorkout(exerciseId, set.id, {
      kg: updatedKg,
      reps: updatedReps,
      completed: true,
    });

    if (next.size >= totalSets) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('completed');
      return;
    }

    setRestRemaining(exercise?.restSeconds || 60);
    startRest();
  };

  const startRest = () => {
    setRestRemaining(exercise?.restSeconds || 60);
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setPhase('rest');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const skipRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRemaining(0);
    goToNextSet();
  };

  const addRestTime = () => setRestRemaining((p) => p + 15);

  const goToNextSet = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    setActiveSetIndex((p) => Math.min(p + 1, totalSets - 1));
    setPhase('active');
    fadeAnim.setValue(1);
  }, [totalSets]);

  const profile = useStore((s) => s.profile);
  const weightKg = profile?.weight || 70;

  useEffect(() => {
    const cal = MET_STRENGTH * weightKg * (workoutTimer / 3600);
    setTrackingCalories(Math.round(cal));
  }, [workoutTimer, weightKg]);

  const handlePause = () => {
    setIsPaused(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pedometerRef.current) { pedometerRef.current.remove(); pedometerRef.current = null; }
  };

  const handleResume = async () => {
    setIsPaused(false);
    timerRef.current = setInterval(() => {
      setWorkoutTimer((p) => p + 1);
    }, 1000);

    try {
      const available = await Pedometer.isAvailableAsync();
      if (available && !pedometerRef.current) {
        pedometerRef.current = Pedometer.watchStepCount((result) => {
          const delta = result.steps - lastStepRef.current;
          lastStepRef.current = result.steps;
          if (delta > 0 && delta < 50) setTrackingSteps((prev) => prev + delta);
        });
      }
    } catch {}
  };

  const updateKg = (id: string, val: number) => {
    setKgValues((p) => ({ ...p, [id]: val }));
  };

  const updateReps = (id: string, val: number) => {
    setRepsValues((p) => ({ ...p, [id]: val }));
  };

  const nextExerciseInWorkout = () => {
    const idx = Array.isArray(workoutBuilder)
      ? workoutBuilder.findIndex((w) => w && w.exerciseId === exerciseId)
      : -1;
    const next = Array.isArray(workoutBuilder) ? workoutBuilder[idx + 1] : null;
    if (next && next.exerciseId) {
      navigation.replace('ExerciseInstruction', { exerciseId: next.exerciseId });
    } else {
      navigation.goBack();
    }
  };

  const finishWorkout = () => {
    navigation.navigate('Main');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const exerciseImageUrls = useMemo(
    () => (exercise ? getExerciseImageUrls(exercise) : []),
    [exercise],
  );

  if (!exercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (phase === 'completed') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.completionContainer}>
          <MaterialIcons name="celebration" size={64} color={colors.success} />
          <Text style={styles.compTitle}>Exercise Completed</Text>
          <Text style={styles.compName}>{exercise.name}</Text>

          <View style={styles.compStatsCard}>
            <View style={styles.compStatItem}>
              <Text style={styles.compStatVal}>{completedSets.length}</Text>
              <Text style={styles.compStatLabel}>Sets</Text>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compStatItem}>
              <Text style={styles.compStatVal}>{totalRepsSum}</Text>
              <Text style={styles.compStatLabel}>Reps</Text>
            </View>
            <View style={styles.compDivider} />
            <View style={styles.compStatItem}>
              <Text style={styles.compStatVal}>{totalVolume}</Text>
              <Text style={styles.compStatLabel}>Volume</Text>
            </View>
          </View>

          <Text style={styles.compTimer}>Duration: {formatTime(workoutTimer)}</Text>

          <TouchableOpacity
            style={styles.compNextBtn}
            onPress={nextExerciseInWorkout}
            activeOpacity={0.85}
          >
            <Text style={styles.compNextBtnText}>
              {Array.isArray(workoutBuilder) && workoutBuilder.length > 1 ? 'Next Exercise' : 'Finish Workout'}
            </Text>
          </TouchableOpacity>
          {(!Array.isArray(workoutBuilder) || workoutBuilder.length <= 1) && (
            <TouchableOpacity
              style={styles.compFinishBtn}
              onPress={finishWorkout}
              activeOpacity={0.85}
            >
              <Text style={styles.compFinishBtnText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (screenLocked && phase === 'active') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <InAppLockOverlay
          activityType={exercise.name || 'Workout'}
          time={formatTime(workoutTimer)}
          steps={trackingSteps}
          distance="0.00 km"
          calories={trackingCalories}
          onUnlock={handleUnlock}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero Image Section */}
        <View style={styles.hero}>
          <ExerciseHeroImage
            urls={exerciseImageUrls}
            name={exercise.name}
            style={styles.heroImgWrap}
            imageStyle={styles.heroImg}
            contentFit="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{exercise.name}</Text>
            <Text style={styles.heroMuscle}>{exercise.category}</Text>
            <View style={styles.heroBadges}>
              <View style={[styles.heroBadge, { borderColor: DIFFICULTY_COLORS[exercise.difficulty] + '60' }]}>
                <Text style={[styles.heroBadgeText, { color: DIFFICULTY_COLORS[exercise.difficulty] }]}>
                  {DIFFICULTY_LABELS[exercise.difficulty] || exercise.difficulty}
                </Text>
              </View>
              <View style={styles.heroBadge}>
                <MaterialIcons name={EQUIPMENT_ICONS[exercise.equipment] || 'fitness-center'} size={14} color={colors.textSecondary} />
                <Text style={styles.heroBadgeText}> {exercise.equipment}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        {workoutExercise && (
          <View style={styles.quickStats}>
            <InfoStatCard iconName="track-changes" label="Muscle" value={exercise.category} />
            <InfoStatCard iconName="format-list-bulleted" label="Sets" value={`${totalSets}`} />
            <InfoStatCard iconName="repeat" label="Reps" value={`${sets[0]?.reps ?? 0}`} />
            <InfoStatCard iconName="timer" label="Rest" value={`${exercise.restSeconds}s`} />
          </View>
        )}

        {!workoutExercise && (
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialIcons name="track-changes" size={18} color={colors.textSecondary} />
                <Text style={styles.metaLabel}>Target</Text>
                <Text style={styles.metaValue}>{exercise.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="timer" size={18} color={colors.textSecondary} />
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>{exercise.restSeconds * exercise.defaultSets}s</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="local-fire-department" size={18} color={colors.textSecondary} />
                <Text style={styles.metaLabel}>Est. Cal</Text>
                <Text style={styles.metaValue}>{Math.round(MET_STRENGTH * (weightKg || 70) * (exercise.defaultSets * (exercise.defaultReps || 10) * 3 / 3600))}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialIcons name="format-list-bulleted" size={18} color={colors.textSecondary} />
                <Text style={styles.metaLabel}>Sets</Text>
                <Text style={styles.metaValue}>{exercise.defaultSets} × {exercise.defaultReps}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          {exercise.formGuide ? (
            <>
              <Text style={styles.sectionTitle}>How to Perform</Text>
              <View style={styles.instructionsCard}>
                <GuideStep number={1} title="Starting Position" text={exercise.formGuide.setup} />
                <GuideStep number={2} title="Movement" text={exercise.formGuide.movement} />
                <GuideStep number={3} title="Breathing" text={exercise.formGuide.breathing} />
                <GuideStep number={4} title="Common Mistakes" text={exercise.formGuide.mistakes} />
                {exercise.formGuide.safety && (
                  <GuideStep number={5} title="Safety" text={exercise.formGuide.safety} isLast />
                )}
              </View>
            </>
          ) : Array.isArray(exercise.instructions) && exercise.instructions.length > 0 ? (
            <View style={{ paddingHorizontal: spacing.lg }}>
              <InstructionSteps instructions={exercise.instructions} title="How to Perform" />
            </View>
          ) : null}
        </View>

        {/* Active tracking UI */}
        {phase !== 'detail' && (
          <View style={styles.activeSection}>
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  Set {activeSetIndex + 1} / {totalSets}
                </Text>
                <Text style={styles.progressTimer}>{formatTime(workoutTimer)}</Text>
              </View>
              <View style={styles.progressSegments}>
                {Array.isArray(sets) && sets.map((_, i) => {
                  const done = sets[i] && completedIds.has(sets[i].id);
                  const curr = i === activeSetIndex;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.progressSeg,
                        done && styles.progressSegDone,
                        curr && !done && styles.progressSegActive,
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={styles.progressDetail}>
                {completedSets.length} of {totalSets} sets • {totalRepsSum} total reps
              </Text>
            </View>

            <View style={styles.liveStats}>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatLabel}>Volume</Text>
                <Text style={styles.liveStatVal}>{totalVolume} kg</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatLabel}>Steps</Text>
                <Text style={styles.liveStatVal}>{trackingSteps}</Text>
              </View>
              <View style={styles.liveStat}>
                <Text style={styles.liveStatLabel}>Cal</Text>
                <Text style={styles.liveStatVal}>{trackingCalories}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Set Tracker */}
        {workoutExercise && (
          <View style={styles.setsSection}>
            <Text style={styles.sectionTitle}>
              {phase === 'detail' ? 'Exercise Plan' : 'Track Sets'}
            </Text>

            {phase === 'detail' && (
              <Text style={styles.setsHint}>
                Complete {totalSets} sets of {sets[0]?.reps || exercise.defaultReps} reps each
              </Text>
            )}

            {Array.isArray(sets) && sets.map((set, i) => (
              set ? (
                <SetTrackerRow
                  key={set.id}
                  setNumber={i + 1}
                  kg={kgValues[set.id] ?? set.kg ?? 0}
                  reps={repsValues[set.id] ?? set.reps ?? 0}
                  completed={completedIds.has(set.id)}
                  isActive={phase !== 'detail' && i === activeSetIndex && !completedIds.has(set.id) && !isPaused}
                  lastKg={lastKg[set.id]}
                  lastReps={lastReps[set.id]}
                  onKgChange={(v) => updateKg(set.id, v)}
                  onRepsChange={(v) => updateReps(set.id, v)}
                  onComplete={phase !== 'detail' && i === activeSetIndex && !completedIds.has(set.id) ? completeCurrentSet : () => {}}
                />
              ) : null
            ))}
          </View>
        )}

        {/* Start / Action Buttons */}
        {phase === 'detail' && (
          <>
            {workoutExercise ? (
              <TouchableOpacity
                style={styles.startBtn}
                onPress={startExercise}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnIcon}>▶</Text>
                <Text style={styles.startBtnText}>Start Exercise</Text>
                <Text style={styles.startBtnSub}>{totalSets} sets • {exercise.restSeconds}s rest</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.cardElevated }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>Back to Workouts</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.disclaimer}>
              Stop if you feel sharp pain. Listen to your body.
            </Text>
          </>
        )}

        {/* Active Controls */}
        {phase === 'active' && (
          <View style={styles.controlsRow}>
            {isPaused ? (
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResume} activeOpacity={0.85}>
                <Text style={styles.controlBtnText}>▶ Resume</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.85}>
                <Text style={styles.controlBtnText}>⏸ Pause</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.endBtn}
              onPress={finishWorkout}
              activeOpacity={0.85}
            >
              <Text style={styles.controlBtnText}>⏹ End</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Lock button */}
      {phase === 'active' && !screenLocked && (
        <LockButton onLock={() => setScreenLocked(true)} />
      )}

      {/* Rest overlay */}
      {phase === 'rest' && (
        <Animated.View style={[styles.restOverlay, { paddingBottom: spacing.xl + insets.bottom, opacity: fadeAnim }]}>
          <RestTimerCard
            remaining={restRemaining}
            onSkip={skipRest}
            onAddTime={addRestTime}
          />
          <TouchableOpacity
            style={styles.restNextBtn}
            onPress={goToNextSet}
            activeOpacity={0.85}
          >
            <MaterialIcons name="arrow-forward" size={20} color={colors.text} />
            <Text style={styles.restNextBtnText}> Next Set</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

function LockButton({ onLock }: { onLock: () => void }) {
  const insets = useSafeAreaInsets();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onLock();
        rotateAnim.setValue(0);
      });
    }, 500);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    rotateAnim.setValue(0);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.lockBtnContainer, { bottom: spacing.lg + insets.bottom, transform: [{ rotate: rotation }, { scale: pulseAnim }] }]}>
      <TouchableOpacity
        style={styles.lockBtn}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <MaterialIcons name="lock" size={20} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function GuideStep({ number, title, text, isLast }: { number: number; title: string; text: string; isLast?: boolean }) {
  return (
    <View style={[styles.guideStep, !isLast && styles.guideStepBorder]}>
      <View style={styles.guideStepNum}>
        <Text style={styles.guideStepNumText}>{number}</Text>
      </View>
      <View style={styles.guideStepContent}>
        <Text style={styles.guideStepTitle}>{title}</Text>
        <Text style={styles.guideStepText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    color: colors.error,
    fontSize: fontSize.lg,
    marginBottom: spacing.md,
  },
  backLink: {
    padding: spacing.sm,
  },
  backLinkText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
  },
  headerBack: { paddingVertical: spacing.xs, paddingRight: spacing.sm },
  headerTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', flex: 1, textAlign: 'center' },
  headerSpacer: { width: 60 },

  scroll: { paddingBottom: spacing.lg },

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },

  // Hero
  hero: {
    borderRadius: 0,
    overflow: 'hidden',
    height: 300,
    position: 'relative',
  },
  heroImgWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  heroImg: { width: '100%', height: '100%' },
  heroImgPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  heroTitle: {
    color: '#fff',
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroMuscle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.md,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardElevated,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  // Meta Card
  metaCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },

  // Instructions
  instructionsSection: {
    marginBottom: spacing.md,
  },
  instructionsCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideStep: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  guideStepBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  guideStepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideStepNumText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  guideStepContent: {
    flex: 1,
  },
  guideStepTitle: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: 2,
  },
  guideStepText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  instructionsList: {
    gap: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  instructionNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cardElevated,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    flex: 1,
    paddingTop: 2,
  },

  // Active Tracking
  activeSection: {
    marginBottom: spacing.sm,
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  progressTimer: { color: colors.textSecondary, fontSize: fontSize.lg, fontWeight: '600' },
  progressSegments: { flexDirection: 'row', gap: 5, height: 8, marginBottom: spacing.xs },
  progressSeg: { flex: 1, backgroundColor: colors.cardElevated, borderRadius: 4 },
  progressSegDone: { backgroundColor: colors.success },
  progressSegActive: { backgroundColor: colors.primary },
  progressDetail: { color: colors.textMuted, fontSize: fontSize.sm },

  liveStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  liveStat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveStatVal: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },

  // Set Tracker
  setsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  setsHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
    paddingHorizontal: 0,
  },

  // Start Button
  startBtn: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnIcon: {
    color: colors.text,
    fontSize: 20,
    marginBottom: 4,
  },
  startBtnText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  startBtnSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    fontWeight: '500',
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: colors.warning,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: colors.success,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    flex: 1,
    backgroundColor: colors.error,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },

  // Lock Button
  lockBtnContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    zIndex: 100,
  },
  lockBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Rest Overlay
  restOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
  },
  restNextBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  restNextBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },

  // Completion
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  compTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '700', marginBottom: spacing.xs },
  compName: { color: colors.textSecondary, fontSize: fontSize.lg, marginBottom: spacing.lg },
  compStatsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compStatItem: { flex: 1, alignItems: 'center' },
  compStatVal: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '700' },
  compStatLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: 2 },
  compDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  compTimer: { color: colors.textSecondary, fontSize: fontSize.md, marginBottom: spacing.lg },
  compNextBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  compNextBtnText: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  compFinishBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
  },
  compFinishBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },
});
