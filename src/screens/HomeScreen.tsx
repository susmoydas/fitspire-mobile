import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { colors, fontSize, spacing, borderRadius, shadows } from '../components/Theme';
import { getExerciseById } from '../data/exercises';
import { Notification } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const workoutSessions = useStore((s) => s.workoutSessions);
  const activityLog = useStore((s) => s.activityLog);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const goals = useStore((s) => s.goals);

  const [showNotifications, setShowNotifications] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayActivity = activityLog.find((a) => a.date === today);
  const todayWorkout = workoutSessions.find(
    (s) => s.date === today && s.completed
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const latestWorkout = workoutSessions
    .filter((s) => s.completed)
    .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())[0];

  const weightGoal = useMemo(() => {
    if (profile.weight && profile.goalWeight) {
      const diff = profile.weight - profile.goalWeight;
      const progress = diff > 0
        ? Math.min(1, diff / (profile.weight * 0.2))
        : Math.min(1, (profile.goalWeight - profile.weight) / (profile.weight * 0.2));
      return {
        current: profile.weight,
        target: profile.goalWeight,
        progress: Math.abs(progress),
        direction: diff > 0 ? 'lose' : 'gain',
      };
    }
    return null;
  }, [profile]);

  const todayCalories = useMemo(() => {
    const meals = useStore.getState().meals.filter((m) => m.date === today);
    return meals.reduce((sum, m) => sum + m.calories, 0);
  }, [today]);

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notifItem, !item.read && styles.notifUnread]}
      onPress={() => markNotificationRead(item.id)}
    >
      <Text style={styles.notifTitle}>{item.title}</Text>
      <Text style={styles.notifMessage}>{item.message}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hi, {profile.gender === 'male' ? 'Bro' : profile.gender === 'female' ? 'Girl' : 'Champ'}!
          </Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.bellButton} onPress={() => setShowNotifications(!showNotifications)}>
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Notifications Panel */}
        {showNotifications && (
          <Card style={styles.notifPanel}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notifications.length === 0 ? (
              <EmptyState title="No notifications" message="You're all caught up!" />
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </Card>
        )}

        {/* Weight Goal */}
        {weightGoal && (
          <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
            <Card style={styles.goalCard} variant="elevated">
              <Text style={styles.goalLabel}>Weight Goal: {weightGoal.direction} weight</Text>
              <View style={styles.goalRow}>
                <Text style={styles.goalValue}>{weightGoal.current} kg</Text>
                <Text style={styles.goalArrow}>→</Text>
                <Text style={[styles.goalValue, { color: colors.success }]}>{weightGoal.target} kg</Text>
              </View>
              <ProgressBar progress={weightGoal.progress} />
              <Text style={styles.goalProgressText}>
                {Math.round(weightGoal.progress * 100)}% toward your goal → Tap for details
              </Text>
            </Card>
          </TouchableOpacity>
        )}

        {/* Today's Workout */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          {todayWorkout ? (
            <View>
              <Text style={styles.completedText}>✅ Workout completed today!</Text>
              <Text style={styles.completedSubtext}>
                Duration: {Math.floor(todayWorkout.duration / 60)}m {todayWorkout.duration % 60}s
              </Text>
            </View>
          ) : latestWorkout ? (
            <TouchableOpacity
              style={styles.startWorkoutBtn}
              onPress={() => navigation.navigate('Exercises' as any)}
            >
              <Text style={styles.startWorkoutText}>Start Today's Workout</Text>
              <Text style={styles.lastWorkoutText}>
                Last: {new Date(latestWorkout.date).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startWorkoutBtn}
              onPress={() => navigation.navigate('Exercises' as any)}
            >
              <Text style={styles.startWorkoutText}>Start First Workout</Text>
              <Text style={styles.lastWorkoutText}>No workouts yet — let's change that!</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Activity Summary */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{todayActivity?.steps || 0}</Text>
              <Text style={styles.metricLabel}>Steps</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{todayCalories}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{todayActivity?.waterGlasses || 0}</Text>
              <Text style={styles.metricLabel}>Water</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{todayActivity?.sleepHours || 0}h</Text>
              <Text style={styles.metricLabel}>Sleep</Text>
            </View>
          </View>
        </Card>

        {/* Recommendations */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendation}>
            <Text style={styles.recIcon}>💧</Text>
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>Stay Hydrated</Text>
              <Text style={styles.recText}>
                {todayActivity?.waterGlasses ? todayActivity.waterGlasses >= 8 ? 'Great job!' : `${8 - todayActivity.waterGlasses} more glasses today` : 'Aim for 8 glasses'}
              </Text>
            </View>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recIcon}>😴</Text>
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>Sleep</Text>
              <Text style={styles.recText}>
                {todayActivity?.sleepHours ? todayActivity.sleepHours >= 7 ? 'Well rested!' : 'Try to get 7-8 hours' : 'Track your sleep'}
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>
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
  greeting: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  dateText: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  bellButton: { position: 'relative', padding: spacing.sm },
  bellIcon: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  notifPanel: { marginBottom: spacing.md },
  notifItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  notifUnread: { backgroundColor: colors.primary + '10' },
  notifTitle: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  notifMessage: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  goalCard: { marginBottom: spacing.md },
  goalLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  goalValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  goalArrow: { color: colors.textMuted, fontSize: fontSize.lg },
  goalProgressText: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.sm },
  sectionCard: { marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm },
  completedText: { color: colors.success, fontWeight: '600' },
  completedSubtext: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  startWorkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  startWorkoutText: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  lastWorkoutText: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: spacing.xs },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  metricLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  recommendation: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  recIcon: { fontSize: 24 },
  recContent: { flex: 1 },
  recTitle: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  recText: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
});
