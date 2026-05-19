import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import EmptyState from '../components/EmptyState';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const activityLog = useStore((s) => s.activityLog);
  const meals = useStore((s) => s.meals);
  const workoutSessions = useStore((s) => s.workoutSessions);

  const today = new Date().toISOString().split('T')[0];

  const weekData = useMemo(() => {
    const days: { date: string; label: string; steps: number; calories: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const act = activityLog.find((a) => a.date === dateStr);
      const dayMeals = meals.filter((m) => m.date === dateStr);
      days.push({
        date: dateStr,
        label,
        steps: act?.steps || 0,
        calories: dayMeals.reduce((s, m) => s + m.calories, 0),
      });
    }
    return days;
  }, [activityLog, meals]);

  const maxSteps = Math.max(...weekData.map((d) => d.steps), 1);
  const maxCalories = Math.max(...weekData.map((d) => d.calories), 1);

  const totalWorkouts = useMemo(() => {
    return workoutSessions.filter((s) => s.completed).length;
  }, [workoutSessions]);

  const totalWorkoutTime = useMemo(() => {
    return workoutSessions
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [workoutSessions]);

  const totalMealsLogged = meals.length;

  const renderSimpleChart = (
    data: typeof weekData,
    valueKey: 'steps' | 'calories',
    maxValue: number,
    color: string,
    label: string
  ) => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{label}</Text>
      <View style={styles.chartRow}>
        {data.map((day) => (
          <View key={day.date} style={styles.chartBarContainer}>
            <View style={styles.chartBarWrapper}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: Math.max((day[valueKey] / maxValue) * 100, 4),
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.chartLabel}>{day.label}</Text>
            <Text style={styles.chartValue}>{day[valueKey]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Stats</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overview Cards */}
        <View style={styles.overviewRow}>
          <Card style={styles.overviewCard}>
            <Text style={styles.overviewIcon}>💪</Text>
            <Text style={styles.overviewValue}>{totalWorkouts}</Text>
            <Text style={styles.overviewLabel}>Workouts</Text>
          </Card>
          <Card style={styles.overviewCard}>
            <Text style={styles.overviewIcon}>⏱️</Text>
            <Text style={styles.overviewValue}>{Math.floor(totalWorkoutTime / 60)}m</Text>
            <Text style={styles.overviewLabel}>Active Time</Text>
          </Card>
          <Card style={styles.overviewCard}>
            <Text style={styles.overviewIcon}>🍽️</Text>
            <Text style={styles.overviewValue}>{totalMealsLogged}</Text>
            <Text style={styles.overviewLabel}>Meals</Text>
          </Card>
        </View>

        {activityLog.length === 0 ? (
          <EmptyState title="No activity data yet" message="Start logging your activity to see stats" />
        ) : (
          <>
            {/* Steps Chart */}
            <Card style={styles.chartCard}>
              {renderSimpleChart(weekData, 'steps', maxSteps, colors.primary, 'Steps This Week')}
            </Card>

            {/* Calories Chart */}
            <Card style={styles.chartCard}>
              {renderSimpleChart(weekData, 'calories', maxCalories, colors.warning, 'Calories This Week')}
            </Card>

            {/* Daily Comparison */}
            <Card style={styles.chartCard}>
              <Text style={styles.chartTitle}>Daily Comparison</Text>
              <View style={styles.compareRow}>
                <View style={styles.compareBox}>
                  <Text style={styles.compareLabel}>Best Steps Day</Text>
                  <Text style={styles.compareValue}>
                    {Math.max(...weekData.map((d) => d.steps)).toLocaleString()}
                  </Text>
                  <Text style={styles.compareSub}>
                    {weekData.reduce((best, d) => (d.steps > (best.steps || 0) ? d : best), weekData[0] || { label: '-' }).label}
                  </Text>
                </View>
                <View style={styles.compareBox}>
                  <Text style={styles.compareLabel}>Avg Steps</Text>
                  <Text style={styles.compareValue}>
                    {Math.round(weekData.reduce((s, d) => s + d.steps, 0) / Math.max(weekData.length, 1)).toLocaleString()}
                  </Text>
                  <Text style={styles.compareSub}>this week</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Workout History */}
        {workoutSessions.filter((s) => s.completed).length > 0 && (
          <Card style={styles.historyCard}>
            <Text style={styles.chartTitle}>Recent Workouts</Text>
            {workoutSessions
              .filter((s) => s.completed)
              .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
              .slice(0, 5)
              .map((session) => (
                <View key={session.id} style={styles.historyItem}>
                  <Text style={styles.historyDate}>
                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                  <Text style={styles.historyDuration}>{Math.floor(session.duration / 60)}m</Text>
                  <Text style={styles.historyExercises}>{session.exercises.length} exercises</Text>
                </View>
              ))}
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  overviewRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  overviewCard: { flex: 1, alignItems: 'center' },
  overviewIcon: { fontSize: 24, marginBottom: spacing.xs },
  overviewValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  overviewLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  chartCard: { marginBottom: spacing.md },
  chartContainer: { marginBottom: spacing.sm },
  chartTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', height: 140 },
  chartBarContainer: { flex: 1, alignItems: 'center' },
  chartBarWrapper: {
    flex: 1,
    width: '60%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: { borderRadius: borderRadius.sm, minHeight: 4 },
  chartLabel: { color: colors.textMuted, fontSize: 10, marginTop: spacing.xs },
  chartValue: { color: colors.textSecondary, fontSize: 9, marginTop: 1 },
  compareRow: { flexDirection: 'row', gap: spacing.md },
  compareBox: { flex: 1, alignItems: 'center', backgroundColor: colors.surfaceLight, borderRadius: borderRadius.md, padding: spacing.md },
  compareLabel: { color: colors.textSecondary, fontSize: fontSize.xs },
  compareValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  compareSub: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  historyCard: { marginBottom: spacing.md },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyDate: { color: colors.text, fontSize: fontSize.sm, flex: 1 },
  historyDuration: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm, marginHorizontal: spacing.md },
  historyExercises: { color: colors.textSecondary, fontSize: fontSize.sm },
});
