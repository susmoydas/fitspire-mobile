import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { useStore } from '../store/useStore';
import TrainingMap, { TrainingMapRef } from '../components/TrainingMap';
import * as Location from 'expo-location';
import { haversineDistanceKm } from '../utils/calculations';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MapRoute = RouteProp<RootStackParamList, 'MovementMap'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function MovementMapScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<MapRoute>();
  const trainingSessions = useStore((s) => s.trainingSessions);

  const [selectedDate, setSelectedDate] = useState(() => {
    if (route.params?.date) return new Date(route.params.date);
    return new Date();
  });
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const mapRef = useRef<TrainingMapRef>(null);

  const dateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(new Date());
  const isToday = dateKey === todayKey;

  const sessionsForDate = useMemo(() => {
    return trainingSessions.filter((s) => s.date === dateKey && s.route && s.route.length > 0);
  }, [trainingSessions, dateKey]);

  const allRoutePoints = useMemo(() => {
    const points: { latitude: number; longitude: number; timestamp: number }[] = [];
    for (const session of sessionsForDate) {
      for (const pt of session.route) {
        if (pt.latitude && pt.longitude) {
          points.push(pt);
        }
      }
    }
    points.sort((a, b) => a.timestamp - b.timestamp);
    return points;
  }, [sessionsForDate]);

  const totalDistance = useMemo(() => {
    if (allRoutePoints.length < 2) return 0;
    return haversineDistanceKm(allRoutePoints);
  }, [allRoutePoints]);

  const totalDuration = useMemo(() => {
    return sessionsForDate.reduce((s, session) => s + session.duration, 0);
  }, [sessionsForDate]);

  useEffect(() => {
    if (mapRef.current && allRoutePoints.length >= 2) {
      mapRef.current.setRouteWithMarkers(allRoutePoints, 0, allRoutePoints.length - 1);
    }
  }, [allRoutePoints]);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    setCheckingPermission(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch {
      setPermissionStatus(null);
    }
    setCheckingPermission(false);
  };

  const requestPermission = async () => {
    setCheckingPermission(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch {
      setPermissionStatus(null);
    }
    setCheckingPermission(false);
  };

  const goToDate = (direction: -1 | 1) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d);
  };

  const goToToday = () => setSelectedDate(new Date());

  const centerMap = useCallback(() => {
    if (mapRef.current && allRoutePoints.length >= 2) {
      mapRef.current.fitBounds();
    }
  }, [allRoutePoints]);

  const dateLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const dateSub = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const hasRoute = allRoutePoints.length >= 2;

  const pace = useMemo(() => {
    if (totalDistance < 0.1 || totalDuration < 10) return '--';
    const paceMin = totalDuration / 60 / totalDistance;
    return `${Math.floor(paceMin)}:${String(Math.round((paceMin % 1) * 60)).padStart(2, '0')} /km`;
  }, [totalDistance, totalDuration]);

  return (
    <View style={styles.container}>
      {/* Full screen map behind everything */}
      {!checkingPermission && permissionStatus === 'granted' && hasRoute ? (
        <TrainingMap ref={mapRef} style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + spacing.xs }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tracking Activity</Text>
          <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.headerBtn}>
            <MaterialIcons name="more-vert" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date selector row */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => goToDate(-1)} style={styles.dateNavBtn}>
            <MaterialIcons name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={isToday ? undefined : goToToday} style={styles.dateLabelBtn}>
            <Text style={styles.dateLabelText}>{dateLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => goToDate(1)} style={styles.dateNavBtn}>
            <MaterialIcons name="chevron-right" size={20} color={isToday ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Three-dot menu dropdown */}
      {showMenu && (
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuDropdown, { top: insets.top + 56, right: spacing.lg }]}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); centerMap(); }}>
              <MaterialIcons name="my-location" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>Center Map</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); goToToday(); }}>
              <MaterialIcons name="today" size={18} color={colors.text} />
              <Text style={styles.menuItemText}>Today</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* State content */}
      {checkingPermission ? (
        <View style={styles.stateContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.stateTitle}>Checking permission...</Text>
        </View>
      ) : permissionStatus === 'denied' ? (
        <View style={styles.stateContainer}>
          <MaterialIcons name="location-off" size={48} color="#EF4444" />
          <Text style={styles.stateTitle}>Location permission needed</Text>
          <Text style={styles.stateSub}>Used to show your walking/running route and distance.</Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                requestPermission();
              }
            }}
            activeOpacity={0.85}
          >
            <MaterialIcons name="settings" size={18} color="#fff" />
            <Text style={styles.permissionBtnText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      ) : permissionStatus !== 'granted' ? (
        <View style={styles.stateContainer}>
          <MaterialIcons name="location-searching" size={48} color="#FBBF24" />
          <Text style={styles.stateTitle}>Location access not requested</Text>
          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
            activeOpacity={0.85}
          >
            <MaterialIcons name="gps-fixed" size={18} color="#fff" />
            <Text style={styles.permissionBtnText}>Allow Location</Text>
          </TouchableOpacity>
        </View>
      ) : !hasRoute ? (
        <View style={styles.stateContainer}>
          <MaterialIcons name="map" size={48} color="rgba(255,255,255,0.3)" />
          <Text style={styles.stateTitle}>No route data available for this day</Text>
          <Text style={styles.stateSub}>Start a walking or running session to track your route.</Text>
        </View>
      ) : null}

      {/* Floating locate button */}
      {hasRoute && (
        <TouchableOpacity style={[styles.locateBtn, { bottom: 180 + insets.bottom }]} onPress={centerMap} activeOpacity={0.85}>
          <MaterialIcons name="my-location" size={22} color="#4F7DFF" />
        </TouchableOpacity>
      )}

      {/* Bottom summary card */}
      {hasRoute && (
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.bottomCardTop}>
            <Text style={styles.bottomDate}>{dateSub}</Text>
            <Text style={styles.bottomTitle}>
              {totalDistance > 0 ? `${totalDistance} km` : 'Route'} · {formatDuration(totalDuration)}
            </Text>
          </View>
          <View style={styles.bottomStats}>
            <View style={styles.bottomStat}>
              <MaterialIcons name="straighten" size={16} color="#4F7DFF" />
              <Text style={styles.bottomStatValue}>{totalDistance > 0 ? `${totalDistance.toFixed(1)}` : '0'}</Text>
              <Text style={styles.bottomStatLabel}>km</Text>
            </View>
            <View style={styles.bottomStatDivider} />
            <View style={styles.bottomStat}>
              <MaterialIcons name="timer" size={16} color="#4F7DFF" />
              <Text style={styles.bottomStatValue}>{formatDuration(totalDuration)}</Text>
              <Text style={styles.bottomStatLabel}>time</Text>
            </View>
            <View style={styles.bottomStatDivider} />
            <View style={styles.bottomStat}>
              <MaterialIcons name="speed" size={16} color="#4F7DFF" />
              <Text style={styles.bottomStatValue}>{pace}</Text>
              <Text style={styles.bottomStatLabel}>pace</Text>
            </View>
            <View style={styles.bottomStatDivider} />
            <View style={styles.bottomStat}>
              <MaterialIcons name="flag" size={16} color="#4F7DFF" />
              <Text style={styles.bottomStatValue}>{allRoutePoints.length}</Text>
              <Text style={styles.bottomStatLabel}>pts</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabelBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 18,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Menu
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
  },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#334155',
  },

  // States
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  stateSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  permissionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#4F7DFF',
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 25,
    marginTop: spacing.md,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Locate button
  locateBtn: {
    position: 'absolute',
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    zIndex: 15,
  },

  // Bottom card
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 15,
  },
  bottomCardTop: {
    marginBottom: spacing.md,
  },
  bottomDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    marginBottom: 2,
  },
  bottomTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  bottomStats: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: spacing.md,
  },
  bottomStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bottomStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bottomStatLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  bottomStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
