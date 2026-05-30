import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { FITNESS_ICONS } from './icons/FitnessIcons';

interface ConnectorItem {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  comingSoon?: boolean;
}

interface FitnessConnectorCardProps {
  item: ConnectorItem;
  checking?: boolean;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
}

export default function FitnessConnectorCard({ item, checking, onConnect, onDisconnect }: FitnessConnectorCardProps) {
  const IconComponent = FITNESS_ICONS[item.icon];

  return (
    <View style={styles.card}>
      {IconComponent ? (
        <IconComponent size={28} color={item.connected ? colors.success : colors.textSecondary} />
      ) : (
        <View style={[styles.iconPlaceholder, { backgroundColor: item.connected ? colors.success + '20' : colors.border }]}>
          <Text style={[styles.iconPlaceholderText, { color: item.connected ? colors.success : colors.textSecondary }]}>
            {item.name.charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.comingSoon ? (
          <Text style={styles.comingSoon}>Coming soon</Text>
        ) : checking ? (
          <Text style={styles.checking}>Checking...</Text>
        ) : item.connected ? (
          <Text style={styles.connected}>Connected</Text>
        ) : (
          <Text style={styles.notConnected}>Not connected</Text>
        )}
      </View>
      {item.comingSoon ? (
        <View style={styles.soonBadge}>
          <Text style={styles.soonBadgeText}>Soon</Text>
        </View>
      ) : checking ? (
        <View style={[styles.actionBtn, { borderColor: colors.warning }]}>
          <Text style={[styles.actionText, { color: colors.warning }]}>...</Text>
        </View>
      ) : item.connected ? (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDisconnect(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.success }]}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.primary }]}
          onPress={() => onConnect(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  iconPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  comingSoon: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  checking: { color: colors.warning, fontSize: fontSize.sm, marginTop: 2 },
  connected: { color: colors.success, fontSize: fontSize.sm, marginTop: 2, fontWeight: '600' },
  notConnected: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
  soonBadge: {
    backgroundColor: colors.cardElevated,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soonBadgeText: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  actionBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  actionText: { fontSize: fontSize.sm, fontWeight: '700' },
});
