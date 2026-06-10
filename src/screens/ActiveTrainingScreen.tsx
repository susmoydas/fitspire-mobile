import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  AppState,
  AppStateStatus,
  BackHandler,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { useTrainingTracker } from '../hooks/useTrainingTracker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { TrainingMode, Coordinate } from '../types';
import TrainingMap, { TrainingMapRef } from '../components/TrainingMap';
import InAppLockOverlay from '../components/InAppLockOverlay';

type RouteParams = RouteProp<RootStackParamList, 'ActiveTraining'>;

const MODE_LABELS: Record<TrainingMode, string> = {
  walking: 'Walking',
  running: 'Running',
  riding: 'Riding',
};

const MODE_ICONS: Record<TrainingMode, keyof typeof MaterialIcons.glyphMap> = {
  walking: 'directions-walk',
  running: 'directions-run',
  riding: 'pedal-bike',
};

const ROUTE_BATCH_INTERVAL = 5000;

export default function ActiveTrainingScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteParams>();
  const navigation = useNavigation();
  const { mode } = route.params;

  const {
    status,
    timer,
    distance,
    steps,
    calories,
    avgPace,
    currentLocation,
    route: trekRoute,
    formatTime,
    start,
    pause,
    resume,
    finish,
  } = useTrainingTracker(mode);

  const mapRef = useRef<TrainingMapRef>(null);
  const [screenLocked, setScreenLocked] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const lastBatchRef = useRef(0);

  const isIdle = status === 'idle';
  const isRunning = status === 'active';
  const isPaused = status === 'paused';

  const handleStart = useCallback(async () => {
    const result = await start();
    if (result === 'location_disabled') {
      Alert.alert(
        'Location Access is off',
        'Enable Location Access in Profile to record your route.',
      );
    } else if (result === 'location_denied') {
      Alert.alert(
        'Location permission required',
        'Allow location access to start tracking your route.',
      );
    }
  }, [start]);
  const handlePause = useCallback(() => { pause(); }, [pause]);
  const handleResume = useCallback(() => { resume(); }, [resume]);
  const handleFinish = useCallback(() => {
    finish();
    navigation.goBack();
  }, [finish, navigation]);

  const handleUnlock = useCallback(() => { setScreenLocked(false); }, []);
  const handleLock = useCallback(() => { setScreenLocked(true); }, []);

  useEffect(() => {
    if (trekRoute.length > 0) {
      mapRef.current?.setRouteWithMarkers(trekRoute);
      if (currentLocation) {
        mapRef.current?.setUserLocation(currentLocation.latitude, currentLocation.longitude);
      }
    }
  }, []);

  useEffect(() => {
    if (currentLocation && (isRunning || isPaused)) {
      mapRef.current?.setUserLocation(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, isRunning, isPaused]);

  useEffect(() => {
    if (!isRunning || trekRoute.length === 0) return;
    const now = Date.now();
    if (now - lastBatchRef.current < ROUTE_BATCH_INTERVAL) return;
    lastBatchRef.current = now;
    mapRef.current?.setRouteWithMarkers(trekRoute);
  }, [trekRoute, isRunning]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && screenLocked) {
        setScreenLocked(false);
      }
    });
    return () => sub.remove();
  }, [screenLocked]);

  useEffect(() => {
    const onBackPress = () => {
      if (isRunning || isPaused) {
        setShowExitModal(true);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isRunning, isPaused]);

  const handleBack = useCallback(() => {
    if (isRunning || isPaused) {
      setShowExitModal(true);
      return;
    }
    navigation.goBack();
  }, [isRunning, isPaused, navigation]);

  const distanceKm = distance / 1000;
  const displayDistance = `${distanceKm.toFixed(2)} km`;
  const displayTime = formatTime(timer);

  if (screenLocked) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <InAppLockOverlay
          activityType={MODE_LABELS[mode]}
          time={displayTime}
          steps={steps}
          distance={displayDistance}
          calories={Math.round(calories)}
          onUnlock={handleUnlock}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.topSafe, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.titleArea}>
            <MaterialIcons name={MODE_ICONS[mode]} size={24} color={colors.primary} />
            <Text style={styles.activityTitle}>{MODE_LABELS[mode]}</Text>
          </View>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{displayTime}</Text>
        </View>
      </View>

      <View style={styles.mapWrapper}>
        <TrainingMap ref={mapRef} style={styles.map} />
      </View>

      <View style={[styles.bottomSafe, { paddingBottom: insets.bottom }]}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <MaterialIcons name="directions-walk" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{steps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="straighten" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{displayDistance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="local-fire-department" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{Math.round(calories)}</Text>
            <Text style={styles.statLabel}>Cal</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="speed" size={16} color={colors.textSecondary} />
            <Text style={styles.statValue}>{avgPace}</Text>
            <Text style={styles.statLabel}>Pace</Text>
          </View>
        </View>

        <View style={styles.controlsContainer}>
          {isIdle && (
              <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.85}>
                <MaterialIcons name="play-arrow" size={22} color={colors.text} />
                <Text style={styles.startButtonText}> Start</Text>
              </TouchableOpacity>
          )}
          {isRunning && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.pauseButton} onPress={handlePause} activeOpacity={0.85}>
                <MaterialIcons name="pause" size={22} color={colors.text} />
                <Text style={styles.controlButtonText}> Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.85}>
                <MaterialIcons name="stop" size={22} color={colors.text} />
                <Text style={styles.controlButtonText}> Finish</Text>
              </TouchableOpacity>
            </View>
          )}
          {isPaused && (
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.resumeButton} onPress={handleResume} activeOpacity={0.85}>
                <MaterialIcons name="play-arrow" size={22} color={colors.text} />
                <Text style={styles.controlButtonText}> Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.finishButton} onPress={handleFinish} activeOpacity={0.85}>
                <MaterialIcons name="stop" size={22} color={colors.text} />
                <Text style={styles.controlButtonText}> Finish</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {(isRunning || isPaused) && (
        <LockButton onLock={handleLock} />
      )}

      <Modal visible={showExitModal} transparent animationType="fade" onRequestClose={() => setShowExitModal(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <MaterialIcons name="warning" size={40} color={colors.warning} />
            <Text style={styles.modalTitle}>Workout in Progress</Text>
            <Text style={styles.modalText}>
              What would you like to do? Your session will be saved.
            </Text>

            <TouchableOpacity
              style={styles.modalStopBtn}
              onPress={() => { setShowExitModal(false); finish(); navigation.goBack(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalStopBtnText}>Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalGoBackBtn}
              onPress={() => { setShowExitModal(false); navigation.goBack(); }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalGoBackBtnText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalContinueBtn}
              onPress={() => setShowExitModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalContinueBtnText}>Continue Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LockButton({ onLock }: { onLock: () => void }) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onLock();
  };

  return (
    <Animated.View style={[styles.lockButtonContainer, { bottom: 200, transform: [{ scale }] }]}>
      <TouchableOpacity
        style={styles.lockButton}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <MaterialIcons name="lock" size={22} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topSafe: {
    backgroundColor: colors.bg + 'F0',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    paddingRight: spacing.md,
  },
  titleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  activityTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingBottom: spacing.sm,
  },
  timerText: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  mapWrapper: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSafe: {
    backgroundColor: colors.bg + 'F0',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  startButton: {
    backgroundColor: colors.primary,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  startButtonText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  controlRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pauseButton: {
    flex: 1,
    backgroundColor: colors.warning,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  resumeButton: {
    flex: 1,
    backgroundColor: colors.success,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  finishButton: {
    flex: 1,
    backgroundColor: colors.error,
    height: buttonHeight.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  lockButtonContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    zIndex: 100,
  },
  lockButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalMask: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.sheet,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  modalStopBtn: {
    width: '100%',
    backgroundColor: colors.error,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalStopBtnText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  modalGoBackBtn: {
    width: '100%',
    backgroundColor: colors.cardElevated,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modalGoBackBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  modalContinueBtn: {
    width: '100%',
    backgroundColor: colors.cardElevated,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalContinueBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
