import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

const LOGO = require('../../assets/logo.png');

interface LogoFallbackProps {
  width?: number | string;
  height?: number | string;
  rounded?: number;
  caption?: string;
  backgroundColor?: string;
  aspectRatio?: number;
  style?: any;
}

export default function LogoFallback({
  width = '100%',
  height = '100%',
  rounded = borderRadius.lg,
  caption,
  backgroundColor = colors.cardElevated,
  aspectRatio,
  style,
}: LogoFallbackProps) {
  return (
    <View
      style={[
        styles.wrap,
        {
          width,
          height,
          borderRadius: rounded,
          backgroundColor,
        },
        aspectRatio ? { height: undefined, aspectRatio } : null,
        style,
      ]}
    >
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: spacing.xs,
  },
  logo: {
    width: 64,
    height: 64,
    opacity: 0.85,
  },
  caption: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
