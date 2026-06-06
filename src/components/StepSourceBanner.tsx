import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, borderRadius, spacing, buttonHeight } from '../theme/colors';
import { useStore } from '../store/useStore';
import {
  initHealthConnect,
  requestHealthConnectPermissions,
  openHealthConnectInstall,
} from '../services/healthConnectSteps';

interface StepSourceBannerProps {
  visible: boolean;
  onRecheck?: () => void;
}

export default function StepSourceBanner({ visible, onRecheck }: StepSourceBannerProps) {
  const setHealthConnectOptIn = useStore((s) => s.setHealthConnectOptIn);
  const [busy, setBusy] = useState(false);

  if (!visible || Platform.OS !== 'android') return null;

  const handleConnect = async () => {
    setBusy(true);
    try {
      const status = await initHealthConnect();
      if (status.notInstalled || status.needsUpdate) {
        await openHealthConnectInstall();
        return;
      }
      if (!status.sdkAvailable) return;
      const granted = await requestHealthConnectPermissions();
      setHealthConnectOptIn(granted ? 'granted' : 'denied');
      onRecheck?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="monitor-heart" size={20} color={colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Enable 24/7 step tracking</Text>
        <Text style={styles.desc}>
          Fitspire can count your steps all day, even when the app is closed. Allow Health Connect for accurate background tracking.
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.cta, busy && styles.ctaBusy]}
        onPress={handleConnect}
        disabled={busy}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{busy ? '…' : 'Connect'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  desc: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    height: buttonHeight.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBusy: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
