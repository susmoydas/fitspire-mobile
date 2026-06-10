import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface SetTrackerRowProps {
  setNumber: number;
  kg: number;
  reps: number;
  completed: boolean;
  isActive: boolean;
  lastKg?: number;
  lastReps?: number;
  onKgChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onComplete: () => void;
}

export default React.memo(function SetTrackerRow({
  setNumber,
  kg,
  reps,
  completed,
  isActive,
  lastKg,
  lastReps,
  onKgChange,
  onRepsChange,
  onComplete,
}: SetTrackerRowProps) {
  const circleBg = completed ? colors.success : isActive ? colors.primary : colors.border;
  return (
    <View style={[styles.row, isActive && styles.activeRow, completed && styles.completedRow]}>
      <View style={styles.left}>
        <View style={[styles.setCircle, { borderColor: circleBg }, completed && styles.setCircleDone, isActive && { backgroundColor: circleBg + '20' }]}>
          {completed && <MaterialIcons name="check" size={14} color="#fff" />}
        </View>
        {lastKg !== undefined && lastReps !== undefined && !completed && (
          <Text style={styles.lastLabel}>Last: {lastKg}kg × {lastReps}</Text>
        )}
      </View>

      <View style={styles.controlGroup}>
        <View style={styles.controlCol}>
          <Text style={styles.controlLabel}>KG</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => onKgChange(Math.max(0, parseFloat((kg - 2.5).toFixed(1))))}
              disabled={completed}
            >
              <MaterialIcons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{kg}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => onKgChange(parseFloat((kg + 2.5).toFixed(1)))}
              disabled={completed}
            >
              <MaterialIcons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlCol}>
          <Text style={styles.controlLabel}>REPS</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => onRepsChange(Math.max(0, reps - 1))}
              disabled={completed}
            >
              <MaterialIcons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{reps}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => onRepsChange(reps + 1)}
              disabled={completed}
            >
              <MaterialIcons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.completeBtn, isActive && !completed && styles.completeBtnActive, completed && styles.completeBtnDone]}
        onPress={onComplete}
        disabled={completed || (!isActive && !completed)}
        activeOpacity={0.7}
      >
        {completed ? (
          <MaterialIcons name="check" size={22} color="#fff" />
        ) : (
          <MaterialIcons name="check-circle-outline" size={22} color={isActive ? '#fff' : colors.textMuted} />
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeRow: {
    borderColor: colors.primary,
    backgroundColor: colors.cardElevated,
  },
  completedRow: {
    opacity: 0.55,
  },
  left: {
    alignItems: 'center',
    width: 56,
    gap: 2,
  },
  setCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCircleActive: {
    borderColor: colors.primary,
  },
  setCircleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  controlGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  controlCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  controlLabel: {
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastLabel: {
    color: colors.textMuted,
    fontSize: 9,
    textAlign: 'center',
  },
  stepperValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    minWidth: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  completeBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  completeBtnActive: {
    backgroundColor: colors.primary,
  },
  completeBtnDone: {
    backgroundColor: colors.success,
  },

});
