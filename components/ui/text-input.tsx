import React from 'react';
import { TextInput as RNTextInput, type TextInputProps } from 'react-native';

export function TextInput({ style, ...props }: TextInputProps) {
  return <RNTextInput style={[{ fontFamily: 'Lexend_400Regular' }, style]} {...props} />;
}
