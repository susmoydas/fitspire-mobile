import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';

interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: any;
  textStyle?: any;
}

export function Button({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  style,
  textStyle,
}: ButtonProps) {
  const bgColor = variant === 'primary' ? '#6C5CFF'
    : variant === 'secondary' ? '#1B1B1B'
    : variant === 'outline' ? 'transparent'
    : 'transparent';

  const txtColor = variant === 'outline' || variant === 'ghost' ? '#6C5CFF' : '#FFFFFF';

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: bgColor,
          height,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: '#6C5CFF',
        },
        fullWidth && { width: '100%' },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} />
      ) : (
        <Text style={[{ color: txtColor, fontWeight: '700', fontSize: 16 }, textStyle]}>
          {title || children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
