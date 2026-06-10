import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ACTIVITY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  walking: 'directions-walk',
  running: 'directions-run',
  riding: 'pedal-bike',
  workout: 'fitness-center',
  yoga: 'self-improvement',
};

interface ActivityNotificationCardProps {
  activityType?: string;
  steps: number;
  calories: number;
  progress: number;
  onExpand?: () => void;
}

export default function ActivityNotificationCard({
  activityType = 'walking',
  steps,
  calories,
  progress,
  onExpand,
}: ActivityNotificationCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: clampedProgress,
      friction: 6,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const icon = ACTIVITY_ICONS[activityType] || ACTIVITY_ICONS.walking;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.85}
      onPress={onExpand}
    >
      <View style={styles.inner}>
        <MaterialIcons name={icon} size={24} color={colors.primary} />

        <View style={styles.content}>
          <View style={styles.metricsRow}>
            <View style={styles.stepsArea}>
              <Text style={styles.stepsValue}>{steps.toLocaleString()}</Text>
              <Text style={styles.stepsLabel}>Steps</Text>
            </View>
            <View style={styles.calArea}>
              <View style={styles.calRow}>
                <MaterialIcons name="local-fire-department" size={14} color={colors.warning} />
                <Text style={styles.calValue}>{calories.toFixed(1)}</Text>
              </View>
              <Text style={styles.calLabel}>kcal</Text>
            </View>
          </View>

          <View style={styles.progressBg}>
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            />
          </View>
        </View>

        <View style={styles.expandArea}>
          <MaterialIcons name="expand-more" size={18} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 6,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  stepsArea: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stepsValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  stepsLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
  calArea: {
    alignItems: 'flex-end',
  },
  calRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  calValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  calLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  progressBg: {
    height: 5,
    backgroundColor: colors.cardElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  expandArea: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandArrow: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
