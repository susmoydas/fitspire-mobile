import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';

type CompleteRoute = RouteProp<RootStackParamList, 'WorkoutComplete'>;
type CompleteNav = NativeStackNavigationProp<RootStackParamList>;

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function WorkoutCompleteScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<CompleteRoute>();
  const navigation = useNavigation<CompleteNav>();

  const {
    workoutId,
    duration,
    exercisesCompleted,
    totalExercises,
    calories,
    workoutTitle,
    category,
    difficulty,
    targetMusclesJson,
    planId,
    setLogJson,
  } = route.params;

  const targetMuscles = useMemo(() => {
    try {
      const parsed = JSON.parse(targetMusclesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [targetMusclesJson]);

  const setLog = useMemo(() => {
    if (!setLogJson) return undefined;
    try {
      const parsed = JSON.parse(setLogJson);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [setLogJson]);

  const addCompletedWorkout = useStore((s) => s.addCompletedWorkout);
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const unlockAchievement = useStore((s) => s.unlockAchievement);

  const totalSets = useMemo(() => {
    const previous = completedWorkoutLog.find((cw) => cw.workoutId === workoutId);
    return previous?.exercisesCompleted
      ? Math.round(previous.exercisesCompleted * 3)
      : exercisesCompleted * 3;
  }, [completedWorkoutLog, workoutId, exercisesCompleted]);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const alreadySaved = completedWorkoutLog.some((cw) => cw.workoutId === workoutId);
    if (!alreadySaved) {
      addCompletedWorkout({
        workoutId,
        workoutTitle,
        completedAt: new Date().toISOString(),
        duration,
        exercisesCompleted,
        totalExercises,
        calories,
        category,
        difficulty,
        targetMuscles,
        planId,
        setLog,
      });
    }
    if (exercisesCompleted >= 4) {
      unlockAchievement('step_master');
    }
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSave = useCallback(() => {
    navigation.navigate('Main');
  }, [navigation]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Main');
    }
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.checkCircle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <MaterialIcons name="check" size={56} color="#fff" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <Text style={styles.title}>Workout Completed</Text>
          <Text style={styles.subtitle}>You're doing great</Text>
        </Animated.View>

        <View style={styles.grid}>
          <SummaryCard
            icon="schedule"
            value={formatDuration(duration)}
            label="min"
            color={colors.primary}
          />
          <SummaryCard
            icon="fitness-center"
            value={exercisesCompleted}
            label="exercises"
            color="#60A5FA"
          />
          <SummaryCard
            icon="repeat"
            value={totalSets}
            label="sets"
            color="#A78BFA"
          />
          <SummaryCard
            icon="local-fire-department"
            value={calories}
            label="kcal"
            color="#F472B6"
          />
        </View>

        <Text style={styles.savedHint}>
          Progress saved to your history.
        </Text>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.primaryBtnText}>Save Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryBtnText}>Back to Workouts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryCard({
  icon,
  value,
  label,
  color,
}: {
  icon: any;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconWrap, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },

  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    width: '100%',
  },
  summaryCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  savedHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: spacing.xl,
  },

  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
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
  primaryBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
  },
  secondaryBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
});
