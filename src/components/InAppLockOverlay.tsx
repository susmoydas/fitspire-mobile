import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface InAppLockOverlayProps {
  activityType: string;
  time: string;
  steps: number;
  distance: string;
  calories: number;
  onUnlock: () => void;
}

export default function InAppLockOverlay({
  activityType,
  time,
  steps,
  distance,
  calories,
  onUnlock,
}: InAppLockOverlayProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePressIn = () => {
    longPressTimer.current = setTimeout(() => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onUnlock();
        rotateAnim.setValue(0);
      });
    }, 500);
  };

  const handlePressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    rotateAnim.setValue(0);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <MaterialIcons name="lock" size={48} color={colors.textSecondary} />
      <Text style={styles.statusText}>Tracking is active</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.activityLabel}>{activityType}</Text>
        <Text style={styles.timerText}>{time}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{steps}</Text>
            <Text style={styles.statLabel}>Steps</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
        </View>
      </View>

      <Text style={styles.unlockHint}>Tap and hold to unlock</Text>

      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <TouchableOpacity
          style={styles.unlockButton}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <MaterialIcons name="lock-open" size={32} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    zIndex: 1000,
  },
  statusText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  infoContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  activityLabel: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  timerText: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  unlockHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  unlockButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
