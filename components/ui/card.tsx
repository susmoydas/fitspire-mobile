import React from 'react';
import { View, type ViewProps } from 'react-native';

export function Card({ style, ...props }: ViewProps) {
  return <View style={[{ backgroundColor: '#1B1B1B', borderRadius: 16, padding: 16 }, style]} {...props} />;
}
