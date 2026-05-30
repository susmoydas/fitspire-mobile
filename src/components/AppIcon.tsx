import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface AppIconProps {
  name: keyof typeof MaterialIcons.glyphMap;
  size?: number;
  color?: string;
}

export default function AppIcon({ name, size = 22, color = colors.textSecondary }: AppIconProps) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
