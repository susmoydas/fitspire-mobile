import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import { useStore } from '../store/useStore';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import {
  getTrainingWeekStatus,
  getWorkoutSummary,
  getPersonalRecords,
  getMuscleSummary,
  getNextWorkout,
  getRecentWorkoutsWithImages,
  getVolumeTrend,
  getWeeklyStepData,
} from '../utils/progressData';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 40) * 0.72;
const SMALL_CARD_WIDTH = (SCREEN_WIDTH - 40 - 14) / 2;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

const MUSCLE_ICONS: Record<string, string> = {
  Chest: 'fitness-center',
  Back: 'fitness-center',
  Biceps: 'fitness-center',
  Triceps: 'fitness-center',
  Shoulders: 'fitness-center',
  Core: 'fitness-center',
  Abs: 'fitness-center',
  Obliques: 'fitness-center',
  Legs: 'directions-walk',
  Quads: 'fitness-center',
  Hamstrings: 'fitness-center',
  Glutes: 'fitness-center',
  Calves: 'fitness-center',
};

const MUSCLE_GRADIENTS: Record<string, [string, string]> = {
  Chest: ['#FF416C', '#FF4B2B'],
  Back: ['#4A00E0', '#8E2DE2'],
  Biceps: ['#F2994A', '#F2C94C'],
  Triceps: ['#FF6B6B', '#EE5A24'],
  Shoulders: ['#667eea', '#764ba2'],
  Core: ['#f093fb', '#f5576c'],
  Abs: ['#4facfe', '#00f2fe'],
  Legs: ['#43e97b', '#38f9d7'],
  Quads: ['#fa709a', '#fee140'],
  Hamstrings: ['#a18cd1', '#fbc2eb'],
  Glutes: ['#fccb90', '#d57eeb'],
  Calves: ['#e0c3fc', '#8ec5fc'],
};

const DEFAULT_GRADIENT: [string, string] = [colors.primary, colors.primaryDark];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Section Components ───────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  );
}

function NextWorkoutCard() {
  const nav = useNavigation<Nav>();
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const { plans } = useWorkoutPlans();

  const next = useMemo(() => {
    if (!plans || plans.length === 0) return null;
    return getNextWorkout(completedWorkoutLog, plans);
  }, [completedWorkoutLog, plans]);

  const fullPlan = useMemo(() => {
    if (!next?.plan) return null;
    return plans.find((p) => p.id === next.plan!.id) || null;
  }, [next, plans]);

  if (!next || !fullPlan) {
    return (
      <View style={styles.nextCard}>
        <Text style={styles.emptyCardText}>Start exploring workout plans</Text>
      </View>
    );
  }

  const { label } = next;
  const plan = fullPlan;

  return (
    <TouchableOpacity
      style={styles.nextCard}
      activeOpacity={0.9}
      onPress={() => nav.navigate('WorkoutDetail', { workoutId: plan.id, workoutTitle: plan.title })}
    >
      <View style={styles.nextCardImageWrap}>
        <ExerciseMediaCard
          exercise={plan.exercises[0] as any}
          aspectRatio={1}
          rounded={20}
          mode="detail"
        />
      </View>
      <View style={styles.nextCardContent}>
        <View style={styles.nextCardTag}>
          <Text style={styles.nextCardTagText}>Next • {label}</Text>
        </View>
        <Text style={styles.nextCardTitle} numberOfLines={2}>{plan.title}</Text>
        <Text style={styles.nextCardDescription} numberOfLines={2}>{plan.description}</Text>
        <View style={styles.nextCardMeta}>
          <View style={styles.metaPill}>
            <MaterialIcons name="fitness-center" size={11} color={colors.textSecondary} />
            <Text style={styles.metaPillText}>{plan.exerciseCount} exercises</Text>
          </View>
          <View style={styles.metaPill}>
            <MaterialIcons name="timer" size={11} color={colors.textSecondary} />
            <Text style={styles.metaPillText}>{plan.duration} min</Text>
          </View>
          <View style={[styles.metaPill, { backgroundColor: DIFFICULTY_COLORS[plan.difficulty] + '20' }]}>
            <Text style={[styles.metaPillText, { color: DIFFICULTY_COLORS[plan.difficulty] }]}>
              {plan.difficulty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TrainingSummaryCard() {
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const profile = useStore((s) => s.profile);
  const weeklyGoal = profile?.workoutDaysPerWeek || 4;

  const summary = useMemo(() => {
    return getTrainingWeekStatus(completedWorkoutLog, new Date(), weeklyGoal);
  }, [completedWorkoutLog, weeklyGoal]);

  const statusIcons: Record<string, { icon: string; color: string }> = {
    completed: { icon: 'check-circle', color: colors.success },
    rest: { icon: 'bedtime', color: colors.info },
    missed: { icon: 'cancel', color: colors.error },
    upcoming: { icon: 'radio-button-unchecked', color: colors.textMuted },
  };

  return (
    <View style={styles.summaryCard}>
      <SectionHeader title="Your Training Summary" />
      <View style={styles.weekRow}>
        {summary.days.map((day, i) => {
          const s = statusIcons[day.status];
          return (
            <View key={i} style={styles.weekDay}>
              <Text style={styles.weekDayLabel}>{day.label}</Text>
              <MaterialIcons name={s.icon as any} size={20} color={s.color} />
            </View>
          );
        })}
      </View>
      <View style={styles.summaryStats}>
        <View style={styles.summaryStat}>
          <Text style={styles.summaryStatValue}>
            {summary.completedCount} / {summary.weeklyGoal}
          </Text>
          <Text style={styles.summaryStatLabel}>completed this week</Text>
        </View>
        <View style={styles.summaryStatDivider} />
        <View style={styles.summaryStat}>
          <Text style={[styles.summaryStatValue, { color: summary.percentOnTrack >= 75 ? colors.success : colors.warning }]}>
            {summary.percentOnTrack}%
          </Text>
          <Text style={styles.summaryStatLabel}>on track</Text>
        </View>
      </View>
    </View>
  );
}

function WeeklySummaryCards() {
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const profile = useStore((s) => s.profile);
  const weeklyGoal = profile?.workoutDaysPerWeek || 4;

  const data = useMemo(() => {
    return getWorkoutSummary(completedWorkoutLog, new Date(), weeklyGoal);
  }, [completedWorkoutLog, weeklyGoal]);

  if (data.totalWorkouts === 0) return null;

  const cards = [
    { icon: 'timer', label: 'Avg. Duration', value: formatDuration(data.avgDurationMinutes), color: colors.info },
    { icon: 'fitness-center', label: 'Workouts', value: String(data.totalWorkouts), color: colors.primary },
    { icon: 'play-circle', label: 'This Week', value: String(data.completedThisWeek), color: colors.success },
    { icon: 'local-fire-department', label: 'Calories', value: `${formatNumber(data.totalCaloriesBurned)}`, color: colors.warning },
    { icon: 'repeat', label: 'Total Sets', value: String(data.totalSets), color: colors.success },
    { icon: 'category', label: 'Most Done', value: data.mostLoggedCategory || '—', color: colors.textSecondary },
  ];

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="Weekly Summary" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smallCardsRow}>
        {cards.map((card, i) => (
          <View key={i} style={styles.smallCard}>
            <MaterialIcons name={card.icon as any} size={20} color={card.color} />
            <Text style={styles.smallCardValue}>{card.value}</Text>
            <Text style={styles.smallCardLabel}>{card.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function VolumeTrendCard() {
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const workoutSessions = useStore((s) => s.workoutSessions);
  const nav = useNavigation<Nav>();

  const trend = useMemo(() => {
    return getVolumeTrend(completedWorkoutLog, workoutSessions);
  }, [completedWorkoutLog, workoutSessions]);

  const maxVolume = Math.max(...trend.weeks.map((w) => w.volume), 1);
  const isUp = trend.changePercent >= 0;

  if (trend.currentWeekVolume === 0 && trend.lastWeekVolume === 0) return null;

  return (
    <TouchableOpacity
      style={styles.volumeCard}
      activeOpacity={0.85}
      onPress={() => nav.navigate('ActivityHistory' as never)}
    >
      <View style={styles.volumeHeader}>
        <View>
          <Text style={styles.volumeTitle}>Volume</Text>
          <View style={styles.volumeValueRow}>
            <Text style={styles.volumeValue}>{formatNumber(trend.currentWeekVolume)}</Text>
            <Text style={styles.volumeUnit}>kg</Text>
          </View>
        </View>
        <View style={styles.changeBadge}>
          <MaterialIcons name={isUp ? 'trending-up' : 'trending-down'} size={14} color={isUp ? colors.success : colors.error} />
          <Text style={[styles.changeText, { color: isUp ? colors.success : colors.error }]}>
            {isUp ? '+' : ''}{trend.changePercent}%
          </Text>
        </View>
      </View>

      <View style={styles.volumeChart}>
        {trend.weeks.map((w, i) => {
          const height = maxVolume > 0 ? (w.volume / maxVolume) * 80 : 4;
          return (
            <View key={i} style={styles.volumeBarCol}>
              <View style={[styles.volumeBar, { height: Math.max(height, 4) }]} />
              <Text style={styles.volumeBarLabel}>{w.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.volumeFooter}>
        <MaterialIcons name="info-outline" size={14} color={colors.textMuted} />
        <Text style={styles.volumeFooterText}>
          {trend.currentWeekVolume > 0
            ? `${trend.weeks[trend.weeks.length - 1]?.workoutCount || 0} workouts this week`
            : 'No volume data this week'}
        </Text>
        <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function PersonalRecordsCard() {
  const workoutSessions = useStore((s) => s.workoutSessions);
  const nav = useNavigation<Nav>();

  const records = useMemo(() => {
    return getPersonalRecords(workoutSessions);
  }, [workoutSessions]);

  if (records.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader title="Recent Personal Records" />
        <View style={styles.emptyCard}>
          <MaterialIcons name="emoji-events" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>No personal records yet</Text>
          <Text style={styles.emptySubtext}>Complete workouts to track your PRs</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="Recent Personal Records" count={`${records.length}`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prRow}>
        {records.map((record, i) => (
          <TouchableOpacity key={i} style={styles.prCard} activeOpacity={0.85}>
            <View style={styles.prGradient}>
              <Text style={styles.prName} numberOfLines={1}>{record.exerciseName}</Text>
              <Text style={styles.prValue}>{record.value}<Text style={styles.prUnit}> {record.unit}</Text></Text>
              <Text style={styles.prDate}>
                {record.achievedAt ? new Date(record.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function MusclesTrainedCard() {
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);

  const muscles = useMemo(() => {
    return getMuscleSummary(completedWorkoutLog);
  }, [completedWorkoutLog]);

  if (muscles.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader title="Muscles Trained" />
        <View style={styles.emptyCard}>
          <MaterialIcons name="fitness-center" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>Complete workouts to see trained muscles</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="Muscles Trained This Week" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.muscleRow}>
        {muscles.map((m, i) => {
          const gradient = MUSCLE_GRADIENTS[m.muscle] || DEFAULT_GRADIENT;
          return (
            <View key={i} style={styles.muscleCard}>
              <LinearGradient colors={gradient} style={styles.muscleIconContainer}>
                <MaterialIcons name={(MUSCLE_ICONS[m.muscle] || 'fitness-center') as any} size={22} color="#fff" />
              </LinearGradient>
              <Text style={styles.muscleName}>{m.muscle}</Text>
              <Text style={styles.muscleCount}>x{m.count}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StepsCard() {
  const nav = useNavigation<Nav>();
  const activityLog = useStore((s) => s.activityLog);
  const profile = useStore((s) => s.profile);
  const stepGoal = profile?.stepGoal || 10000;
  const todaySteps = useStore((s) => s.todaySteps);

  const weeklyData = useMemo(() => {
    return getWeeklyStepData(activityLog, new Date(), stepGoal);
  }, [activityLog, stepGoal]);

  const maxSteps = Math.max(...weeklyData.map((d) => d.steps), 1);
  const progress = Math.min((todaySteps / stepGoal) * 100, 100);

  return (
    <TouchableOpacity
      style={styles.stepsCard}
      activeOpacity={0.85}
      onPress={() => nav.navigate('StepDetail')}
    >
      <View style={styles.stepsHeader}>
        <View style={styles.stepsTitleRow}>
          <MaterialIcons name="directions-walk" size={20} color={colors.primary} />
          <Text style={styles.stepsTitle}>Steps</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
      </View>

      <View style={styles.stepsBody}>
        <View style={styles.stepsLeft}>
          <Text style={styles.stepsCount}>{formatNumber(todaySteps)}</Text>
          <View style={styles.stepsProgressBg}>
            <View style={[styles.stepsProgressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.stepsGoalText}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{Math.round(progress)}%</Text>
            {' of '}{formatNumber(stepGoal)} goal
          </Text>
        </View>

        {/* Mini weekly chart */}
        <View style={styles.stepsMiniChart}>
          {weeklyData.map((d, i) => {
            const height = maxSteps > 0 ? (d.steps / maxSteps) * 40 : 4;
            return (
              <View key={i} style={styles.stepsMiniBar}>
                <View style={[styles.stepsMiniBarFill, { height: Math.max(height, 3) }]} />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.stepsFooter}>
        <TouchableOpacity
          style={styles.stepsGoalBtn}
          onPress={() => nav.navigate('StepDetail')}
        >
          <MaterialIcons name="edit" size={12} color={colors.primary} />
          <Text style={styles.stepsGoalBtnText}>Edit Goal</Text>
        </TouchableOpacity>
        <Text style={styles.stepsFooterText}>Tap for details</Text>
      </View>
    </TouchableOpacity>
  );
}

function HealthMetricsCard() {
  const profile = useStore((s) => s.profile);

  const hasWeight = profile?.weight && profile.weight > 0;

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="Key Health Metrics" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRow}>
        <StepsCard />

        {hasWeight ? (
          <View style={styles.metricCard}>
            <MaterialIcons name="monitor-weight" size={20} color={colors.info} />
            <Text style={styles.metricValue}>{profile.weight}<Text style={styles.metricUnit}> kg</Text></Text>
            <Text style={styles.metricLabel}>Weight</Text>
          </View>
        ) : null}

        <View style={styles.metricCard}>
          <MaterialIcons name="favorite-border" size={20} color={colors.error} />
          <Text style={styles.metricPlaceholder}>—</Text>
          <Text style={styles.metricLabel}>Heart Rate</Text>
          <Text style={styles.metricSubtext}>Connect device</Text>
        </View>

        <View style={styles.metricCard}>
          <MaterialIcons name="bedtime" size={20} color={colors.info} />
          <Text style={styles.metricPlaceholder}>—</Text>
          <Text style={styles.metricLabel}>Sleep</Text>
          <Text style={styles.metricSubtext}>Connect device</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function RecentWorkoutsCard() {
  const nav = useNavigation<Nav>();
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const { plans } = useWorkoutPlans();

  const recentWorkouts = useMemo(() => {
    return getRecentWorkoutsWithImages(completedWorkoutLog, plans || []);
  }, [completedWorkoutLog, plans]);

  if (recentWorkouts.length === 0) {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader title="Recent Workouts" />
        <View style={styles.emptyCard}>
          <MaterialIcons name="fitness-center" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>Complete your first workout to see recent workouts</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      <SectionHeader title="Recent Workouts" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
        {recentWorkouts.map((w, i) => (
          <TouchableOpacity
            key={w.workoutId + i}
            style={styles.recentCard}
            activeOpacity={0.85}
            onPress={() => nav.navigate('WorkoutDetail', { workoutId: w.workoutId || '', workoutTitle: w.workoutTitle })}
          >
            <Image
              source={{ uri: w.imageUrl || 'https://placehold.co/400x300/1a1a1c/666?text=Workout' }}
              style={styles.recentCardImage}
              contentFit="cover"
            />
            <View style={styles.recentCardContent}>
              <View style={styles.recentCardTag}>
                <MaterialIcons name="check-circle" size={12} color={colors.success} />
                <Text style={styles.recentCardTagText}>Completed</Text>
              </View>
              <Text style={styles.recentCardTitle} numberOfLines={1}>{w.workoutTitle}</Text>
              <View style={styles.recentCardMeta}>
                <Text style={styles.recentCardMetaText}>{w.exercisesCompleted} exercises</Text>
                <Text style={styles.recentCardMetaDot}>•</Text>
                <Text style={styles.recentCardMetaText}>{formatDuration(Math.round(w.duration / 60))}</Text>
              </View>
              {w.calories > 0 && (
                <Text style={styles.recentCardCalories}>{w.calories} cal</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Next Workout */}
        <View style={styles.sectionContainer}>
          <SectionHeader title="Next Workout" />
          <NextWorkoutCard />
        </View>

        {/* 2. Training Summary */}
        <TrainingSummaryCard />

        {/* 3. Weekly Summary Cards */}
        <WeeklySummaryCards />

        {/* 4. Volume Trend */}
        <VolumeTrendCard />

        {/* 5. Personal Records */}
        <PersonalRecordsCard />

        {/* 6. Muscles Trained */}
        <MusclesTrainedCard />

        {/* 7. Health Metrics */}
        <HealthMetricsCard />

        {/* 8. Recent Workouts */}
        <RecentWorkoutsCard />

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  sectionContainer: {
    marginBottom: spacing.lg,
  },

  // Empty states
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Next Workout
  nextCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.bigCard,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextCardImageWrap: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  nextCardContent: {
    padding: spacing.md,
  },
  nextCardTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  nextCardTagText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextCardTitle: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  nextCardDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  nextCardMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    gap: spacing.xxs,
  },
  metaPillText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Training Summary
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  weekDay: {
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  weekDayLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '600',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  summaryStatLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // Small cards (Weekly Summary)
  smallCardsRow: {
    gap: spacing.sm + 2,
  },
  smallCard: {
    width: SMALL_CARD_WIDTH,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallCardValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
  },
  smallCardLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Volume
  volumeCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  volumeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  volumeTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  volumeValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  volumeValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  volumeUnit: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  changeBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  volumeChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  volumeBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  volumeBar: {
    width: 20,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    minHeight: 4,
  },
  volumeBarLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  volumeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  volumeFooterText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs / 2,
  },

  // Personal Records
  prRow: {
    gap: spacing.sm + 2,
  },
  prCard: {
    width: 140,
    height: 120,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prGradient: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 2,
  },
  prName: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  prValue: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.text,
  },
  prUnit: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  prDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Muscles
  muscleRow: {
    gap: spacing.sm + 2,
  },
  muscleCard: {
    width: 110,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muscleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muscleName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  muscleCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Steps
  stepsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    width: SCREEN_WIDTH - spacing.lg * 2,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepsTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  stepsBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepsLeft: {
    flex: 1,
  },
  stepsCount: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  stepsProgressBg: {
    height: 6,
    backgroundColor: colors.cardElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: spacing.xs,
  },
  stepsProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepsGoalText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  stepsMiniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  stepsMiniBar: {
    width: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stepsMiniBarFill: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
    minHeight: 3,
    opacity: 0.5,
  },
  stepsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  stepsGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  stepsGoalBtnText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },
  stepsFooterText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Health Metrics
  metricsRow: {
    gap: spacing.sm + 2,
  },
  metricCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - 16) / 2 - 16,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
  },
  metricUnit: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textMuted,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
  },
  metricPlaceholder: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  metricSubtext: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    opacity: 0.6,
  },

  // Recent Workouts
  recentRow: {
    gap: spacing.sm + 2,
  },
  recentCard: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  recentCardContent: {
    padding: spacing.sm + 2,
    gap: 2,
  },
  recentCardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  recentCardTagText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: '600',
  },
  recentCardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  recentCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recentCardMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  recentCardMetaDot: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  recentCardCalories: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 2,
  },
});
