import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { useTimer } from '../hooks/useTimer';
import { useRestTimer } from '../hooks/useRestTimer';
import Timer from '../components/Timer';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { colors, fontSize, spacing, borderRadius, shadows } from '../components/Theme';
import { getExerciseById } from '../data/exercises';
import { WorkoutExercise, WorkoutSession } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutTimer'>;

export default function WorkoutTimerScreen({ navigation }: Props) {
  const workoutBuilder = useStore((s) => s.workoutBuilder);
  const addWorkoutSession = useStore((s) => s.addWorkoutSession);
  const setCurrentWorkout = useStore((s) => s.setCurrentWorkout);
  const completeWorkout = useStore((s) => s.completeWorkout);
  const clearWorkoutBuilder = useStore((s) => s.clearWorkoutBuilder);

  const { seconds, isRunning, start, pause, resume, stop } = useTimer();
  const restTimer = useRestTimer();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'working' | 'rest' | 'complete'>('ready');
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const id = `session-${Date.now()}`;
    setSessionId(id);
    const session: WorkoutSession = {
      id,
      date: new Date().toISOString().split('T')[0],
      exercises: workoutBuilder,
      duration: 0,
      completed: false,
      startedAt: new Date().toISOString(),
    };
    addWorkoutSession(session);
    setCurrentWorkout(session);
  }, []);

  const currentExercise = workoutBuilder[currentExerciseIndex];
  const exerciseData = currentExercise ? getExerciseById(currentExercise.exerciseId) : null;
  const totalExercises = workoutBuilder.length;
  const currentSet = currentExercise?.sets[currentSetIndex];
  const totalSets = currentExercise?.sets.length || 0;

  const progress = totalExercises > 0
    ? (currentExerciseIndex + (currentSetIndex / totalSets)) / totalExercises
    : 0;

  const startWorkout = () => {
    start();
    setPhase('working');
  };

  const completeSet = () => {
    pause();
    restTimer.startRest(60);
    setPhase('rest');
  };

  const skipRest = () => {
    restTimer.skip();
    moveToNext();
  };

  const moveToNext = useCallback(() => {
    if (currentSetIndex < totalSets - 1) {
      setCurrentSetIndex(currentSetIndex + 1);
      resume();
      setPhase('working');
    } else if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      resume();
      setPhase('working');
    } else {
      stop();
      completeWorkout(sessionId);
      setPhase('complete');
    }
  }, [currentSetIndex, totalSets, currentExerciseIndex, totalExercises, resume, stop, completeWorkout, sessionId]);

  const finishWorkout = () => {
    stop();
    completeWorkout(sessionId);
    clearWorkoutBuilder();
    navigation.navigate('WorkoutComplete', {
      sessionId,
      duration: seconds,
    });
  };

  if (phase === 'ready') {
    return (
      <View style={styles.container}>
        <Header title="Ready?" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text style={styles.emoji}>💪</Text>
          <Text style={styles.readyTitle}>Ready to crush it?</Text>
          <Text style={styles.readySubtitle}>
            {totalExercises} exercises • {workoutBuilder.reduce((s, w) => s + w.sets.length, 0)} total sets
          </Text>
          <Button title="Start Workout" onPress={startWorkout} size="lg" fullWidth />
        </View>
      </View>
    );
  }

  if (phase === 'complete') {
    return (
      <View style={styles.container}>
        <Header title="Workout Complete!" onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text style={styles.emoji}>🎉</Text>
          <Timer seconds={seconds} size="lg" />
          <Text style={styles.completeTitle}>Amazing work!</Text>
          <Button
            title="View Summary"
            onPress={finishWorkout}
            size="lg"
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={`${currentExerciseIndex + 1}/${totalExercises}`}
        onBack={() => navigation.goBack()}
      />

      <ProgressBar progress={progress} />

      <ScrollView contentContainerStyle={styles.workoutContent}>
        {/* Timer */}
        <Card style={styles.timerCard} variant="elevated">
          {phase === 'rest' ? (
            <View>
              <Text style={styles.restLabel}>Rest</Text>
              <Timer seconds={restTimer.remaining} size="lg" />
              <View style={styles.restActions}>
                <Button title="Skip" onPress={skipRest} variant="ghost" size="sm" />
              </View>
            </View>
          ) : (
            <View>
              <Timer seconds={seconds} size="lg" />
              <Text style={styles.timerLabel}>Total Time</Text>
            </View>
          )}
        </Card>

        {/* Current Exercise */}
        {exerciseData && (
          <Card style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{exerciseData.name}</Text>
            <Text style={styles.exerciseCategory}>{exerciseData.category}</Text>

            <View style={styles.setInfo}>
              <Text style={styles.setLabel}>
                Set {currentSetIndex + 1} of {totalSets}
              </Text>
              <Text style={styles.setDetails}>
                {currentSet?.kg || 0} kg × {currentSet?.reps || 0} reps
              </Text>
            </View>

            {phase === 'working' ? (
              <Button title="Complete This Set" onPress={completeSet} size="lg" fullWidth />
            ) : (
              <Button title="Next Set" onPress={moveToNext} size="lg" fullWidth />
            )}
          </Card>
        )}

        {/* Exercise List Summary */}
        {workoutBuilder.map((we, i) => {
          const ex = getExerciseById(we.exerciseId);
          const isActive = i === currentExerciseIndex;
          const completed = i < currentExerciseIndex;
          return (
            <View
              key={we.exerciseId}
              style={[styles.exerciseListItem, isActive && styles.exerciseActive, completed && styles.exerciseDone]}
            >
              <Text style={[styles.exListItemText, completed && styles.exListDone]}>
                {completed ? '✓ ' : ''}{ex?.name || 'Unknown'}
              </Text>
              <Text style={styles.exListItemSets}>{we.sets.length} sets</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Finish button */}
      <View style={styles.finishBar}>
        <Button title="Finish Workout" onPress={finishWorkout} variant="outline" fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 64, marginBottom: spacing.lg },
  readyTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '700', textAlign: 'center' },
  readySubtitle: { color: colors.textSecondary, fontSize: fontSize.md, marginVertical: spacing.lg, textAlign: 'center' },
  completeTitle: { color: colors.success, fontSize: fontSize.xxl, fontWeight: '700', marginVertical: spacing.lg },
  workoutContent: { padding: spacing.lg },
  timerCard: { marginBottom: spacing.md, alignItems: 'center', paddingVertical: spacing.xl },
  timerLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.sm },
  restLabel: { color: colors.warning, fontSize: fontSize.lg, fontWeight: '700', textAlign: 'center', marginBottom: spacing.sm },
  restActions: { marginTop: spacing.sm, alignItems: 'center' },
  exerciseCard: { marginBottom: spacing.md },
  exerciseName: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  exerciseCategory: { color: colors.primary, fontSize: fontSize.sm, marginTop: 2 },
  setInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  setLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  setDetails: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  exerciseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  exerciseActive: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  exerciseDone: { opacity: 0.5 },
  exListItemText: { color: colors.text, fontWeight: '500' },
  exListDone: { textDecorationLine: 'line-through' },
  exListItemSets: { color: colors.textSecondary, fontSize: fontSize.sm },
  finishBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
