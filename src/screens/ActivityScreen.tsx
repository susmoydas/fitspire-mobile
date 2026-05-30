import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';
import type { TrainingMode, TrainingSession } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ACTIVITIES: { mode: TrainingMode; icon: keyof typeof MaterialIcons.glyphMap; label: string; desc: string; color: string }[] = [
  { mode: 'walking', icon: 'directions-walk', label: 'Walk', desc: 'Track your walks and hikes', color: colors.success },
  { mode: 'running', icon: 'directions-run', label: 'Run', desc: 'Monitor your runs and jogs', color: colors.primary },
  { mode: 'riding', icon: 'pedal-bike', label: 'Cycle', desc: 'Record your cycling routes', color: colors.success },
];

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${seconds}s`;
}

export default function ActivityScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const trainingSessions = useStore((s) => s.trainingSessions);

  const lastSessionForMode = useMemo(() => {
    const map = new Map<TrainingMode, TrainingSession>();
    for (const s of trainingSessions) {
      if (!map.has(s.mode)) {
        map.set(s.mode, s);
      }
    }
    return map;
  }, [trainingSessions]);

  const recentSessions = useMemo(() => trainingSessions.slice(0, 10), [trainingSessions]);

  const lastSession = trainingSessions[0];

  const handleStartActivity = useCallback(
    (mode: TrainingMode) => {
      navigation.navigate('ActiveTraining', { mode });
    },
    [navigation],
  );

  const handleSessionPress = useCallback(
    (session: TrainingSession) => {
      navigation.navigate('TrainingDetail', { session });
    },
    [navigation],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsRow}>
          {ACTIVITIES.map((activity) => {
            const last = lastSessionForMode.get(activity.mode);
            return (
              <View
                key={activity.mode}
                style={styles.activityCard}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardIconWrap}>
                    <MaterialIcons name={activity.icon} size={32} color={activity.color} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{activity.label}</Text>
                    <Text style={styles.cardDesc}>{activity.desc}</Text>
                  </View>
                </View>
                {last ? (
                  <View style={styles.cardStatsRow}>
                    <View style={styles.cardStat}>
                      <Text style={styles.cardStatValue}>{last.distance.toFixed(2)}</Text>
                      <Text style={styles.cardStatLabel}>km</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.cardStat}>
                      <Text style={styles.cardStatValue}>{formatDuration(last.duration)}</Text>
                      <Text style={styles.cardStatLabel}>time</Text>
                    </View>
                    <View style={styles.cardStatDivider} />
                    <View style={styles.cardStat}>
                      <Text style={styles.cardStatValue}>{Math.round(last.calories)}</Text>
                      <Text style={styles.cardStatLabel}>cal</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.cardStatsEmpty}>No activity yet — tap Start to begin</Text>
                )}
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => handleStartActivity(activity.mode)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="play-arrow" size={18} color="#fff" />
                  <Text style={styles.startBtnText}>Start</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="history" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <Text style={styles.sectionCount}>{trainingSessions.length}</Text>
        </View>

        {recentSessions.length > 0 ? (
          <>
            {recentSessions.map((session) => {
              const act = ACTIVITIES.find((a) => a.mode === session.mode);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionItem}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionIcon}>
                    <MaterialIcons name={act?.icon || 'directions-walk'} size={24} color={act?.color || colors.primary} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionName}>{act?.label || session.mode}</Text>
                    <Text style={styles.sessionMeta}>
                      {session.distance.toFixed(2)} km · {formatDuration(session.duration)} · {Math.round(session.calories)} cal
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}

            {lastSession && (
              <TouchableOpacity
                style={styles.mapPreview}
                onPress={() => handleSessionPress(lastSession)}
                activeOpacity={0.85}
              >
                <View
                  style={styles.mapInner}
                >
                  <View style={styles.mapIconWrap}>
                    <MaterialIcons name="map" size={28} color={colors.primary} />
                  </View>
                  <Text style={styles.mapText}>View route map</Text>
                  <Text style={styles.mapSubtext}>
                    {lastSession.route?.length || 0} tracking points · {lastSession.distance.toFixed(2)} km
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="directions-walk" size={48} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>
              Start your first outdoor activity{'\n'}using the cards above
            </Text>
          </View>
        )}

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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 4,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  cardsRow: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  activityCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  cardStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardStat: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  cardStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  cardStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  cardStatsEmpty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  startBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 54,
    borderRadius: borderRadius.full,
  },
  startBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sessionMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  mapPreview: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  mapInner: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  mapIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  mapText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  mapSubtext: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});
