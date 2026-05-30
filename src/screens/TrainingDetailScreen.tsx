import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import TrainingMap, { TrainingMapRef } from '../components/TrainingMap';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'TrainingDetail'>;

const MODE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  walking: 'directions-walk',
  running: 'directions-run',
  riding: 'pedal-bike',
};

const MODE_LABELS: Record<string, string> = {
  walking: 'Walking',
  running: 'Running',
  riding: 'Riding',
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${seconds}s`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TrainingDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session } = route.params;
  const mapRef = useRef<TrainingMapRef>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!session.route || session.route.length === 0) return;
    const timer = setTimeout(() => {
      mapRef.current?.setRouteWithMarkers(session.route);
      setMapReady(true);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const hasRoute = session.route && session.route.length > 0;
  const startLocation = hasRoute ? session.route[0] : null;
  const endLocation = hasRoute ? session.route[session.route.length - 1] : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <MaterialIcons name={MODE_ICONS[session.mode]} size={22} color={colors.primary} />
          <Text style={styles.headerTitle}>{MODE_LABELS[session.mode]} Details</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Map */}
        <View style={styles.mapContainer}>
          {hasRoute ? (
            <TrainingMap ref={mapRef} style={styles.map} />
          ) : (
            <View style={styles.noRoute}>
              <MaterialIcons name="explore" size={40} color={colors.textMuted} />
              <Text style={styles.noRouteText}>No route data</Text>
            </View>
          )}
        </View>

        {/* Date & Stats */}
        <View style={styles.statsCard}>
          <View style={styles.dateSection}>
            <MaterialIcons name="calendar-today" size={14} color={colors.textSecondary} />
            <Text style={styles.dateText}>
              {formatDateTime(session.startTime)}
            </Text>
            <MaterialIcons name="arrow-forward" size={14} color={colors.textMuted} />
            <Text style={styles.dateText}>
              {formatDateTime(session.endTime)}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{session.distance.toFixed(2)} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{session.steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(session.calories)}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{session.avgPace}</Text>
              <Text style={styles.statLabel}>Avg Pace</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{session.route?.length || 0}</Text>
              <Text style={styles.statLabel}>Route Points</Text>
            </View>
          </View>
        </View>

        {/* Route Details - Start/End Locations */}
        {hasRoute && startLocation && endLocation && (
          <View style={styles.locationCard}>
            <Text style={styles.locationTitle}>Route Details</Text>
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: colors.success }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Start</Text>
                <Text style={styles.locationSub}>
                  {startLocation.latitude.toFixed(6)}, {startLocation.longitude.toFixed(6)}
                </Text>
              </View>
              <MaterialIcons name="my-location" size={16} color={colors.success} />
            </View>
            <View style={styles.locationDivider} />
            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: colors.error }]} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>End</Text>
                <Text style={styles.locationSub}>
                  {endLocation.latitude.toFixed(6)}, {endLocation.longitude.toFixed(6)}
                </Text>
              </View>
              <MaterialIcons name="location-on" size={16} color={colors.error} />
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  mapContainer: {
    height: 300,
    margin: spacing.md,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  noRoute: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noRouteText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  locationCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 20 + spacing.md,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  locationSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 1,
    fontFamily: 'monospace',
  },
});
