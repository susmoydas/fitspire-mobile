import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { DailyActivity } from '../types';

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const activityLog = useStore((s) => s.activityLog);
  const updateActivity = useStore((s) => s.updateActivity);

  const today = new Date().toISOString().split('T')[0];
  const todayActivity = activityLog.find((a) => a.date === today);

  const [editing, setEditing] = useState(false);
  const [steps, setSteps] = useState(todayActivity?.steps?.toString() || '');
  const [calories, setCalories] = useState(todayActivity?.caloriesBurned?.toString() || '');
  const [sleep, setSleep] = useState(todayActivity?.sleepHours?.toString() || '');
  const [water, setWater] = useState(todayActivity?.waterGlasses?.toString() || '');

  const weekDays = useMemo(() => {
    const days: { label: string; date: string; steps: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const act = activityLog.find((a) => a.date === dateStr);
      days.push({ label: dayLabel, date: dateStr, steps: act?.steps || 0 });
    }
    return days;
  }, [activityLog]);

  const maxWeekSteps = Math.max(...weekDays.map((d) => d.steps), 1);

  const handleSave = () => {
    const activity: DailyActivity = {
      date: today,
      steps: parseInt(steps, 10) || 0,
      caloriesBurned: parseInt(calories, 10) || 0,
      sleepHours: parseFloat(sleep) || 0,
      waterGlasses: parseInt(water, 10) || 0,
    };
    updateActivity(activity);
    setEditing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Activity</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Today's Metrics */}
        <Card style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Today</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricIcon}>👣</Text>
              <Text style={styles.metricValue}>{todayActivity?.steps || 0}</Text>
              <Text style={styles.metricLabel}>Steps</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricIcon}>🔥</Text>
              <Text style={styles.metricValue}>{todayActivity?.caloriesBurned || 0}</Text>
              <Text style={styles.metricLabel}>Calories</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricIcon}>😴</Text>
              <Text style={styles.metricValue}>{todayActivity?.sleepHours || 0}h</Text>
              <Text style={styles.metricLabel}>Sleep</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricIcon}>💧</Text>
              <Text style={styles.metricValue}>{todayActivity?.waterGlasses || 0}</Text>
              <Text style={styles.metricLabel}>Water</Text>
            </View>
          </View>
          <Button
            title={editing ? 'Cancel' : 'Log Activity'}
            onPress={() => setEditing(!editing)}
            variant="outline"
            size="sm"
          />
        </Card>

        {/* Edit Form */}
        {editing && (
          <Card style={styles.editCard}>
            <Text style={styles.sectionTitle}>Log Today's Activity</Text>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Steps</Text>
              <TextInput
                style={styles.editInput}
                value={steps}
                onChangeText={setSteps}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                placeholder="0"
              />
            </View>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Calories Burned</Text>
              <TextInput
                style={styles.editInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                placeholder="0"
              />
            </View>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Sleep (hours)</Text>
              <TextInput
                style={styles.editInput}
                value={sleep}
                onChangeText={setSleep}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textMuted}
                placeholder="0"
              />
            </View>
            <View style={styles.editRow}>
              <Text style={styles.editLabel}>Water (glasses)</Text>
              <TextInput
                style={styles.editInput}
                value={water}
                onChangeText={setWater}
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted}
                placeholder="0"
              />
            </View>
            <Button title="Save" onPress={handleSave} fullWidth />
          </Card>
        )}

        {/* Weekly Overview */}
        <Card style={styles.weekCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekChart}>
            {weekDays.map((day) => (
              <View key={day.date} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: Math.max((day.steps / maxWeekSteps) * 80, 4) },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.weekTotal}>
            Total: {weekDays.reduce((s, d) => s + d.steps, 0).toLocaleString()} steps
          </Text>
        </Card>

        {/* Goals Section */}
        {[
          { label: 'Steps', current: todayActivity?.steps || 0, target: 10000, unit: 'steps', color: colors.info },
          { label: 'Water', current: todayActivity?.waterGlasses || 0, target: 8, unit: 'glasses', color: colors.info },
          { label: 'Sleep', current: todayActivity?.sleepHours || 0, target: 8, unit: 'hours', color: colors.success },
        ].map((goal) => (
          <Card key={goal.label} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>{goal.label}</Text>
              <Text style={styles.goalStat}>
                {goal.current} / {goal.target} {goal.unit}
              </Text>
            </View>
            <ProgressBar progress={goal.current / goal.target} color={goal.color} />
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  metricsCard: { marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  metricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  metricIcon: { fontSize: 24, marginBottom: spacing.xs },
  metricValue: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  metricLabel: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  editCard: { marginBottom: spacing.md },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  editLabel: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1 },
  editInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    textAlign: 'right',
  },
  weekCard: { marginBottom: spacing.md },
  weekChart: { flexDirection: 'row', justifyContent: 'space-between', height: 100, alignItems: 'flex-end' },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: {
    flex: 1,
    width: '60%',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  barLabel: { color: colors.textMuted, fontSize: 10, marginTop: spacing.xs },
  weekTotal: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.sm },
  goalCard: { marginBottom: spacing.sm },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  goalLabel: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  goalStat: { color: colors.textSecondary, fontSize: fontSize.sm },
});
