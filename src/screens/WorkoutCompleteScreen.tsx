import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

type CompleteRoute = RouteProp<RootStackParamList, 'WorkoutComplete'>;
type CompleteNav = NativeStackNavigationProp<RootStackParamList>;

const MOTIVATIONAL_QUOTES = [
  "You crushed it! Every rep brings you closer to your goals. Keep showing up!",
  "Amazing work! Consistency beats intensity. You're building a habit that lasts.",
  "Great job today! Your future self will thank you for showing up.",
  "You did it! Progress happens one workout at a time. This is yours.",
  "Outstanding effort! Remember: every workout counts, and you just added another win.",
  "Stronger than yesterday! Keep showing up for yourself.",
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

export default function WorkoutCompleteScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<CompleteRoute>();
  const navigation = useNavigation<CompleteNav>();

  const {
    workoutId, duration, exercisesCompleted, totalExercises,
    calories, workoutTitle, category, difficulty,
    targetMusclesJson, planId,
  } = route.params;

  const targetMuscles = useMemo(() => {
    try {
      const parsed = JSON.parse(targetMusclesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [targetMusclesJson]);

  const addCompletedWorkout = useStore((s) => s.addCompletedWorkout);
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const unlockAchievement = useStore((s) => s.unlockAchievement);

  const isFirstWorkout = useMemo(() => completedWorkoutLog.length === 0, []);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const alreadySaved = completedWorkoutLog.some(
      (cw) => cw.workoutId === workoutId
    );
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
      });
    }
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(sparkle1, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(sparkle2, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(sparkle2, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    unlockAchievement('first_workout');
  }, []);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const completionTime = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const quote = useMemo(
    () => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)],
    []
  );

  const streak = useMemo(() => {
    const log = completedWorkoutLog;
    if (log.length === 0) return 0;
    const seen = new Set<string>();
    log.forEach((cw) => {
      const date = cw.completedAt.split('T')[0];
      seen.add(date);
    });
    const dates = Array.from(seen).sort().reverse();
    if (dates.length === 0) return 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 1;
    let count = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1] + 'T00:00:00');
      const curr = new Date(dates[i] + 'T00:00:00');
      const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
      if (Math.abs(diffDays - 1) < 0.1) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [completedWorkoutLog]);

  const diffColor = DIFFICULTY_COLORS[difficulty] || colors.textSecondary;

  const handleNavigateTo = (tabName: string) => {
    navigation.navigate('Main', { screen: tabName } as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Sparkle Decorations */}
        <Animated.View style={[styles.sparkleTopRight, { opacity: sparkle1 }]}>
          <MaterialIcons name="star" size={20} color={colors.warning} />
        </Animated.View>
        <Animated.View style={[styles.sparkleTopLeft, { opacity: sparkle2 }]}>
          <MaterialIcons name="star" size={16} color={colors.primary} />
        </Animated.View>

        {/* 1. Success Header */}
        <View style={styles.heroSection}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.successCircle}>
              <MaterialIcons name="check" size={52} color="#fff" />
            </View>
          </Animated.View>
          <Animated.Text style={[styles.heroTitle, { opacity: fadeAnim }]}>
            Workout Complete!
          </Animated.Text>
          <Animated.Text style={[styles.heroSubtitle, { opacity: fadeAnim }]}>
            Great job!
          </Animated.Text>
        </View>

        {/* 2. Stats Grid */}
        <Animated.View
          style={[styles.statsGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialIcons name="timelapse" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{minutes} min {seconds} sec</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="fitness-center" size={24} color={colors.primary} />
              <Text style={styles.statValue}>{exercisesCompleted}/{totalExercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialIcons name="local-fire-department" size={24} color={colors.primary} />
              <Text style={styles.statValue}>~{calories} cal</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="speed" size={24} color={diffColor} />
              <Text style={[styles.statValue, { color: diffColor }]}>{difficulty}</Text>
              <Text style={styles.statLabel}>Difficulty</Text>
            </View>
          </View>
        </Animated.View>

        {/* 3. Workout Summary Card */}
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.cardTitle}>Workout Summary</Text>
          <Text style={styles.workoutTitle}>{workoutTitle}</Text>
          <View style={styles.tagRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{category}</Text>
            </View>
          </View>
          {targetMuscles.length > 0 && (
            <View style={styles.muscleChipsRow}>
              {targetMuscles.map((muscle, i) => (
                <View key={i} style={styles.muscleChip}>
                  <Text style={styles.muscleChipText}>{muscle}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={styles.completionTime}>{completionTime}</Text>
        </Animated.View>

        {/* 4. Streak Information */}
        <Animated.View
          style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.streakRow}>
            <MaterialIcons name="whatshot" size={28} color={colors.warning} />
            <View style={styles.streakTextContainer}>
              {streak > 1 ? (
                <Text style={styles.streakValue}>{streak} day streak</Text>
              ) : (
                <Text style={styles.streakValue}>First workout completed!</Text>
              )}
              <Text style={styles.streakLabel}>Keep the momentum going</Text>
            </View>
          </View>
        </Animated.View>

        {/* 5. Motivational Quote */}
        <Animated.View
          style={[styles.quoteCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <MaterialIcons name="format-quote" size={24} color={colors.primary} />
          <Text style={styles.quoteText}>{quote}</Text>
        </Animated.View>

        {/* 6. Achievement Badge */}
        {isFirstWorkout && (
          <Animated.View style={[styles.achievementCard, { opacity: fadeAnim }]}>
            <View style={styles.achievementRow}>
              <View style={styles.achievementIconWrap}>
                <MaterialIcons name="emoji-events" size={28} color={colors.warning} />
              </View>
              <View style={styles.achievementInfo}>
                <Text style={styles.achievementTitle}>First Workout</Text>
                <Text style={styles.achievementDesc}>Completed your first session!</Text>
              </View>
              <MaterialIcons name="lock-open" size={18} color={colors.success} />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* 7. Action Buttons */}
      <Animated.View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, opacity: fadeAnim }]}
      >
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handleNavigateTo('Progress')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="bar-chart" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>View Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleNavigateTo('Workouts')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="fitness-center" size={20} color={colors.text} />
          <Text style={styles.secondaryButtonText}>Do Another Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostButton}
          onPress={() => handleNavigateTo('Home')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="home" size={20} color={colors.textSecondary} />
          <Text style={styles.ghostButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 200,
  },

  // Sparkle Decorations
  sparkleTopRight: {
    position: 'absolute',
    top: 60,
    right: 50,
    zIndex: 1,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 80,
    left: 60,
    zIndex: 1,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Stats Grid
  statsGrid: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // Card
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  workoutTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  categoryTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryTagText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  muscleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  muscleChip: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  muscleChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  completionTime: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  // Streak
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakTextContainer: {
    flex: 1,
  },
  streakValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  streakLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Quote Card
  quoteCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  quoteText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },

  // Achievement
  achievementCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  achievementIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  achievementDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Footer
  footer: {
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    gap: spacing.sm,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  ghostButtonText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
