import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import Button from '../components/Button';
import BottomSheet from '../components/BottomSheet';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { getExerciseById } from '../data/exercises';
import { Set } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen({ route, navigation }: Props) {
  const { exerciseId } = route.params;
  const exercise = getExerciseById(exerciseId);
  const workoutBuilder = useStore((s) => s.workoutBuilder);
  const updateSetInWorkout = useStore((s) => s.updateSetInWorkout);
  const addSetToWorkoutExercise = useStore((s) => s.addSetToWorkoutExercise);
  const removeSetFromWorkoutExercise = useStore((s) => s.removeSetFromWorkoutExercise);
  const removeExerciseFromWorkout = useStore((s) => s.removeExerciseFromWorkout);

  const workoutExercise = workoutBuilder.find((w) => w.exerciseId === exerciseId);
  const [showActions, setShowActions] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  if (!exercise || !workoutExercise) {
    return (
      <View style={styles.container}>
        <Header title="Exercise" onBack={() => navigation.goBack()} />
        <Text style={styles.errorText}>Exercise not found in workout</Text>
      </View>
    );
  }

  const handleSetChange = (setId: string, field: 'kg' | 'reps', value: string) => {
    const num = parseInt(value, 10) || 0;
    updateSetInWorkout(exerciseId, setId, { [field]: num });
  };

  const toggleSetComplete = (setId: string) => {
    const set = workoutExercise.sets.find((s) => s.id === setId);
    if (set) {
      updateSetInWorkout(exerciseId, setId, { completed: !set.completed });
    }
  };

  const addSet = () => {
    const newSet: Set = {
      id: `${exerciseId}-set-${Date.now()}`,
      kg: 0,
      reps: 10,
      completed: false,
    };
    addSetToWorkoutExercise(exerciseId, newSet);
  };

  const removeSet = (setId: string) => {
    removeSetFromWorkoutExercise(exerciseId, setId);
    const remaining = workoutExercise.sets.filter((s) => s.id !== setId);
    if (remaining.length === 0) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={exercise.name}
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity onPress={() => setShowActions(true)}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Exercise Image */}
        <Image
          source={{ uri: exercise.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{exercise.category}</Text>
        </View>

        {/* Instructions */}
        <TouchableOpacity
          style={styles.instructionsBtn}
          onPress={() => setShowInstructions(!showInstructions)}
        >
          <Text style={styles.instructionsBtnText}>Instructions ▼</Text>
        </TouchableOpacity>
        {showInstructions && (
          <View style={styles.instructionsList}>
            {exercise.instructions.map((inst, i) => (
              <Text key={i} style={styles.instructionItem}>
                {i + 1}. {inst}
              </Text>
            ))}
          </View>
        )}

        {/* Sets */}
        <View style={styles.setsHeader}>
          <Text style={styles.setsTitle}>Sets & Reps</Text>
          <TouchableOpacity onPress={addSet}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>

        {/* Set Column Headers */}
        <View style={styles.setRowHeader}>
          <Text style={[styles.setCol, styles.setNumCol]}>Set</Text>
          <Text style={styles.setCol}>kg</Text>
          <Text style={styles.setCol}>Reps</Text>
          <Text style={styles.setCol}>Done</Text>
        </View>

        {workoutExercise.sets.map((set, index) => (
          <View key={set.id} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
            <Text style={[styles.setCol, styles.setNumCol]}>{index + 1}</Text>
            <TextInput
              style={styles.setInput}
              value={set.kg === 0 ? '' : String(set.kg)}
              onChangeText={(v) => handleSetChange(set.id, 'kg', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={styles.setInput}
              value={set.reps === 0 ? '' : String(set.reps)}
              onChangeText={(v) => handleSetChange(set.id, 'reps', v)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.checkbox, set.completed && styles.checkboxDone]}
              onPress={() => toggleSetComplete(set.id)}
            >
              {set.completed && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Sheet Actions */}
      <BottomSheet visible={showActions} onClose={() => setShowActions(false)} title="Actions">
        <Button
          title="Remove from Workout"
          onPress={() => {
            removeExerciseFromWorkout(exerciseId);
            setShowActions(false);
            navigation.goBack();
          }}
          variant="outline"
          style={{ marginBottom: spacing.sm }}
        />
        <Button
          title="Cancel"
          onPress={() => setShowActions(false)}
          variant="ghost"
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  errorText: { color: colors.error, textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.md },
  menuIcon: { color: colors.text, fontSize: fontSize.xl, paddingHorizontal: spacing.sm },
  scrollContent: { padding: spacing.lg },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  categoryText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.xs },
  instructionsBtn: { marginBottom: spacing.sm },
  instructionsBtnText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  instructionsList: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  instructionItem: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: 4, lineHeight: 20 },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  setsTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  addSetText: { color: colors.primary, fontWeight: '600', fontSize: fontSize.sm },
  setRowHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setRowCompleted: { opacity: 0.5 },
  setCol: { flex: 1, color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center' },
  setNumCol: { flex: 0.5 },
  setInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  checkbox: {
    flex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  checkboxDone: { borderColor: colors.success, backgroundColor: colors.success },
  checkIcon: { color: colors.text, fontWeight: '700', fontSize: fontSize.sm },
});
