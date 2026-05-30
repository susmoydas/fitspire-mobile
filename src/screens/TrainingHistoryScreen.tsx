import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { TrainingSession, TrainingMode } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

const MODE_ICONS: Record<TrainingMode, string> = {
  walking: 'directions-walk',
  running: 'directions-run',
  riding: 'pedal-bike',
};

const MODE_LABELS: Record<TrainingMode, string> = {
  walking: 'Walking',
  running: 'Running',
  riding: 'Riding',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return `${seconds}s`;
}

function HistoryCard({ session }: { session: TrainingSession }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('TrainingDetail', { session })}>
      <Card style={styles.historyCard}>
        <View style={styles.cardRow}>
          <View style={styles.iconArea}>
            <MaterialIcons name={MODE_ICONS[session.mode] as any} size={20} color={colors.textSecondary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{MODE_LABELS[session.mode]}</Text>
            <Text style={styles.cardDate}>
              {formatDate(session.startTime || session.date)}
              {session.startTime && session.endTime
                ? `, ${formatTime(session.startTime)} - ${formatTime(session.endTime)}`
                : ''}
            </Text>
            <View style={styles.cardStatsRow}>
              <Text style={styles.cardStat}>
                {session.distance.toFixed(1)} km
              </Text>
              <Text style={styles.cardStatDivider}>•</Text>
              <Text style={styles.cardStat}>
                {formatDuration(session.duration)}
              </Text>
              <Text style={styles.cardStatDivider}>•</Text>
              <Text style={styles.cardStat}>
                {Math.round(session.calories)} kcal
              </Text>
              {session.steps > 0 && (
                <>
                  <Text style={styles.cardStatDivider}>•</Text>
                  <Text style={styles.cardStat}>
                    {session.steps.toLocaleString()} steps
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function DailyView({ sessions }: { sessions: TrainingSession[] }) {
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.date === today);

  const totals = useMemo(() => {
    return todaySessions.reduce(
      (acc, s) => ({
        steps: acc.steps + s.steps,
        distance: acc.distance + s.distance,
        calories: acc.calories + s.calories,
      }),
      { steps: 0, distance: 0, calories: 0 }
    );
  }, [todaySessions]);

  if (todaySessions.length === 0) {
    return (
      <EmptyState
        icon="fitness-center"
        title="No activity yet"
        message="Start a walking, running, or riding session to see it here."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.steps.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.distance.toFixed(1)} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
        </View>
      </Card>
      {todaySessions.map((session) => (
        <HistoryCard key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}

function WeeklyView({ sessions }: { sessions: TrainingSession[] }) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const weekSessions = sessions.filter((s) => s.date >= weekStartStr);

  const totals = useMemo(() => {
    return weekSessions.reduce(
      (acc, s) => ({
        sessions: acc.sessions + 1,
        steps: acc.steps + s.steps,
        distance: acc.distance + s.distance,
        duration: acc.duration + s.duration,
        calories: acc.calories + s.calories,
      }),
      { sessions: 0, steps: 0, distance: 0, duration: 0, calories: 0 }
    );
  }, [weekSessions]);

  if (weekSessions.length === 0) {
    return (
      <EmptyState
        icon="calendar-month"
        title="No activity this week"
        message="Complete a session to see your weekly stats."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>This Week</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.sessions}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.distance.toFixed(1)} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
        </View>
      </Card>
      {weekSessions.map((session) => (
        <HistoryCard key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}

function MonthlyView({ sessions }: { sessions: TrainingSession[] }) {
  const now = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const monthSessions = sessions.filter((s) => s.date.startsWith(monthStr));

  const totals = useMemo(() => {
    return monthSessions.reduce(
      (acc, s) => ({
        sessions: acc.sessions + 1,
        steps: acc.steps + s.steps,
        distance: acc.distance + s.distance,
        duration: acc.duration + s.duration,
        calories: acc.calories + s.calories,
      }),
      { sessions: 0, steps: 0, distance: 0, duration: 0, calories: 0 }
    );
  }, [monthSessions]);

  if (monthSessions.length === 0) {
    return (
      <EmptyState
        icon="calendar-month"
        title="No activity this month"
        message="Complete a training session to see your monthly stats."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.sessions}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.steps.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{totals.distance.toFixed(1)} km</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{formatDuration(totals.duration)}</Text>
            <Text style={styles.summaryLabel}>Duration</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
        </View>
      </Card>
      {monthSessions.map((session) => (
        <HistoryCard key={session.id} session={session} />
      ))}
    </ScrollView>
  );
}

export default function TrainingHistoryScreen() {
  const trainingSessions = useStore((s) => s.trainingSessions);
  const [tabIndex, setTabIndex] = useState(0);

  const safeSessions = Array.isArray(trainingSessions) ? trainingSessions : [];

  const tabs = ['Daily', 'Weekly', 'Monthly'];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedContainer}>
        {tabs.map((label, index) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.segmentedPill,
              tabIndex === index && styles.segmentedPillActive,
            ]}
            onPress={() => setTabIndex(index)}
          >
            <Text
              style={[
                styles.segmentedPillText,
                tabIndex === index && styles.segmentedPillTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {tabIndex === 0 ? (
        <DailyView sessions={safeSessions} />
      ) : tabIndex === 1 ? (
        <WeeklyView sessions={safeSessions} />
      ) : (
        <MonthlyView sessions={safeSessions} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryBox: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  historyCard: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArea: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cardDate: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  cardStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  cardStat: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  cardStatDivider: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  segmentedPill: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  segmentedPillActive: {
    backgroundColor: colors.primary,
  },
  segmentedPillText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  segmentedPillTextActive: {
    color: colors.text,
  },
});
