import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius } from '../theme/colors';

interface IconButtonProps {
  name: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  bgColor?: string;
  style?: ViewStyle;
}

export default function IconButton({
  name,
  onPress,
  size = 22,
  color = colors.text,
  bgColor = colors.cardElevated,
  style,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bgColor }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialIcons name={name} size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
