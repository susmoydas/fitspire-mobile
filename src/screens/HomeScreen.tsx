import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { useStepCounter } from '../hooks/useStepCounter';
import { useStepLiveActivity } from '../hooks/useStepGoalNotifier';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import SectionHeader from '../components/SectionHeader';
import MetricCard from '../components/MetricCard';
import StepSourceBanner from '../components/StepSourceBanner';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import type { CompletedWorkout, DailyActivity } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Step Ring ────────────────────────────────────────────────
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const RING_SIZE = CARD_WIDTH - 40;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Weekly Ring ──────────────────────────────────────────────
const WEEKLY_SIZE = 42;
const WEEKLY_STROKE = 3;
const WEEKLY_RADIUS = (WEEKLY_SIZE - WEEKLY_STROKE) / 2;
const WEEKLY_CIRCUMFERENCE = 2 * Math.PI * WEEKLY_RADIUS;

// ─── Helpers ──────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function calculateStreak(log: CompletedWorkout[]): { current: number; best: number } {
  if (!log.length) return { current: 0, best: 0 };
  const dates = [...new Set(log.map((w) => w.completedAt.split('T')[0]))].sort().reverse();
  let current = 1;
  let best = 1;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) { current++; streak++; best = Math.max(best, streak); }
    else break;
  }
  best = Math.max(best, current);
  return { current, best };
}

function getWeekStart(): Date {
  const today = new Date();
  const day = today.getDay();
  const offset = (day + 1) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeeklyProgress(
  completedWorkoutLog: CompletedWorkout[],
  activityLog: DailyActivity[],
  stepGoal: number,
  todaySteps: number,
) {
  const weekStart = getWeekStart();
  const dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const today = new Date();

  return dayNames.map((day, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const isToday = date.toDateString() === today.toDateString();
    const isFuture = date.getTime() > today.getTime();

    let progress = 0;

    if (!isFuture) {
      const hasWorkout = completedWorkoutLog.some((w) => w.completedAt?.startsWith(dateStr));
      if (hasWorkout) progress = 1;

      let steps = 0;
      if (isToday) {
        steps = todaySteps;
      } else {
        const activity = activityLog.find((a) => a.date === dateStr);
        steps = activity?.steps || 0;
      }
      if (stepGoal > 0) {
        const stepPct = Math.min(steps / stepGoal, 1);
        if (stepPct > progress) progress = stepPct;
      }
    }

    progress = Math.min(progress, 1);

    let status: 'completed' | 'partial' | 'low' | 'empty' | 'upcoming';
    if (isFuture) status = 'upcoming';
    else if (progress >= 1) status = 'completed';
    else if (progress > 0.5) status = 'partial';
    else if (progress > 0) status = 'low';
    else status = 'empty';

    return { day, date: dateStr, progress, status, isToday, isFuture };
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const { steps: pedometerSteps, distanceKm, calories: stepCalories, isAvailable, permissionGranted, healthConnectActive, needsHealthConnectInstall } = useStepCounter();
  useStepLiveActivity({ permissionGranted, isAvailable });
  const { plans, loading: plansLoading } = useWorkoutPlans();

  const todaySteps = useStore((s) => s.todaySteps);
  const stepGoal = useStore((s) => s.profile.stepGoal) || 10000;
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);
  const workoutBuilder = useStore((s) => s.workoutBuilder);
  const activityLog = useStore((s) => s.activityLog);
  const healthConnectOptIn = useStore((s) => s.healthConnectOptIn);

  const hasLiveSteps = isAvailable && permissionGranted;
  const displaySteps = hasLiveSteps ? pedometerSteps : todaySteps;
  const showStepBanner =
    Platform.OS === 'android' &&
    healthConnectOptIn !== 'pending' &&
    (!healthConnectActive || needsHealthConnectInstall);
  const progressPct = Math.min(displaySteps / stepGoal, 1);
  const progressOffset = CIRCUMFERENCE * (1 - progressPct);

  const workoutsThisWeek = useMemo(() => {
    const weekStart = getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return completedWorkoutLog.filter((w) => {
      const d = new Date(w.completedAt);
      return d >= weekStart && d < weekEnd;
    }).length;
  }, [completedWorkoutLog]);

  const streak = useMemo(() => calculateStreak(completedWorkoutLog), [completedWorkoutLog]);

  const todayCompleted = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return completedWorkoutLog.find((w) => w.completedAt?.startsWith(today));
  }, [completedWorkoutLog]);

  const hasCompletedToday = !!todayCompleted;

  const weekDays = useMemo(
    () => getWeeklyProgress(completedWorkoutLog, activityLog, stepGoal, displaySteps),
    [completedWorkoutLog, activityLog, stepGoal, displaySteps],
  );

  const firstPlan = plans.length > 0 ? plans[0] : null;
  const upcomingPlan = plans.length > 1 ? plans[1] : null;

  const recommendedPlans = useMemo(() => {
    const skipIds = new Set([firstPlan?.id, upcomingPlan?.id].filter(Boolean));
    return plans.filter((p) => !skipIds.has(p.id)).slice(0, 5);
  }, [plans, firstPlan, upcomingPlan]);

  const hasUnfinished = workoutBuilder.length > 0;

  // ─── Step counter dismiss state ─────────────────────────────
  const [stepDismissed, setStepDismissed] = useState(false);
  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => {
        // Only claim the gesture when horizontal motion clearly dominates.
        return Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
      },
      onPanResponderMove: (_e, g) => {
        // Only allow leftward translation; clamp positive drag to 0.
        if (g.dx < 0) pan.setValue(g.dx);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -80) {
          Animated.timing(pan, {
            toValue: -SCREEN_WIDTH,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            pan.setValue(0);
            setStepDismissed(true);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    }),
  ).current;

  const recentActivity = useMemo(() => {
    return [...completedWorkoutLog].slice(0, 5);
  }, [completedWorkoutLog]);

  const todayCalories = useMemo(() => {
    if (hasCompletedToday && todayCompleted?.calories) return todayCompleted.calories;
    return stepCalories;
  }, [hasCompletedToday, todayCompleted, stepCalories]);

  // ─── Weekly Circle Render ─────────────────────────────────
  const renderDayCircle = (d: typeof weekDays[number]) => {
    const offset = WEEKLY_CIRCUMFERENCE * (1 - d.progress);
    let ringColor = colors.textMuted;
    let bgColor = '#1A1A1C';
    let dashArray: string | undefined;

    if (d.status === 'completed') { ringColor = colors.primary; bgColor = 'rgba(255,122,26,0.08)'; }
    else if (d.status === 'partial') { ringColor = colors.primary; bgColor = 'rgba(255,122,26,0.05)'; }
    else if (d.status === 'low') { ringColor = colors.primary + '60'; bgColor = 'transparent'; }
    else if (d.status === 'upcoming') { ringColor = '#2A2A2A'; bgColor = 'transparent'; dashArray = '2, 3'; }
    else { ringColor = '#2A2A2A'; bgColor = 'transparent'; dashArray = '2, 3'; }

    return (
      <View key={d.day} style={styles.dayCol}>
        <View style={[styles.dayCircleOuter, { backgroundColor: bgColor }]}>
          <Svg width={WEEKLY_SIZE} height={WEEKLY_SIZE}>
            <Circle
              cx={WEEKLY_SIZE / 2}
              cy={WEEKLY_SIZE / 2}
              r={WEEKLY_RADIUS}
              stroke={d.status === 'upcoming' ? '#1A1A1C' : '#252525'}
              strokeWidth={WEEKLY_STROKE}
              fill="none"
              strokeDasharray={d.status === 'empty' || d.status === 'upcoming' ? '2, 3' : undefined}
            />
            {(d.status !== 'upcoming' && d.progress > 0) && (
              <Circle
                cx={WEEKLY_SIZE / 2}
                cy={WEEKLY_SIZE / 2}
                r={WEEKLY_RADIUS}
                stroke={ringColor}
                strokeWidth={WEEKLY_STROKE}
                fill="none"
                strokeDasharray={CIRCUMFERENCE.toString()}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${WEEKLY_SIZE / 2} ${WEEKLY_SIZE / 2})`}
              />
            )}
          </Svg>
          <Text style={[
            styles.dayCircleText,
            d.status === 'completed' && { color: colors.primary },
            d.status === 'upcoming' && { color: colors.textMuted },
          ]}>
            {d.day[0]}
          </Text>
        </View>
        <Text style={[
          styles.dayLabel,
          d.isToday && { color: colors.primary, fontWeight: '700' },
        ]}>{d.day}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <StepSourceBanner visible={showStepBanner} />

        {/* ── 1. STEP COUNTER (swipeable) ─────────────────── */}
        {stepDismissed ? (
          <TouchableOpacity
            style={styles.stepRestorePill}
            activeOpacity={0.85}
            onPress={() => setStepDismissed(false)}
          >
            <MaterialIcons name="directions-walk" size={16} color={colors.primary} />
            <Text style={styles.stepRestoreText}>Show step counter</Text>
          </TouchableOpacity>
        ) : (
          <Animated.View
            style={[styles.stepCardWrap, { transform: [{ translateX: pan }] }]}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              style={styles.stepCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('StepDetail')}
            >
          <View style={styles.stepRingContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#252525"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke={colors.primary}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={progressOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.stepRingCenter}>
              <Text style={styles.stepCountNumber}>{displaySteps.toLocaleString()}</Text>
              <Text style={styles.stepsLabel}>Steps</Text>
              <Text style={styles.stepGoalLabel}>Goal {stepGoal.toLocaleString()}</Text>
              <View style={styles.stepProgressBadge}>
                <Text style={styles.stepPct}>{Math.round(progressPct * 100)}% completed</Text>
              </View>
            </View>
          </View>

          {hasLiveSteps && (
            <View style={styles.stepMetaRow}>
              <View style={styles.stepMeta}>
                <MaterialIcons name="directions-walk" size={16} color={colors.textMuted} />
                <Text style={styles.stepMetaText}>{distanceKm} km</Text>
              </View>
              <View style={styles.stepMetaDot} />
              <View style={styles.stepMeta}>
                <MaterialIcons name="local-fire-department" size={16} color={colors.textMuted} />
                <Text style={styles.stepMetaText}>{stepCalories} cal</Text>
              </View>
            </View>
          )}
          <TouchableOpacity
            style={styles.stepClose}
            onPress={() => setStepDismissed(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── 2. STATS ROW ────────────────────────────────── */}
        <View style={styles.metricsRow}>
          <MetricCard
            icon="local-fire-department"
            value={todayCalories.toString()}
            label="Calories"
            color={colors.primary}
          />
          <MetricCard
            icon="fitness-center"
            value={workoutsThisWeek.toString()}
            label="Workouts"
            color="#5AC8FA"
          />
          <MetricCard
            icon="whatshot"
            value={streak.current.toString()}
            label="Streak"
            color={colors.primary}
          />
        </View>

        {/* ── 3. WEEKLY DAY PROGRESS ──────────────────────── */}
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
            <Text style={styles.weeklyHeaderText}>This Week</Text>
            <Text style={styles.weeklyCount}>{workoutsThisWeek} workout{workoutsThisWeek !== 1 ? 's' : ''}</Text>
          </View>
          <View style={styles.weeklyRow}>
            {weekDays.map(renderDayCircle)}
          </View>
        </View>

        {/* ── 4. TODAY'S WORKOUT ──────────────────────────── */}
        <View style={styles.workoutCard}>
          {hasCompletedToday ? (
            <>
              <View style={styles.workoutBadge}>
                <MaterialIcons name="check-circle" size={20} color={colors.success} />
                <Text style={[styles.workoutBadgeText, { color: colors.success }]}>Completed Today</Text>
              </View>
              <Text style={styles.workoutTitle}>{todayCompleted?.workoutTitle}</Text>
              <Text style={styles.workoutDesc}>{formatDuration(todayCompleted?.duration || 0)}</Text>
              <Text style={styles.workoutCongrats}>Great work! Come back tomorrow for your next session.</Text>
            </>
          ) : plansLoading ? (
            <View style={styles.workoutLoading}>
              <View style={styles.skeletonLineWide} />
              <View style={styles.skeletonLineShort} />
            </View>
          ) : firstPlan ? (
            <>
              <View style={styles.workoutBadge}>
                <View style={styles.workoutBadgeDot} />
                <Text style={styles.workoutBadgeText}>Today's Workout</Text>
              </View>
              <Text style={styles.workoutTitle}>{firstPlan.title}</Text>
              <Text style={styles.workoutDesc}>{firstPlan.benefit}</Text>
              <View style={styles.workoutMetaRow}>
                <View style={styles.workoutMeta}>
                  <MaterialIcons name="timer" size={16} color={colors.primary} />
                  <Text style={styles.workoutMetaText}>{formatDuration(firstPlan.duration * 60)}</Text>
                </View>
                <View style={styles.workoutMetaSep} />
                <View style={styles.workoutMeta}>
                  <MaterialIcons name="signal-cellular-alt" size={16} color={colors.primary} />
                  <Text style={styles.workoutMetaText}>{firstPlan.difficulty}</Text>
                </View>
                <View style={styles.workoutMetaSep} />
                <View style={styles.workoutMeta}>
                  <MaterialIcons name="fitness-center" size={16} color={colors.primary} />
                  <Text style={styles.workoutMetaText}>{firstPlan.exerciseCount} exercises</Text>
                </View>
              </View>
              <View style={styles.workoutTargetRow}>
                {firstPlan.targetMuscles.slice(0, 4).map((m) => (
                  <View key={m} style={styles.targetChip}>
                    <Text style={styles.targetChipText}>{m}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('WorkoutDetail', { workoutId: firstPlan.id, workoutTitle: firstPlan.title })}
                style={styles.workoutBtn}
              >
                <MaterialIcons name="play-arrow" size={22} color={colors.text} />
                <Text style={styles.workoutBtnText}>Start Workout</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.workoutEmpty}>
              <Text style={styles.workoutEmptyText}>No workouts available</Text>
            </View>
          )}
        </View>

        {/* ── 5. UPCOMING WORKOUT ────────────────────────── */}
        <View style={styles.upcomingCard}>
          {upcomingPlan ? (
            <>
              <View style={styles.upcomingHeader}>
                <MaterialIcons name="schedule" size={18} color={colors.textSecondary} />
                <Text style={styles.upcomingHeaderText}>Upcoming</Text>
              </View>
              <Text style={styles.upcomingTitle}>{upcomingPlan.title}</Text>
              <Text style={styles.upcomingBenefit}>{upcomingPlan.benefit}</Text>
              <View style={styles.upcomingMetaRow}>
                <View style={styles.upcomingMeta}>
                  <MaterialIcons name="timer" size={15} color={colors.textMuted} />
                  <Text style={styles.upcomingMetaText}>{formatDuration(upcomingPlan.duration * 60)}</Text>
                </View>
                <View style={styles.upcomingMetaSep} />
                <View style={styles.upcomingMeta}>
                  <MaterialIcons name="signal-cellular-alt" size={15} color={colors.textMuted} />
                  <Text style={styles.upcomingMetaText}>{upcomingPlan.difficulty}</Text>
                </View>
                <View style={styles.upcomingMetaSep} />
                <View style={styles.upcomingMeta}>
                  <MaterialIcons name="fitness-center" size={15} color={colors.textMuted} />
                  <Text style={styles.upcomingMetaText}>{upcomingPlan.targetMuscles.slice(0, 2).join(', ')}</Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.upcomingBtn}
                onPress={() => navigation.navigate('WorkoutDetail', { workoutId: upcomingPlan.id, workoutTitle: upcomingPlan.title })}
              >
                <Text style={styles.upcomingBtnText}>View Workout</Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.upcomingHeader}>
                <MaterialIcons name="schedule" size={18} color={colors.textSecondary} />
                <Text style={styles.upcomingHeaderText}>Upcoming</Text>
              </View>
              <Text style={styles.upcomingEmptyTitle}>Plan your next workout</Text>
              <Text style={styles.upcomingEmptyDesc}>
                Browse the workout library and choose what to do next
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.upcomingBtn}
                onPress={() => (navigation as any).navigate('Workouts')}
              >
                <Text style={styles.upcomingBtnText}>Choose Workout</Text>
                <MaterialIcons name="arrow-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── 6. CONTINUE WORKOUT (lower) ────────────────── */}
        {hasUnfinished && (
          <View style={styles.continueCard}>
            <View style={styles.continueHeader}>
              <MaterialIcons name="pause-circle" size={20} color={colors.warning} />
              <Text style={styles.continueLabel}>Unfinished</Text>
              <View style={styles.continueProgressWrap}>
                <View style={styles.continueProgressTrack}>
                  <View style={[styles.continueProgressFill, { width: '30%' }]} />
                </View>
              </View>
            </View>
            <Text style={styles.continueTitle}>Continue your session</Text>
            <Text style={styles.continueDesc}>
              {workoutBuilder.length} exercise{workoutBuilder.length !== 1 ? 's' : ''} in progress
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: 'builder', workoutTitle: 'Custom Workout' })}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>Continue Workout</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── 7. RECOMMENDED ──────────────────────────────── */}
        {recommendedPlans.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Recommended"
              action="See All"
              onAction={() => (navigation as any).navigate('Workouts')}
            />
            <View style={styles.recommendedGrid}>
              {recommendedPlans.slice(0, 4).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recommendedCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id, workoutTitle: item.title })}
                >
                  {item.exercises?.[0] ? (
                    <ExerciseMediaCard
                      exercise={item.exercises[0] as any}
                      aspectRatio={1}
                      rounded={16}
                      mode="detail"
                    />
                  ) : (
                    <View style={[styles.recommendedImageFallback, { aspectRatio: 1 }]}>
                      <MaterialIcons name="fitness-center" size={28} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.recommendedInfo}>
                    <View style={styles.recommendedLevelPill}>
                      <Text style={styles.recommendedLevelPillText}>{item.difficulty}</Text>
                    </View>
                    <Text style={styles.recommendedName} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.recommendedMetaText}>{item.duration} min · Level</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 8. RECENT ACTIVITY ──────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Activity"
            action="See All"
            onAction={() => navigation.navigate('ActivityHistory')}
          />
          {recentActivity.length === 0 ? (
            <View style={styles.emptyRecent}>
              <MaterialIcons name="fitness-center" size={44} color={colors.textMuted} />
              <Text style={styles.emptyRecentTitle}>No activity yet</Text>
              <Text style={styles.emptyRecentMessage}>
                Complete your first workout to see progress
              </Text>
            </View>
          ) : (
            recentActivity.map((item) => (
              <TouchableOpacity
                key={item.completedAt}
                style={styles.activityRow}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.workoutId, workoutTitle: item.workoutTitle })}
              >
                <View style={styles.activityIcon}>
                  <MaterialIcons name="check-circle" size={24} color={colors.success} />
                </View>
                <View style={styles.activityInfoWrap}>
                  <Text style={styles.activityName} numberOfLines={1}>{item.workoutTitle}</Text>
                  <Text style={styles.activityMeta}>{formatDuration(item.duration)}</Text>
                </View>
                <View style={styles.activityRight}>
                  <View style={[styles.difficultyBadge, {
                    backgroundColor: (item.difficulty === 'Beginner' || item.difficulty === 'Intermediate') ? colors.primary + '20' : colors.error + '20'
                  }]}>
                    <Text style={[styles.difficultyBadgeText, {
                      color: item.difficulty === 'Advanced' ? colors.error : colors.warning
                    }]}>
                      {item.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>{formatDate(item.completedAt)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  // ── Step Card ────────────────────────────────────────────
  stepCardWrap: {
    position: 'relative',
  },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
  },
  stepRestorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRestoreText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  stepRingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  stepCountNumber: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  stepsLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  stepGoalLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 2,
  },
  stepProgressBadge: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs + 1,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  stepPct: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  stepMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  stepMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
  },

  // ── Weekly Card ──────────────────────────────────────────
  weeklyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    marginBottom: spacing.md,
  },
  weeklyHeaderText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  weeklyCount: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: spacing.xxs - 1,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayCol: {
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  dayCircleOuter: {
    width: WEEKLY_SIZE + 8,
    height: WEEKLY_SIZE + 8,
    borderRadius: (WEEKLY_SIZE + 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: {
    position: 'absolute',
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text,
  },
  dayLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // ── Metrics ──────────────────────────────────────────────
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.xl,
  },

  // ── Today's Workout Card ─────────────────────────────────
  workoutCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    marginBottom: spacing.sm,
  },
  workoutBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  workoutBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  workoutDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutMetaSep: {
    width: 1,
    height: 14,
    backgroundColor: '#2A2A2A',
  },
  workoutMetaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  workoutTargetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  targetChip: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  targetChipText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  workoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  workoutBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  workoutLoading: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  workoutEmpty: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  workoutEmptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  skeletonLineWide: {
    height: 14,
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    width: '70%',
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: colors.skeleton,
    borderRadius: 4,
    width: '40%',
  },
  workoutCongrats: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  // ── Upcoming Card ───────────────────────────────────────
  upcomingCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  upcomingHeaderText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  upcomingTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  upcomingBenefit: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  upcomingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  upcomingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upcomingMetaSep: {
    width: 1,
    height: 12,
    backgroundColor: '#2A2A2A',
  },
  upcomingMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  upcomingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  upcomingBtnText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  upcomingEmptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  upcomingEmptyDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.md,
  },

  // ── Continue Workout ─────────────────────────────────────
  continueCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  continueLabel: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  continueProgressWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  continueProgressTrack: {
    width: 60,
    height: 4,
    backgroundColor: '#252525',
    borderRadius: 2,
    overflow: 'hidden',
  },
  continueProgressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 2,
  },
  continueTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  continueDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginBottom: spacing.md,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },

  // ── Section ──────────────────────────────────────────────
  section: {
    marginBottom: spacing.xl,
  },

  // ── Recommended ──────────────────────────────────────────
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recommendedCard: {
    width: (CARD_WIDTH - 12) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  recommendedImageFallback: {
    width: '100%',
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedInfo: {
    padding: spacing.sm + 2,
    gap: 4,
  },
  recommendedLevelPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: 2,
  },
  recommendedLevelPillText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recommendedName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '800',
    lineHeight: 20,
  },
  recommendedMetaText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Recent Activity ──────────────────────────────────────
  emptyRecent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyRecentTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  emptyRecentMessage: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfoWrap: {
    flex: 1,
    gap: 2,
  },
  activityName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  activityMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  difficultyBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
  },
  difficultyBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  activityDate: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
