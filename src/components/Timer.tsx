import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, fontSize, spacing } from '../theme/colors';

interface TimerProps {
  seconds: number;
  size?: 'sm' | 'md' | 'lg';
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function Timer({ seconds, size = 'md' }: TimerProps) {
  const isLarge = size === 'lg';
  return (
    <View style={styles.container}>
      <Text style={[styles.time, isLarge && styles.timeLarge]}>
        {formatTime(seconds)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  time: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeLarge: {
    fontSize: 48,
    letterSpacing: 4,
  },
});
