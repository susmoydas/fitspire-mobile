import React, { useMemo, useState } from 'react';
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
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { Goal } from '../types';

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);

  const weightGoal = useMemo(() => {
    if (profile.weight && profile.goalWeight) {
      const diff = profile.weight - profile.goalWeight;
      const maxChange = profile.weight * 0.25;
      const progress = diff > 0
        ? Math.min(1, diff / maxChange)
        : Math.min(1, (profile.goalWeight - profile.weight) / maxChange);
      return {
        current: profile.weight,
        target: profile.goalWeight,
        progress: Math.abs(progress),
        direction: diff > 0 ? 'Lose' : 'Gain',
      };
    }
    return null;
  }, [profile]);

  const defaultGoals: Goal[] = useMemo(() => [
    { id: 'g-steps', type: 'steps', current: 0, target: 10000, unit: 'steps' },
    { id: 'g-water', type: 'water', current: 0, target: 8, unit: 'glasses' },
    { id: 'g-sleep', type: 'sleep', current: 0, target: 8, unit: 'hours' },
  ], []);

  const mergedGoals = useMemo(() => {
    return defaultGoals.map((dg) => goals.find((g) => g.id === dg.id) || dg);
  }, [defaultGoals, goals]);

  const [editGoalId, setEditGoalId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState('');

  const handleEditGoal = (goal: Goal) => {
    setEditGoalId(goal.id);
    setEditTarget(String(goal.target));
  };

  const handleSaveGoal = () => {
    if (editGoalId && editTarget) {
      const existing = goals.find((g) => g.id === editGoalId);
      const updated: Goal = {
        id: editGoalId,
        type: existing?.type || 'steps',
        current: existing?.current || 0,
        target: parseInt(editTarget, 10) || 0,
        unit: existing?.unit || '',
      };
      if (existing) {
        updateGoal(updated);
      } else {
        addGoal(updated);
      }
      setEditGoalId(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Goals</Text>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Weight Goal */}
        {weightGoal && (
          <Card style={styles.goalCard} variant="elevated">
            <Text style={styles.goalType}>🏆 Weight Goal</Text>
            <Text style={styles.goalDirection}>{weightGoal.direction} Weight</Text>
            <View style={styles.goalRow}>
              <View style={styles.goalNumBox}>
                <Text style={styles.goalNumLabel}>Current</Text>
                <Text style={styles.goalNumValue}>{weightGoal.current} kg</Text>
              </View>
              <Text style={styles.goalArrow}>→</Text>
              <View style={styles.goalNumBox}>
                <Text style={styles.goalNumLabel}>Goal</Text>
                <Text style={[styles.goalNumValue, { color: colors.success }]}>{weightGoal.target} kg</Text>
              </View>
            </View>
            <ProgressBar progress={weightGoal.progress} />
            <Text style={styles.goalProgress}>
              {Math.round(weightGoal.progress * 100)}% Complete
            </Text>
          </Card>
        )}

        {/* Daily Goals */}
        <Text style={styles.sectionTitle}>Daily Targets</Text>
        {mergedGoals.map((goal) => (
          <Card key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalLabel}>{goal.type.toUpperCase()}</Text>
              {editGoalId === goal.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={editTarget}
                    onChangeText={setEditTarget}
                    keyboardType="numeric"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Button title="Save" onPress={handleSaveGoal} size="sm" />
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleEditGoal(goal)}>
                  <Text style={styles.editText}>
                    {goal.current}/{goal.target} {goal.unit} ✏️
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <ProgressBar
              progress={goal.target > 0 ? goal.current / goal.target : 0}
              color={goal.current >= goal.target ? colors.success : colors.primary}
            />
          </Card>
        ))}

        {/* Recommendations */}
        <Card style={styles.recommendationCard}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>💪</Text>
            <Text style={styles.recText}>
              {profile.goalWeight && profile.weight && profile.weight > profile.goalWeight
                ? 'Focus on calorie deficit and consistent training to reach your goal weight.'
                : 'Great work maintaining! Keep challenging yourself.'}
            </Text>
          </View>
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>💧</Text>
            <Text style={styles.recText}>
              Stay hydrated! Aim for 8 glasses of water daily.
            </Text>
          </View>
          <View style={styles.recItem}>
            <Text style={styles.recIcon}>😴</Text>
            <Text style={styles.recText}>
              Sleep is crucial for recovery. Try to get 7-8 hours per night.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md, marginTop: spacing.md },
  goalCard: { marginBottom: spacing.md },
  goalType: { fontSize: fontSize.xl, marginBottom: spacing.xs },
  goalDirection: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.md },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  goalNumBox: { alignItems: 'center' },
  goalNumLabel: { color: colors.textSecondary, fontSize: fontSize.xs },
  goalNumValue: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  goalArrow: { color: colors.textMuted, fontSize: fontSize.xxl },
  goalProgress: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.sm },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  goalLabel: { color: colors.text, fontWeight: '700', fontSize: fontSize.md },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editInput: {
    backgroundColor: colors.inputBackground,
    color: colors.text,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    width: 60,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  editText: { color: colors.textSecondary, fontSize: fontSize.sm },
  recommendationCard: { marginBottom: spacing.md },
  recItem: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  recIcon: { fontSize: 18 },
  recText: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1, lineHeight: 20 },
});
