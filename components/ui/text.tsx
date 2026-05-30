import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={style} {...props} />;
}
