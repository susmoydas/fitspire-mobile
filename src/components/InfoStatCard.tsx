import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface InfoStatCardProps {
  icon?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}

export default React.memo(function InfoStatCard({ icon, iconName, label, value }: InfoStatCardProps) {
  return (
    <View style={styles.card}>
      {iconName ? (
        <MaterialIcons name={iconName} size={18} color={colors.textSecondary} />
      ) : (
        <Text style={styles.icon}>{icon}</Text>
      )}
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { marginBottom: 2, fontSize: fontSize.lg },
  value: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', textAlign: 'center' },
  label: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: 'center', fontWeight: '500' },
});
