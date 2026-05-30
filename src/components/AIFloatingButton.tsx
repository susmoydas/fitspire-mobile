import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AIFloatingButtonProps {
  onPress: () => void;
  bottom: number;
  right?: number;
  style?: ViewStyle;
}

export default function AIFloatingButton({
  onPress,
  bottom,
  right = 20,
  style,
}: AIFloatingButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom, right }, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityLabel="Open FitAI assistant"
    >
      <MaterialIcons name="auto-awesome" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
