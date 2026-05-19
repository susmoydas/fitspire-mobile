import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, fontSize, spacing, borderRadius, shadows } from '../components/Theme';
import { exercises, exerciseCategories, getExercisesByCategory } from '../data/exercises';
import { ExerciseCategory, Exercise, Set } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ExercisesScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const selectedCategory = useStore((s) => s.selectedCategory);
  const setSelectedCategory = useStore((s) => s.setSelectedCategory);
  const workoutBuilder = useStore((s) => s.workoutBuilder);
  const addExerciseToWorkout = useStore((s) => s.addExerciseToWorkout);
  const clearWorkoutBuilder = useStore((s) => s.clearWorkoutBuilder);

  const filteredExercises = getExercisesByCategory(selectedCategory);
  const exerciseCount = workoutBuilder.reduce((sum, w) => sum + w.sets.length, 0);

  const handleSelectExercise = (exercise: Exercise) => {
    const existing = workoutBuilder.find((w) => w.exerciseId === exercise.id);
    if (existing) {
      navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
    } else {
      const sets: Set[] = Array.from({ length: exercise.defaultSets }, (_, i) => ({
        id: `${exercise.id}-set-${i}`,
        kg: 0,
        reps: exercise.defaultReps,
        completed: false,
      }));
      addExerciseToWorkout(exercise.id, sets);
      navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
    }
  };

  const renderCategory = (cat: ExerciseCategory) => (
    <TouchableOpacity
      key={cat}
      style={[styles.categoryPill, selectedCategory === cat && styles.categorySelected]}
      onPress={() => setSelectedCategory(cat)}
    >
      <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextSelected]}>
        {cat}
      </Text>
    </TouchableOpacity>
  );

  const renderExercise = ({ item }: { item: Exercise }) => {
    const inWorkout = workoutBuilder.some((w) => w.exerciseId === item.id);
    return (
      <TouchableOpacity
        style={[styles.exerciseCard, inWorkout && styles.exerciseInWorkout]}
        onPress={() => handleSelectExercise(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.exerciseImage}
          resizeMode="cover"
        />
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseCategory}>{item.category}</Text>
          <Text style={styles.exerciseSets}>
            {item.defaultSets} sets × {item.defaultReps} reps
          </Text>
        </View>
        {inWorkout && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exercises</Text>
        {workoutBuilder.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={clearWorkoutBuilder}
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesRow}
        contentContainerStyle={styles.categoriesContent}
      >
        {exerciseCategories.map(renderCategory)}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Start Workout FAB */}
      {workoutBuilder.length > 0 && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('WorkoutTimer')}
          >
            <Text style={styles.fabText}>
              Start Workout ({exerciseCount} sets)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  clearBtn: { padding: spacing.sm },
  clearBtnText: { color: colors.error, fontWeight: '600' },
  categoriesRow: { maxHeight: 44, marginBottom: spacing.sm },
  categoriesContent: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  categoryPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  categorySelected: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  categoryText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.sm },
  categoryTextSelected: { color: colors.primary },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  exerciseInWorkout: { borderColor: colors.primary, borderWidth: 2 },
  exerciseImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
  },
  exerciseInfo: { flex: 1, marginLeft: spacing.md },
  exerciseName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  exerciseCategory: { color: colors.primary, fontSize: fontSize.xs, marginTop: 2 },
  exerciseSets: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  checkMark: { color: colors.success, fontSize: fontSize.xl, fontWeight: '700', marginLeft: spacing.sm },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: spacing.lg,
    right: spacing.lg,
  },
  fab: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  fabText: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
});
