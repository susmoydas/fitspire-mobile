import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  AppState,
  AppStateStatus,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pedometer } from 'expo-sensors';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import FloatingLockButton from '../components/FloatingLockButton';
import { calculateCaloriesFromSteps, calculateDistanceKm } from '../utils/calculations';

export default function StepCounterScreen() {
  const insets = useSafeAreaInsets();
  const [steps, setSteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [screenLocked, setScreenLocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const pedometerSub = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastStepRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    checkPermissions();
    return () => {
      pedometerSub.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  const checkPermissions = async () => {
    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) {
        setPermissionDenied(true);
        return;
      }
      startTracking();
    } catch {
      setPermissionDenied(true);
    }
  };

  const startTracking = useCallback(() => {
    lastStepRef.current = 0;
    startTimeRef.current = Date.now();

    pedometerSub.current = Pedometer.watchStepCount((result) => {
      const delta = result.steps - lastStepRef.current;
      lastStepRef.current = result.steps;
      if (delta > 0 && delta < 50) {
        setSteps((prev) => prev + delta);
      }
    });

    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    setIsTracking(true);
  }, []);

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (appStateRef.current === 'background' && nextState === 'active') {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setDuration(elapsed);
      setScreenLocked(false);
    }
    if (nextState === 'background') {
      setScreenLocked(true);
    }
    appStateRef.current = nextState;
  };

  const toggleLock = () => {
    if (screenLocked) {
      setScreenLocked(false);
    } else {
      setScreenLocked(true);
    }
  };

  const distanceKm = calculateDistanceKm(steps, 175);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const displayTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {screenLocked ? (
        <View style={styles.lockedOverlay}>
          <MaterialIcons name="lock" size={48} color={colors.text} />
          <Text style={styles.lockedText}>Screen Locked</Text>
          <Text style={styles.lockedSub}>Tracking continues in background</Text>
          <Text style={styles.stepsLarge}>{steps}</Text>
          <Text style={styles.stepsUnit}>steps</Text>
          <Text style={styles.lockedTimer}>{displayTime}</Text>
        </View>
      ) : (
        <View style={[styles.content, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Step Counter</Text>
            <Text style={styles.headerSub}>
              {isTracking ? 'Tracking your steps' : 'Starting...'}
            </Text>
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsCount}>{steps}</Text>
            <Text style={styles.stepsLabel}>Total Steps</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{displayTime}</Text>
                <Text style={styles.statLabel}>duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{calculateCaloriesFromSteps(steps, 70)}</Text>
                <Text style={styles.statLabel}>cal</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Steps are counted using your device's pedometer. The lock button lets you
              safely put your phone away while tracking continues in the background.
            </Text>
          </View>
        </View>
      )}

      <FloatingLockButton locked={screenLocked} onToggle={toggleLock} />

      <Modal visible={permissionDenied} transparent animationType="fade">
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <MaterialIcons name="warning" size={48} color={colors.warning} />
            <Text style={styles.modalTitle}>Permission Required</Text>
            <Text style={styles.modalText}>
              Step tracking needs motion & fitness permission. Please enable it in your device
              settings to track steps.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setPermissionDenied(false)}
            >
              <Text style={styles.modalBtnText}>Got it</Text>
            </TouchableOpacity>
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
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },

  stepsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepsCount: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  stepsLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  infoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  lockedOverlay: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  lockedSub: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  stepsLarge: {
    color: colors.text,
    fontSize: 80,
    fontWeight: '700',
  },
  stepsUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  lockedTimer: {
    color: colors.textMuted,
    fontSize: fontSize.xl,
    fontVariant: ['tabular-nums'],
    marginTop: spacing.sm,
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
  },
  modalText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});
