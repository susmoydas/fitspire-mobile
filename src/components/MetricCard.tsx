import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, borderRadius, spacing } from '../theme/colors';

interface MetricCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
  color?: string;
}

export default React.memo(function MetricCard({ icon, value, label, color = colors.primary }: MetricCardProps) {
  return (
    <View style={styles.card}>
      <MaterialIcons name={icon} size={20} color={color} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
