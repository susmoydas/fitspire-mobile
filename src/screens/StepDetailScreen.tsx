import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { TextInput } from '@/components/ui/text-input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { useStore } from '../store/useStore';
import { getWeeklyStepData, getMonthlyStepData, getStepStats } from '../utils/progressData';
import { calculateCaloriesFromSteps, calculateDistanceKm } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 200;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PRESET_GOALS = [5000, 8000, 10000, 12000, 15000];

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function estimateActiveMinutes(steps: number): number {
  return Math.round(steps / (10000 / 30));
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function StepDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const activityLog = useStore((s) => s.activityLog);
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);
  const todaySteps = useStore((s) => s.todaySteps);

  const stepGoal = profile?.stepGoal || 10000;

  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [customGoal, setCustomGoal] = useState(String(stepGoal));

  const stepData = useMemo(() => {
    if (viewMode === 'weekly') {
      return getWeeklyStepData(activityLog, currentDate, stepGoal);
    }
    return getMonthlyStepData(activityLog, currentDate, stepGoal);
  }, [activityLog, currentDate, stepGoal, viewMode]);

  const stats = useMemo(() => getStepStats(stepData, new Date()), [stepData]);

  const currentDateMonth = currentDate.getMonth();
  const currentDateYear = currentDate.getFullYear();
  const displaySteps = todaySteps;

  const rangeLabel = viewMode === 'weekly'
    ? (() => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(start.setDate(diff));
        const sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);
        const startStr = `${MONTHS[mon.getMonth()]} ${mon.getDate()}`;
        const endStr = mon.getMonth() === sun.getMonth()
          ? `${sun.getDate()}`
          : `${MONTHS[sun.getMonth()]} ${sun.getDate()}`;
        return `${startStr} – ${endStr}`;
      })()
    : `${MONTHS[currentDateMonth]} ${currentDateYear}`;

  const navigateDate = (direction: -1 | 1) => {
    const d = new Date(currentDate);
    if (viewMode === 'weekly') {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    setCurrentDate(d);
  };

  const isCurrentPeriod = useMemo(() => {
    const now = new Date();
    if (viewMode === 'weekly') {
      const getWeekId = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const dd = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(dd)).toISOString().substring(0, 10);
      };
      return getWeekId(now) === getWeekId(currentDate);
    }
    return now.getMonth() === currentDateMonth && now.getFullYear() === currentDateYear;
  }, [viewMode, currentDate, currentDateMonth, currentDateYear]);

  const maxSteps = useMemo(() => Math.max(...stepData.map((d) => d.steps), 1), [stepData]);

  const goalProgressPercent = Math.min((displaySteps / stepGoal) * 100, 100);

  const handleSaveGoal = (goal: number) => {
    setProfile({ stepGoal: goal });
    setCustomGoal(String(goal));
    setShowGoalEditor(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Step Details</Text>
        <TouchableOpacity onPress={() => nav.navigate('ActivityHistory' as never)} style={styles.historyBtn}>
          <MaterialIcons name="history" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Current Steps */}
        <View style={styles.currentCard}>
          <View style={styles.currentTopRow}>
            <MaterialIcons name="directions-walk" size={28} color={colors.primary} />
            <View />
          </View>

          <Text style={styles.currentSteps}>{formatNumber(displaySteps)}</Text>
          <Text style={styles.currentLabel}>steps today</Text>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${goalProgressPercent}%` }]} />
          </View>

          <View style={styles.currentMeta}>
            <Text style={styles.currentMetaText}>
              <Text style={styles.currentMetaValue}>{Math.round(goalProgressPercent)}%</Text>
              {' of '}
              <Text style={styles.currentMetaValue}>{formatNumber(stepGoal)}</Text>
              {' goal'}
            </Text>
            <TouchableOpacity
              style={styles.editGoalBtn}
              onPress={() => { setCustomGoal(String(stepGoal)); setShowGoalEditor(true); }}
            >
              <MaterialIcons name="edit" size={14} color={colors.primary} />
              <Text style={styles.editGoalText}>Edit Goal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Distance / Calories / Active Time */}
        <View style={styles.metricsRow}>
          <View style={styles.metricsCard}>
            <MaterialIcons name="directions-walk" size={18} color={colors.info} />
            <Text style={styles.metricsValue}>{calculateDistanceKm(displaySteps, profile.height || 170)} km</Text>
            <Text style={styles.metricsLabel}>Distance</Text>
          </View>
          <View style={styles.metricsCard}>
            <MaterialIcons name="local-fire-department" size={18} color={colors.warning} />
            <Text style={styles.metricsValue}>{calculateCaloriesFromSteps(displaySteps, profile.weight || 70)}</Text>
            <Text style={styles.metricsLabel}>Calories</Text>
          </View>
          <View style={styles.metricsCard}>
            <MaterialIcons name="timer" size={18} color={colors.success} />
            <Text style={styles.metricsValue}>{formatDuration(estimateActiveMinutes(displaySteps))}</Text>
            <Text style={styles.metricsLabel}>Active</Text>
          </View>
        </View>

        {/* View Toggle & Date Navigation */}
        <View style={styles.controlRow}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navBtn}>
            <MaterialIcons name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.controlCenter}>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'weekly' && styles.toggleBtnActive]}
                onPress={() => setViewMode('weekly')}
              >
                <Text style={[styles.toggleText, viewMode === 'weekly' && styles.toggleTextActive]}>Week</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
                onPress={() => setViewMode('monthly')}
              >
                <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>Month</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.dateRange}>{rangeLabel}</Text>
          </View>

          <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navBtn}>
            <MaterialIcons name="chevron-right" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Chart — weekly bar chart or monthly calendar grid */}
        {viewMode === 'weekly' ? (
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              <View style={styles.yAxis}>
                {[maxSteps, Math.round(maxSteps / 2), 0].map((val, i) => (
                  <Text key={i} style={styles.yLabel}>{formatNumber(val)}</Text>
                ))}
              </View>
              <View style={styles.barsContainer}>
                {stepData.map((d, i) => {
                  const height = maxSteps > 0 ? (d.steps / maxSteps) * CHART_HEIGHT : 4;
                  const isToday = d.key === new Date().toISOString().split('T')[0];
                  return (
                    <View key={i} style={styles.barCol}>
                      <View style={styles.barWrapper}>
                        {d.steps > 0 && (
                          <Text style={styles.barValue}>{formatNumber(d.steps)}</Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(height, 4),
                              backgroundColor: d.steps >= d.goal ? colors.success : (isToday ? colors.primary : colors.primary + '50'),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.date.getDay()]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.monthCalContainer}>
            <View style={styles.monthCalGrid}>
              {stepData
                .filter((d) => d.date.getMonth() === currentDateMonth && d.date.getFullYear() === currentDateYear)
                .map((d) => {
                  const isToday = d.key === new Date().toISOString().split('T')[0];
                  return (
                    <View key={d.key} style={[styles.monthCalDay, isToday && styles.monthCalDayToday]}>
                      <Text style={[styles.monthCalDayNum, isToday && styles.monthCalDayNumToday]}>{d.date.getDate()}</Text>
                      <View style={[styles.monthCalDot, { backgroundColor: d.steps > 0 ? colors.success : colors.cardElevated }]} />
                      {d.steps > 0 && (
                        <Text style={styles.monthCalSteps} numberOfLines={1}>{formatNumber(d.steps)}</Text>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={18} color={colors.primary} />
            <Text style={styles.statValue}>{formatNumber(stats.totalSteps)}</Text>
            <Text style={styles.statLabel}>Total Steps</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="show-chart" size={18} color={colors.success} />
            <Text style={styles.statValue}>{formatNumber(stats.avgSteps)}</Text>
            <Text style={styles.statLabel}>Daily Avg</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="emoji-events" size={18} color={colors.warning} />
            <Text style={styles.statValue}>{formatNumber(stats.bestDay)}</Text>
            <Text style={styles.statLabel}>Best Day</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.statValue}>{stats.goalRate}%</Text>
            <Text style={styles.statLabel}>Goal Rate</Text>
          </View>
        </View>

        {/* Today button */}
        {!isCurrentPeriod && (
          <TouchableOpacity style={styles.todayBtn} onPress={() => setCurrentDate(new Date())}>
            <MaterialIcons name="today" size={16} color={colors.primary} />
            <Text style={styles.todayBtnText}>Back to {viewMode === 'weekly' ? 'current week' : 'current month'}</Text>
          </TouchableOpacity>
        )}

        {/* View full history */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => nav.navigate('ActivityHistory' as never)}
        >
          <MaterialIcons name="history" size={18} color={colors.textSecondary} />
          <Text style={styles.historyLinkText}>View full activity history</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Goal Editor Modal */}
      <Modal
        visible={showGoalEditor}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalEditor(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Step Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalEditor(false)}>
                <MaterialIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalCurrent}>
              Current: {formatNumber(stepGoal)} steps
            </Text>

            <Text style={styles.modalSectionTitle}>Quick Select</Text>
            <View style={styles.presetRow}>
              {PRESET_GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.presetBtn, stepGoal === g && styles.presetBtnActive]}
                  onPress={() => handleSaveGoal(g)}
                >
                  <Text style={[styles.presetBtnText, stepGoal === g && styles.presetBtnTextActive]}>
                    {formatNumber(g)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalSectionTitle}>Custom Goal</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customGoal}
                onChangeText={setCustomGoal}
                keyboardType="number-pad"
                placeholder="Enter step goal"
                placeholderTextColor={colors.textMuted}
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => {
                  const parsed = parseInt(customGoal, 10);
                  if (parsed > 0) handleSaveGoal(parsed);
                }}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Current steps card
  currentCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  currentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  currentSteps: {
    fontSize: fontSize.giant,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  currentLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  currentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentMetaText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  currentMetaValue: {
    fontWeight: '700',
    color: colors.text,
  },
  editGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  editGoalText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: '600',
  },

  // Control row
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlCenter: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm - 3,
    borderRadius: borderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: '#fff',
  },
  dateRange: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Chart
  chartContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  chart: {
    flexDirection: 'row',
    height: CHART_HEIGHT + 24,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  yLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  barValue: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  bar: {
    width: 12,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },

  // Monthly calendar grid
  monthCalContainer: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  monthCalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    justifyContent: 'flex-start',
  },
  monthCalDay: {
    width: '14%',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
    borderRadius: borderRadius.xs,
  },
  monthCalDayToday: {
    backgroundColor: colors.primary + '20',
  },
  monthCalDayNum: {
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: '600',
  },
  monthCalDayNumToday: {
    color: colors.primary,
  },
  monthCalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  monthCalSteps: {
    fontSize: 7,
    color: colors.textMuted,
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricsCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricsValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  metricsLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    gap: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Today button
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm,
  },
  todayBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: '600',
  },

  // History link
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  historyLinkText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.bigCard,
    borderTopRightRadius: borderRadius.bigCard,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  modalCurrent: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.bgSecondary,
  },
  presetBtnActive: {
    backgroundColor: colors.primary,
  },
  presetBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetBtnTextActive: {
    color: '#fff',
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: fontSize.md,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
});
