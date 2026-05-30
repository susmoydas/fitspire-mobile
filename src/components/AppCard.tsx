import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme/colors';

interface AppCardProps {
  children: React.ReactNode;
  variant?: 'normal' | 'large';
  padding?: number;
  style?: ViewStyle;
}

export default function AppCard({ children, variant = 'normal', padding, style }: AppCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: variant === 'large' ? borderRadius.bigCard : borderRadius.card,
    padding: padding ?? spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  };

  return <View style={[cardStyle, style]}>{children}</View>;
}
