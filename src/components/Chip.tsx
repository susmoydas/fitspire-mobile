import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  height?: number;
}

export default function Chip({ label, active, onPress, style, height = 44 }: ChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { height },
        active && styles.chipActive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  textActive: {
    color: '#fff',
  },
});
