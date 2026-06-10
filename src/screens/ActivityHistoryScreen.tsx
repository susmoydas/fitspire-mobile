import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import TrainingMap from '../components/TrainingMap';
import type { TrainingSession } from '../types';
import { calculateCaloriesFromSteps, calculateDistanceKm } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DAILY_TARGET_STEPS = 14000;

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function getWeekDates(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getMonthDates(monthDate: Date): string[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
}

const WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type TabKey = 'today' | 'yesterday' | 'weekly' | 'monthly';

const TABS: { key: TabKey; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'today', label: 'Today', icon: 'today' },
  { key: 'yesterday', label: 'Yesterday', icon: 'history' },
  { key: 'weekly', label: 'Weekly', icon: 'date-range' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar-month' },
];

export default function ActivityHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const mapRef = useRef<any>(null);

  const activityLog = useStore((s) => s.activityLog);
  const profile = useStore((s) => s.profile);
  const trainingSessions = useStore((s) => s.trainingSessions);
  const todaySteps = useStore((s) => s.todaySteps);
  const todayDate = useStore((s) => s.todayDate);

  const heightCm = profile?.height || 170;
  const weightKg = profile?.weight || 70;

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = getDateStr(0);
  const yesterday = getDateStr(-1);
  const weekDates = useMemo(() => getWeekDates(), []);
  const monthDates = useMemo(() => getMonthDates(currentMonth), [currentMonth]);
  const monthLabel = `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const todayData = useMemo(() => {
    const fromLog = activityLog.find((a) => a.date === today);
    const steps = todayDate === today ? todaySteps : (fromLog?.steps || 0);
    const calories = fromLog?.caloriesBurned || calculateCaloriesFromSteps(steps, weightKg);
    const distance = calculateDistanceKm(steps, heightCm);
    const duration = Math.round(steps / (100 / 60));
    const fromTraining = trainingSessions.filter(s => s.date === today);
    return {
      steps,
      calories: calories + fromTraining.reduce((sum, s) => sum + s.calories, 0),
      distance: distance + fromTraining.reduce((sum, s) => sum + s.distance, 0),
      duration: formatDuration(duration),
      durationMin: duration,
      pct: Math.min(steps / DAILY_TARGET_STEPS, 1),
      training: fromTraining,
    };
  }, [activityLog, today, todaySteps, todayDate, weightKg, heightCm, trainingSessions]);

  const yesterdayData = useMemo(() => {
    const fromLog = activityLog.find((a) => a.date === yesterday);
    const steps = fromLog?.steps || 0;
    const calories = fromLog?.caloriesBurned || calculateCaloriesFromSteps(steps, weightKg);
    const distance = calculateDistanceKm(steps, heightCm);
    const fromTraining = trainingSessions.filter(s => s.date === yesterday);
    const durationMin = Math.round(steps / (100 / 60)) + fromTraining.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);
    return {
      steps,
      calories: calories + fromTraining.reduce((sum, s) => sum + s.calories, 0),
      distance: distance + fromTraining.reduce((sum, s) => sum + s.distance, 0),
      duration: formatDuration(durationMin),
      durationMin,
      pct: Math.min(steps / DAILY_TARGET_STEPS, 1),
      training: fromTraining,
    };
  }, [activityLog, yesterday, weightKg, heightCm, trainingSessions]);

  const weekData = useMemo(() => {
    const days = weekDates.map((date, i) => {
      const dayActivity = activityLog.find((a) => a.date === date);
      const dayTraining = trainingSessions.filter(s => s.date === date);
      const steps = date === today && todayDate === today
        ? Math.max(dayActivity?.steps || 0, todaySteps)
        : (dayActivity?.steps || 0);
      const cal = (dayActivity?.caloriesBurned || calculateCaloriesFromSteps(steps, weightKg)) + dayTraining.reduce((sum, s) => sum + s.calories, 0);
      const dist = calculateDistanceKm(steps, heightCm) + dayTraining.reduce((sum, s) => sum + s.distance, 0);
      const durationMin = Math.round(steps / (100 / 60));
      return { label: WEEK_LABELS[i], date, steps, cal, dist, pct: Math.min(steps / DAILY_TARGET_STEPS, 1), durationMin };
    });
    const total = { steps: days.reduce((s, d) => s + d.steps, 0), cal: days.reduce((s, d) => s + d.cal, 0), dist: days.reduce((s, d) => s + d.dist, 0), durationMin: days.reduce((s, d) => s + d.durationMin, 0) };
    return { days, ...total, avgSteps: Math.round(total.steps / 7) };
  }, [weekDates, activityLog, trainingSessions, today, todayDate, todaySteps, weightKg, heightCm]);

  const monthData = useMemo(() => {
    const days = monthDates.map((date) => {
      const dayActivity = activityLog.find((a) => a.date === date);
      const dayTraining = trainingSessions.filter(s => s.date === date);
      const steps = date === today && todayDate === today
        ? Math.max(dayActivity?.steps || 0, todaySteps)
        : (dayActivity?.steps || 0);
      return {
        date,
        steps,
        cal: (dayActivity?.caloriesBurned || calculateCaloriesFromSteps(steps, weightKg)) + dayTraining.reduce((sum, s) => sum + s.calories, 0),
        dist: calculateDistanceKm(steps, heightCm) + dayTraining.reduce((sum, s) => sum + s.distance, 0),
        pct: Math.min(steps / DAILY_TARGET_STEPS, 1),
      };
    });
    const totalSteps = days.reduce((s, d) => s + d.steps, 0);
    const activeDays = days.filter(d => d.steps > 0).length;
    return { days, totalSteps, activeDays, avgSteps: activeDays > 0 ? Math.round(totalSteps / activeDays) : 0 };
  }, [monthDates, activityLog, trainingSessions, today, todayDate, todaySteps, weightKg, heightCm]);

  const statsBar = (steps: number, calories: number, distance: number, duration: string) => (
    <View style={styles.statsBar}>
      <View style={styles.statsBarItem}>
        <MaterialIcons name="directions-walk" size={18} color={colors.primary} />
        <Text style={styles.statsBarValue}>{steps.toLocaleString()}</Text>
        <Text style={styles.statsBarLabel}>Steps</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <MaterialIcons name="local-fire-department" size={18} color={colors.warning} />
        <Text style={styles.statsBarValue}>{calories.toLocaleString()}</Text>
        <Text style={styles.statsBarLabel}>Cal</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <MaterialIcons name="explore" size={18} color={colors.info} />
        <Text style={styles.statsBarValue}>{distance.toFixed(1)}</Text>
        <Text style={styles.statsBarLabel}>km</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <MaterialIcons name="access-time" size={18} color={colors.success} />
        <Text style={styles.statsBarValue}>{duration}</Text>
        <Text style={styles.statsBarLabel}>Time</Text>
      </View>
    </View>
  );

  const handleMapPress = useCallback((session: TrainingSession) => {
    navigation.navigate('TrainingDetail', { session });
  }, [navigation]);

  const routeIcon = (mode: string) => {
    switch (mode) {
      case 'running': return 'directions-run';
      case 'cycling': return 'directions-bike';
      default: return 'directions-walk';
    }
  };

  const renderDayContent = (data: typeof todayData) => (
    <>
      <TouchableOpacity
        style={styles.mapCard}
        onPress={() => data.training.length > 0 && handleMapPress(data.training[0])}
        activeOpacity={0.85}
      >
        <View style={styles.mapContainer}>
          {data.training.length > 0 ? (
            <TrainingMap ref={mapRef} />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MaterialIcons name="explore" size={36} color={colors.textMuted} />
              <Text style={styles.mapPlaceholderText}>No route data</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {data.training.length > 0 && (
        <View style={styles.routeHierarchy}>
          <Text style={styles.hierarchyTitle}>Route Segments</Text>
          {data.training.map((s, idx) => (
            <TouchableOpacity
              key={s.id}
              style={styles.hierarchyRow}
              onPress={() => handleMapPress(s)}
              activeOpacity={0.75}
            >
              <View style={styles.hierarchyIndex}>
                <Text style={styles.hierarchyIndexText}>{idx + 1}</Text>
              </View>
              <View style={styles.hierarchyInfo}>
                <Text style={styles.hierarchyMode}>
                  <MaterialIcons name={routeIcon(s.mode)} size={14} color={colors.text} /> {s.mode}
                </Text>
                <View style={styles.hierarchyMeta}>
                  <Text style={styles.hierarchyMetaText}>{s.distance.toFixed(2)} km</Text>
                  <Text style={styles.hierarchyMetaDivider}>|</Text>
                  <Text style={styles.hierarchyMetaText}>{formatDuration(Math.round(s.duration / 60))}</Text>
                  <Text style={styles.hierarchyMetaDivider}>|</Text>
                  <Text style={styles.hierarchyMetaText}>{s.steps} steps</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          {/* Summary row */}
          <View style={styles.hierarchySummary}>
            <Text style={styles.hierarchySummaryText}>
              Total: {data.training.reduce((sum, s) => sum + s.distance, 0).toFixed(2)} km • {formatDuration(data.training.reduce((sum, s) => sum + Math.round(s.duration / 60), 0))} • {data.training.reduce((sum, s) => sum + s.steps, 0)} steps
            </Text>
          </View>
        </View>
      )}
    </>
  );

  const renderWeeklyBars = () => {
    const maxSteps = Math.max(...weekData.days.map(d => d.steps), 1);
    return (
      <View style={styles.barsCard}>
        <Text style={styles.cardTitle}>Daily Breakdown</Text>
        <Text style={styles.cardSubtitle}>{weekData.steps.toLocaleString()} total steps • {weekData.dist.toFixed(1)} km</Text>
        <View style={styles.barsRow}>
          {weekData.days.map((day, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: Math.max((day.steps / maxSteps) * 80, 2), backgroundColor: day.pct >= 1 ? colors.success : colors.primary }]} />
              </View>
              <Text style={styles.barLabel}>{day.label}</Text>
              <Text style={styles.barValue}>{day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : day.steps}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMonthlyContent = () => {
    const maxSteps = Math.max(...monthData.days.map(d => d.steps), 1);
    const totalActiveDays = monthData.days.filter(d => d.steps > 0).length;
    return (
      <>
        <View style={styles.summaryCard}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItemLarge}>
              <Text style={styles.summaryValue}>{monthData.totalSteps.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Steps</Text>
            </View>
            <View style={styles.summaryItemLarge}>
              <Text style={styles.summaryValue}>{monthData.activeDays}</Text>
              <Text style={styles.summaryLabel}>Active Days</Text>
            </View>
          </View>
          <View style={styles.summaryDividerH} />
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItemLarge}>
              <Text style={styles.summaryValue}>{monthData.avgSteps.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Avg / Day</Text>
            </View>
            <View style={styles.summaryItemLarge}>
              <Text style={styles.summaryValue}>{Math.round(monthData.totalSteps / 7000 * 100)}%</Text>
              <Text style={styles.summaryLabel}>Goal Rate</Text>
            </View>
          </View>
        </View>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() - 1); setCurrentMonth(d); }} style={styles.navBtn}>
            <MaterialIcons name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.navCenter}>
            <Text style={styles.navMonth}>{monthLabel}</Text>
            <Text style={styles.navSub}>{totalActiveDays} active day{totalActiveDays !== 1 ? 's' : ''} this month</Text>
          </View>
          <TouchableOpacity onPress={() => { const d = new Date(currentMonth); d.setMonth(d.getMonth() + 1); setCurrentMonth(d); }} style={styles.navBtn}>
            <MaterialIcons name="chevron-right" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.barsCard}>
          <Text style={styles.cardTitle}>Monthly Calendar</Text>
          <View style={styles.calGrid}>
            {monthData.days.map((day, i) => {
              const d = new Date(day.date);
              return (
                <View key={day.date} style={styles.calDay}>
                  <Text style={styles.calDayNum}>{d.getDate()}</Text>
                  <View style={[styles.calDot, { backgroundColor: day.steps > 0 ? colors.success : colors.cardElevated }]} />
                </View>
              );
            })}
          </View>
        </View>
        <View style={styles.barsCard}>
          <Text style={styles.cardTitle}>Activity Trend</Text>
          <View style={styles.trendRow}>
            {monthData.days.filter((_, i) => i % 3 === 0).map((day, i) => {
              return (
                <View key={day.date} style={styles.trendCol}>
                  <View style={styles.trendBarWrapper}>
                    <View style={[styles.trendBar, { height: Math.max((day.steps / maxSteps) * 50, 2), backgroundColor: day.pct >= 1 ? colors.success : colors.primary }]} />
                  </View>
                  <Text style={styles.trendLabel}>{new Date(day.date).getDate()}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialIcons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'today' && statsBar(todayData.steps, todayData.calories, todayData.distance, todayData.duration)}
      {activeTab === 'yesterday' && statsBar(yesterdayData.steps, yesterdayData.calories, yesterdayData.distance, yesterdayData.duration)}
      {activeTab === 'weekly' && statsBar(weekData.steps, weekData.cal, weekData.dist, formatDuration(Math.round(weekData.steps / (100 / 60) / 7)))}
      {activeTab === 'monthly' && statsBar(monthData.totalSteps, monthData.totalSteps > 0 ? monthData.activeDays * calculateCaloriesFromSteps(Math.round(monthData.totalSteps / monthData.activeDays), weightKg) : 0, 0, formatDuration(Math.round(monthData.totalSteps / (100 / 60) / 30)))}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'today' && renderDayContent(todayData)}
        {activeTab === 'yesterday' && (
          yesterdayData.steps > 0 ? renderDayContent(yesterdayData) : (
            <View style={styles.emptyCard}>
              <MaterialIcons name="history" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No activity recorded yesterday</Text>
            </View>
          )
        )}
        {activeTab === 'weekly' && renderWeeklyBars()}
        {activeTab === 'monthly' && renderMonthlyContent()}
        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.full,
    padding: 3,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  tabActive: { backgroundColor: colors.card },
  tabText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },

  statsBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statsBarItem: { flex: 1, alignItems: 'center', gap: 2 },
  statsBarValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statsBarLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '500' },
  statsBarDivider: { width: 1, height: 36, backgroundColor: colors.border },

  mapCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapContainer: { height: 220 },
  mapPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mapPlaceholderText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '500' },

  routeHierarchy: {
    gap: 2,
  },
  hierarchyTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingVertical: spacing.sm,
  },
  hierarchyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  hierarchyIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hierarchyIndexText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  hierarchyInfo: { flex: 1 },
  hierarchyMode: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', textTransform: 'capitalize' },
  hierarchyMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  hierarchyMetaText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  hierarchyMetaDivider: { color: colors.textMuted, fontSize: 10 },
  hierarchySummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  hierarchySummaryText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },

  barsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 100,
    alignItems: 'flex-end',
    gap: 2,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barWrapper: { width: '60%', borderRadius: borderRadius.sm, justifyContent: 'flex-end', overflow: 'hidden', flex: 1 },
  bar: { borderRadius: borderRadius.sm, minHeight: 2 },
  barLabel: { color: colors.textSecondary, fontSize: 10, marginTop: 4, fontWeight: '500' },
  barValue: { color: colors.textMuted, fontSize: 8, marginTop: 1 },

  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryItemLarge: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  summaryLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '500', marginTop: 2 },
  summaryDividerH: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  cardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginBottom: spacing.sm },
  cardSubtitle: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.md },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCenter: { alignItems: 'center', gap: 2 },
  navMonth: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  navSub: { color: colors.textSecondary, fontSize: fontSize.xs },

  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start' },
  calDay: { width: '12%', alignItems: 'center', paddingVertical: 4, gap: 2 },
  calDayNum: { color: colors.textMuted, fontSize: 9, fontWeight: '600' },
  calDot: { width: 6, height: 6, borderRadius: 3 },

  trendRow: { flexDirection: 'row', height: 60, alignItems: 'flex-end', gap: 2 },
  trendCol: { flex: 1, alignItems: 'center' },
  trendBarWrapper: { width: '60%', borderRadius: borderRadius.sm, justifyContent: 'flex-end', overflow: 'hidden', flex: 1 },
  trendBar: { borderRadius: borderRadius.sm, minHeight: 2 },
  trendLabel: { color: colors.textMuted, fontSize: 8, marginTop: 2 },

  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
});
