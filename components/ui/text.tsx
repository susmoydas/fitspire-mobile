import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

const WEIGHT_MAP: Record<string, string> = {
  '100': 'Lexend_400Regular',
  '200': 'Lexend_400Regular',
  '300': 'Lexend_400Regular',
  '400': 'Lexend_400Regular',
  '500': 'Lexend_500Medium',
  '600': 'Lexend_600SemiBold',
  '700': 'Lexend_700Bold',
  '800': 'Lexend_800ExtraBold',
  '900': 'Lexend_900Black',
  normal: 'Lexend_400Regular',
  bold: 'Lexend_700Bold',
};

function resolveFamily(style: TextProps['style']): string {
  const items = Array.isArray(style) ? style : [style];
  for (const item of items) {
    if (item && typeof item === 'object' && 'fontWeight' in item) {
      const fw = (item as any).fontWeight;
      const family = WEIGHT_MAP[String(fw)];
      if (family) return family;
    }
  }
  return 'Lexend_400Regular';
}

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[{ fontFamily: resolveFamily(style) }, style]} {...props} />;
}
