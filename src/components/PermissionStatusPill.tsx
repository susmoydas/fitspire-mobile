import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import type { PermissionLevel } from '../services/permissions';

interface Props {
  status: PermissionLevel;
  allowedLabel?: string;
  deniedLabel?: string;
  unknownLabel?: string;
}

function levelToState(
  status: PermissionLevel,
): { color: string; label: string; bg: string } {
  switch (status) {
    case 'granted':
      return { color: colors.success, label: 'Allowed', bg: colors.success + '18' };
    case 'denied':
      return { color: colors.error, label: 'Not allowed', bg: colors.error + '18' };
    case 'undetermined':
      return { color: colors.warning, label: 'Needs permission', bg: colors.warning + '18' };
    case 'unavailable':
    default:
      return { color: colors.textMuted, label: 'Unavailable', bg: colors.textMuted + '18' };
  }
}

export default function PermissionStatusPill({
  status,
  allowedLabel = 'Allowed',
  deniedLabel = 'Not allowed',
  unknownLabel = 'Needs permission',
}: Props) {
  let info = levelToState(status);
  if (status === 'granted' && allowedLabel !== 'Allowed') info = { ...info, label: allowedLabel };
  else if (status === 'denied' && deniedLabel !== 'Not allowed') info = { ...info, label: deniedLabel };
  else if (status === 'undetermined' && unknownLabel !== 'Needs permission')
    info = { ...info, label: unknownLabel };

  return (
    <View style={[styles.pill, { backgroundColor: info.bg }]}>
      <View style={[styles.dot, { backgroundColor: info.color }]} />
      <Text style={[styles.text, { color: info.color }]}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
